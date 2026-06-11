import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import Spinner from '../components/Spinner';

export default function TechniquePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tech, setTech] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    API.content.getTechnique(id).then(setTech).catch(setError);
  }, [id]);

  if (error?.code === 'SUBSCRIPTION_REQUIRED') {
    return (
      <div className="card paywall">
        <div className="paywall-icon">🔒</div>
        <h2 className="paywall-title">Требуется подписка</h2>
        <p className="paywall-text">Оформите подписку от 199 руб./месяц для доступа ко всем материалам</p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/subscription')}>Выбрать тариф →</button>
      </div>
    );
  }

  if (!tech) return <Spinner />;

  return (
    <>
      <div className="page-header">
        <div className="breadcrumb">
          <span className="crumb" onClick={() => navigate('/')}>🏠 Главная</span>
          <span className="sep">/</span>
          <span className="crumb" onClick={() => navigate(`/topic/${tech.topic?.id}`)}>{tech.topic?.title || 'Тема'}</span>
          <span className="sep">/</span>
          <span>{tech.title}</span>
        </div>
        <h1 className="page-title">🔬 {tech.title}</h1>
        <p className="page-subtitle">{tech.description || ''}</p>
      </div>

      <div className="section-title">Методы ({tech.methods.length})</div>
      <div className="grid-2">
        {tech.methods.map((m, i) => {
          const statusClass = m.progress?.status || 'not_started';
          const statusIcon = { completed: '✅', in_progress: '📖', not_started: '' }[statusClass] || '';
          return (
            <div key={m.id} className={`method-btn ${statusClass !== 'not_started' ? statusClass : ''}`} onClick={() => navigate(`/method/${m.id}`)}>
              <div className="method-num">{statusClass === 'completed' ? '✓' : i + 1}</div>
              <div className="method-info">
                <div className="method-name">{m.title}</div>
                <div className="method-meta">Сложность: {m.difficulty}/5 · {m.duration ? Math.round(m.duration / 60) + ' мин' : 'видео'}</div>
              </div>
              <div className="method-status">{statusIcon}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
