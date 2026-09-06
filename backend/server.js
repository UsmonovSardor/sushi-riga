'use strict';

// Sentry MUST be first — it auto-instruments http/express as they load.
require('./src/instrument');
require('dotenv').config();

const app    = require('./src/app');
const config = require('./src/config');
const { initDB } = require('./src/db');
const bot    = require('./src/services/botService');

// DB tabllarni yaratib keyin serverni ishga tushiramiz
initDB()
  .then(() => {
    app.listen(config.PORT, () => {
      console.log(`🍣 Sushi Riga API → http://localhost:${config.PORT} [${config.NODE_ENV}]`);
    });
    // Telegram bot webhook (non-blocking)
    bot.setupWebhook().catch(err => console.error('webhook setup:', err.message));
  })
  .catch(err => {
    console.error('❌ DB init muvaffaqiyatsiz, server ishga tushmadi:', err.message);
    process.exit(1);
  });
