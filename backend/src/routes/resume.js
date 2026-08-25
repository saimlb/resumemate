const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const auth = require('../middleware/auth');
const creditsCheck = require('../middleware/credits');
const pdfProcessor = require('../services/pdfProcessor');
const atsAnalyzer = require('../services/atsAnalyzer');

// Configurar multer
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
    fileSize: 5 * 1024 * 1024
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

    const text = await pdfProcessor.extractText(filePath);
    
    if (!text || text.trim().length < 50) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        error: 'El PDF parece no contener texto extraíble.' 
      });
    }

    const analysis = atsAnalyzer.analyze(text);
    const optimizedText = atsAnalyzer.generateOptimizedText(text, analysis.suggestions);
    const optimizedPath = await pdfProcessor.createOptimizedPDF(filePath, optimizedText);

    const userId = req.user.id;
    
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET credits = credits - 1 WHERE id = ?',
        [userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    const result = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO analyses (user_id, filename, original_name, score, issues, suggestions, optimized_path)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          req.file.filename,
          originalName,
          analysis.score,
          JSON.stringify(analysis.issues),
          JSON.stringify(analysis.suggestions),
          optimizedPath
        ],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });

    const creditsInfo = await new Promise((resolve, reject) => {
      db.get('SELECT credits FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    fs.unlinkSync(filePath);

    res.json({
      success: true,
      analysisId: result.id,
      score: analysis.score,
      issues: analysis.issues,
      suggestions: analysis.suggestions,
      details: analysis.details,
      optimizedPath: `/download/${req.file.filename}`,
      remainingCredits: creditsInfo.credits,
      message: `✅ Análisis completado. Créditos restantes: ${creditsInfo.credits}`
    });

  } catch (error) {
    console.error('Error en análisis:', error);
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({ error: error.message || 'Error al analizar el CV.' });
  }
});

// Descargar PDF optimizado
router.get('/download/:filename', auth, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '..', '..', 'output', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Archivo no encontrado.' });
  }

  res.download(filePath, 'cv_optimizado_ats.pdf', (err) => {
    if (err) {
      console.error('Error al descargar:', err);
      res.status(500).json({ error: 'Error al descargar el archivo.' });
    }
  });
});

// Obtener historial
router.get('/history', auth, (req, res) => {
  db.all(
    'SELECT id, original_name, score, created_at FROM analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener historial.' });
      }
      res.json(rows);
    }
  );
});

module.exports = router; 
