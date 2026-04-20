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

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    // Allow Railway domains, Render, and configured origins
    const allowed = [
      ...config.ALLOWED_ORIGINS,
      /\.railway\.app$/,
      /\.onrender\.com$/,
      /localhost/,
    ];
    if (!origin) return cb(null, true); // same-origin / curl
    const ok = allowed.some(p =>
      typeof p === 'string' ? p === origin : p.test(origin)
    );
    cb(ok ? null : new Error('CORS'), ok);
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(rateLimit({ windowMs:15*60*1000, max:500, standardHeaders:true, legacyHeaders:false }));
app.use(express.json({ limit:'100kb' }));
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (_req, res) => res.json({ status:'ok', ts: new Date() }));
app.use('/api', router);
app.use((_req, res) => res.status(404).json({ error:'Not found' }));
app.use(errorHandler);

module.exports = app;
