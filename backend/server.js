'use strict';

require('dotenv').config();

const app    = require('./src/app');
const config = require('./src/config');
const { initDB } = require('./src/db');

// DB tabllarni yaratib keyin serverni ishga tushiramiz
initDB()
  .then(() => {
    app.listen(config.PORT, () => {
      console.log(`🍣 Sushi Riga API → http://localhost:${config.PORT} [${config.NODE_ENV}]`);
    });
  })
  .catch(err => {
    console.error('❌ DB init muvaffaqiyatsiz, server ishga tushmadi:', err.message);
    process.exit(1);
  });
