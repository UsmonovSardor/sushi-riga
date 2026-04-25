'use strict';

const jwt = require('jsonwebtoken');
const { query } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'sushi-riga-secret-2026';

const normalizePhone = v => String(v || '').replace(/[^\d]/g, '');

function publicUser(user) {
  return {
    id: user.id,
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
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

exports.register = async (req, res) => {
  try {
    await ensureUsersTable();

    const { name, surname, address = '', phone } = req.body;
    if (!name || !surname || !phone) {
      return res.status(400).json({ error: 'Name, surname and phone required' });
    }

    const phoneNorm = normalizePhone(phone);
    if (!phoneNorm) return res.status(400).json({ error: 'Phone required' });

    const exists = await query('SELECT * FROM users_data WHERE phone_norm=$1', [phoneNorm]);

    if (exists.rows.length > 0) {
      return res.status(409).json({
        error: 'Bu nomer oldin ro‘yxatdan o‘tgan. Iltimos, kirish bo‘limidan kiring.',
      });
    }

    const user = {
      id: String(Date.now()),
      name: name.trim(),
      surname: surname.trim(),
      address: address || '',
      phone: phone.trim(),
      phoneNorm,
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    await query(
      `INSERT INTO users_data (id, phone_norm, data)
       VALUES ($1, $2, $3)`,
      [user.id, phoneNorm, JSON.stringify(user)]
    );

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ token, user: publicUser(user) });
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
      return res.status(400).json({ error: 'Name, surname and phone required' });
    }

    const phoneNorm = normalizePhone(phone);

    const r = await query('SELECT * FROM users_data WHERE phone_norm=$1', [phoneNorm]);
    if (r.rows.length === 0) {
      return res.status(404).json({ error: 'Bu nomer ro‘yxatdan o‘tmagan' });
    }

    const user = r.rows[0].data;

    const sameName = String(user.name || '').trim().toLowerCase() === String(name).trim().toLowerCase();
    const sameSurname = String(user.surname || '').trim().toLowerCase() === String(surname).trim().toLowerCase();

    if (!sameName || !sameSurname) {
      return res.status(401).json({ error: 'Ism yoki familiya noto‘g‘ri' });
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role || 'user' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ token, user: publicUser(user) });
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

    const r = await query('SELECT * FROM users_data WHERE id=$1', [String(payload.id)]);
    if (r.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(publicUser(r.rows[0].data));
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
