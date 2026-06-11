// ========== ANALYTICS PAGE ==========

async function renderAnalyticsPage() {
  if (!State.user) return `<div class="auth-page"><div class="auth-card"><p class="text-muted text-center">Войдите для просмотра аналитики</p><button class="btn btn-primary btn-block mt-16" onclick="Router.go('login')">Войти</button></div></div>`;

  return `
    <div class="page-header">
      <h1 class="page-title">📊 Аналитика обучения</h1>
      <p class="page-subtitle">Детальный анализ вашего прогресса</p>
    </div>

    <div class="tabs">
      <button class="tab-btn active" onclick="switchAnalyticsTab('personal', this)">Личная</button>
      ${State.isAdmin() ? `<button class="tab-btn" onclick="switchAnalyticsTab('platform', this)">Платформа</button>` : ''}
    </div>

    <div id="analyticsContent">
      <div class="loading-state"><div class="spinner"></div></div>
    </div>
  `;
}

async function loadAnalyticsData(type = 'personal') {
  const container = document.getElementById('analyticsContent');
  if (!container) return;

  try {
    if (type === 'personal') {
      const [data, progressData] = await Promise.all([API.analytics.getMy(30), API.progress.getOverview()]);

      container.innerHTML = `
        <div class="grid-2" style="margin-bottom:20px">
          <div class="viz-container">
            <div class="viz-title">📅 Активность за 30 дней</div>
            <div id="progressChart"></div>
          </div>
          <div class="viz-container">
            <div class="viz-title">⏱ Время по темам</div>
            <div id="topicsChart"></div>
          </div>
        </div>
        <div class="grid-2" style="margin-bottom:20px">
          <div class="viz-container">
            <div class="viz-title">🎯 Радар компетенций</div>
            <div id="radarChart"></div>
          </div>
          <div class="viz-container">
            <div class="viz-title">📈 Динамика прогресса</div>
            <div id="activityChart"></div>
          </div>
        </div>
        <div class="grid-2">
          <div class="card">
            <div class="section-title">🏆 Топ методов</div>
            <div id="topMethodsList"></div>
          </div>
          <div class="card">
            <div class="section-title">📋 Результаты тестов</div>
            <div id="testScoresList"></div>
          </div>
        </div>
      `;

      // Draw charts
      if (data.daily?.length) {
        drawProgressChart(data.daily, 'progressChart');
        drawActivityChart(data.daily, 'activityChart');
      }
      if (data.timeByTopic?.length) drawTopicsChart(data.timeByTopic, 'topicsChart');
      if (progressData.byBlock?.length) drawRadarChart(progressData.byBlock, 'radarChart');

      // Top methods list
      const topEl = document.getElementById('topMethodsList');
      if (topEl && data.topMethods?.length) {
        topEl.innerHTML = data.topMethods.map((m, i) => `
          <div class="flex items-center gap-12" style="padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="font-weight:700;color:var(--orange);width:20px">${i+1}</span>
            <div style="flex:1;font-size:14px">${m.title}</div>
            <span class="badge badge-orange">${m.views} просмотров</span>
          </div>
        `).join('');
      } else if (topEl) {
        topEl.innerHTML = `<div class="empty-state"><div class="empty-icon">📚</div><p>Начните изучение</p></div>`;
      }

      // Test scores
      const tsEl = document.getElementById('testScoresList');
      if (tsEl && progressData.testScores?.length) {
        tsEl.innerHTML = progressData.testScores.map(t => `
          <div class="flex justify-between items-center" style="padding:8px 0;border-bottom:1px solid var(--border)">
            <div style="font-size:14px">${t.topic}</div>
            <div class="flex gap-8 items-center">
              <span style="font-weight:700;color:${t.score >= 70 ? '#10B981' : 'var(--orange)'}">${t.score}%</span>
              <span class="text-muted" style="font-size:12px">${formatDate(t.completed_at)}</span>
            </div>
          </div>
        `).join('');
      } else if (tsEl) {
        tsEl.innerHTML = `<div class="empty-state"><p>Тесты ещё не пройдены</p></div>`;
      }

    } else {
      // Platform analytics (admin)
      const data = await API.analytics.getPlatform();
      container.innerHTML = `
        <div class="stats-grid" style="margin-bottom:20px">
          <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-value">${data.userStats?.total || 0}</div><div class="stat-label">Всего пользователей</div></div>
          <div class="stat-card"><div class="stat-icon">🆕</div><div class="stat-value">${data.userStats?.new_this_week || 0}</div><div class="stat-label">Новых за неделю</div></div>
          <div class="stat-card"><div class="stat-icon">🔥</div><div class="stat-value">${data.userStats?.active_this_week || 0}</div><div class="stat-label">Активных за неделю</div></div>
          <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-value">${(data.subStats || []).reduce((sum, s) => sum + (s.revenue || 0), 0)} ₽</div><div class="stat-label">Доход (активные)</div></div>
        </div>
        <div class="grid-2" style="margin-bottom:20px">
          <div class="viz-container">
            <div class="viz-title">👥 DAU (последние 30 дней)</div>
            <div id="dauChart"></div>
          </div>
          <div class="viz-container">
            <div class="viz-title">💳 Подписки по тарифам</div>
            <div id="subsChart"></div>
          </div>
        </div>
        <div class="card">
          <div class="section-title">🔥 Популярные методы</div>
          <table class="data-table">
            <thead><tr><th>#</th><th>Метод</th><th>Тема</th><th>Просмотров</th></tr></thead>
            <tbody>
              ${(data.popularMethods || []).map((m, i) => `
                <tr><td>${i+1}</td><td>${m.title}</td><td>${m.topic}</td><td><span class="badge badge-orange">${m.views}</span></td></tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      if (data.dailyActive?.length) drawProgressChart(data.dailyActive.map(d => ({ day: d.day, events: d.users, completed: 0 })), 'dauChart');
      if (data.subStats?.length) drawSubsChart(data.subStats, 'subsChart');
    }
  } catch (err) {
    console.error(err);
    if (container) container.innerHTML = `<div class="card"><p class="text-muted">Ошибка загрузки аналитики: ${err.message}</p></div>`;
  }
}

function switchAnalyticsTab(type, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('analyticsContent').innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;
  loadAnalyticsData(type);
}

function drawSubsChart(data, containerId) {
  const el = document.getElementById(containerId);
  if (!el || !data.length) return;
  const labels = { monthly: 'Месяц', half_year: '6 мес', yearly: 'Год' };
  const colors = ['#FF9500', '#FFD060', '#10B981'];
  const total = data.reduce((s, d) => s + d.count, 0);
  el.innerHTML = data.map((d, i) => `
    <div style="margin-bottom:10px">
      <div class="flex justify-between" style="font-size:13px;margin-bottom:4px">
        <span>${labels[d.plan_type] || d.plan_type}</span>
        <span>${d.count} (${total ? Math.round(d.count/total*100) : 0}%)</span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar" style="width:${total ? (d.count/total*100) : 0}%;background:${colors[i % colors.length]}"></div>
      </div>
    </div>
  `).join('');
}
