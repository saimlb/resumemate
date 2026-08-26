require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 1. WEBHOOK DE STRIPE (DEBE IR ANTES DE express.json)
// ============================================
const paymentsRoutes = require('./routes/payments');
app.use('/api/payments/webhook', paymentsRoutes);

// ============================================
// 2. CORS CONFIGURACIÓN COMPLETA
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

// ============================================
// 5. RUTAS DE LA API
// ============================================
const authRoutes = require('./routes/auth');
const creditsRoutes = require('./routes/credits');
const resumeRoutes = require('./routes/resume');

app.use('/api/auth', authRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/resume', resumeRoutes);

// ============================================
// 6. RUTAS DE PAGOS (DESPUÉS DE express.json)
// ============================================
app.use('/api/payments', express.json(), paymentsRoutes);

// ============================================
// 7. RUTAS DEL FRONTEND
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
// 8. MANEJO DE ERRORES 404
// ============================================
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ============================================
// 9. INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 ResumeMate Server running on http://localhost:${PORT}`);
  console.log(`📧 Cuenta demo: demo@resumemate.com / demopass123`);
  console.log(`💰 Créditos: 10 (plan premium)`);
  console.log(`💳 Stripe pagos: ${process.env.STRIPE_SECRET_KEY ? '✅ Configurado' : '❌ No configurado'}`);
});

module.exports = app;
