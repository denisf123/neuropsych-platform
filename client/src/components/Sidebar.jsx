import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasSubscription, isAdmin, logout } = useAuth();
  const { toast } = useUI();

  const go = (path) => { navigate(path); onClose(); };
  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    toast('Вы вышли из системы', 'warning');
    go('/');
  };

  const initials = user
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '';

  return (
    <aside className={`sidebar${open ? ' open' : ''}`} id="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">🧠</div>
          <div className="logo-text">
            <span className="logo-title">ЦДН Счастливые</span>
            <span className="logo-subtitle">детки</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className={`nav-item${isActive('/') ? ' active' : ''}`} onClick={() => go('/')}>
          <span className="nav-icon">🏠</span><span className="nav-label">Главная</span>
        </div>

        {user && (
          <>
            <div className="nav-section-title">Обучение</div>
            <div className={`nav-item${isActive('/block/1') ? ' active' : ''}`} onClick={() => go('/block/1')}>
              <span className="nav-icon">📋</span><span className="nav-label">1 блок</span>
            </div>
            <div className={`nav-item${isActive('/block/2') ? ' active' : ''}`} onClick={() => go('/block/2')}>
              <span className="nav-icon">📋</span><span className="nav-label">2 блок</span>
            </div>

            <div className="nav-section-title">Прогресс</div>
            <div className={`nav-item${isActive('/dashboard') ? ' active' : ''}`} onClick={() => go('/dashboard')}>
              <span className="nav-icon">📊</span><span className="nav-label">Дашборд</span>
            </div>
            <div className={`nav-item${isActive('/analytics') ? ' active' : ''}`} onClick={() => go('/analytics')}>
              <span className="nav-icon">📈</span><span className="nav-label">Аналитика</span>
            </div>

            {isAdmin() && (
              <>
                <div className="nav-section-title">Администратор</div>
                <div className="nav-item" onClick={() => go('/admin')}>
                  <span className="nav-icon">⚙️</span><span className="nav-label">Управление</span>
                </div>
              </>
            )}

            {!hasSubscription() && (
              <>
                <div className="nav-section-title">Подписка</div>
                <div className="nav-item" onClick={() => go('/subscription')} style={{ background: 'rgba(255,149,0,0.15)' }}>
                  <span className="nav-icon">⭐</span><span className="nav-label">Оформить подписку</span>
                </div>
              </>
            )}
          </>
        )}

        {!user && (
          <div className="nav-item" onClick={() => go('/subscription')}>
            <span className="nav-icon">⭐</span><span className="nav-label">Тарифы</span>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        {user ? (
          <>
            <div className="user-card" onClick={() => go('/profile')} style={{ cursor: 'pointer' }}>
              <div className="user-avatar">{initials}</div>
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                {hasSubscription() ? <span className="sub-badge">PRO</span> : <div className="user-role">Бесплатный</div>}
              </div>
            </div>
            <div className="nav-item mt-8" onClick={handleLogout} style={{ color: '#EF4444' }}>
              <span className="nav-icon">🚪</span><span className="nav-label">Выйти</span>
            </div>
          </>
        ) : (
          <>
            <div className="nav-item" onClick={() => go('/register')} style={{ background: 'rgba(0,0,0,0.06)' }}>
              <span className="nav-icon">👤</span><span className="nav-label">Регистрация</span>
            </div>
            <div className="nav-item" onClick={() => go('/login')}>
              <span className="nav-icon">🔑</span><span className="nav-label">Войти</span>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
