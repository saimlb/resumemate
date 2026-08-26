require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));
console.log('📁 Sirviendo frontend desde:', path.join(__dirname, '../frontend'));

// Rutas
const authRoutes = require('./routes/auth');
const creditsRoutes = require('./routes/credits');
const resumeRoutes = require('./routes/resume');

app.use('/api/auth', authRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/resume', resumeRoutes);

// Rutas del frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'dashboard.html'));
});

app.get('/analyzer', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'analyzer.html'));
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 ResumeMate Server running on http://localhost:${PORT}`);
  console.log(`📧 Cuenta demo: demo@resumemate.com / demopass123`);
  console.log(`💰 Créditos: 10 (plan premium)`);
});

module.exports = app; 
