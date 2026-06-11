const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb, dbGet, dbRun, dbAll } = require('../database/init');
const { requireAuth, generateToken } = require('../middleware/auth');
const { getSubscriptionInfo } = require('../middleware/access');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Заполните все поля' });
  if (password.length < 6) return res.status(400).json({ error: 'Пароль минимум 6 символов' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Некорректный email' });

  try {
    const db = getDb();
    const existing = await dbGet(db, 'SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing) return res.status(409).json({ error: 'Пользователь с таким email уже существует' });

    const hash = await bcrypt.hash(password, 12);
    const { lastID } = await dbRun(db, 'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)', [email.toLowerCase(), hash, name]);
    await dbRun(db, 'INSERT INTO analytics_events (user_id, event_type) VALUES (?, ?)', [lastID, 'register']);

    res.status(201).json({ token: generateToken(lastID), user: { id: lastID, email: email.toLowerCase(), name, role: 'user' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Введите email и пароль' });

  try {
    const db = getDb();
    const user = await dbGet(db, 'SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Неверный email или пароль' });

    await dbRun(db, 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    await dbRun(db, 'INSERT INTO analytics_events (user_id, event_type) VALUES (?, ?)', [user.id, 'login']);

    const subscription = await getSubscriptionInfo(user.id);
    res.json({ token: generateToken(user.id), user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar }, subscription });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка входа' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const db = getDb();
  const subscription = await getSubscriptionInfo(req.user.id);
  const stats = await dbGet(db, `SELECT COUNT(*) as completed FROM user_progress WHERE user_id = ? AND status = 'completed'`, [req.user.id]);
  res.json({ user: req.user, subscription, stats });
});

router.put('/profile', requireAuth, async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;
  const db = getDb();
  try {
    if (newPassword) {
      if (newPassword.length < 6) return res.status(400).json({ error: 'Пароль слишком короткий' });
      const user = await dbGet(db, 'SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
      if (!await bcrypt.compare(currentPassword, user.password_hash)) return res.status(401).json({ error: 'Неверный текущий пароль' });
      await dbRun(db, 'UPDATE users SET password_hash = ? WHERE id = ?', [await bcrypt.hash(newPassword, 12), req.user.id]);
    }
    if (name) await dbRun(db, 'UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления профиля' });
  }
});

router.get('/users', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Нет доступа' });
  const db = getDb();
  const users = await dbAll(db, `
    SELECT u.id, u.email, u.name, u.role, u.created_at, u.last_login,
      s.plan_type, s.end_date, s.status as sub_status
    FROM users u
    LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active' AND s.end_date > datetime('now')
    ORDER BY u.created_at DESC`, []);
  res.json(users);
});

module.exports = router;
