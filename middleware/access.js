const { getDb, dbGet, dbAll, dbRun } = require('../database/init');

async function hasActiveSubscription(userId) {
  if (!userId) return false;
  const db = getDb();
  const sub = await dbGet(db, `SELECT id FROM subscriptions WHERE user_id = ? AND status = 'active' AND end_date > datetime('now') LIMIT 1`, [userId]);
  return !!sub;
}

async function canAccessTopic(userId, topicId) {
  const db = getDb();
  const topic = await dbGet(db, 'SELECT is_free FROM topics WHERE id = ?', [topicId]);
  if (!topic) return false;
  if (topic.is_free) return true;
  return hasActiveSubscription(userId);
}

async function canAccessMethod(userId, methodId) {
  const db = getDb();
  const row = await dbGet(db, `
    SELECT t.is_free FROM methods m
    JOIN techniques tech ON m.technique_id = tech.id
    JOIN topics t ON tech.topic_id = t.id
    WHERE m.id = ?`, [methodId]);
  if (!row) return false;
  if (row.is_free) return true;
  return hasActiveSubscription(userId);
}

async function getSubscriptionInfo(userId) {
  if (!userId) return null;
  const db = getDb();
  return dbGet(db, `
    SELECT id, plan_type, start_date, end_date, status,
      CAST((julianday(end_date) - julianday('now')) AS INTEGER) as days_left
    FROM subscriptions
    WHERE user_id = ? AND status = 'active' AND end_date > datetime('now')
    ORDER BY end_date DESC LIMIT 1`, [userId]);
}

const PLANS = {
  monthly:  { price: 199,  days: 30,  label: 'Месяц',     discount: null },
  half_year:{ price: 999,  days: 180, label: '6 месяцев', discount: 16 },
  yearly:   { price: 1599, days: 365, label: '1 год',      discount: 33 }
};

module.exports = { hasActiveSubscription, canAccessTopic, canAccessMethod, getSubscriptionInfo, PLANS, dbAll, dbRun };
