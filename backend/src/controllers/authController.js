'use strict';

const jwt = require('jsonwebtoken');
const { query } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;

const normalizePhone = v => String(v || '').replace(/[^\d]/g, '');

function publicUser(user) {
  return {
    id: String(user.id || ''),
    name: user.name || '',
    surname: user.surname || '',
    address: user.address || '',
    phone: user.phone || '',
    role: user.role || 'user',
  };
}

async function ensureUsersTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS users_data (
      id TEXT PRIMARY KEY,
      phone_norm TEXT UNIQUE NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_users_phone_norm
    ON users_data(phone_norm);
  `);
}

function makeToken(user) {
  return jwt.sign(
    {
      id: String(user.id),
      phone: user.phone,
      role: user.role || 'user',
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

exports.register = async (req, res) => {
  try {
    await ensureUsersTable();

    const { name, surname, address = '', phone } = req.body;

    if (!name || !surname || !phone) {
      return res.status(400).json({
        error: 'Name, surname and phone required',
      });
    }

    const phoneNorm = normalizePhone(phone);
    if (!phoneNorm) {
      return res.status(400).json({ error: 'Phone required' });
    }

    const exists = await query(
      'SELECT data FROM users_data WHERE phone_norm=$1',
      [phoneNorm]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({
        error: 'Bu nomer oldin ro‘yxatdan o‘tgan. Iltimos, kirish bo‘limidan kiring.',
      });
    }

    const now = new Date().toISOString();

    const user = {
      id: String(Date.now()),
      name: String(name).trim(),
      surname: String(surname).trim(),
      address: String(address || '').trim(),
      phone: String(phone).trim(),
      phoneNorm,
      role: 'user',
      createdAt: now,
      updatedAt: now,
    };

    await query(
      `
      INSERT INTO users_data (id, phone_norm, data, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      `,
      [user.id, phoneNorm, JSON.stringify(user)]
    );

    const token = makeToken(user);

    res.json({
      token,
      user: publicUser(user),
    });
  } catch (e) {
    console.error('register:', e.message);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    await ensureUsersTable();

    const { name, surname, phone } = req.body;

    if (!name || !surname || !phone) {
      return res.status(400).json({
        error: 'Name, surname and phone required',
      });
    }

    const phoneNorm = normalizePhone(phone);
    if (!phoneNorm) {
      return res.status(400).json({ error: 'Phone required' });
    }

    const r = await query(
      'SELECT data FROM users_data WHERE phone_norm=$1',
      [phoneNorm]
    );

    if (r.rows.length === 0) {
      return res.status(404).json({
        error: 'Bu nomer ro‘yxatdan o‘tmagan',
      });
    }

    const user = r.rows[0].data;

    const sameName =
      String(user.name || '').trim().toLowerCase() ===
      String(name || '').trim().toLowerCase();

    const sameSurname =
      String(user.surname || '').trim().toLowerCase() ===
      String(surname || '').trim().toLowerCase();

    if (!sameName || !sameSurname) {
      return res.status(401).json({
        error: 'Ism yoki familiya noto‘g‘ri',
      });
    }

    const token = makeToken(user);

    res.json({
      token,
      user: publicUser(user),
    });
  } catch (e) {
    console.error('login:', e.message);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.me = async (req, res) => {
  try {
    await ensureUsersTable();

    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token' });
    }

    const payload = jwt.verify(auth.slice(7), JWT_SECRET);

    const r = await query(
      'SELECT data FROM users_data WHERE id=$1',
      [String(payload.id)]
    );

    if (r.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(publicUser(r.rows[0].data));
  } catch (e) {
    console.error('me:', e.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};
