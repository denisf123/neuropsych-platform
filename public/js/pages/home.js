// ========== HOME / DASHBOARD PAGES ==========

function renderHomePage() {
  if (State.user) return renderDashboard();
  return renderLanding();
}

function renderLanding() {
  return `
    <div style="text-align:center;padding:60px 20px 40px">
      <div style="font-size:72px;margin-bottom:16px">🧠</div>
      <h1 style="font-size:36px;font-weight:800;margin-bottom:12px">ЦДН Счастливые детки</h1>
      <p style="font-size:18px;color:var(--text-muted);max-width:600px;margin:0 auto 32px;line-height:1.7">
        Профессиональная платформа нейропсихологического обучения.<br>
        Интерактивные методы, персональная аналитика, адаптивное обучение.
      </p>
      <div class="flex gap-16" style="justify-content:center;flex-wrap:wrap">
        <button class="btn btn-primary btn-lg" onclick="Router.go('register')">Начать бесплатно</button>
        <button class="btn btn-secondary btn-lg" onclick="Router.go('subscription')">Смотреть тарифы</button>
      </div>
    </div>

    <div class="grid-3" style="max-width:900px;margin:0 auto 40px;gap:20px">
      ${[
        ['🎓', '512 методов', '2 блока, 16 тем, 128 техник — полная программа нейропсихологии'],
        ['📊', 'Аналитика', 'Детальный анализ прогресса и персональные рекомендации'],
        ['🎥', 'Видео-уроки', 'Короткие видео с визуализацией каждого метода'],
        ['🧪', 'Тесты', 'Интерактивное тестирование с адаптацией программы'],
        ['🤖', 'ИИ-рекомендации', 'Система рекомендаций на основе вашего прогресса'],
        ['🔓', 'Бесплатный доступ', 'По 1 теме из каждого блока доступно без подписки']
      ].map(([icon, title, desc]) => `
        <div class="card text-center">
          <div style="font-size:36px;margin-bottom:12px">${icon}</div>
          <h3 style="font-weight:700;margin-bottom:8px">${title}</h3>
          <p class="text-muted" style="font-size:14px;line-height:1.5">${desc}</p>
        </div>
      `).join('')}
    </div>

    <div class="text-center" style="padding:40px;background:var(--yellow-light);border-radius:20px;max-width:700px;margin:0 auto">
      <h2 style="font-size:24px;font-weight:700;margin-bottom:12px">Готовы начать?</h2>
      <p class="text-muted" style="margin-bottom:20px">Зарегистрируйтесь и получите бесплатный доступ к первой теме каждого блока</p>
      <button class="btn btn-primary btn-lg" onclick="Router.go('register')">Зарегистрироваться бесплатно</button>
    </div>
  `;
}

async function renderDashboard() {
  const html = `
    <div class="page-header">
      <h1 class="page-title">👋 Добрый день, ${State.user.name.split(' ')[0]}!</h1>
      <p class="page-subtitle">Продолжайте обучение — каждый день приближает вас к цели</p>
    </div>

    <div class="stats-grid" id="statsGrid">
      <div class="stat-card"><div class="stat-icon">⏳</div><div class="stat-value" id="st-inprogress">—</div><div class="stat-label">В процессе</div></div>
      <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-value" id="st-completed">—</div><div class="stat-label">Завершено</div></div>
      <div class="stat-card"><div class="stat-icon">⏱</div><div class="stat-value" id="st-time">—</div><div class="stat-label">Время обучения</div></div>
      <div class="stat-card"><div class="stat-icon">📊</div><div class="stat-value" id="st-score">—</div><div class="stat-label">Средний балл</div></div>
    </div>

    <div class="dashboard-grid">
      <div>
        ${!State.hasSubscription() ? `
          <div style="background:linear-gradient(135deg,var(--yellow),var(--orange-light));border-radius:var(--radius);padding:20px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
            <div>
              <div style="font-size:16px;font-weight:700;margin-bottom:4px">⭐ Получите полный доступ</div>
              <div style="font-size:14px;opacity:0.8">Откройте все 16 тем и 512 методов</div>
            </div>
            <button class="btn btn-primary" onclick="Router.go('subscription')">Выбрать тариф</button>
          </div>
        ` : `
          <div id="streakBlock" class="streak-display mb-16" style="margin-bottom:20px">
            <div>
              <div class="streak-num" id="streakNum">0</div>
              <div class="streak-label">дней подряд</div>
            </div>
            <div>
              <div style="font-size:24px">🔥</div>
              <div style="font-size:13px;opacity:0.9">Серия обучения</div>
            </div>
          </div>
        `}

        <div class="card mb-16">
          <div class="section-title">📋 Блоки обучения</div>
          <div id="blocksPreview"><div class="loading-state"><div class="spinner"></div></div></div>
        </div>

        <div class="card">
          <div class="section-title">📈 Прогресс по темам</div>
          <div id="topicsProgress"><div class="loading-state"><div class="spinner"></div></div></div>
        </div>
      </div>

      <div>
        <div class="card mb-16">
          <div class="section-title">💡 Рекомендации</div>
          <div id="recsBlock"><div class="loading-state"><div class="spinner"></div></div></div>
        </div>

        <div class="card mb-16">
          <div class="section-title">📅 Активность</div>
          <div id="activityChart" style="height:160px"></div>
        </div>

        <div class="card">
          <div class="section-title">🕐 Последняя активность</div>
          <div id="recentActivity"><div class="loading-state"><div class="spinner"></div></div></div>
        </div>
      </div>
    </div>
  `;
  return html;
}

async function loadDashboardData() {
  try {
    const [progressData, analyticsData, blocks] = await Promise.all([
      API.progress.getOverview(),
      API.analytics.getMy(30),
      API.content.getBlocks()
    ]);

    // Stats
    const el = (id) => document.getElementById(id);
    if (el('st-inprogress')) el('st-inprogress').textContent = progressData.overview?.in_progress || 0;
    if (el('st-completed')) el('st-completed').textContent = progressData.overview?.completed || 0;
    if (el('st-time')) el('st-time').textContent = formatTime(progressData.overview?.total_time);
    if (el('st-score')) el('st-score').textContent = Math.round(progressData.overview?.avg_score || 0) + '%';
    if (el('streakNum')) el('streakNum').textContent = analyticsData.streak || 0;

    // Blocks preview
    if (el('blocksPreview')) {
      el('blocksPreview').innerHTML = blocks.map(b => `
        <div class="flex items-center justify-between" style="padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="Router.go('block',{id:${b.id}})">
          <div class="flex items-center gap-12">
            <span style="font-size:20px">${b.icon}</span>
            <div>
              <div style="font-weight:600;font-size:14px">${b.title}</div>
              <div class="text-muted" style="font-size:12px">${b.topics?.length || 0} тем</div>
            </div>
          </div>
          <span style="color:var(--orange)">→</span>
        </div>
      `).join('');
    }

    // Topics progress
    if (el('topicsProgress') && progressData.byBlock) {
      el('topicsProgress').innerHTML = progressData.byBlock.map(b => {
        const pct = b.total > 0 ? Math.round((b.completed / b.total) * 100) : 0;
        return `
          <div style="margin-bottom:14px">
            <div class="flex justify-between" style="margin-bottom:6px;font-size:14px">
              <span style="font-weight:500">${b.title}</span>
              <span class="text-muted">${b.completed}/${b.total} (${pct}%)</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar" style="width:${pct}%"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Recommendations
    if (el('recsBlock')) {
      try {
        const recs = await API.progress.getRecommendations();
        if (recs.length === 0) {
          el('recsBlock').innerHTML = `<div class="empty-state"><div class="empty-icon">🎉</div><p>Нет новых рекомендаций</p></div>`;
        } else {
          el('recsBlock').innerHTML = recs.map(r => `
            <div class="rec-card" onclick="Router.go('method',{id:${r.method_id}})" style="margin-bottom:8px">
              <span class="rec-icon">💡</span>
              <div class="rec-info">
                <div class="rec-title">${r.method_title}</div>
                <div class="rec-reason">${r.topic_title} · ${r.reason}</div>
              </div>
            </div>
          `).join('');
        }
      } catch {
        el('recsBlock').innerHTML = `<p class="text-muted">Войдите для рекомендаций</p>`;
      }
    }

    // Recent activity
    if (el('recentActivity') && progressData.recentActivity?.length) {
      el('recentActivity').innerHTML = progressData.recentActivity.map(a => `
        <div class="flex items-center gap-8" style="padding:8px 0;border-bottom:1px solid var(--border);font-size:13px">
          <span>${a.status === 'completed' ? '✅' : '📖'}</span>
          <div>
            <div style="font-weight:500">${a.method_title}</div>
            <div class="text-muted">${a.topic_title}</div>
          </div>
        </div>
      `).join('');
    } else if (el('recentActivity')) {
      el('recentActivity').innerHTML = `<div class="empty-state"><div class="empty-icon">📚</div><p>Начните изучение материалов</p></div>`;
    }

    // Activity chart
    if (analyticsData.daily && document.getElementById('activityChart')) {
      drawActivityChart(analyticsData.daily, 'activityChart');
    }

  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}
