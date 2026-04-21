'use strict';
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const config     = require('./config');
const router     = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Allowed origins ──────────────────────────────────────────────────────────
const ORIGINS = [
  'https://cherrysushi.eu',
  'https://www.cherrysushi.eu',
  'http://cherrysushi.eu',
  'http://www.cherrysushi.eu',
];

function isAllowed(origin) {
  if (!origin) return true;                     // curl / server-to-server
  if (ORIGINS.includes(origin)) return true;
  if (/\.railway\.app$/.test(origin)) return true;
  if (/localhost/.test(origin)) return true;
  return false;
}

// Raw headers — fires before everything, guarantees CORS even on error
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

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: (o, cb) => cb(null, isAllowed(o)), credentials: true, optionsSuccessStatus: 200 }));
app.use(rateLimit({ windowMs: 15*60*1000, max: 500, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '200kb' }));
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date(), cors: 'enabled' }));
app.use('/api', router);
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

module.exports = app;
