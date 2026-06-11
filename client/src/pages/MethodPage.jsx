import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { useUI } from '../context/UIContext';
import { difficultyStars, formatTime } from '../utils/helpers';
import BrainVisualization from '../components/BrainVisualization';
import Spinner from '../components/Spinner';

const TRAINER_PHASES = [
  { instruction: '👀 Сфокусируйте внимание на объекте и нажимайте каждый раз, когда он меняется', target: '🔵', duration: 30 },
  { instruction: '🤲 Выполните двустороннее движение руками, затем нажмите кнопку', target: '🟡', duration: 30 },
  { instruction: '💭 Представьте образ, связанный с темой, и нажмите кнопку', target: '🟢', duration: 30 },
];

export default function MethodPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showModal, closeModal } = useUI();
  const [method, setMethod] = useState(null);
  const [error, setError] = useState(null);
  const [showTrainer, setShowTrainer] = useState(false);
  const [trainerRunning, setTrainerRunning] = useState(false);
  const [trainerPhase, setTrainerPhase] = useState(0);
  const [trainerScore, setTrainerScore] = useState(0);
  const [trainerTime, setTrainerTime] = useState(30);
  const [trainerDone, setTrainerDone] = useState(false);
  const trainerInterval = useRef(null);
  const timeTrackingRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    API.content.getMethod(id).then(setMethod).catch(setError);
    startTimeRef.current = Date.now();
    timeTrackingRef.current = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (elapsed > 0 && elapsed % 30 === 0) {
        API.progress.updateMethod(id, { timeSpent: 30, status: 'in_progress' }).catch(() => {});
      }
    }, 5000);
    return () => {
      clearInterval(timeTrackingRef.current);
      if (startTimeRef.current) {
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        if (elapsed > 5) API.progress.updateMethod(id, { timeSpent: elapsed }).catch(() => {});
      }
    };
  }, [id]);

  const markComplete = async () => {
    try {
      await API.progress.updateMethod(id, { status: 'completed', timeSpent: 120 });
      toast('Метод отмечен как пройденный!', 'success');
      API.content.getMethod(id).then(setMethod);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const showMethodAnalytics = async () => {
    try {
      const stats = await API.analytics.getEffectiveness(id);
      showModal(
        <>
          <h2 className="modal-title">📊 Статистика метода</h2>
          <div className="grid-2" style={{ gap: 12, marginBottom: 20 }}>
            <div className="stat-card"><div className="stat-value">{Math.round(stats.avg_score || 0)}%</div><div className="stat-label">Средний балл</div></div>
            <div className="stat-card"><div className="stat-value">{stats.total_users || 0}</div><div className="stat-label">Изучали пользователей</div></div>
            <div className="stat-card"><div className="stat-value">{formatTime(stats.avg_time)}</div><div className="stat-label">Среднее время</div></div>
            <div className="stat-card"><div className="stat-value">{stats.completed || 0}</div><div className="stat-label">Завершили</div></div>
          </div>
          <button className="btn btn-secondary btn-block" onClick={closeModal}>Закрыть</button>
        </>
      );
    } catch { toast('Ошибка загрузки статистики', 'error'); }
  };

  const startTrainer = useCallback(() => {
    setTrainerScore(0);
    setTrainerPhase(0);
    setTrainerTime(TRAINER_PHASES[0].duration);
    setTrainerRunning(true);
    setTrainerDone(false);
    let phase = 0;
    let time = TRAINER_PHASES[0].duration;
    clearInterval(trainerInterval.current);
    trainerInterval.current = setInterval(() => {
      time--;
      setTrainerTime(time);
      if (time <= 0) {
        phase++;
        if (phase >= TRAINER_PHASES.length) {
          clearInterval(trainerInterval.current);
          setTrainerRunning(false);
          setTrainerDone(true);
        } else {
          time = TRAINER_PHASES[phase].duration;
          setTrainerPhase(phase);
          setTrainerTime(time);
        }
      }
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(trainerInterval.current), []);

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

  if (!method) return <Spinner />;

  const tags = (() => { try { return JSON.parse(method.tags || '[]'); } catch { return []; } })();
  const nav = method.navigation;
  const trainerAccuracy = Math.min(100, trainerScore * 3);

  return (
    <div className="method-page">
      <div className="breadcrumb" style={{ marginBottom: 16 }}>
        <span className="crumb" onClick={() => navigate('/')}>🏠</span>
        <span className="sep">/</span>
        <span className="crumb" onClick={() => navigate(`/technique/${method.technique?.id}`)}>{method.technique?.title || 'Техника'}</span>
        <span className="sep">/</span>
        <span>Метод {nav.current}/{nav.total}</span>
      </div>

      <div className="method-header">
        <h1 className="method-title">{method.title}</h1>
        <div className="difficulty-stars">{difficultyStars(method.difficulty)}</div>
        {tags.length > 0 && <div className="method-tags">{tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>}
        {method.userProgress?.status === 'completed' && <div style={{ marginTop: 12 }}><span className="badge badge-green">✅ Пройдено</span></div>}
      </div>

      <div className="video-container">
        {method.video_url
          ? <video controls preload="metadata" src={`/stream/${method.id}`} style={{ width: '100%', height: '100%' }} />
          : (
            <div className="video-placeholder">
              <div className="play-icon">▶</div>
              <p>Видео материал</p>
              <p style={{ fontSize: 12 }}>(Загрузите видео через панель администратора)</p>
            </div>
          )}
      </div>

      <div className="method-description">
        <h3>📋 Описание метода</h3>
        <p>{method.description}</p>
      </div>

      <div className="progress-actions">
        {method.userProgress?.status !== 'completed'
          ? <button className="btn btn-primary" onClick={markComplete}>✅ Отметить пройденным</button>
          : <span className="badge badge-green" style={{ padding: '8px 16px', fontSize: 14 }}>✅ Пройдено!</span>}
        <button className="btn btn-secondary" onClick={() => setShowTrainer(true)}>🏋️ Тренажёр</button>
        <button className="btn btn-ghost" onClick={showMethodAnalytics}>📊 Статистика</button>
      </div>

      {showTrainer && (
        <div className="card mt-16">
          <div className="section-title">🏋️ Интерактивный тренажёр: {method.title}</div>
          <div className="trainer-area">
            <div className="trainer-stage">
              {trainerDone ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Тренировка завершена!</div>
                  <div className="text-muted" style={{ marginBottom: 20 }}>Результат: {trainerAccuracy} очков · {trainerScore} действий</div>
                  <button className="btn btn-primary" onClick={startTrainer}>🔄 Повторить</button>
                </div>
              ) : (
                <>
                  <div className="trainer-instruction">{trainerRunning ? TRAINER_PHASES[trainerPhase].instruction : 'Нажмите кнопку для начала тренировки'}</div>
                  <div className="trainer-target" onClick={() => trainerRunning && setTrainerScore((s) => s + 1)} title="Нажмите!">
                    {trainerRunning ? TRAINER_PHASES[trainerPhase].target : '🧠'}
                  </div>
                  <div className="timer-circle">{trainerTime}</div>
                  <div className="flex gap-12 mt-16">
                    {!trainerRunning && <button className="btn btn-primary" onClick={startTrainer}>▶ Начать</button>}
                    <button className="btn btn-secondary" onClick={() => { setShowTrainer(false); clearInterval(trainerInterval.current); setTrainerRunning(false); }}>✕ Закрыть</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="method-nav">
        {nav.prev ? <button className="btn btn-secondary" onClick={() => navigate(`/method/${nav.prev.id}`)}>← {nav.prev.title}</button> : <div />}
        <button className="btn btn-ghost" onClick={() => navigate(`/technique/${method.technique?.id}`)}>Все методы</button>
        {nav.next ? <button className="btn btn-primary" onClick={() => navigate(`/method/${nav.next.id}`)}>{nav.next.title} →</button> : <div />}
      </div>

      <div className="mt-24">
        <div className="viz-container">
          <div className="viz-title">🧠 Нейровизуализация активности</div>
          <BrainVisualization />
        </div>
      </div>
    </div>
  );
}
