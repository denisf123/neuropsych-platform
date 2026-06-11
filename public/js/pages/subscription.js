// ========== SUBSCRIPTION PAGE ==========

function renderSubscriptionPage() {
  const hasSub = State.hasSubscription();
  return `
    <div class="page-header text-center" style="margin-bottom:36px">
      <h1 class="page-title" style="font-size:32px">Выберите подходящий тариф</h1>
      ${hasSub ? `<p class="text-muted">У вас есть активная подписка</p>` : `<p class="text-muted">Получите полный доступ ко всем материалам центра</p>`}
    </div>

    <div class="plans-grid" id="plansGrid">
      <div class="loading-state"><div class="spinner"></div></div>
    </div>

    ${hasSub ? `
      <div class="text-center mt-24">
        <button class="btn btn-secondary" onclick="confirmCancelSub()">Отменить подписку</button>
      </div>
    ` : ''}

    <div class="card mt-24" style="max-width:900px;margin:32px auto 0">
      <h3 class="section-title">✅ Что входит в подписку</h3>
      <div class="grid-3" style="gap:12px">
        ${[
          ['📚', 'Полный доступ', 'Все 2 блока, 16 тем, 128 техник, 512 методов'],
          ['🎥', 'Видео-материалы', 'Короткие видео с визуализацией каждого метода'],
          ['📊', 'Аналитика', 'Детальный анализ вашего прогресса и успехов'],
          ['🧪', 'Тесты', 'Интерактивные тесты для проверки знаний'],
          ['🤖', 'Рекомендации', 'Персональные рекомендации на основе ИИ'],
          ['🏋️', 'Тренажёры', 'Интерактивные упражнения для отработки методов']
        ].map(([icon, title, desc]) => `
          <div class="flex gap-12" style="align-items:flex-start">
            <span style="font-size:24px">${icon}</span>
            <div><div class="font-bold" style="font-size:14px">${title}</div><div class="text-muted" style="font-size:13px">${desc}</div></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function loadPlans() {
  try {
    const plans = await API.subscription.getPlans();
    const grid = document.getElementById('plansGrid');
    if (!grid) return;

    const planOrder = ['monthly', 'half_year', 'yearly'];
    grid.innerHTML = planOrder.map(key => {
      const p = plans[key];
      if (!p) return '';
      const hasSub = State.hasSubscription();
      const isCurrent = State.subscription?.plan_type === key;
      return `
        <div class="plan-card ${key === 'half_year' ? 'featured' : ''}">
          ${p.discount ? `<div class="plan-badge">-${p.discount}%</div>` : ''}
          <div class="plan-name">${p.label}</div>
          <div class="plan-price">${p.price}</div>
          <div class="plan-currency">рублей</div>
          <div class="plan-desc">Полный доступ ко всем платным материалам</div>
          <div class="plan-duration"><span>${p.days}</span> дней</div>
          ${isCurrent
            ? `<button class="btn-activate" style="background:#10B981;cursor:default">✓ АКТИВНА</button>`
            : `<button class="btn-activate" onclick="subscribeTo('${key}')">АКТИВИРОВАТЬ</button>`
          }
        </div>
      `;
    }).join('');
  } catch (err) {
    const grid = document.getElementById('plansGrid');
    if (grid) grid.innerHTML = `<p class="text-muted text-center">Ошибка загрузки тарифов</p>`;
  }
}

async function subscribeTo(planType) {
  if (!State.user) {
    toast('Для оформления подписки необходимо войти в аккаунт', 'warning');
    Router.go('login');
    return;
  }

  showModal(`
    <div style="text-align:center;padding:8px">
      <div style="font-size:48px;margin-bottom:16px">💳</div>
      <h2 class="modal-title">Оформление подписки</h2>
      <p class="text-muted" style="margin-bottom:24px">
        Это демонстрационная версия. В реальном проекте здесь будет интеграция с платёжной системой (ЮKassa, Stripe и др.)
      </p>
      <div class="card" style="background:var(--bg);padding:16px;margin-bottom:20px;text-align:left">
        <div class="flex justify-between" style="margin-bottom:8px">
          <span>Тариф:</span><strong>${PLAN_LABELS[planType]}</strong>
        </div>
        <div class="flex justify-between">
          <span>Сумма:</span><strong style="color:var(--orange)">${getPlanPrice(planType)} руб.</strong>
        </div>
      </div>
      <button class="btn btn-primary btn-block btn-lg" onclick="confirmSubscribe('${planType}')">
        Подтвердить оплату
      </button>
      <button class="btn btn-ghost btn-block mt-8" onclick="closeModal()">Отмена</button>
    </div>
  `);
}

async function confirmSubscribe(planType) {
  try {
    const { subscription } = await API.subscription.subscribe(planType);
    State.subscription = subscription;
    closeModal();
    toast('Подписка активирована! Добро пожаловать в PRO!', 'success');
    State.render();
    Router.go('home');
  } catch (err) {
    toast(err.message, 'error');
    closeModal();
  }
}

async function confirmCancelSub() {
  showModal(`
    <h2 class="modal-title">Отменить подписку?</h2>
    <p class="text-muted" style="margin-bottom:20px">Вы потеряете доступ к платным материалам. Доступ сохраняется до конца оплаченного периода.</p>
    <div class="flex gap-12">
      <button class="btn btn-danger btn-block" onclick="doCancelSub()">Отменить подписку</button>
      <button class="btn btn-secondary btn-block" onclick="closeModal()">Назад</button>
    </div>
  `);
}

async function doCancelSub() {
  try {
    await API.subscription.cancel();
    State.subscription = null;
    closeModal();
    toast('Подписка отменена', 'warning');
    State.render();
    Router.go('subscription');
  } catch (err) {
    toast(err.message, 'error');
  }
}

function getPlanPrice(planType) {
  const prices = { monthly: 199, half_year: 999, yearly: 1599 };
  return prices[planType] || 0;
}
