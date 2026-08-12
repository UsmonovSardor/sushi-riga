'use strict';
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const compression = require('compression');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
const config     = require('./config');
const router     = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const ORIGINS = [
  'https://cherrysushi.eu','https://www.cherrysushi.eu',
  'http://cherrysushi.eu','http://www.cherrysushi.eu',
];
function isAllowed(origin) {
  if (!origin) return true;
  if (ORIGINS.includes(origin)) return true;
  if (/\.cherrysushi\.eu$/.test(origin)) return true; // app.cherrysushi.eu (Mini App)
  if (/\.railway\.app$/.test(origin)) return true;
  if (/\.vercel\.app$/.test(origin)) return true;     // Mini App preview deploys
  if (/localhost/.test(origin)) return true;
  return false;
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (isAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(compression()); // gzip/brotli JSON + static responses
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: (o, cb) => cb(null, isAllowed(o)), credentials: true, optionsSuccessStatus: 200 }));
app.use(rateLimit({ windowMs: 15*60*1000, max: 500, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '25mb' })); // headroom for base64 hero video uploads
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Serve uploaded images
const uploadsDir = path.join(config.DATA_PATH, 'uploads');
app.use('/uploads', express.static(uploadsDir));

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));
app.use('/api', router);
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

module.exports = app;
