const express = require('express');
const router = express.Router();
const { paddle, PRICE_IDS } = require('../config/paddle');
const pool = require('../database');
const auth = require('../middleware/auth');

// Crear transacción para checkout
router.post('/create-checkout', auth, async (req, res) => {
  const { plan } = req.body; // 'pro' o 'premium'

  try {
    const priceId = PRICE_IDS[plan.toUpperCase() + '_MONTHLY'];

    if (!priceId) {
      return res.status(400).json({ error: 'Plan no válido' });
    }

    // Obtener datos del usuario
    const userResult = await pool.query('SELECT email, name FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Crear el checkout en Paddle
    const checkout = await paddle.transactions.create({
      items: [
        {
          price_id: priceId,
          quantity: 1
        }
      ],
      customer: {
        email: user.email,
        name: user.name
      },
      custom_data: {
        userId: req.user.id.toString(),
        plan: plan,
        credits: plan === 'pro' ? '20' : '100'
      },
      return_url: `${process.env.APP_URL || 'https://resumemate-xrhk.onrender.com'}/dashboard?payment=success`,
    });

    console.log('✅ Checkout creado:', checkout.url);
    res.json({ url: checkout.url });
  } catch (error) {
    console.error('❌ Error al crear checkout:', error);
    res.status(500).json({ error: 'Error al procesar el pago' });
  }
});

// Webhook para recibir eventos de Paddle
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['paddle-signature'];
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

  console.log('🔔 Webhook recibido');
  console.log('📨 Signature:', signature);
  console.log('🔑 Webhook Secret:', webhookSecret ? '✅ Presente' : '❌ No configurado');

  try {
    const event = await paddle.webhooks.unmarshal(req.body, signature, webhookSecret);
    console.log('✅ Webhook verificado correctamente');

    // Manejar evento de pago completado
    if (event.type === 'transaction.completed') {
      const transaction = event.data;
      const userId = transaction.custom_data?.userId;
      const credits = parseInt(transaction.custom_data?.credits || '0');
      const plan = transaction.custom_data?.plan;

      console.log(`💰 Transacción completada: Usuario ${userId}, ${credits} créditos, plan ${plan}`);

      if (userId && credits > 0) {
        await pool.query(
          'UPDATE users SET credits = credits + $1, plan = $2 WHERE id = $3',
          [credits, plan, userId]
        );
        console.log(`✅ Usuario ${userId} recibió ${credits} créditos (plan ${plan})`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Error al verificar webhook:', error);
    res.status(400).send('Webhook Error');
  }
});

module.exports = router;