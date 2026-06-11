import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { formatDate, PLAN_LABELS } from '../utils/helpers';

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (tab === 'users') {
      API.auth.getUsers().then(setUsers).catch(console.error);
    }
  }, [tab]);

  if (!isAdmin()) return <div className="card"><p>Нет доступа</p></div>;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">⚙️ Панель администратора</h1>
      </div>
      <div className="tabs">
        <button className={`tab-btn${tab === 'users' ? ' active' : ''}`} onClick={() => setTab('users')}>Пользователи</button>
        <button className={`tab-btn${tab === 'subscriptions' ? ' active' : ''}`} onClick={() => setTab('subscriptions')}>Подписки</button>
        <button className="tab-btn" onClick={() => navigate('/analytics')}>Аналитика →</button>
      </div>

      {tab === 'users' && (
        <div className="card">
          <div className="flex justify-between items-center mb-16">
            <div className="section-title" style={{ margin: 0 }}>Пользователи ({users.length})</div>
          </div>
          <table className="data-table">
            <thead><tr><th>ID</th><th>Имя</th><th>Email</th><th>Роль</th><th>Подписка</th><th>Регистрация</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge ${u.role === 'admin' ? 'badge-blue' : 'badge-orange'}`}>{u.role}</span></td>
                  <td>{u.plan_type ? <span className="badge badge-green">{PLAN_LABELS[u.plan_type] || u.plan_type}</span> : <span className="text-muted">—</span>}</td>
                  <td className="text-muted">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'subscriptions' && <div className="card"><p>Подписки</p></div>}
    </>
  );
}
