import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import Spinner from '../components/Spinner';

export default function TopicPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    API.content.getTopic(id).then(setTopic).catch((err) => {
      setError(err);
    });
  }, [id]);

  if (error?.code === 'SUBSCRIPTION_REQUIRED') {
    return (
      <div className="card paywall">
        <div className="paywall-icon">🔒</div>
        <h2 className="paywall-title">Требуется подписка</h2>
        <p className="paywall-text">Оформите подписку для доступа к этой теме</p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/subscription')}>Выбрать тариф</button>
      </div>
    );
  }

  if (!topic) return <Spinner />;

  const totalMethods = topic.techniques.length * 4;
  const completedMethods = Object.values(topic.progress || {}).filter((s) => s === 'completed').length;
  const pct = totalMethods > 0 ? Math.round((completedMethods / totalMethods) * 100) : 0;

  return (
    <>
      <div className="page-header">
        <div className="breadcrumb">
          <span className="crumb" onClick={() => navigate('/')}>🏠 Главная</span>
          <span className="sep">/</span>
          <span className="crumb" onClick={() => navigate(`/block/${topic.block_id}`)}>{topic.block?.title || 'Блок'}</span>
          <span className="sep">/</span>
          <span>{topic.title}</span>
        </div>
        <h1 className="page-title">{topic.icon || '📖'} {topic.title}</h1>
        <p className="page-subtitle">{topic.description || ''}</p>
      </div>

      <div className="card mb-16">
        <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Прогресс темы</span>
          <span className="text-muted" style={{ fontSize: 14 }}>{completedMethods}/{totalMethods} методов</span>
        </div>
        <div className="progress-bar-container"><div className="progress-bar" style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="flex justify-between items-center mb-16">
        <h2 className="section-title" style={{ marginBottom: 0 }}>Техники ({topic.techniques.length})</h2>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/test/${topic.id}`)}>📝 Пройти тест</button>
      </div>

      <div className="grid-8">
        {topic.techniques.map((t) => (
          <div key={t.id} className="technique-btn" onClick={() => navigate(`/technique/${t.id}`)}>
            <div className="tech-icon">{t.icon || '🔬'}</div>
            <div className="tech-name">{t.title}</div>
          </div>
        ))}
      </div>
    </>
  );
}
