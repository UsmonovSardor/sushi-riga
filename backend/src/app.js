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

const ALLOWED = [
  'https://cherrysushi.eu',
  'https://www.cherrysushi.eu',
  'http://cherrysushi.eu',
];

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // same-origin / curl
    const ok =
      ALLOWED.includes(origin) ||
      origin.endsWith('.railway.app') ||
      origin.endsWith('.onrender.com') ||
      origin.includes('localhost');
    cb(null, ok ? null : new Error('CORS'), ok);
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));

app.use(rateLimit({ windowMs:15*60*1000, max:500, standardHeaders:true, legacyHeaders:false }));
app.use(express.json({ limit:'200kb' }));
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (_req, res) => res.json({ status:'ok', ts: new Date() }));
app.use('/api', router);
app.use((_req, res) => res.status(404).json({ error:'Not found' }));
app.use(errorHandler);

module.exports = app;
