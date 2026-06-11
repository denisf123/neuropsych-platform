import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { toast } = useUI();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register({ name, email, password });
      toast(`Добро пожаловать, ${user.name}!`, 'success');
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🧠</div>
        <h1 className="auth-title">Регистрация</h1>
        <p className="auth-subtitle">Создайте аккаунт в нейропсихологическом центре</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Ваше имя</label>
            <input className="form-input" type="text" placeholder="Иван Иванов" required
              value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="ivan@example.com" required
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input className="form-input" type="password" placeholder="Минимум 6 символов" required
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Зарегистрироваться'}
          </button>
        </form>
        <div className="auth-switch">
          Уже есть аккаунт? <a onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>Войти</a>
        </div>
        <div className="auth-switch" style={{ marginTop: 8 }}>
          <a onClick={() => navigate('/subscription')} style={{ cursor: 'pointer' }}>Посмотреть тарифы</a>
        </div>
      </div>
    </div>
  );
}
