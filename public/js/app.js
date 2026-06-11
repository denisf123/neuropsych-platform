// ========== ROUTER ==========
const Router = {
  current: null,
  params: null,

  routes: {
    home: () => renderHomePage(),
    login: () => renderLoginPage(),
    register: () => renderRegisterPage(),
    subscription: () => renderSubscriptionPage(),
    dashboard: () => renderHomePage(),
    profile: () => renderProfilePage(),
    analytics: () => renderAnalyticsPage(),
    block: (p) => renderBlockPage(p),
    topic: (p) => renderTopicPage(p),
    technique: (p) => renderTechniquePage(p),
    method: (p) => renderMethodPage(p),
    test: (p) => renderTestPage(p),
    admin: () => renderAdminPage(),
  },

  async go(route, params = {}) {
    this.current = route;
    this.params = params;

    // Close sidebar on mobile
    document.getElementById('sidebar')?.classList.remove('open');

    // Destroy three.js if leaving method page
    if (route !== 'method') destroyThree();

    const app = document.getElementById('app');
    app.innerHTML = `<div class="loading-state"><div class="spinner"></div><span>Загрузка...</span></div>`;

    // Update active nav
    renderSidebar();

    try {
      const renderer = this.routes[route];
      if (!renderer) { app.innerHTML = `<div class="card"><h2>404</h2><p>Страница не найдена</p></div>`; return; }

      const html = await renderer(params);
      if (html) app.innerHTML = html;

      // After-render hooks
      await afterRender(route, params);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Router error:', err);
      app.innerHTML = `<div class="card"><p class="text-muted">Ошибка: ${err.message}</p></div>`;
    }
  }
};

async function afterRender(route, params) {
  switch (route) {
    case 'home':
    case 'dashboard':
      if (State.user) await loadDashboardData();
      break;
    case 'subscription':
      await loadPlans();
      break;
    case 'analytics':
      await loadAnalyticsData('personal');
      break;
    case 'profile':
      await loadAchievements();
      break;
    case 'method':
      // Init Three.js brain visualization
      setTimeout(() => initBrainVisualization('brainViz'), 100);
      // Start time tracking
      startTimeTracking(params.id);
      break;
    case 'admin':
      await loadAdminData();
      break;
  }
}

// Time tracking for methods
let timeTrackingInterval = null;
let methodStartTime = null;
let currentMethodId = null;

function startTimeTracking(methodId) {
  stopTimeTracking();
  currentMethodId = methodId;
  methodStartTime = Date.now();
  timeTrackingInterval = setInterval(() => {
    const elapsed = Math.round((Date.now() - methodStartTime) / 1000);
    if (elapsed > 0 && elapsed % 30 === 0) {
      API.progress.updateMethod(methodId, { timeSpent: 30, status: 'in_progress' }).catch(() => {});
    }
  }, 5000);
}

function stopTimeTracking() {
  if (timeTrackingInterval) { clearInterval(timeTrackingInterval); timeTrackingInterval = null; }
  if (currentMethodId && methodStartTime) {
    const elapsed = Math.round((Date.now() - methodStartTime) / 1000);
    if (elapsed > 5) {
      API.progress.updateMethod(currentMethodId, { timeSpent: elapsed }).catch(() => {});
    }
  }
  currentMethodId = null; methodStartTime = null;
}

// ========== ADMIN PAGE ==========
function renderAdminPage() {
  if (!State.isAdmin()) return `<div class="card"><p>Нет доступа</p></div>`;
  return `
    <div class="page-header">
      <h1 class="page-title">⚙️ Панель администратора</h1>
    </div>
    <div class="tabs">
      <button class="tab-btn active" onclick="switchAdminTab('users', this)">Пользователи</button>
      <button class="tab-btn" onclick="switchAdminTab('subscriptions', this)">Подписки</button>
      <button class="tab-btn" onclick="Router.go('analytics')">Аналитика →</button>
    </div>
    <div id="adminContent"><div class="loading-state"><div class="spinner"></div></div></div>
  `;
}

async function loadAdminData(tab = 'users') {
  const container = document.getElementById('adminContent');
  if (!container) return;
  try {
    if (tab === 'users') {
      const users = await API.auth.getUsers();
      container.innerHTML = `
        <div class="card">
          <div class="flex justify-between items-center mb-16">
            <div class="section-title" style="margin:0">Пользователи (${users.length})</div>
          </div>
          <table class="data-table">
            <thead><tr><th>ID</th><th>Имя</th><th>Email</th><th>Роль</th><th>Подписка</th><th>Регистрация</th></tr></thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td>${u.id}</td>
                  <td>${u.name}</td>
                  <td>${u.email}</td>
                  <td><span class="badge ${u.role === 'admin' ? 'badge-blue' : 'badge-orange'}">${u.role}</span></td>
                  <td>${u.plan_type ? `<span class="badge badge-green">${PLAN_LABELS[u.plan_type] || u.plan_type}</span>` : '<span class="text-muted">—</span>'}</td>
                  <td class="text-muted">${formatDate(u.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      const subs = await API.subscription.all?.() || [];
      container.innerHTML = `<div class="card"><p>Подписки</p></div>`;
    }
  } catch (err) {
    if (container) container.innerHTML = `<div class="card"><p class="text-muted">${err.message}</p></div>`;
  }
}

function switchAdminTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadAdminData(tab);
}

// ========== INIT ==========
async function init() {
  // Try to restore session
  await State.loadUser();

  // Parse hash route
  const hash = window.location.hash.slice(1) || 'home';
  const [route, ...queryParts] = hash.split('?');
  const params = {};
  if (queryParts.length) {
    queryParts.join('?').split('&').forEach(pair => {
      const [k, v] = pair.split('=');
      params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
  }

  Router.go(route in Router.routes ? route : 'home', params);
}

// Hash-based navigation
window.addEventListener('hashchange', () => {
  stopTimeTracking();
  const hash = window.location.hash.slice(1) || 'home';
  const [route, ...queryParts] = hash.split('?');
  const params = {};
  if (queryParts.length) {
    queryParts.join('?').split('&').forEach(pair => {
      const [k, v] = pair.split('=');
      params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
  }
  Router.go(route in Router.routes ? route : 'home', params);
});

// Override Router.go to update hash
const origGo = Router.go.bind(Router);
Router.go = function(route, params = {}) {
  const queryStr = Object.keys(params).length
    ? '?' + Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
    : '';
  window.history.pushState(null, '', `#${route}${queryStr}`);
  return origGo(route, params);
};

// Start app
document.addEventListener('DOMContentLoaded', init);
