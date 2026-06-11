const express = require('express');
const { getDb, dbGet, dbRun, dbAll } = require('../database/init');
const { requireAuth } = require('../middleware/auth');
const { canAccessMethod } = require('../middleware/access');

const router = express.Router();

router.post('/method/:methodId', requireAuth, async (req, res) => {
  const { status, score, timeSpent } = req.body;
  const methodId = parseInt(req.params.methodId);

  if (!await canAccessMethod(req.user.id, methodId)) {
    return res.status(403).json({ error: 'Нет доступа', code: 'SUBSCRIPTION_REQUIRED' });
  }

  try {
    const db = getDb();
    const existing = await dbGet(db, 'SELECT * FROM user_progress WHERE user_id = ? AND method_id = ?', [req.user.id, methodId]);

    if (existing) {
      await dbRun(db, `
        UPDATE user_progress SET
          status = COALESCE(?, status),
          score = COALESCE(?, score),
          time_spent = time_spent + ?,
          attempts = attempts + 1,
          completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND method_id = ?`,
        [status, score, timeSpent || 0, status, req.user.id, methodId]);
    } else {
      await dbRun(db, `
        INSERT INTO user_progress (user_id, method_id, status, score, time_spent, attempts, completed_at)
        VALUES (?, ?, ?, ?, ?, 1, CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END)`,
        [req.user.id, methodId, status || 'in_progress', score || null, timeSpent || 0, status]);
    }

    await dbRun(db, 'INSERT INTO analytics_events (user_id, event_type, entity_type, entity_id, data) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, `method_${status || 'progress'}`, 'method', methodId, JSON.stringify({ score, timeSpent })]);

    if (status === 'completed') {
      await dbRun(db, 'DELETE FROM recommendations WHERE user_id = ? AND method_id = ?', [req.user.id, methodId]);
      await updateAdaptiveLevel(req.user.id, db);
    }

    const updated = await dbGet(db, 'SELECT * FROM user_progress WHERE user_id = ? AND method_id = ?', [req.user.id, methodId]);
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/overview', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    const [overview, byBlock, recentActivity, testScores] = await Promise.all([
      dbGet(db, `
        SELECT COUNT(*) as total_methods,
          SUM(CASE WHEN up.status='completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN up.status='in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(up.time_spent) as total_time,
          AVG(CASE WHEN up.score IS NOT NULL THEN up.score END) as avg_score
        FROM methods m LEFT JOIN user_progress up ON up.method_id=m.id AND up.user_id=?`, [userId]),
      dbAll(db, `
        SELECT b.id, b.title,
          COUNT(m.id) as total,
          SUM(CASE WHEN up.status='completed' THEN 1 ELSE 0 END) as completed
        FROM blocks b
        JOIN topics t ON t.block_id=b.id
        JOIN techniques tech ON tech.topic_id=t.id
        JOIN methods m ON m.technique_id=tech.id
        LEFT JOIN user_progress up ON up.method_id=m.id AND up.user_id=?
        GROUP BY b.id`, [userId]),
      dbAll(db, `
        SELECT m.title as method_title, t.title as topic_title, up.status, up.completed_at, up.score
        FROM user_progress up
        JOIN methods m ON up.method_id=m.id
        JOIN techniques tech ON m.technique_id=tech.id
        JOIN topics t ON tech.topic_id=t.id
        WHERE up.user_id=? AND up.updated_at > datetime('now','-30 days')
        ORDER BY up.updated_at DESC LIMIT 10`, [userId]),
      dbAll(db, `
        SELECT t2.title as topic, tr.score, tr.completed_at
        FROM test_results tr JOIN tests t ON tr.test_id=t.id JOIN topics t2 ON t.topic_id=t2.id
        WHERE tr.user_id=? ORDER BY tr.completed_at DESC LIMIT 10`, [userId])
    ]);

    res.json({ overview, byBlock, recentActivity, testScores });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/recommendations', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const recs = await dbAll(db, `
      SELECT r.*, m.title as method_title, m.difficulty,
        tech.title as technique_title, t.title as topic_title
      FROM recommendations r
      JOIN methods m ON r.method_id=m.id
      JOIN techniques tech ON m.technique_id=tech.id
      JOIN topics t ON tech.topic_id=t.id
      WHERE r.user_id=? ORDER BY r.priority DESC, r.created_at DESC LIMIT 5`, [req.user.id]);
    res.json(recs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/path/generate', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const methods = await dbAll(db, `
      SELECT m.id FROM methods m
      JOIN techniques tech ON m.technique_id=tech.id
      JOIN topics t ON tech.topic_id=t.id
      LEFT JOIN user_progress up ON up.method_id=m.id AND up.user_id=?
      WHERE (up.status IS NULL OR up.status != 'completed') AND t.is_free=1
      ORDER BY m.difficulty ASC, RANDOM() LIMIT 10`, [req.user.id]);
    if (!methods.length) return res.json({ message: 'Все методы пройдены!' });
    const { lastID } = await dbRun(db, `INSERT INTO learning_paths (user_id, title, description, method_ids) VALUES (?, ?, ?, ?)`,
      [req.user.id, 'Персональный путь обучения', 'Адаптивный путь на основе прогресса', JSON.stringify(methods.map(m => m.id))]);
    res.json({ id: lastID, methodIds: methods.map(m => m.id) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

async function updateAdaptiveLevel(userId, db) {
  const stats = await dbGet(db, `
    SELECT COUNT(*) as cnt, AVG(score) as avg_score
    FROM user_progress WHERE user_id=? AND status='completed'`, [userId]);
  let level = 1;
  if (stats.cnt >= 50 && stats.avg_score >= 80) level = 3;
  else if (stats.cnt >= 20 && stats.avg_score >= 60) level = 2;
  await dbRun(db, 'UPDATE users SET adaptive_level=? WHERE id=?', [level, userId]);
}

module.exports = router;
