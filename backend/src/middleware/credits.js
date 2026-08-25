const db = require('../database');

module.exports = (req, res, next) => {
  const userId = req.user.id;
  
  db.get('SELECT credits FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error al verificar créditos.' });
    }
    
    if (!row || row.credits < 1) {
      return res.status(403).json({ 
        error: 'Créditos insuficientes. Por favor, actualiza tu plan.',
        credits: 0
      });
    }
    
    req.credits = row.credits;
    next();
  });
}; 
