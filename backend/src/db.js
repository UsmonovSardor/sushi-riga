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
        await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        menu_id TEXT NOT NULL,
        order_id TEXT NOT NULL,
        user_id TEXT,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(order_id, menu_id)
      );
    `);

        await client.query(`CREATE INDEX IF NOT EXISTS idx_reviews_menu ON reviews(menu_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);`);

    // Admin-managed promo banners shown on the storefront.
    await client.query(`
      CREATE TABLE IF NOT EXISTS promos (
        id TEXT PRIMARY KEY,
        title JSONB NOT NULL DEFAULT '{}',
        subtitle JSONB NOT NULL DEFAULT '{}',
        cta JSONB NOT NULL DEFAULT '{}',
        img TEXT DEFAULT '',
        link TEXT DEFAULT '',
        theme TEXT NOT NULL DEFAULT 'red',
        active BOOLEAN NOT NULL DEFAULT true,
        sort INTEGER NOT NULL DEFAULT 0,
        starts_at TIMESTAMPTZ,
        ends_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_promos_active ON promos(active, sort);`);
    // Hero-slide fields: a background video (in addition to img) and a badge pill.
    await client.query(`ALTER TABLE promos ADD COLUMN IF NOT EXISTS video TEXT DEFAULT '';`);
    await client.query(`ALTER TABLE promos ADD COLUMN IF NOT EXISTS badge JSONB NOT NULL DEFAULT '{}';`);

    // Seed the current 3 hero slides once, so the admin has real content to
    // manage from day one (instead of the previously hardcoded slider).
    const pcount = await client.query('SELECT COUNT(*)::int AS n FROM promos');
    if (pcount.rows[0].n === 0) {
      const seed = [
        {
          id: 'seed1', sort: 0, video: '/hero/cherry-sushi-1.mp4',
          img: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=1200&h=630&fit=crop&auto=format&q=75',
          link: 'cold',
          badge: { lv: '🍣 Populārākais', ru: '🍣 Популярное', en: '🍣 Popular' },
          title: { lv: 'Svaigi rolli\nkatru dienu', ru: 'Свежие роллы\nкаждый день', en: 'Fresh rolls\nevery day' },
          subtitle: { lv: 'Gatavoti no svaigiem produktiem', ru: 'Готовим из свежих продуктов', en: 'Made from fresh ingredients' },
          cta: { lv: 'Pasūtīt', ru: 'Заказать', en: 'Order Now' },
        },
        {
          id: 'seed2', sort: 1, video: '/hero/cherry-sushi-2.mp4',
          img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200&h=630&fit=crop&auto=format&q=75',
          link: 'double',
          badge: { lv: '🎯 Jaunums', ru: '🎯 Новинка', en: '🎯 New' },
          title: { lv: 'Dubultie sēti\nlielāka garša', ru: 'Дабл сеты\nбольше вкуса', en: 'Double sets\nmore flavor' },
          subtitle: { lv: 'Labākā izvēle kompānijai', ru: 'Лучший выбор для компании', en: 'Best choice for the company' },
          cta: { lv: 'Pasūtīt', ru: 'Заказать', en: 'Order Now' },
        },
        {
          id: 'seed3', sort: 2, video: '/hero/cherry-sushi-3.mp4',
          img: 'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=1200&h=630&fit=crop&auto=format&q=75',
          link: 'sets',
          badge: { lv: '🔥 Akcija', ru: '🔥 Акция', en: '🔥 Sale' },
          title: { lv: 'Sēti ar atlaidi\nlīdz 30%', ru: 'Сеты со скидкой\nдо 30%', en: 'Sets on sale\nup to 30%' },
          subtitle: { lv: 'Pieredzējušu šefpavāru receptes', ru: 'Рецепты опытных поваров', en: 'Expert chef recipes' },
          cta: { lv: 'Pasūtīt', ru: 'Заказать', en: 'Order Now' },
        },
      ];
      for (const s of seed) {
        await client.query(
          `INSERT INTO promos (id, title, subtitle, badge, cta, img, video, link, theme, active, sort)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'dark',true,$9)`,
          [s.id, JSON.stringify(s.title), JSON.stringify(s.subtitle), JSON.stringify(s.badge),
           JSON.stringify(s.cta), s.img, s.video, s.link, s.sort]
        );
      }
      console.log('✅ Seeded 3 hero slides');
    }

    // ---- Telegram Mini App migrations (idempotent) ----
    await client.query(`ALTER TABLE users_data ADD COLUMN IF NOT EXISTS telegram_id BIGINT;`);
    await client.query(`ALTER TABLE users_data ADD COLUMN IF NOT EXISTS lang TEXT DEFAULT 'ru';`);
    await client.query(`ALTER TABLE users_data ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;`);
    await client.query(`ALTER TABLE users_data ADD COLUMN IF NOT EXISTS referred_by BIGINT;`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telegram_id ON users_data(telegram_id) WHERE telegram_id IS NOT NULL;`);

    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid BOOLEAN NOT NULL DEFAULT false;`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_charge_id TEXT;`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS telegram_id BIGINT;`);

    // Order channel: 'web' (website) or 'tma' (Telegram Mini App). New orders set
    // this at creation; existing orders are backfilled from whether the placing
    // customer is a Telegram user (their users_data row has a telegram_id).
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'web';`);
    await client.query(`
      UPDATE orders o SET source = 'tma'
      WHERE o.source <> 'tma'
        AND o.customer_id IN (SELECT id FROM users_data WHERE telegram_id IS NOT NULL);
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source);`);

    

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
