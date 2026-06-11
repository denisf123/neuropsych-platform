export function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatTime(seconds) {
  if (!seconds) return '0 мин';
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h} ч ${m % 60} мин` : `${m} мин`;
}

export function difficultyStars(level) {
  return Array.from({ length: 5 }, (_, i) => (i < level ? '⭐' : '☆')).join('');
}

export const PLAN_LABELS = { monthly: 'Месяц', half_year: '6 месяцев', yearly: '1 год' };
export const PLAN_PRICES = { monthly: 199, half_year: 999, yearly: 1599 };
