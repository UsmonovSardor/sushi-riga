'use strict';

const jwt = require('jsonwebtoken');
const { db, schema } = require('../db');
const { eq } = require('drizzle-orm');
const { t } = require('../utils/i18n');
const { usersData } = schema;

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

function makeToken(user) {
  return jwt.sign(
    { id: String(user.id), phone: user.phone, role: user.role || 'user' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

exports.register = async (req, res) => {
  try {
    const { name, surname, address = '', phone, lang = 'lv' } = req.body;

    if (!name || !surname || !phone) {
      return res.status(400).json({ error: t('required_fields', lang) });
    }

    const phoneNorm = normalizePhone(phone);
    if (!phoneNorm) {
      return res.status(400).json({ error: t('phone_required', lang) });
    }

    const exists = await db.select({ id: usersData.id }).from(usersData)
      .where(eq(usersData.phoneNorm, phoneNorm)).limit(1);

    if (exists.length > 0) {
      return res.status(409).json({ error: t('phone_exists', lang) });
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

    await db.insert(usersData).values({
      id: user.id,
      phoneNorm,
      data: user,
    });

    res.json({ token: makeToken(user), user: publicUser(user) });
  } catch (e) {
    console.error('register:', e.message);
    res.status(500).json({ error: t('server_error', req.body?.lang || 'lv') });
  }
};

exports.login = async (req, res) => {
  try {
    const { name, surname, phone, lang = 'lv' } = req.body;

    if (!name || !surname || !phone) {
      return res.status(400).json({ error: t('required_fields', lang) });
    }

    const phoneNorm = normalizePhone(phone);
    if (!phoneNorm) {
      return res.status(400).json({ error: t('phone_required', lang) });
    }

    const [row] = await db.select({ data: usersData.data }).from(usersData)
      .where(eq(usersData.phoneNorm, phoneNorm)).limit(1);

    if (!row) {
      return res.status(404).json({ error: t('phone_not_found', lang) });
    }

    const user = row.data;

    const sameName =
      String(user.name || '').trim().toLowerCase() === String(name || '').trim().toLowerCase();
    const sameSurname =
      String(user.surname || '').trim().toLowerCase() === String(surname || '').trim().toLowerCase();

    if (!sameName || !sameSurname) {
      return res.status(401).json({ error: t('bad_credentials', lang) });
    }

    res.json({ token: makeToken(user), user: publicUser(user) });
  } catch (e) {
    console.error('login:', e.message);
    res.status(500).json({ error: t('server_error', req.body?.lang || 'lv') });
  }
};

exports.me = async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token' });
    }

    const payload = jwt.verify(auth.slice(7), JWT_SECRET);

    const [row] = await db.select({ data: usersData.data }).from(usersData)
      .where(eq(usersData.id, String(payload.id))).limit(1);

    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(publicUser(row.data));
  } catch (e) {
    console.error('me:', e.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};
