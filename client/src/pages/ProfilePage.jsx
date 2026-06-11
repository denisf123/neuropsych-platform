import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import API from '../utils/api';
import { formatDate, formatTime, PLAN_LABELS } from '../utils/helpers';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, subscription, hasSubscription, loadUser } = useAuth();
  const { toast } = useUI();
  const [name, setName] = useState(user?.name || '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [achievements, setAchievements] = useState(null);

  useEffect(() => {
    API.progress.getOverview()
      .then(({ overview }) => setAchievements(overview))
      .catch(() => {});
  }, []);

  if (!user) { navigate('/login'); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.auth.updateProfile({ name, currentPassword: currentPw, newPassword: newPw });
      toast('Профиль обновлён!');
      await loadUser();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const sub = subscription;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">👤 Профиль</h1>
      </div>
      <div className="grid-2" style={{ maxWidth: 800 }}>
        <div className="card">
          <h3 className="section-title">Личные данные</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Имя</label>
              <input className="form-input" type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={user.email} disabled style={{ opacity: 0.6 }} />
            </div>
            <div className="divider" />
            <h4 style={{ marginBottom: 12, fontSize: 15 }}>Изменить пароль</h4>
            <div className="form-group">
              <label className="form-label">Текущий пароль</label>
              <input className="form-input" type="password" placeholder="••••••" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Новый пароль</label>
              <input className="form-input" type="password" placeholder="••••••" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Сохранить'}
            </button>
          </form>
        </div>
        <div>
          <div className="card mb-16">
            <h3 className="section-title">Подписка</h3>
            {sub ? (
              <>
                <div className="badge badge-green" style={{ marginBottom: 12 }}>Активна</div>
                <p><strong>План:</strong> {PLAN_LABELS[sub.plan_type] || sub.plan_type}</p>
                <p style={{ marginTop: 8 }}><strong>Активна до:</strong> {formatDate(sub.end_date)}</p>
                <p style={{ marginTop: 8 }}><strong>Осталось дней:</strong> {sub.days_left}</p>
                <button className="btn btn-secondary btn-sm mt-16" onClick={() => navigate('/subscription')}>Управление</button>
              </>
            ) : (
              <>
                <p className="text-muted mb-16">У вас нет активной подписки</p>
                <button className="btn btn-primary" onClick={() => navigate('/subscription')}>Выбрать тариф</button>
              </>
            )}
          </div>
          <div className="card">
            <h3 className="section-title">Достижения</h3>
            {achievements ? (
              [
                { icon: '🎯', label: 'Методов пройдено', value: achievements.completed || 0 },
                { icon: '⏱', label: 'Время обучения', value: formatTime(achievements.total_time) },
                { icon: '📊', label: 'Средний балл', value: Math.round(achievements.avg_score || 0) + '%' },
              ].map((a) => (
                <div key={a.label} className="flex items-center gap-12" style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>{a.icon}</span>
                  <div><div className="font-bold" style={{ fontSize: 18 }}>{a.value}</div><div className="text-muted">{a.label}</div></div>
                </div>
              ))
            ) : <div className="loading-state"><div className="spinner" /></div>}
          </div>
        </div>
      </div>
    </>
  );
}
