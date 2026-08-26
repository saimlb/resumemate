const express = require('express');
const router = express.Router();
const pool = require('../database');
const auth = require('../middleware/auth');

// Obtener créditos del usuario
router.get('/balance', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT credits, plan FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json({ credits: user.credits, plan: user.plan });
  } catch (error) {
    console.error('Error al obtener créditos:', error);
    res.status(500).json({ error: 'Error al obtener créditos.' });
  }
});

// Simular compra de créditos (pago simulado)
router.post('/purchase', auth, async (req, res) => {
  const { plan } = req.body;
  
  const plans = {
    'pro': { credits: 20, price: 19 },
    'premium': { credits: 100, price: 59 }
  };

  if (!plans[plan]) {
    return res.status(400).json({ error: 'Plan no válido.' });
  }

  try {
    const newCredits = plans[plan].credits;
    const price = plans[plan].price;

    await pool.query(
      'UPDATE users SET credits = credits + $1, plan = $2 WHERE id = $3',
      [newCredits, plan, req.user.id]
    );

    res.json({
      success: true,
      message: `💰 SIMULACIÓN DE PAGO: Has adquirido ${newCredits} créditos por ${price}€ (plan ${plan}). ¡Pago simulado!`,
      credits: newCredits,
      plan: plan
    });
  } catch (error) {
    console.error('Error al procesar compra:', error);
    res.status(500).json({ error: 'Error al procesar la compra.' });
  }
});

module.exports = router;
