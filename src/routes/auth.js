const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

// Registro
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (email, password, name, credits, plan) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, name, 2, 'free'],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Este email ya está registrado.' });
          }
          return res.status(500).json({ error: 'Error al registrar usuario.' });
        }
        
        const token = jwt.sign(
          { id: this.lastID, email },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        
        res.status(201).json({
          token,
          user: { id: this.lastID, email, name, credits: 2, plan: 'free' }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario.' });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Error al iniciar sesión.' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        plan: user.plan
      }
    });
  });
});

// Obtener perfil
router.get('/me', (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No autorizado.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    db.get('SELECT id, email, name, credits, plan FROM users WHERE id = ?', [decoded.id], (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }
      res.json(user);
    });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido.' });
  }
});

module.exports = router; 
