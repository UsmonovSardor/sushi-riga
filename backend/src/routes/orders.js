'use strict';
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/orderController');
const { validate, schemas } = require('../validators');

// Tight per-IP cap on order creation — a real customer places one order at a
// time; this blunts scripted spam that would flood the Telegram channel.
const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment and try again.' },
});

router.get('/my', ctrl.getMyOrders);
// Real-time order-status stream (SSE). Auth is via ?token= (EventSource can't
// send headers); the handler verifies the JWT itself.
router.get('/stream', ctrl.stream);
router.post('/', orderLimiter, validate(schemas.createOrder), ctrl.createOrder);
// NOTE: the "all orders" listing is intentionally NOT exposed here — it returns
// customer PII (names, phones). Admins read orders via the authenticated
// /api/admin/orders route (adminController.getOrders). Do not re-add a public GET.

module.exports = router;
