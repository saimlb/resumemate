const { Paddle } = require('@paddle/paddle-node-sdk');

// Inicializar Paddle con tu clave secreta
const paddle = new Paddle(process.env.PADDLE_SECRET_KEY);

// IDs de los precios de tus productos
const PRICE_IDS = {
  PRO_MONTHLY: process.env.PADDLE_PRICE_PRO,
  PREMIUM_MONTHLY: process.env.PADDLE_PRICE_PREMIUM
};

module.exports = { paddle, PRICE_IDS };