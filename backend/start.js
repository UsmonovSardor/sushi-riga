'use strict';
const fs   = require('fs');
const path = require('path');

// On Railway, /app/persistent is a volume mount
// We copy initial data there on first run, then always use it
const VOLUME = process.env.DATA_PATH || path.join(__dirname, 'src/data');
const INIT   = path.join(__dirname, 'src/data-init');

// Ensure directories exist
if (!fs.existsSync(VOLUME)) fs.mkdirSync(VOLUME, { recursive: true });

// Copy initial files to volume only if they don't exist there
['menu.json', 'orders.json', 'users.json'].forEach(file => {
  const dest = path.join(VOLUME, file);
  const src  = path.join(INIT, file);
  if (!fs.existsSync(dest) && fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`📦 Initialized ${file} from template`);
  }
});

console.log(`📂 Data path: ${VOLUME}`);

// Set env var for other modules
process.env.DATA_PATH = VOLUME;

// Start app
require('./server.js');
