const express = require('express');
const router = express.Router();
const { stripe, PRICE_IDS } = require('../config/stripe');
const pool = require('../database');
const auth = require('../middleware/auth');

// Crear sesión de checkout
router.post('/create-checkout', auth, async (req, res) => {
  const { plan, interval } = req.body;

  try {
    const planKey = plan.toUpperCase() + '_' + interval.toUpperCase();
    const priceId = PRICE_IDS[planKey];

    if (!priceId) {
      return res.status(400).json({ error: 'Plan no válido' });
    }

    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
    const userEmail = userResult.rows[0]?.email;

    let customer;
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId: req.user.id.toString() }
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${process.env.APP_URL || 'https://resumemate-xrhk.onrender.com'}/dashboard?payment=success`,
      cancel_url: `${process.env.APP_URL || 'https://resumemate-xrhk.onrender.com'}/pricing?payment=canceled`,
      metadata: {
        userId: req.user.id.toString(),
        plan: plan,
        credits: plan === 'pro' ? '20' : '100'
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error al crear checkout:', error);
    res.status(500).json({ error: 'Error al procesar el pago' });
  }
});

// Webhook para recibir eventos de Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Error al verificar webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const credits = parseInt(session.metadata.credits);
    const plan = session.metadata.plan;

    try {
      await pool.query(
        'UPDATE users SET credits = credits + $1, plan = $2 WHERE id = $3',
        [credits, plan, userId]
      );
      
      console.log(`✅ Usuario ${userId} recibió ${credits} créditos (plan ${plan})`);
    } catch (error) {
      console.error('Error al actualizar créditos:', error);
    }
  }

  res.json({ received: true });
});

module.exports = router;