const express = require('express');
const { getDb, dbGet, dbAll, dbRun } = require('../database/init');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { hasActiveSubscription, canAccessTopic } = require('../middleware/access');

const router = express.Router();

router.get('/blocks', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const hasSub = await hasActiveSubscription(req.user?.id);
    const blocks = await dbAll(db, 'SELECT * FROM blocks ORDER BY order_num', []);
    const result = await Promise.all(blocks.map(async b => {
      const topics = await dbAll(db, 'SELECT id, title, description, icon, is_free, order_num FROM topics WHERE block_id = ? ORDER BY order_num', [b.id]);
      return { ...b, topics: topics.map(t => ({ ...t, accessible: !!t.is_free || hasSub })) };
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/blocks/:id', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const block = await dbGet(db, 'SELECT * FROM blocks WHERE id = ?', [req.params.id]);
    if (!block) return res.status(404).json({ error: 'Блок не найден' });
    const hasSub = await hasActiveSubscription(req.user?.id);
    const topics = await dbAll(db, 'SELECT * FROM topics WHERE block_id = ? ORDER BY order_num', [block.id]);
    res.json({ ...block, topics: topics.map(t => ({ ...t, accessible: !!t.is_free || hasSub })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/topics/:id', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const topic = await dbGet(db, 'SELECT * FROM topics WHERE id = ?', [req.params.id]);
    if (!topic) return res.status(404).json({ error: 'Тема не найдена' });

    if (!await canAccessTopic(req.user?.id, topic.id)) {
      return res.status(403).json({ error: 'Требуется подписка', code: 'SUBSCRIPTION_REQUIRED', topic: { id: topic.id, title: topic.title } });
    }

    const techniques = await dbAll(db, 'SELECT * FROM techniques WHERE topic_id = ? ORDER BY order_num', [topic.id]);
    const block = await dbGet(db, 'SELECT id, title FROM blocks WHERE id = ?', [topic.block_id]);

    let progress = {};
    if (req.user) {
      const techIds = techniques.map(t => t.id);
      if (techIds.length) {
        const placeholders = techIds.map(() => '?').join(',');
        const progRows = await dbAll(db, `
          SELECT m.id as method_id, up.status FROM methods m
          JOIN user_progress up ON up.method_id = m.id AND up.user_id = ?
          WHERE m.technique_id IN (${placeholders})`, [req.user.id, ...techIds]);
        progRows.forEach(p => { progress[p.method_id] = p.status; });
      }
    }
    res.json({ ...topic, block, techniques, progress });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/techniques/:id', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const technique = await dbGet(db, 'SELECT * FROM techniques WHERE id = ?', [req.params.id]);
    if (!technique) return res.status(404).json({ error: 'Техника не найдена' });

    const topic = await dbGet(db, 'SELECT * FROM topics WHERE id = ?', [technique.topic_id]);
    if (!await canAccessTopic(req.user?.id, topic.id)) {
      return res.status(403).json({ error: 'Требуется подписка', code: 'SUBSCRIPTION_REQUIRED' });
    }

    const methods = await dbAll(db, 'SELECT * FROM methods WHERE technique_id = ? ORDER BY order_num', [technique.id]);
    let userProgress = {};
    if (req.user && methods.length) {
      const ids = methods.map(m => m.id);
      const rows = await dbAll(db, `SELECT method_id, status, score FROM user_progress WHERE user_id = ? AND method_id IN (${ids.map(() => '?').join(',')})`, [req.user.id, ...ids]);
      rows.forEach(p => { userProgress[p.method_id] = p; });
    }
    res.json({ ...technique, topic, methods: methods.map(m => ({ ...m, progress: userProgress[m.id] || null })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/methods/:id', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const method = await dbGet(db, 'SELECT * FROM methods WHERE id = ?', [req.params.id]);
    if (!method) return res.status(404).json({ error: 'Метод не найден' });

    const technique = await dbGet(db, 'SELECT * FROM techniques WHERE id = ?', [method.technique_id]);
    const topic = await dbGet(db, 'SELECT * FROM topics WHERE id = ?', [technique.topic_id]);

    if (!await canAccessTopic(req.user?.id, topic.id)) {
      return res.status(403).json({ error: 'Требуется подписка', code: 'SUBSCRIPTION_REQUIRED' });
    }

    const siblings = await dbAll(db, 'SELECT id, title, order_num FROM methods WHERE technique_id = ? ORDER BY order_num', [method.technique_id]);
    const currentIdx = siblings.findIndex(m => m.id === method.id);

    let userProgress = null;
    if (req.user) {
      userProgress = await dbGet(db, 'SELECT * FROM user_progress WHERE user_id = ? AND method_id = ?', [req.user.id, method.id]);
      await dbRun(db, 'INSERT OR IGNORE INTO user_progress (user_id, method_id, status) VALUES (?, ?, ?)', [req.user.id, method.id, 'in_progress']);
      await dbRun(db, 'INSERT INTO analytics_events (user_id, event_type, entity_type, entity_id) VALUES (?, ?, ?, ?)', [req.user.id, 'method_view', 'method', method.id]);
    }

    res.json({
      ...method,
      technique: { id: technique.id, title: technique.title },
      topic: { id: topic.id, title: topic.title },
      navigation: {
        prev: currentIdx > 0 ? siblings[currentIdx - 1] : null,
        next: currentIdx < siblings.length - 1 ? siblings[currentIdx + 1] : null,
        current: currentIdx + 1,
        total: siblings.length
      },
      userProgress
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/topics/:id/test', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    if (!await canAccessTopic(req.user.id, req.params.id)) {
      return res.status(403).json({ error: 'Требуется подписка', code: 'SUBSCRIPTION_REQUIRED' });
    }
    const test = await dbGet(db, 'SELECT * FROM tests WHERE topic_id = ?', [req.params.id]);
    if (!test) return res.status(404).json({ error: 'Тест не найден' });
    const questions = await dbAll(db, 'SELECT id, question, options, order_num FROM test_questions WHERE test_id = ? ORDER BY order_num', [test.id]);
    res.json({ ...test, questions: questions.map(q => ({ ...q, options: JSON.parse(q.options) })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/topics/:id/test', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const { answers, timeTaken } = req.body;
    if (!await canAccessTopic(req.user.id, req.params.id)) return res.status(403).json({ error: 'Нет доступа' });

    const test = await dbGet(db, 'SELECT * FROM tests WHERE topic_id = ?', [req.params.id]);
    if (!test) return res.status(404).json({ error: 'Тест не найден' });
    const questions = await dbAll(db, 'SELECT * FROM test_questions WHERE test_id = ? ORDER BY order_num', [test.id]);

    let correct = 0;
    const detailedResults = questions.map((q, i) => {
      const isCorrect = answers[i] === q.correct_answer;
      if (isCorrect) correct++;
      return { question: q.question, userAnswer: answers[i], correctAnswer: q.correct_answer, isCorrect, explanation: q.explanation };
    });

    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= test.pass_score;

    await dbRun(db, 'INSERT INTO test_results (user_id, test_id, score, answers, time_taken) VALUES (?, ?, ?, ?, ?)', [req.user.id, test.id, score, JSON.stringify(answers), timeTaken || 0]);
    await dbRun(db, 'INSERT INTO analytics_events (user_id, event_type, entity_type, entity_id, data) VALUES (?, ?, ?, ?, ?)', [req.user.id, 'test_complete', 'test', test.id, JSON.stringify({ score, passed })]);

    if (!passed) await generateRecommendations(req.user.id, req.params.id, db);

    res.json({ score, passed, passScore: test.pass_score, correct, total: questions.length, results: detailedResults });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

async function generateRecommendations(userId, topicId, db) {
  const methods = await dbAll(db, `SELECT m.id FROM methods m JOIN techniques t ON m.technique_id = t.id WHERE t.topic_id = ? ORDER BY RANDOM() LIMIT 3`, [topicId]);
  for (const m of methods) {
    await dbRun(db, 'INSERT OR IGNORE INTO recommendations (user_id, method_id, reason, priority) VALUES (?, ?, ?, ?)', [userId, m.id, 'Рекомендовано по результатам теста', 2]);
  }
}

module.exports = router;
