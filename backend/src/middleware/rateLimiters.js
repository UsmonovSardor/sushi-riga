'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Credential-endpoint rate limits. Auth here is phone + name (no password) and
 * the admin gate is a shared secret, so both are brute-force / enumeration
 * targets — these per-IP caps blunt scripted attacks without hurting the low
 * volume of legitimate logins a single restaurant sees.
 *
 * NOTE: relies on `app.set('trust proxy', …)` so the key is the real client IP
 * (X-Forwarded-For) behind Railway's edge, not the shared proxy IP.
 */

// Register / login: enumeration + credential-stuffing protection.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});

// Admin secret exchange: far fewer legitimate hits, so a tighter cap.
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait and try again.' },
});

module.exports = { authLimiter, adminLoginLimiter };
