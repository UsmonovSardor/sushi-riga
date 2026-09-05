'use strict';

/* ============================================================================
   Zod validation schemas + middleware.

   One schema per mutating endpoint, shared as the single definition of what a
   valid request body looks like. `validate(schema)` parses req.body, replaces
   it with the coerced/cleaned result, and returns 422 with structured errors
   on failure — matching the previous express-validator response shape.
   ========================================================================== */

const { z } = require('zod');

// A localized text blob: { lv, ru, en } (all optional, extra keys tolerated).
const i18nText = z.record(z.string(), z.string()).or(z.string());

const str = z.string();
const optStr = z.string().trim().optional();

// ── /api/orders (create) ────────────────────────────────────────────────────
const createOrder = z.object({
  name:      str.trim().min(1, 'Name required'),
  phone:     str.trim().min(1, 'Phone required'),
  items:     z.array(z.object({}).passthrough()).min(1, 'Cart is empty').max(100, 'Too many items'),
  surname:   optStr,
  note:      optStr,
  address:   optStr,
  lang:      z.enum(['lv', 'ru', 'en']).optional(),
  payMethod: z.enum(['cash', 'card']).optional(),
}).passthrough();

// ── /api/auth ───────────────────────────────────────────────────────────────
const register = z.object({
  name:    str.trim().min(1),
  surname: str.trim().min(1),
  phone:   str.trim().min(1),
  address: optStr,
  lang:    z.enum(['lv', 'ru', 'en']).optional(),
}).passthrough();

const login = z.object({
  name:    str.trim().min(1),
  surname: str.trim().min(1),
  phone:   str.trim().min(1),
  lang:    z.enum(['lv', 'ru', 'en']).optional(),
}).passthrough();

// ── /api/admin (menu items) ─────────────────────────────────────────────────
const menuItem = z.object({
  id:    z.union([z.string(), z.number()]).optional(),
  cat:   str.min(1, 'cat required'),
  e:     optStr,
  name:  i18nText,
  desc:  i18nText.optional(),
  price: z.coerce.number().min(0),
  old:   z.coerce.number().nullable().optional(),
  img:   optStr,
  hit:   z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
}).passthrough();

// Update: every field optional (partial patch).
const menuItemUpdate = menuItem.partial();

// ── /api/admin (login) ──────────────────────────────────────────────────────
const adminLogin = z.object({ secret: str.min(1) }).passthrough();

// ── /api/promos ─────────────────────────────────────────────────────────────
const promo = z.object({
  title:    i18nText.optional(),
  subtitle: i18nText.optional(),
  badge:    i18nText.optional(),
  cta:      i18nText.optional(),
  img:      optStr,
  video:    optStr,
  link:     optStr,
  theme:    optStr,
  active:   z.boolean().optional(),
  sort:     z.coerce.number().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt:   z.string().nullable().optional(),
}).passthrough();

// ── /api/reviews (add) ──────────────────────────────────────────────────────
const review = z.object({
  menuId:  z.union([z.string(), z.number()]),
  orderId: z.union([z.string(), z.number()]),
  rating:  z.coerce.number().int().min(1).max(5),
  comment: z.string().max(400).optional(),
}).passthrough();

// ── /api/tma ────────────────────────────────────────────────────────────────
const tmaAuth = z.object({ initData: str.min(1) }).passthrough();
const tmaInvoice = z.object({ orderId: z.union([z.string(), z.number()]) }).passthrough();

// ── Middleware ──────────────────────────────────────────────────────────────
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).json({
        errors: result.error.issues.map(i => ({
          path: i.path.join('.'),
          msg: i.message,
        })),
      });
    }
    req.body = result.data;
    next();
  };
}

module.exports = {
  validate,
  schemas: {
    createOrder, register, login,
    menuItem, menuItemUpdate, adminLogin,
    promo, review, tmaAuth, tmaInvoice,
  },
};
