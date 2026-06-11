// ========== AUTH PAGES ==========

function renderRegisterPage() {
  return `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">🧠</div>
        <h1 class="auth-title">Регистрация</h1>
        <p class="auth-subtitle">Создайте аккаунт в нейропсихологическом центре</p>
        <form id="registerForm" onsubmit="handleRegister(event)">
          <div class="form-group">
            <label class="form-label">Ваше имя</label>
            <input class="form-input" type="text" id="regName" placeholder="Иван Иванов" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" type="email" id="regEmail" placeholder="ivan@example.com" required>
          </div>
          <div class="form-group">
            <label class="form-label">Пароль</label>
            <input class="form-input" type="password" id="regPassword" placeholder="Минимум 6 символов" required>
          </div>
          <div id="regError" class="form-error" style="margin-bottom:12px"></div>
          <button class="btn btn-primary btn-block btn-lg" type="submit" id="regBtn">Зарегистрироваться</button>
        </form>
        <div class="auth-switch">
          Уже есть аккаунт? <a onclick="Router.go('login')">Войти</a>
        </div>
        <div class="auth-switch" style="margin-top:8px">
          <a onclick="Router.go('subscription')">Посмотреть тарифы</a>
        </div>
      </div>
    </div>
  `;
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('regBtn');
  const errEl = document.getElementById('regError');
  errEl.textContent = '';
  setLoading(btn, true);
  try {
    const { token, user } = await API.auth.register({
      name: document.getElementById('regName').value,
      email: document.getElementById('regEmail').value,
      password: document.getElementById('regPassword').value
    });
    localStorage.setItem('token', token);
    State.setUser(user, null);
    toast('Добро пожаловать, ' + user.name + '!', 'success');
    Router.go('home');
  } catch (err) {
    errEl.textContent = err.message;
    setLoading(btn, false);
  }
}

// ========== LOGIN ==========

function renderLoginPage() {
  return `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">🔑</div>
        <h1 class="auth-title">Вход</h1>
        <p class="auth-subtitle">Войдите в свой аккаунт</p>
        <form id="loginForm" onsubmit="handleLogin(event)">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" type="email" id="loginEmail" placeholder="ivan@example.com" required>
          </div>
          <div class="form-group">
            <label class="form-label">Пароль</label>
            <input class="form-input" type="password" id="loginPassword" placeholder="Ваш пароль" required>
          </div>
          <div id="loginError" class="form-error" style="margin-bottom:12px"></div>
          <button class="btn btn-primary btn-block btn-lg" type="submit" id="loginBtn">Войти</button>
        </form>
        <div class="auth-switch">
          Нет аккаунта? <a onclick="Router.go('register')">Зарегистрироваться</a>
        </div>
      </div>
    </div>
  `;
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  setLoading(btn, true);
  try {
    const { token, user, subscription } = await API.auth.login({
      email: document.getElementById('loginEmail').value,
      password: document.getElementById('loginPassword').value
    });
    localStorage.setItem('token', token);
    State.setUser(user, subscription);
    toast('Добро пожаловать, ' + user.name + '!', 'success');
    Router.go('home');
  } catch (err) {
    errEl.textContent = err.message;
    setLoading(btn, false);
  }
}

// ========== PROFILE ==========

function renderProfilePage() {
  if (!State.user) return renderLoginPage();
  const sub = State.subscription;
  return `
    <div class="page-header">
      <h1 class="page-title">👤 Профиль</h1>
    </div>
    <div class="grid-2" style="max-width:800px">
      <div class="card">
        <h3 class="section-title">Личные данные</h3>
        <form onsubmit="handleProfileUpdate(event)">
          <div class="form-group">
            <label class="form-label">Имя</label>
            <input class="form-input" type="text" id="profileName" value="${State.user.name}">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" type="email" value="${State.user.email}" disabled style="opacity:0.6">
          </div>
          <div class="divider"></div>
          <h4 style="margin-bottom:12px;font-size:15px">Изменить пароль</h4>
          <div class="form-group">
            <label class="form-label">Текущий пароль</label>
            <input class="form-input" type="password" id="currentPw" placeholder="••••••">
          </div>
          <div class="form-group">
            <label class="form-label">Новый пароль</label>
            <input class="form-input" type="password" id="newPw" placeholder="••••••">
          </div>
          <button class="btn btn-primary" type="submit" id="profileBtn">Сохранить</button>
        </form>
      </div>
      <div>
        <div class="card mb-16">
          <h3 class="section-title">Подписка</h3>
          ${sub ? `
            <div class="badge badge-green" style="margin-bottom:12px">Активна</div>
            <p><strong>План:</strong> ${PLAN_LABELS[sub.plan_type] || sub.plan_type}</p>
            <p style="margin-top:8px"><strong>Активна до:</strong> ${formatDate(sub.end_date)}</p>
            <p style="margin-top:8px"><strong>Осталось дней:</strong> ${sub.days_left}</p>
            <button class="btn btn-secondary btn-sm mt-16" onclick="Router.go('subscription')">Управление</button>
          ` : `
            <p class="text-muted mb-16">У вас нет активной подписки</p>
            <button class="btn btn-primary" onclick="Router.go('subscription')">Выбрать тариф</button>
          `}
        </div>
        <div class="card">
          <h3 class="section-title">Достижения</h3>
          <div id="achievements">
            <div class="loading-state"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  const btn = document.getElementById('profileBtn');
  setLoading(btn, true);
  try {
    await API.auth.updateProfile({
      name: document.getElementById('profileName').value,
      currentPassword: document.getElementById('currentPw').value,
      newPassword: document.getElementById('newPw').value
    });
    toast('Профиль обновлён!');
    await State.loadUser();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
}

async function loadAchievements() {
  try {
    const { overview } = await API.progress.getOverview();
    const el = document.getElementById('achievements');
    if (!el) return;
    const achievements = [
      { icon: '🎯', label: 'Методов пройдено', value: overview.completed || 0 },
      { icon: '⏱', label: 'Время обучения', value: formatTime(overview.total_time) },
      { icon: '📊', label: 'Средний балл', value: Math.round(overview.avg_score || 0) + '%' }
    ];
    el.innerHTML = achievements.map(a => `
      <div class="flex items-center gap-12" style="margin-bottom:12px">
        <span style="font-size:24px">${a.icon}</span>
        <div><div class="font-bold" style="font-size:18px">${a.value}</div><div class="text-muted">${a.label}</div></div>
      </div>
    `).join('');
  } catch {}
}

const PLAN_LABELS = { monthly: 'Месяц', half_year: '6 месяцев', yearly: '1 год' };
