'use strict';
const path = require('path');

const DATA_PATH = process.env.DATA_PATH || path.join(__dirname, '../data');

const PUBLIC_URL =
  process.env.PUBLIC_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '');

module.exports = {
  NODE_ENV:       process.env.NODE_ENV               || 'development',
  PORT:           Number(process.env.PORT)            || 4000,
  BOT_TOKEN:      process.env.TELEGRAM_BOT_TOKEN      || '',
  CHAT_ID:        process.env.TELEGRAM_CHAT_ID        || '',
  // Telegram Payments provider token (BotFather → Payments). Empty ⇒ card disabled.
  PROVIDER_TOKEN: process.env.TELEGRAM_PROVIDER_TOKEN || '',
  // Public URL of THIS API (for webhook registration).
  PUBLIC_URL,
  // Mini App URL (menu button / deep links).
  TMA_URL:        process.env.TMA_URL                 || 'https://app.cherrysushi.eu',
  BOT_USERNAME:   process.env.TELEGRAM_BOT_USERNAME   || '',
  WEBHOOK_SECRET: process.env.BOT_WEBHOOK_SECRET      || '',
  ALLOWED_ORIGINS:(process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
                   .split(',').map(s => s.trim()),
  DATA_PATH,
};
