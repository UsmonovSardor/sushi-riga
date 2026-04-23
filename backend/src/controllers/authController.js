'use strict';
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const fs       = require('fs');
const path     = require('path');

const USERS_FILE = path.join(__dirname, '../data/users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'sushi-riga-secret-2026';

function loadUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch { return []; }
}
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

exports.register = async (req, res) => {
  try {
    const { name, surname, address, phone } = req.body;
    if (!name || !surname || !address || !phone) return res.status(400).json({ error: 'Name, surname, address and phone required' });
    if (users.find(u => u.email === email.toLowerCase())) return res.status(409).json({ error: 'Email already exists' });
    const users = loadUsers();
    if (users.find(u => u.phone === phone.trim())) return res.status(409).json({ error: 'Phone already exists' });

    const user = { id: Date.now(), name, surname, address, phone: phone.trim(), role: 'user', createdAt: new Date().toISOString() };
    users.push(user);
    saveUsers(users);
    const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, surname: user.surname, address: user.address, phone: user.phone, role: user.role } });
  } catch(e) { res.status(500).json({ error: 'Server error' }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const users = loadUsers();
    const user = users.find(u => u.email === email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch(e) { res.status(500).json({ error: 'Server error' }); }
};

exports.me = (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    const users = loadUsers();
    const user = users.find(u => u.id === payload.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role });
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};
