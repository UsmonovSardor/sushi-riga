'use strict';

/* ============================================================================
   Drizzle schema — the single source of truth for the database structure.

   Every table, column, default, and index here matches the live production
   schema exactly (verified with a pg_dump diff against the previous
   CREATE TABLE / ALTER TABLE bootstrap). Schema changes from now on are made
   here and shipped as generated migrations in ./migrations — never as ad-hoc
   ALTER statements.
   ========================================================================== */

const {
  pgTable, text, jsonb, numeric, boolean, integer, bigint, timestamp,
  index, uniqueIndex, unique, check,
} = require('drizzle-orm/pg-core');
const { sql } = require('drizzle-orm');

// Reusable timestamptz DEFAULT now() NOT NULL column.
const tsNow = (name) =>
  timestamp(name, { withTimezone: true }).notNull().defaultNow();

// ── menu_items ─────────────────────────────────────────────────────────────
const menuItems = pgTable('menu_items', {
  id:          text('id').primaryKey(),
  cat:         text('cat').notNull().default(''),
  e:           text('e').default(''),
  name:        jsonb('name').notNull().default({}),
  description: jsonb('description').notNull().default({}),
  price:       numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
  oldPrice:    numeric('old_price', { precision: 10, scale: 2 }),
  img:         text('img').default(''),
  hit:         boolean('hit').notNull().default(false),
  createdAt:   tsNow('created_at'),
  updatedAt:   tsNow('updated_at'),
}, (t) => ({
  catIdx: index('idx_menu_cat').on(t.cat),
}));

// ── orders ─────────────────────────────────────────────────────────────────
const orders = pgTable('orders', {
  id:               text('id').primaryKey(),
  name:             text('name').notNull().default(''),
  surname:          text('surname').default(''),
  phone:            text('phone').notNull().default(''),
  note:             text('note').default(''),
  address:          text('address').default(''),
  items:            jsonb('items').notNull().default([]),
  total:            numeric('total', { precision: 10, scale: 2 }).notNull().default('0'),
  payMethod:        text('pay_method').notNull().default('cash'),
  lang:             text('lang').notNull().default('lv'),
  status:           text('status').notNull().default('new'),
  statusHistory:    jsonb('status_history').notNull().default([]),
  customerId:       text('customer_id'),
  customerPhone:    text('customer_phone'),
  readyAt:          timestamp('ready_at', { withTimezone: true }),
  deliveredAt:      timestamp('delivered_at', { withTimezone: true }),
  createdAt:        tsNow('created_at'),
  updatedAt:        tsNow('updated_at'),
  paid:             boolean('paid').notNull().default(false),
  providerChargeId: text('provider_charge_id'),
  telegramId:       bigint('telegram_id', { mode: 'number' }),
  source:           text('source').notNull().default('web'),
}, (t) => ({
  createdIdx: index('idx_orders_created').on(t.createdAt.desc()),
  custIdx:    index('idx_orders_custid').on(t.customerId),
  sourceIdx:  index('idx_orders_source').on(t.source),
  statusIdx:  index('idx_orders_status').on(t.status),
}));

// ── promos ─────────────────────────────────────────────────────────────────
const promos = pgTable('promos', {
  id:        text('id').primaryKey(),
  title:     jsonb('title').notNull().default({}),
  subtitle:  jsonb('subtitle').notNull().default({}),
  cta:       jsonb('cta').notNull().default({}),
  img:       text('img').default(''),
  link:      text('link').default(''),
  theme:     text('theme').notNull().default('red'),
  active:    boolean('active').notNull().default(true),
  sort:      integer('sort').notNull().default(0),
  startsAt:  timestamp('starts_at', { withTimezone: true }),
  endsAt:    timestamp('ends_at', { withTimezone: true }),
  createdAt: tsNow('created_at'),
  updatedAt: tsNow('updated_at'),
  video:     text('video').default(''),
  badge:     jsonb('badge').notNull().default({}),
}, (t) => ({
  activeIdx: index('idx_promos_active').on(t.active, t.sort),
}));

// ── reviews ────────────────────────────────────────────────────────────────
const reviews = pgTable('reviews', {
  id:        text('id').primaryKey(),
  menuId:    text('menu_id').notNull(),
  orderId:   text('order_id').notNull(),
  userId:    text('user_id'),
  rating:    integer('rating').notNull(),
  comment:   text('comment').default(''),
  createdAt: tsNow('created_at'),
}, (t) => ({
  ratingCheck:  check('reviews_rating_check', sql`${t.rating} >= 1 AND ${t.rating} <= 5`),
  orderMenuUniq: unique('reviews_order_id_menu_id_key').on(t.orderId, t.menuId),
  menuIdx:      index('idx_reviews_menu').on(t.menuId),
  createdIdx:   index('idx_reviews_created').on(t.createdAt.desc()),
}));

// ── users_data ─────────────────────────────────────────────────────────────
const usersData = pgTable('users_data', {
  id:         text('id').primaryKey(),
  phoneNorm:  text('phone_norm').notNull().unique('users_data_phone_norm_key'),
  data:       jsonb('data').notNull(),
  createdAt:  tsNow('created_at'),
  updatedAt:  tsNow('updated_at'),
  telegramId: bigint('telegram_id', { mode: 'number' }),
  lang:       text('lang').default('ru'),
  points:     integer('points').notNull().default(0),
  referredBy: bigint('referred_by', { mode: 'number' }),
}, (t) => ({
  phoneNormIdx: index('idx_users_phone_norm').on(t.phoneNorm),
  telegramIdx:  uniqueIndex('idx_users_telegram_id')
                  .on(t.telegramId)
                  .where(sql`telegram_id IS NOT NULL`),
}));

module.exports = { menuItems, orders, promos, reviews, usersData };
