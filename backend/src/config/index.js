'use strict';
module.exports = {
  NODE_ENV:       process.env.NODE_ENV               || 'development',
  PORT:           Number(process.env.PORT)            || 4000,
  BOT_TOKEN:      process.env.TELEGRAM_BOT_TOKEN      || '',
  CHAT_ID:        process.env.TELEGRAM_CHAT_ID        || '',
  ALLOWED_ORIGINS:(process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
                   .split(',').map(s => s.trim()),
};
