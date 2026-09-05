'use strict';

/* ============================================================================
   Database client.

   - `db`    → Drizzle ORM instance (type-safe query builder), the primary API.
   - `pool`  → raw pg Pool, still used by the migrator and a couple of hot paths.
   - `query` → thin raw-SQL helper kept for backward compatibility.
   - `initDB` → runs pending migrations (from ./db/migrations) then idempotent
                seeding. Replaces the old hand-written CREATE TABLE bootstrap.
   ========================================================================== */

const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const { sql } = require('drizzle-orm');
const path = require('path');
const schema = require('./db/schema');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => console.log('✅ PostgreSQL ulandi'));
pool.on('error', err => console.error('❌ PostgreSQL xatosi:', err.message));

const db = drizzle(pool, { schema });

// ── Raw-SQL helper (backward compatibility) ─────────────────────────────────
async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('❌ SQL xatosi:', err.message);
    console.error('Query:', text.slice(0, 160));
    throw err;
  }
}

// ── Seed data: the 3 hero slides, inserted only on a brand-new database so the
//    admin has real content to manage from day one. No-op once promos exist. ──
const HERO_SEED = [
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

async function seed() {
  // Seed hero slides once (fresh DB only).
  const [{ n }] = await db
    .select({ n: sql`count(*)::int` })
    .from(schema.promos);
  if (Number(n) === 0) {
    await db.insert(schema.promos).values(
      HERO_SEED.map(s => ({
        id: s.id, title: s.title, subtitle: s.subtitle, badge: s.badge, cta: s.cta,
        img: s.img, video: s.video, link: s.link, theme: 'dark', active: true, sort: s.sort,
      }))
    );
    console.log('✅ Seeded 3 hero slides');
  }

  // Backfill order channel for any legacy rows placed by Telegram users but not
  // yet tagged. Idempotent (guarded by source <> 'tma'); a no-op on fresh DBs.
  await query(`
    UPDATE orders o SET source = 'tma'
    WHERE o.source <> 'tma'
      AND o.customer_id IN (SELECT id FROM users_data WHERE telegram_id IS NOT NULL);
  `);
}

// ── Bootstrap: run migrations, then seed. Called once at server startup. ─────
async function initDB() {
  try {
    await migrate(db, { migrationsFolder: path.join(__dirname, 'db/migrations') });
    console.log('✅ Migratsiyalar qo\'llandi');
    await seed();
    console.log('✅ DB tayyor');
  } catch (err) {
    console.error('❌ DB init xatosi:', err.message);
    throw err;
  }
}

module.exports = { db, pool, query, initDB, schema };
