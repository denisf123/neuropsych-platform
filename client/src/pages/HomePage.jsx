import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { formatTime, formatDate } from '../utils/helpers';
import { ActivityChart } from '../components/Visualizations';

function Landing() {
  const navigate = useNavigate();
  const features = [
    ['🎓', '512 методов', '2 блока, 16 тем, 128 техник — полная программа нейропсихологии'],
    ['📊', 'Аналитика', 'Детальный анализ прогресса и персональные рекомендации'],
    ['🎥', 'Видео-уроки', 'Короткие видео с визуализацией каждого метода'],
    ['🧪', 'Тесты', 'Интерактивное тестирование с адаптацией программы'],
    ['🤖', 'ИИ-рекомендации', 'Система рекомендаций на основе вашего прогресса'],
    ['🔓', 'Бесплатный доступ', 'По 1 теме из каждого блока доступно без подписки'],
  ];

  return (
    <>
      <div style={{ textAlign: 'center', padding: '60px 20px 40px' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🧠</div>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>ЦДН Счастливые детки</h1>
        <p style={{ fontSize: 18, color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.7 }}>
          Профессиональная платформа нейропсихологического обучения.<br />
          Интерактивные методы, персональная аналитика, адаптивное обучение.
        </p>
        <div className="flex gap-16" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>Начать бесплатно</button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate('/subscription')}>Смотреть тарифы</button>
        </div>
      </div>
      <div className="grid-3" style={{ maxWidth: 900, margin: '0 auto 40px', gap: 20 }}>
        {features.map(([icon, title, desc]) => (
          <div className="card text-center" key={title}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{title}</h3>
            <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>
      <div className="text-center" style={{ padding: 40, background: 'var(--yellow-light)', borderRadius: 20, maxWidth: 700, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Готовы начать?</h2>
        <p className="text-muted" style={{ marginBottom: 20 }}>Зарегистрируйтесь и получите бесплатный доступ к первой теме каждого блока</p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>Зарегистрироваться бесплатно</button>
      </div>
    </>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const { user, hasSubscription } = useAuth();
  const [stats, setStats] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [progress, setProgress] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recs, setRecs] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [progressData, analyticsData, blocksData] = await Promise.all([
          API.progress.getOverview(),
          API.analytics.getMy(30),
          API.content.getBlocks(),
        ]);
        setStats(progressData.overview);
        setProgress(progressData);
        setAnalytics(analyticsData);
        setBlocks(blocksData);
        try {
          const r = await API.progress.getRecommendations();
          setRecs(r);
        } catch {}
      } catch (err) {
        console.error('Dashboard load error:', err);
      }
    }
    load();
  }, []);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">👋 Добрый день, {user.name.split(' ')[0]}!</h1>
        <p className="page-subtitle">Продолжайте обучение — каждый день приближает вас к цели</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon">⏳</div><div className="stat-value">{stats?.in_progress || 0}</div><div className="stat-label">В процессе</div></div>
        <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-value">{stats?.completed || 0}</div><div className="stat-label">Завершено</div></div>
        <div className="stat-card"><div className="stat-icon">⏱</div><div className="stat-value">{formatTime(stats?.total_time)}</div><div className="stat-label">Время обучения</div></div>
        <div className="stat-card"><div className="stat-icon">📊</div><div className="stat-value">{Math.round(stats?.avg_score || 0)}%</div><div className="stat-label">Средний балл</div></div>
      </div>

      <div className="dashboard-grid">
        <div>
          {!hasSubscription() ? (
            <div style={{ background: 'linear-gradient(135deg,var(--yellow),var(--orange-light))', borderRadius: 'var(--radius)', padding: 20, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>⭐ Получите полный доступ</div>
                <div style={{ fontSize: 14, opacity: 0.8 }}>Откройте все 16 тем и 512 методов</div>
              </div>
              <button className="btn btn-primary" onClick={() => navigate('/subscription')}>Выбрать тариф</button>
            </div>
          ) : (
            <div className="streak-display mb-16" style={{ marginBottom: 20 }}>
              <div>
                <div className="streak-num">{analytics?.streak || 0}</div>
                <div className="streak-label">дней подряд</div>
              </div>
              <div>
                <div style={{ fontSize: 24 }}>🔥</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>Серия обучения</div>
              </div>
            </div>
          )}

          <div className="card mb-16">
            <div className="section-title">📋 Блоки обучения</div>
            {blocks.length === 0 ? (
              <div className="loading-state"><div className="spinner" /></div>
            ) : (
              blocks.map((b) => (
                <div key={b.id} className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate(`/block/${b.id}`)}>
                  <div className="flex items-center gap-12">
                    <span style={{ fontSize: 20 }}>{b.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{b.title}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{b.topics?.length || 0} тем</div>
                    </div>
                  </div>
                  <span style={{ color: 'var(--orange)' }}>→</span>
                </div>
              ))
            )}
          </div>

          <div className="card">
            <div className="section-title">📈 Прогресс по темам</div>
            {progress?.byBlock ? progress.byBlock.map((b) => {
              const pct = b.total > 0 ? Math.round((b.completed / b.total) * 100) : 0;
              return (
                <div key={b.title} style={{ marginBottom: 14 }}>
                  <div className="flex justify-between" style={{ marginBottom: 6, fontSize: 14 }}>
                    <span style={{ fontWeight: 500 }}>{b.title}</span>
                    <span className="text-muted">{b.completed}/{b.total} ({pct}%)</span>
                  </div>
                  <div className="progress-bar-container"><div className="progress-bar" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            }) : <div className="loading-state"><div className="spinner" /></div>}
          </div>
        </div>

        <div>
          <div className="card mb-16">
            <div className="section-title">💡 Рекомендации</div>
            {recs.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🎉</div><p>Нет новых рекомендаций</p></div>
            ) : (
              recs.map((r) => (
                <div key={r.method_id} className="rec-card" onClick={() => navigate(`/method/${r.method_id}`)} style={{ marginBottom: 8 }}>
                  <span className="rec-icon">💡</span>
                  <div className="rec-info">
                    <div className="rec-title">{r.method_title}</div>
                    <div className="rec-reason">{r.topic_title} · {r.reason}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card mb-16">
            <div className="section-title">📅 Активность</div>
            <div style={{ height: 160 }}>
              {analytics?.daily && <ActivityChart data={analytics.daily} />}
            </div>
          </div>

          <div className="card">
            <div className="section-title">🕐 Последняя активность</div>
            {progress?.recentActivity?.length ? progress.recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-8" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span>{a.status === 'completed' ? '✅' : '📖'}</span>
                <div>
                  <div style={{ fontWeight: 500 }}>{a.method_title}</div>
                  <div className="text-muted">{a.topic_title}</div>
                </div>
              </div>
            )) : (
              <div className="empty-state"><div className="empty-icon">📚</div><p>Начните изучение материалов</p></div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  return user ? <Dashboard /> : <Landing />;
}
