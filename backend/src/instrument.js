'use strict';

/* ============================================================================
   Sentry init — MUST run before any other module so the SDK can auto-instrument
   http/express. Required as the very first line of the server entrypoint.

   No-op when SENTRY_DSN is unset (local dev, or before the DSN is configured in
   Railway), so nothing breaks without it.
   ========================================================================== */

require('dotenv').config();
const Sentry = require('@sentry/node');

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    // Capture 10% of transactions for performance; 100% of errors always send.
    tracesSampleRate: 0.1,
    // Don't leak PII by default (order names/phones stay out of Sentry).
    sendDefaultPii: false,
  });
  console.log('✅ Sentry initialized');
} else {
  console.log('ℹ️  SENTRY_DSN not set — error monitoring disabled');
}

module.exports = Sentry;
