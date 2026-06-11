const express = require('express');
const { getDb, dbGet, dbRun, dbAll } = require('../database/init');
const { requireAuth } = require('../middleware/auth');
const { PLANS, getSubscriptionInfo } = require('../middleware/access');

const router = express.Router();

router.get('/plans', (_req, res) => res.json(PLANS));

router.get('/my', requireAuth, async (req, res) => {
  const sub = await getSubscriptionInfo(req.user.id);
  res.json(sub || { status: 'none' });
});

router.post('/subscribe', requireAuth, async (req, res) => {
  const { planType } = req.body;
  if (!PLANS[planType]) return res.status(400).json({ error: 'Неверный план подписки' });

  try {
    const db = getDb();
    const plan = PLANS[planType];
    await dbRun(db, `UPDATE subscriptions SET status = 'cancelled' WHERE user_id = ? AND status = 'active'`, [req.user.id]);

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.days * 86400000);
    const { lastID } = await dbRun(db, `INSERT INTO subscriptions (user_id, plan_type, price, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, 'active')`,
      [req.user.id, planType, plan.price, startDate.toISOString(), endDate.toISOString()]);

    await dbRun(db, 'INSERT INTO analytics_events (user_id, event_type, data) VALUES (?, ?, ?)',
      [req.user.id, 'subscription_created', JSON.stringify({ planType, price: plan.price })]);

    res.json({ success: true, subscription: { id: lastID, plan_type: planType, price: plan.price, start_date: startDate.toISOString(), end_date: endDate.toISOString(), status: 'active', days_left: plan.days, label: plan.label } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/cancel', requireAuth, async (req, res) => {
  const db = getDb();
  const { changes } = await dbRun(db, `UPDATE subscriptions SET status = 'cancelled' WHERE user_id = ? AND status = 'active'`, [req.user.id]);
  await dbRun(db, 'INSERT INTO analytics_events (user_id, event_type) VALUES (?, ?)', [req.user.id, 'subscription_cancelled']);
  res.json({ success: true, changed: changes });
});

router.get('/history', requireAuth, async (req, res) => {
  const db = getDb();
  const history = await dbAll(db, 'SELECT id, plan_type, price, start_date, end_date, status, created_at FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
  res.json(history);
});

router.get('/all', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Нет доступа' });
  const db = getDb();
  const subs = await dbAll(db, `SELECT s.*, u.email, u.name FROM subscriptions s JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC LIMIT 100`, []);
  res.json(subs);
});

module.exports = router;
