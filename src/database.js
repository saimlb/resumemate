const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'resumemate.db');
const db = new sqlite3.Database(dbPath);

// Inicializar tablas
db.serialize(() => {
  // Tabla de usuarios
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      credits INTEGER DEFAULT 2,
      plan TEXT DEFAULT 'free',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de análisis
  db.run(`
    CREATE TABLE IF NOT EXISTS analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      score INTEGER,
      issues TEXT,
      suggestions TEXT,
      optimized_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Crear usuario de prueba
  const testEmail = 'demo@resumemate.com';
  db.get('SELECT * FROM users WHERE email = ?', [testEmail], (err, row) => {
    if (!row) {
      const hashedPassword = bcrypt.hashSync('demopass123', 10);
      db.run(
        'INSERT INTO users (email, password, name, credits, plan) VALUES (?, ?, ?, ?, ?)',
        [testEmail, hashedPassword, 'Usuario Demo', 10, 'premium']
      );
      console.log('✅ Usuario de prueba creado: demo@resumemate.com / demopass123');
    }
  });
});

module.exports = db; 
