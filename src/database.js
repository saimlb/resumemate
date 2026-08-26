const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Configurar conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Requerido para Render
  }
});

// Función para inicializar la base de datos
async function initDatabase() {
  try {
    // Crear tabla de usuarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        credits INTEGER DEFAULT 2,
        plan TEXT DEFAULT 'free',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de análisis
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analyses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        score INTEGER,
        issues TEXT,
        suggestions TEXT,
        optimized_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Crear usuario de prueba
    const testEmail = 'demo@resumemate.com';
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [testEmail]);
    
    if (existingUser.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('demopass123', 10);
      await pool.query(
        'INSERT INTO users (email, password, name, credits, plan) VALUES ($1, $2, $3, $4, $5)',
        [testEmail, hashedPassword, 'Usuario Demo', 10, 'premium']
      );
      console.log('✅ Usuario de prueba creado: demo@resumemate.com / demopass123');
    }

    console.log('✅ Base de datos PostgreSQL conectada');
  } catch (error) {
    console.error('❌ Error al inicializar base de datos:', error);
  }
}

// Inicializar
initDatabase();

module.exports = pool;
