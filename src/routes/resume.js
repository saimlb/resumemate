const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../database');
const auth = require('../middleware/auth');
const creditsCheck = require('../middleware/credits');
const pdfProcessor = require('../services/pdfProcessor');
const atsAnalyzer = require('../services/atsAnalyzer');

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Analizar CV
router.post('/analyze', auth, creditsCheck, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo.' });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;

    // Extraer texto del PDF
    const text = await pdfProcessor.extractText(filePath);
    
    if (!text || text.trim().length < 50) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        error: 'El PDF parece no contener texto extraíble. Asegúrate de que no sea un documento escaneado.' 
      });
    }

    // Analizar con ATS
    const analysis = atsAnalyzer.analyze(text);
    
    // Generar PDF optimizado
    const optimizedText = atsAnalyzer.generateOptimizedText(text, analysis.suggestions);
    const optimizedPath = await pdfProcessor.createOptimizedPDF(filePath, optimizedText);

    const userId = req.user.id;
    
    // Reducir créditos
    await pool.query('UPDATE users SET credits = credits - 1 WHERE id = $1', [userId]);

    // Guardar análisis en PostgreSQL
    const result = await pool.query(
      `INSERT INTO analyses (user_id, filename, original_name, score, issues, suggestions, optimized_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        userId,
        req.file.filename,
        originalName,
        analysis.score,
        JSON.stringify(analysis.issues),
        JSON.stringify(analysis.suggestions),
        optimizedPath
      ]
    );

    // Obtener créditos actualizados
    const creditsResult = await pool.query('SELECT credits FROM users WHERE id = $1', [userId]);
    const remainingCredits = creditsResult.rows[0].credits;

    // Limpiar archivo subido
    fs.unlinkSync(filePath);

    // Extraer solo el nombre del archivo para la URL de descarga
    const filename = path.basename(optimizedPath);

    res.json({
      success: true,
      analysisId: result.rows[0].id,
      score: analysis.score,
      issues: analysis.issues,
      suggestions: analysis.suggestions,
      details: analysis.details,
      optimizedPath: `/download/${filename}`,
      remainingCredits: remainingCredits,
      message: `✅ Análisis completado. Créditos restantes: ${remainingCredits}`
    });

  } catch (error) {
    console.error('Error en análisis:', error);
    // Limpiar archivo si existe
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({ error: error.message || 'Error al analizar el CV.' });
  }
});

// Descargar PDF optimizado
router.get('/download/:filename', auth, (req, res) => {
  const filename = req.params.filename;
  // La ruta correcta es: ../output/ (no ../src/output/)
  const filePath = path.join(__dirname, '..', 'output', filename);
  
  console.log('📥 Buscando archivo para descargar:', filePath);
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ Archivo no encontrado:', filePath);
    return res.status(404).json({ error: 'Archivo no encontrado.' });
  }

  res.download(filePath, 'cv_optimizado_ats.pdf', (err) => {
    if (err) {
      console.error('Error al descargar:', err);
      res.status(500).json({ error: 'Error al descargar el archivo.' });
    }
  });
});

// Obtener historial de análisis
router.get('/history', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, original_name, score, created_at FROM analyses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al obtener historial.' });
  }
});

module.exports = router;
