const Stripe = require('stripe');

// Inicializar Stripe con tu clave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// IDs de los productos y precios
const PRICE_IDS = {
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
  PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY,
  PREMIUM_MONTHLY: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
  PREMIUM_YEARLY: process.env.STRIPE_PRICE_PREMIUM_YEARLY
};

module.exports = { stripe, PRICE_IDS };