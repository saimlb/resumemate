require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 1. WEBHOOK DE PADDLE (DEBE IR ANTES DE express.json)
// ============================================
const paddlePaymentsRoutes = require('./routes/paddlePayments');
app.use('/api/payments/webhook', paddlePaymentsRoutes);

// ============================================
// 2. CORS CONFIGURACIÓN
// ============================================
app.use(cors({
  origin: [
    'https://resumemate-xrhk.onrender.com',
    'http://localhost:3000',
    'http://localhost:5500'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// ============================================
// 3. MIDDLEWARE
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// 4. SERVIR ARCHIVOS ESTÁTICOS
// ============================================
app.use(express.static(path.join(__dirname, '../frontend')));
console.log('📁 Sirviendo frontend desde:', path.join(__dirname, '../frontend'));

// === SERVIR ARCHIVOS DE OUTPUT (PARA DESCARGA) ===
app.use('/download', express.static(path.join(__dirname, '../output')));
console.log('📁 Sirviendo archivos de output desde:', path.join(__dirname, '../output'));

// ============================================
// 5. PASAR TOKEN DE PADDLE AL FRONTEND
// ============================================
app.use((req, res, next) => {
    res.locals.paddleClientToken = process.env.PADDLE_CLIENT_TOKEN || '';
    next();
});

// Ruta para obtener el token de Paddle
app.get('/api/paddle-token', (req, res) => {
    res.json({ token: process.env.PADDLE_CLIENT_TOKEN || '' });
});

// ============================================
// 6. RUTAS DE LA API
// ============================================
const authRoutes = require('./routes/auth');
const creditsRoutes = require('./routes/credits');
const resumeRoutes = require('./routes/resume');

app.use('/api/auth', authRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/resume', resumeRoutes);

// ============================================
// 7. RUTAS DE PAGOS (DESPUÉS DE express.json)
// ============================================
app.use('/api/payments', express.json(), paddlePaymentsRoutes);

// ============================================
// 8. RUTAS DEL FRONTEND
// ============================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.get('/analyzer', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/analyzer.html'));
});

// ============================================
// 9. PÁGINAS LEGALES
// ============================================
app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/terms.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/privacy.html'));
});

app.get('/refund', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/refund.html'));
});

// Versiones con .html (por si acaso)
app.get('/terms.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/terms.html'));
});

app.get('/privacy.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/privacy.html'));
});

app.get('/refund.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/refund.html'));
});

// ============================================
// 10. MANEJO DE ERRORES 404
// ============================================
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ============================================
// 11. INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 ResumeMate Server running on http://localhost:${PORT}`);
  console.log(`📧 Cuenta demo: demo@resumemate.com / demopass123`);
  console.log(`💰 Créditos: 10 (plan premium)`);
  console.log(`💳 Paddle: ${process.env.PADDLE_SECRET_KEY ? '✅ Configurado' : '❌ No configurado'}`);
});

module.exports = app;
