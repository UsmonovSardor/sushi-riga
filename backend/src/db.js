'use strict';

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => console.log('✅ PostgreSQL ulandi'));
pool.on('error', err => console.error('❌ PostgreSQL xatosi:', err.message));

async function initDB() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        cat TEXT NOT NULL DEFAULT '',
        e TEXT DEFAULT '',
        name JSONB NOT NULL DEFAULT '{}',
        description JSONB NOT NULL DEFAULT '{}',
        price NUMERIC(10,2) NOT NULL DEFAULT 0,
        old_price NUMERIC(10,2),
        img TEXT DEFAULT '',
        hit BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        surname TEXT DEFAULT '',
        phone TEXT NOT NULL DEFAULT '',
        note TEXT DEFAULT '',
        address TEXT DEFAULT '',
        items JSONB NOT NULL DEFAULT '[]',
        total NUMERIC(10,2) NOT NULL DEFAULT 0,
        pay_method TEXT NOT NULL DEFAULT 'cash',
        lang TEXT NOT NULL DEFAULT 'lv',
        status TEXT NOT NULL DEFAULT 'new',
        status_history JSONB NOT NULL DEFAULT '[]',
        customer_id TEXT,
        customer_phone TEXT,
        ready_at TIMESTAMPTZ,
        delivered_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users_data (
        id TEXT PRIMARY KEY,
        phone_norm TEXT UNIQUE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_menu_cat ON menu_items(cat);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_custid ON orders(customer_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_phone_norm ON users_data(phone_norm);`);

    await client.query('COMMIT');
    console.log('✅ DB tabllar tayyor');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ DB init xatosi:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('❌ SQL xatosi:', err.message);
    console.error('Query:', text.slice(0, 160));
    throw err;
  }
}

module.exports = {
  pool,
  query,
  initDB,
};
