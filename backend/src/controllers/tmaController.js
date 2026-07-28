'use strict';

/* ============================================================
   Telegram Mini App authentication.
   Verifies `initData` HMAC signature (Telegram spec), then
   upserts the user into users_data by telegram_id and issues
   the same JWT the web app uses.
   ============================================================ */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const config = require('../config');
const bot = require('../services/botService');

const JWT_SECRET = process.env.JWT_SECRET;
const BOT_TOKEN = config.BOT_TOKEN;

/**
 * Validate Telegram WebApp initData.
 * @returns parsed user object or null if signature is invalid.
 */
function verifyInitData(initData) {
  if (!initData || !BOT_TOKEN) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  params.delete('hash');

  // Build data-check-string: sorted "key=value" joined by \n
  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(BOT_TOKEN)
    .digest();

  const computed = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (computed !== hash) return null;

  // Optional freshness check (24h)
  const authDate = Number(params.get('auth_date') || 0);
  if (authDate && Date.now() / 1000 - authDate > 86400) return null;

  try {
    return JSON.parse(params.get('user') || 'null');
  } catch {
    return null;
  }
}

function publicUser(u) {
  return {
    id: String(u.id || ''),
    name: u.name || '',
    surname: u.surname || '',
    address: u.address || '',
    phone: u.phone || '',
    role: u.role || 'user',
    points: u.points || 0,
  };
}

function makeToken(u) {
  return jwt.sign(
    { id: String(u.id), phone: u.phone || '', role: u.role || 'user' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

exports.auth = async (req, res) => {
  try {
    const { initData } = req.body;

    const tgUser = verifyInitData(initData);
    if (!tgUser || !tgUser.id) {
      return res.status(401).json({ error: 'Invalid Telegram signature' });
    }

    const telegramId = Number(tgUser.id);
    const lang = (tgUser.language_code || 'ru').slice(0, 2);

    // Find existing by telegram_id
    const existing = await query(
      'SELECT * FROM users_data WHERE telegram_id=$1',
      [telegramId]
    );

    let record;

    if (existing.rows.length > 0) {
      record = existing.rows[0].data;
      record.id = existing.rows[0].id;
      record.points = existing.rows[0].points ?? record.points ?? 0;
    } else {
      const now = new Date().toISOString();
      const id = String(telegramId);
      record = {
        id,
        name: tgUser.first_name || '',
        surname: tgUser.last_name || '',
        address: '',
        phone: '',
        phoneNorm: `tg${telegramId}`, // placeholder until contact shared
        telegramId,
        username: tgUser.username || '',
        lang,
        role: 'user',
        points: 0,
        createdAt: now,
        updatedAt: now,
      };

      await query(
        `INSERT INTO users_data (id, phone_norm, telegram_id, lang, data, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [id, record.phoneNorm, telegramId, lang, JSON.stringify(record)]
      );
    }

    const token = makeToken(record);
    res.json({ token, user: publicUser(record) });
  } catch (e) {
    console.error('tma auth:', e.message);
    res.status(500).json({ error: 'Auth failed' });
  }
};

/** Runtime config for the Mini App (which features are live). */
exports.config = (_req, res) => {
  res.json({
    payments: Boolean(config.PROVIDER_TOKEN),
    botUsername: config.BOT_USERNAME || '',
  });
};

function userFromReq(req) {
  const auth = req.headers.authorization || '';
  const t = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!t) return null;
  try {
    return jwt.verify(t, JWT_SECRET);
  } catch {
    return null;
  }
}

/** Create a Telegram Payments invoice link for one of the caller's orders. */
exports.invoice = async (req, res) => {
  try {
    if (!config.PROVIDER_TOKEN) {
      return res.status(400).json({ error: 'payments_disabled' });
    }
    const u = userFromReq(req);
    if (!u) return res.status(401).json({ error: 'Unauthorized' });

    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId required' });

    const r = await query('SELECT * FROM orders WHERE id=$1', [String(orderId)]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const order = r.rows[0];

    // Ownership: JWT id matches the order's telegram/customer id.
    const owns =
      String(order.telegram_id || '') === String(u.id) ||
      String(order.customer_id || '') === String(u.id);
    if (!owns) return res.status(403).json({ error: 'Forbidden' });

    if (order.paid) return res.status(409).json({ error: 'already_paid' });

    const link = await bot.createInvoiceLink(order);
    if (!link.ok) {
      return res.status(502).json({ error: link.description || 'invoice_failed' });
    }
    res.json({ url: link.result });
  } catch (e) {
    console.error('tma invoice:', e.message);
    res.status(500).json({ error: 'invoice_failed' });
  }
};
