import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { formatDate } from '../utils/helpers';
import { ProgressChart, ActivityChart, TopicsChart, RadarChart } from '../components/Visualizations';

export default function AnalyticsPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('personal');
  const [data, setData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [platformData, setPlatformData] = useState(null);

  useEffect(() => {
    if (tab === 'personal') {
      Promise.all([API.analytics.getMy(30), API.progress.getOverview()])
        .then(([d, p]) => { setData(d); setProgressData(p); })
        .catch(console.error);
    } else {
      API.analytics.getPlatform().then(setPlatformData).catch(console.error);
    }
  }, [tab]);

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p className="text-muted text-center">Войдите для просмотра аналитики</p>
          <button className="btn btn-primary btn-block mt-16" onClick={() => navigate('/login')}>Войти</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📊 Аналитика обучения</h1>
        <p className="page-subtitle">Детальный анализ вашего прогресса</p>
      </div>

      <div className="tabs">
        <button className={`tab-btn${tab === 'personal' ? ' active' : ''}`} onClick={() => setTab('personal')}>Личная</button>
        {isAdmin() && <button className={`tab-btn${tab === 'platform' ? ' active' : ''}`} onClick={() => setTab('platform')}>Платформа</button>}
      </div>

      {tab === 'personal' && data && (
        <>
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="viz-container">
              <div className="viz-title">📅 Активность за 30 дней</div>
              <ProgressChart data={data.daily} />
            </div>
            <div className="viz-container">
              <div className="viz-title">⏱ Время по темам</div>
              <TopicsChart data={data.timeByTopic} />
            </div>
          </div>
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="viz-container">
              <div className="viz-title">🎯 Радар компетенций</div>
              {progressData?.byBlock && <RadarChart blockData={progressData.byBlock} />}
            </div>
            <div className="viz-container">
              <div className="viz-title">📈 Динамика прогресса</div>
              <ActivityChart data={data.daily} />
            </div>
          </div>
          <div className="grid-2">
            <div className="card">
              <div className="section-title">🏆 Топ методов</div>
              {data.topMethods?.length ? data.topMethods.map((m, i) => (
                <div key={i} className="flex items-center gap-12" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--orange)', width: 20 }}>{i + 1}</span>
                  <div style={{ flex: 1, fontSize: 14 }}>{m.title}</div>
                  <span className="badge badge-orange">{m.views} просмотров</span>
                </div>
              )) : <div className="empty-state"><div className="empty-icon">📚</div><p>Начните изучение</p></div>}
            </div>
            <div className="card">
              <div className="section-title">📋 Результаты тестов</div>
              {progressData?.testScores?.length ? progressData.testScores.map((t, i) => (
                <div key={i} className="flex justify-between items-center" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 14 }}>{t.topic}</div>
                  <div className="flex gap-8 items-center">
                    <span style={{ fontWeight: 700, color: t.score >= 70 ? '#10B981' : 'var(--orange)' }}>{t.score}%</span>
                    <span className="text-muted" style={{ fontSize: 12 }}>{formatDate(t.completed_at)}</span>
                  </div>
                </div>
              )) : <div className="empty-state"><p>Тесты ещё не пройдены</p></div>}
            </div>
          </div>
        </>
      )}

      {tab === 'platform' && platformData && (
        <>
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-value">{platformData.userStats?.total || 0}</div><div className="stat-label">Всего пользователей</div></div>
            <div className="stat-card"><div className="stat-icon">🆕</div><div className="stat-value">{platformData.userStats?.new_this_week || 0}</div><div className="stat-label">Новых за неделю</div></div>
            <div className="stat-card"><div className="stat-icon">🔥</div><div className="stat-value">{platformData.userStats?.active_this_week || 0}</div><div className="stat-label">Активных за неделю</div></div>
            <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-value">{(platformData.subStats || []).reduce((s, d) => s + (d.revenue || 0), 0)} ₽</div><div className="stat-label">Доход (активные)</div></div>
          </div>
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="viz-container">
              <div className="viz-title">👥 DAU (последние 30 дней)</div>
              <ProgressChart data={(platformData.dailyActive || []).map(d => ({ day: d.day, events: d.users, completed: 0 }))} />
            </div>
            <div className="viz-container">
              <div className="viz-title">💳 Подписки по тарифам</div>
              {(platformData.subStats || []).map((d, i) => {
                const labels = { monthly: 'Месяц', half_year: '6 мес', yearly: 'Год' };
                const colors = ['#FF9500', '#FFD060', '#10B981'];
                const total = platformData.subStats.reduce((s, x) => s + x.count, 0);
                return (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div className="flex justify-between" style={{ fontSize: 13, marginBottom: 4 }}>
                      <span>{labels[d.plan_type] || d.plan_type}</span>
                      <span>{d.count} ({total ? Math.round(d.count / total * 100) : 0}%)</span>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar" style={{ width: `${total ? (d.count / total * 100) : 0}%`, background: colors[i % colors.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card">
            <div className="section-title">🔥 Популярные методы</div>
            <table className="data-table">
              <thead><tr><th>#</th><th>Метод</th><th>Тема</th><th>Просмотров</th></tr></thead>
              <tbody>
                {(platformData.popularMethods || []).map((m, i) => (
                  <tr key={i}><td>{i + 1}</td><td>{m.title}</td><td>{m.topic}</td><td><span className="badge badge-orange">{m.views}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!data && !platformData && <div className="loading-state"><div className="spinner" /></div>}
    </>
  );
}
