const jwt = require('jsonwebtoken');
const { getDb, dbGet } = require('../database/init');

const JWT_SECRET = process.env.JWT_SECRET || 'neuropsych_secret_key_2024';

async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Требуется авторизация' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDb();
    const user = await dbGet(db, 'SELECT id, email, name, role, avatar, adaptive_level FROM users WHERE id = ?', [decoded.id]);
    if (!user) return res.status(401).json({ error: 'Пользователь не найден' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Недействительный токен' });
  }
}

async function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDb();
    req.user = await dbGet(db, 'SELECT id, email, name, role, avatar FROM users WHERE id = ?', [decoded.id]);
  } catch {}
  next();
}

function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return req.query.token || null;
}

function generateToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

module.exports = { requireAuth, optionalAuth, generateToken };
