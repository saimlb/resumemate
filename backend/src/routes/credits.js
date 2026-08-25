const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

// Obtener créditos del usuario
router.get('/balance', auth, (req, res) => {
  db.get('SELECT credits, plan FROM users WHERE id = ?', [req.user.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener créditos.' });
    }
    res.json({ credits: row.credits, plan: row.plan });
  });
});

// Simular compra de créditos (pago simulado)
router.post('/purchase', auth, (req, res) => {
  const { plan } = req.body;
  
  const plans = {
    'pro': { credits: 20, price: 19 },
    'premium': { credits: 100, price: 59 }
  };

  if (!plans[plan]) {
    return res.status(400).json({ error: 'Plan no válido.' });
  }

  const newCredits = plans[plan].credits;
  const price = plans[plan].price;

  db.run(
    'UPDATE users SET credits = credits + ?, plan = ? WHERE id = ?',
    [newCredits, plan, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al procesar la compra.' });
      }

      res.json({
        success: true,
        message: `💰 SIMULACIÓN DE PAGO: Has adquirido ${newCredits} créditos por ${price}€ (plan ${plan}). ¡Pago simulado!`,
        credits: newCredits,
        plan: plan
      });
    }
  );
});

module.exports = router; 
