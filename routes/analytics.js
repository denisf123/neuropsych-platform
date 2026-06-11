const express = require('express');
const { getDb, dbGet, dbRun, dbAll } = require('../database/init');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/event', requireAuth, async (req, res) => {
  const { eventType, entityType, entityId, data, sessionId } = req.body;
  const db = getDb();
  await dbRun(db, 'INSERT INTO analytics_events (user_id, event_type, entity_type, entity_id, data, session_id) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.id, eventType, entityType || null, entityId || null, JSON.stringify(data || {}), sessionId || null]);
  res.json({ success: true });
});

router.get('/my', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const days = parseInt(req.query.days) || 30;
    const userId = req.user.id;

    const [daily, topMethods, timeByTopic, streakData] = await Promise.all([
      dbAll(db, `
        SELECT date(created_at) as day,
          COUNT(*) as events,
          SUM(CASE WHEN event_type='method_completed' THEN 1 ELSE 0 END) as completed
        FROM analytics_events
        WHERE user_id=? AND created_at > datetime('now', '-' || ? || ' days')
        GROUP BY date(created_at) ORDER BY day ASC`, [userId, days]),
      dbAll(db, `
        SELECT m.title, COUNT(*) as views
        FROM analytics_events ae JOIN methods m ON ae.entity_id=m.id
        WHERE ae.user_id=? AND ae.event_type='method_view' AND ae.entity_type='method'
        GROUP BY ae.entity_id ORDER BY views DESC LIMIT 5`, [userId]),
      dbAll(db, `
        SELECT t.title, SUM(up.time_spent) as total_time, COUNT(*) as methods_count
        FROM user_progress up
        JOIN methods m ON up.method_id=m.id
        JOIN techniques tech ON m.technique_id=tech.id
        JOIN topics t ON tech.topic_id=t.id
        WHERE up.user_id=? GROUP BY t.id ORDER BY total_time DESC`, [userId]),
      dbAll(db, `
        SELECT date(created_at) as day FROM analytics_events
        WHERE user_id=? AND created_at > datetime('now','-60 days')
        GROUP BY date(created_at) ORDER BY day DESC`, [userId])
    ]);

    const streak = calculateStreak(streakData.map(d => d.day));
    res.json({ daily, topMethods, timeByTopic, streak });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/platform', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Нет доступа' });
  try {
    const db = getDb();
    const [userStats, subStats, popularMethods, dailyActive, completionRates] = await Promise.all([
      dbGet(db, `SELECT COUNT(*) as total,
        SUM(CASE WHEN created_at > datetime('now','-7 days') THEN 1 ELSE 0 END) as new_this_week,
        SUM(CASE WHEN last_login > datetime('now','-7 days') THEN 1 ELSE 0 END) as active_this_week
        FROM users`, []),
      dbAll(db, `SELECT plan_type, COUNT(*) as count, SUM(price) as revenue FROM subscriptions WHERE status='active' AND end_date > datetime('now') GROUP BY plan_type`, []),
      dbAll(db, `
        SELECT m.title, t.title as topic, COUNT(*) as views
        FROM analytics_events ae JOIN methods m ON ae.entity_id=m.id
        JOIN techniques tech ON m.technique_id=tech.id JOIN topics t ON tech.topic_id=t.id
        WHERE ae.event_type='method_view' GROUP BY ae.entity_id ORDER BY views DESC LIMIT 10`, []),
      dbAll(db, `SELECT date(created_at) as day, COUNT(DISTINCT user_id) as users FROM analytics_events WHERE created_at > datetime('now','-30 days') GROUP BY date(created_at) ORDER BY day ASC`, []),
      dbAll(db, `
        SELECT t.title, COUNT(DISTINCT up.user_id) as started,
          SUM(CASE WHEN up.status='completed' THEN 1 ELSE 0 END) as completed
        FROM user_progress up JOIN methods m ON up.method_id=m.id
        JOIN techniques tech ON m.technique_id=tech.id JOIN topics t ON tech.topic_id=t.id
        GROUP BY t.id ORDER BY started DESC LIMIT 8`, [])
    ]);
    res.json({ userStats, subStats, popularMethods, dailyActive, completionRates });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/effectiveness/:methodId', requireAuth, async (req, res) => {
  const db = getDb();
  const stats = await dbGet(db, `
    SELECT COUNT(*) as total_users, AVG(score) as avg_score, AVG(time_spent) as avg_time,
      SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed
    FROM user_progress WHERE method_id=?`, [req.params.methodId]);
  res.json(stats);
});

function calculateStreak(days) {
  if (!days.length) return 0;
  const today = new Date().toISOString().split('T')[0];
  let streak = 0;
  let current = new Date(today);
  for (const day of days) {
    if (day === current.toISOString().split('T')[0]) { streak++; current.setDate(current.getDate() - 1); }
    else break;
  }
  return streak;
}

module.exports = router;
