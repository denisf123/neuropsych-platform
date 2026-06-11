// ========== STATE MANAGEMENT ==========
const State = {
  user: null,
  subscription: null,
  sessionId: 'sess_' + Math.random().toString(36).slice(2),

  setUser(user, sub) {
    this.user = user;
    this.subscription = sub || null;
    this.render();
  },

  clearUser() {
    this.user = null;
    this.subscription = null;
    localStorage.removeItem('token');
  },

  hasSubscription() {
    if (!this.subscription) return false;
    return this.subscription.status === 'active' && new Date(this.subscription.end_date) > new Date();
  },

  isAdmin() { return this.user?.role === 'admin'; },

  render() {
    renderSidebar();
  },

  async loadUser() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const { user, subscription } = await API.auth.me();
      this.setUser(user, subscription);
    } catch {
      this.clearUser();
    }
  }
};

// ========== SIDEBAR ==========
function renderSidebar() {
  const nav = document.getElementById('sidebarNav');
  const footer = document.getElementById('sidebarFooter');
  if (!nav) return;

  const isLoggedIn = !!State.user;
  const hasSub = State.hasSubscription();

  nav.innerHTML = `
    <div class="nav-item ${Router.current === 'home' ? 'active' : ''}" onclick="Router.go('home')">
      <span class="nav-icon">🏠</span><span class="nav-label">Главная</span>
    </div>
    ${isLoggedIn ? `
      <div class="nav-section-title">Обучение</div>
      <div class="nav-item ${Router.current === 'block-1' ? 'active' : ''}" onclick="Router.go('block', {id: 1})">
        <span class="nav-icon">📋</span><span class="nav-label">1 блок</span>
      </div>
      <div class="nav-item ${Router.current === 'block-2' ? 'active' : ''}" onclick="Router.go('block', {id: 2})">
        <span class="nav-icon">📋</span><span class="nav-label">2 блок</span>
      </div>
      <div class="nav-section-title">Прогресс</div>
      <div class="nav-item ${Router.current === 'dashboard' ? 'active' : ''}" onclick="Router.go('dashboard')">
        <span class="nav-icon">📊</span><span class="nav-label">Дашборд</span>
      </div>
      <div class="nav-item ${Router.current === 'analytics' ? 'active' : ''}" onclick="Router.go('analytics')">
        <span class="nav-icon">📈</span><span class="nav-label">Аналитика</span>
      </div>
      ${State.isAdmin() ? `
        <div class="nav-section-title">Администратор</div>
        <div class="nav-item" onclick="Router.go('admin')">
          <span class="nav-icon">⚙️</span><span class="nav-label">Управление</span>
        </div>
      ` : ''}
      ${!hasSub ? `
        <div class="nav-section-title">Подписка</div>
        <div class="nav-item" onclick="Router.go('subscription')" style="background:rgba(255,149,0,0.15)">
          <span class="nav-icon">⭐</span><span class="nav-label">Оформить подписку</span>
        </div>
      ` : ''}
    ` : `
      <div class="nav-item" onclick="Router.go('subscription')">
        <span class="nav-icon">⭐</span><span class="nav-label">Тарифы</span>
      </div>
    `}
  `;

  if (isLoggedIn) {
    const initials = State.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    footer.innerHTML = `
      <div class="user-card" onclick="Router.go('profile')" style="cursor:pointer">
        <div class="user-avatar">${initials}</div>
        <div class="user-info">
          <div class="user-name">${State.user.name}</div>
          ${hasSub ? `<span class="sub-badge">PRO</span>` : `<div class="user-role">Бесплатный</div>`}
        </div>
      </div>
      <div class="nav-item mt-8" onclick="logout()" style="color:#EF4444">
        <span class="nav-icon">🚪</span><span class="nav-label">Выйти</span>
      </div>
    `;
  } else {
    footer.innerHTML = `
      <div class="nav-item" onclick="Router.go('register')" style="background:rgba(0,0,0,0.06)">
        <span class="nav-icon">👤</span><span class="nav-label">Регистрация</span>
      </div>
      <div class="nav-item" onclick="Router.go('login')">
        <span class="nav-icon">🔑</span><span class="nav-label">Войти</span>
      </div>
    `;
  }
}

// ========== GLOBAL HELPERS ==========
function toast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', warning: '⚠️' };
  el.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

function showModal(html) {
  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modalOverlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

async function logout() {
  State.clearUser();
  toast('Вы вышли из системы', 'warning');
  Router.go('home');
}

function setLoading(el, loading) {
  if (typeof el === 'string') el = document.querySelector(el);
  if (!el) return;
  if (loading) { el.dataset.originalText = el.innerHTML; el.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px"></span>'; el.disabled = true; }
  else { el.innerHTML = el.dataset.originalText || ''; el.disabled = false; }
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(seconds) {
  if (!seconds) return '0 мин';
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h} ч ${m % 60} мин` : `${m} мин`;
}

function difficultyStars(level) {
  return Array.from({ length: 5 }, (_, i) => `<span class="star">${i < level ? '⭐' : '☆'}</span>`).join('');
}
