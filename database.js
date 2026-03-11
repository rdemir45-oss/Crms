require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    // Kullanıcılar tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Yatırımcılar tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS investors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        surname VARCHAR(100) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Görüşme notları tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS meeting_notes (
        id SERIAL PRIMARY KEY,
        investor_id INTEGER NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
        step_number INTEGER NOT NULL DEFAULT 1,
        title VARCHAR(200),
        content TEXT NOT NULL,
        meeting_date DATE,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Mevcut tabloya status kolonu ekle (migration)
    await client.query(`
      ALTER TABLE meeting_notes ADD COLUMN IF NOT EXISTS status VARCHAR(50)
    `);

    // 3 admin kullanıcısı oluştur (ilk çalıştırmada)
    const admins = [
      {
        username: process.env.ADMIN1_USERNAME || 'admin1',
        password: process.env.ADMIN1_PASSWORD || 'Admin123!',
        full_name: process.env.ADMIN1_NAME || 'Yönetici 1'
      },
      {
        username: process.env.ADMIN2_USERNAME || 'admin2',
        password: process.env.ADMIN2_PASSWORD || 'Admin123!',
        full_name: process.env.ADMIN2_NAME || 'Yönetici 2'
      },
      {
        username: process.env.ADMIN3_USERNAME || 'admin3',
        password: process.env.ADMIN3_PASSWORD || 'Admin123!',
        full_name: process.env.ADMIN3_NAME || 'Yönetici 3'
      }
    ];

    for (const admin of admins) {
      const { rows } = await client.query(
        'SELECT id FROM users WHERE username = $1',
        [admin.username]
      );
      if (rows.length === 0) {
        const hash = await bcrypt.hash(admin.password, 12);
        await client.query(
          'INSERT INTO users (username, password_hash, full_name) VALUES ($1, $2, $3)',
          [admin.username, hash, admin.full_name]
        );
        console.log(`✓ Admin oluşturuldu: ${admin.username}`);
      }
    }

    console.log('✓ Veritabanı hazır.');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDatabase };
