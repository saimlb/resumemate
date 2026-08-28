const pool = require('../database');

module.exports = async (req, res, next) => {
  const userId = req.user.id;
  
  try {
    const result = await pool.query('SELECT credits FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    
    if (!user || user.credits < 1) {
      return res.status(403).json({ 
        error: 'Créditos insuficientes. Por favor, actualiza tu plan.',
        credits: 0
      });
    }
    
    req.credits = user.credits;
    next();
  } catch (error) {
    console.error('Error al verificar créditos:', error);
    res.status(500).json({ error: 'Error al verificar créditos.' });
  }
};
