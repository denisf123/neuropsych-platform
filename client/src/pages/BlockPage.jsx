import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext';
import API from '../utils/api';
import Spinner from '../components/Spinner';

export default function BlockPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showModal, closeModal } = useUI();
  const [block, setBlock] = useState(null);

  useEffect(() => {
    API.content.getBlock(id).then(setBlock).catch(console.error);
  }, [id]);

  const handleTopicClick = (topic) => {
    if (!topic.accessible) {
      showModal(
        <div className="paywall">
          <div className="paywall-icon">🔒</div>
          <h2 className="paywall-title">Нужна подписка</h2>
          <p className="paywall-text">
            Тема <strong>"{topic.title}"</strong> доступна только для подписчиков.<br />
            Оформите подписку от 199 руб./месяц и получите полный доступ ко всем материалам.
          </p>
          <button className="btn btn-primary btn-lg mb-16" onClick={() => { closeModal(); navigate('/subscription'); }}>Выбрать тариф</button>
          <br />
          <button className="btn btn-ghost" onClick={closeModal}>Позже</button>
        </div>
      );
      return;
    }
    navigate(`/topic/${topic.id}`);
  };

  if (!block) return <Spinner />;

  return (
    <>
      <div className="page-header">
        <div className="breadcrumb">
          <span className="crumb" onClick={() => navigate('/')}>🏠 Главная</span>
          <span className="sep">/</span>
          <span>{block.title}</span>
        </div>
        <h1 className="page-title">{block.icon} {block.title}</h1>
        <p className="page-subtitle">{block.description || ''}</p>
      </div>
      <div className="grid-8">
        {block.topics.map((t) => (
          <div key={t.id} className={`topic-btn${!t.accessible ? ' locked' : ''}`} onClick={() => handleTopicClick(t)}>
            <span className="topic-icon">{t.icon || '📖'}</span>
            <span className="topic-name">{t.title}</span>
            <span className="topic-desc">{t.description || ''}</span>
            {t.is_free ? <span className="free-badge">Бесплатно</span> : !t.accessible ? <span className="lock-badge">🔒 Нужна подписка</span> : null}
          </div>
        ))}
      </div>
    </>
  );
}
