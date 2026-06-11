// ========== CONTENT PAGES ==========

// --- BLOCK PAGE ---
async function renderBlockPage(params) {
  try {
    const block = await API.content.getBlock(params.id);
    return `
      <div class="page-header">
        <div class="breadcrumb">
          <span class="crumb" onclick="Router.go('home')">🏠 Главная</span>
          <span class="sep">/</span>
          <span>${block.title}</span>
        </div>
        <h1 class="page-title">${block.icon} ${block.title}</h1>
        <p class="page-subtitle">${block.description || ''}</p>
      </div>

      <div class="grid-8">
        ${block.topics.map(t => `
          <div class="topic-btn ${!t.accessible ? 'locked' : ''}" onclick="handleTopicClick(${t.id}, ${t.accessible}, '${t.title.replace(/'/g,"\\'")}')">
            <span class="topic-icon">${t.icon || '📖'}</span>
            <span class="topic-name">${t.title}</span>
            <span class="topic-desc">${t.description || ''}</span>
            ${t.is_free ? `<span class="free-badge">Бесплатно</span>` : !t.accessible ? `<span class="lock-badge">🔒 Нужна подписка</span>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    return `<div class="card"><p class="text-muted">Ошибка загрузки блока</p></div>`;
  }
}

function handleTopicClick(id, accessible, title) {
  if (!accessible) {
    showPaywall(title);
    return;
  }
  Router.go('topic', { id });
}

function showPaywall(title) {
  showModal(`
    <div class="paywall">
      <div class="paywall-icon">🔒</div>
      <h2 class="paywall-title">Нужна подписка</h2>
      <p class="paywall-text">
        Тема <strong>"${title}"</strong> доступна только для подписчиков.<br>
        Оформите подписку от 199 руб./месяц и получите полный доступ ко всем материалам.
      </p>
      <button class="btn btn-primary btn-lg mb-16" onclick="closeModal();Router.go('subscription')">Выбрать тариф</button>
      <br>
      <button class="btn btn-ghost" onclick="closeModal()">Позже</button>
    </div>
  `);
}

// --- TOPIC PAGE ---
async function renderTopicPage(params) {
  try {
    const topic = await API.content.getTopic(params.id);
    const totalMethods = topic.techniques.length * 4;
    const completedMethods = Object.values(topic.progress || {}).filter(s => s === 'completed').length;
    const pct = totalMethods > 0 ? Math.round((completedMethods / totalMethods) * 100) : 0;

    return `
      <div class="page-header">
        <div class="breadcrumb">
          <span class="crumb" onclick="Router.go('home')">🏠 Главная</span>
          <span class="sep">/</span>
          <span class="crumb" onclick="Router.go('block',{id:${topic.block_id}})">${topic.block?.title || 'Блок'}</span>
          <span class="sep">/</span>
          <span>${topic.title}</span>
        </div>
        <h1 class="page-title">${topic.icon || '📖'} ${topic.title}</h1>
        <p class="page-subtitle">${topic.description || ''}</p>
      </div>

      <div class="card mb-16">
        <div class="flex justify-between items-center" style="margin-bottom:8px">
          <span style="font-size:14px;font-weight:500">Прогресс темы</span>
          <span class="text-muted" style="font-size:14px">${completedMethods}/${totalMethods} методов</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width:${pct}%"></div>
        </div>
      </div>

      <div class="flex justify-between items-center mb-16">
        <h2 class="section-title" style="margin-bottom:0">Техники (${topic.techniques.length})</h2>
        <button class="btn btn-secondary btn-sm" onclick="Router.go('test',{topicId:${topic.id}})">📝 Пройти тест</button>
      </div>

      <div class="grid-8">
        ${topic.techniques.map((t, i) => `
          <div class="technique-btn" onclick="Router.go('technique',{id:${t.id}})">
            <div class="tech-icon">${t.icon || '🔬'}</div>
            <div class="tech-name">${t.title}</div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    if (err.code === 'SUBSCRIPTION_REQUIRED') {
      return `
        <div class="paywall card">
          <div class="paywall-icon">🔒</div>
          <h2 class="paywall-title">Требуется подписка</h2>
          <p class="paywall-text">Оформите подписку для доступа к этой теме</p>
          <button class="btn btn-primary btn-lg" onclick="Router.go('subscription')">Выбрать тариф</button>
        </div>
      `;
    }
    return `<div class="card"><p class="text-muted">Ошибка загрузки: ${err.message}</p></div>`;
  }
}

// --- TECHNIQUE PAGE ---
async function renderTechniquePage(params) {
  try {
    const tech = await API.content.getTechnique(params.id);
    return `
      <div class="page-header">
        <div class="breadcrumb">
          <span class="crumb" onclick="Router.go('home')">🏠 Главная</span>
          <span class="sep">/</span>
          <span class="crumb" onclick="Router.go('topic',{id:${tech.topic?.id}})">${tech.topic?.title || 'Тема'}</span>
          <span class="sep">/</span>
          <span>${tech.title}</span>
        </div>
        <h1 class="page-title">🔬 ${tech.title}</h1>
        <p class="page-subtitle">${tech.description || ''}</p>
      </div>

      <div class="section-title">Методы (${tech.methods.length})</div>
      <div class="grid-2">
        ${tech.methods.map((m, i) => {
          const prog = m.progress;
          const statusClass = prog?.status || 'not_started';
          const statusIcon = { completed: '✅', in_progress: '📖', not_started: '' }[statusClass] || '';
          return `
            <div class="method-btn ${prog?.status === 'completed' ? 'completed' : prog?.status === 'in_progress' ? 'in_progress' : ''}" onclick="Router.go('method',{id:${m.id}})">
              <div class="method-num">${statusClass === 'completed' ? '✓' : i + 1}</div>
              <div class="method-info">
                <div class="method-name">${m.title}</div>
                <div class="method-meta">Сложность: ${m.difficulty}/5 · ${m.duration ? Math.round(m.duration/60) + ' мин' : 'видео'}</div>
              </div>
              <div class="method-status">${statusIcon}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (err) {
    if (err.code === 'SUBSCRIPTION_REQUIRED') return renderPaywallCard();
    return `<div class="card"><p class="text-muted">Ошибка: ${err.message}</p></div>`;
  }
}

// --- METHOD PAGE ---
async function renderMethodPage(params) {
  try {
    const method = await API.content.getMethod(params.id);
    const tags = (() => { try { return JSON.parse(method.tags || '[]'); } catch { return []; } })();
    const nav = method.navigation;

    return `
      <div class="method-page">
        <div class="breadcrumb" style="margin-bottom:16px">
          <span class="crumb" onclick="Router.go('home')">🏠</span>
          <span class="sep">/</span>
          <span class="crumb" onclick="Router.go('technique',{id:${method.technique?.id}})">${method.technique?.title || 'Техника'}</span>
          <span class="sep">/</span>
          <span>Метод ${nav.current}/${nav.total}</span>
        </div>

        <div class="method-header">
          <h1 class="method-title">${method.title}</h1>
          <div class="difficulty-stars">${difficultyStars(method.difficulty)}</div>
          ${tags.length ? `<div class="method-tags">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
          ${method.userProgress?.status === 'completed' ? `<div style="margin-top:12px"><span class="badge badge-green">✅ Пройдено</span></div>` : ''}
        </div>

        <div class="video-container">
          ${method.video_url
            ? `<video controls preload="metadata" src="/stream/${method.id}" style="width:100%;height:100%"></video>`
            : `<div class="video-placeholder"><div class="play-icon">▶</div><p>Видео материал</p><p style="font-size:12px">(Загрузите видео через панель администратора)</p></div>`
          }
        </div>

        <div class="method-description">
          <h3>📋 Описание метода</h3>
          <p>${method.description}</p>
        </div>

        <div class="progress-actions">
          ${method.userProgress?.status !== 'completed' ? `
            <button class="btn btn-primary" onclick="markMethodComplete(${method.id})">✅ Отметить пройденным</button>
          ` : `<span class="badge badge-green" style="padding:8px 16px;font-size:14px">✅ Пройдено!</span>`}
          <button class="btn btn-secondary" onclick="openTrainer(${method.id}, '${method.title.replace(/'/g,"\\'")}')">🏋️ Тренажёр</button>
          <button class="btn btn-ghost" onclick="showMethodAnalytics(${method.id})">📊 Статистика</button>
        </div>

        <div id="trainerArea" class="hidden"></div>

        <div class="method-nav">
          ${nav.prev ? `<button class="btn btn-secondary" onclick="Router.go('method',{id:${nav.prev.id}})">← ${nav.prev.title}</button>` : '<div></div>'}
          <button class="btn btn-ghost" onclick="Router.go('technique',{id:${method.technique?.id}})">Все методы</button>
          ${nav.next ? `<button class="btn btn-primary" onclick="Router.go('method',{id:${nav.next.id}})">${nav.next.title} →</button>` : '<div></div>'}
        </div>

        <div id="vizSection" class="mt-24">
          <div class="viz-container">
            <div class="viz-title">🧠 Нейровизуализация активности</div>
            <div class="three-container" id="brainViz"></div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    if (err.code === 'SUBSCRIPTION_REQUIRED') return renderPaywallCard();
    return `<div class="card"><p class="text-muted">Ошибка: ${err.message}</p></div>`;
  }
}

async function markMethodComplete(methodId) {
  try {
    await API.progress.updateMethod(methodId, { status: 'completed', timeSpent: 120 });
    toast('Метод отмечен как пройденный!', 'success');
    Router.go('method', { id: methodId });
  } catch (err) {
    if (err.code === 'SUBSCRIPTION_REQUIRED') { showPaywall('этот метод'); return; }
    toast(err.message, 'error');
  }
}

function openTrainer(methodId, methodTitle) {
  const area = document.getElementById('trainerArea');
  if (!area) return;
  area.classList.remove('hidden');
  area.innerHTML = `
    <div class="card mt-16">
      <div class="section-title">🏋️ Интерактивный тренажёр: ${methodTitle}</div>
      <div class="trainer-area">
        <div class="trainer-stage" id="trainerStage">
          <div class="trainer-instruction" id="trainerInstruction">Нажмите кнопку для начала тренировки</div>
          <div class="trainer-target" id="trainerTarget" onclick="trainerAction()" title="Нажмите!">🧠</div>
          <div class="timer-circle" id="trainerTimer">10</div>
          <div class="trainer-feedback" id="trainerFeedback"></div>
          <div class="flex gap-12 mt-16">
            <button class="btn btn-primary" id="trainerStartBtn" onclick="startTrainer(${methodId})">▶ Начать</button>
            <button class="btn btn-secondary" onclick="document.getElementById('trainerArea').classList.add('hidden')">✕ Закрыть</button>
          </div>
        </div>
      </div>
    </div>
  `;
  area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

let trainerInterval = null;
let trainerScore = 0;
let trainerTimeLeft = 30;
const TRAINER_PHASES = [
  { instruction: '👀 Сфокусируйте внимание на объекте и нажимайте каждый раз, когда он меняется', target: '🔵', duration: 30 },
  { instruction: '🤲 Выполните двустороннее движение руками, затем нажмите кнопку', target: '🟡', duration: 30 },
  { instruction: '💭 Представьте образ, связанный с темой, и нажмите кнопку', target: '🟢', duration: 30 }
];
let trainerPhase = 0;

function startTrainer(methodId) {
  trainerScore = 0; trainerTimeLeft = TRAINER_PHASES[0].duration; trainerPhase = 0;
  document.getElementById('trainerStartBtn').style.display = 'none';
  updateTrainerPhase();
  trainerInterval = setInterval(() => {
    trainerTimeLeft--;
    const timerEl = document.getElementById('trainerTimer');
    if (timerEl) timerEl.textContent = trainerTimeLeft;
    if (trainerTimeLeft <= 0) {
      trainerPhase++;
      if (trainerPhase >= TRAINER_PHASES.length) {
        clearInterval(trainerInterval);
        endTrainer(methodId);
      } else {
        trainerTimeLeft = TRAINER_PHASES[trainerPhase].duration;
        updateTrainerPhase();
      }
    }
  }, 1000);
}

function updateTrainerPhase() {
  const phase = TRAINER_PHASES[trainerPhase];
  const instrEl = document.getElementById('trainerInstruction');
  const targetEl = document.getElementById('trainerTarget');
  if (instrEl) instrEl.textContent = phase.instruction;
  if (targetEl) targetEl.textContent = phase.target;
}

function trainerAction() {
  trainerScore++;
  const target = document.getElementById('trainerTarget');
  const feedback = document.getElementById('trainerFeedback');
  if (target) { target.style.transform = 'scale(1.2)'; setTimeout(() => target.style.transform = '', 150); }
  if (feedback) { feedback.textContent = `+1 (всего: ${trainerScore})`; feedback.style.color = 'var(--orange)'; setTimeout(() => feedback.textContent = '', 500); }
}

function endTrainer(methodId) {
  const accuracy = Math.min(100, trainerScore * 3);
  API.analytics.trackEvent({ eventType: 'trainer_complete', entityType: 'method', entityId: methodId, data: { score: accuracy } }).catch(() => {});
  const stage = document.getElementById('trainerStage');
  if (stage) stage.innerHTML = `
    <div style="text-align:center">
      <div style="font-size:56px;margin-bottom:16px">🎉</div>
      <div style="font-size:22px;font-weight:700;margin-bottom:8px">Тренировка завершена!</div>
      <div class="text-muted" style="margin-bottom:20px">Результат: ${accuracy} очков · ${trainerScore} действий</div>
      <button class="btn btn-primary" onclick="startTrainer(${methodId})">🔄 Повторить</button>
    </div>
  `;
}

function showMethodAnalytics(methodId) {
  API.analytics.getEffectiveness(methodId).then(stats => {
    showModal(`
      <h2 class="modal-title">📊 Статистика метода</h2>
      <div class="grid-2" style="gap:12px;margin-bottom:20px">
        <div class="stat-card"><div class="stat-value">${Math.round(stats.avg_score || 0)}%</div><div class="stat-label">Средний балл</div></div>
        <div class="stat-card"><div class="stat-value">${stats.total_users || 0}</div><div class="stat-label">Изучали пользователей</div></div>
        <div class="stat-card"><div class="stat-value">${formatTime(stats.avg_time)}</div><div class="stat-label">Среднее время</div></div>
        <div class="stat-card"><div class="stat-value">${stats.completed || 0}</div><div class="stat-label">Завершили</div></div>
      </div>
      <button class="btn btn-secondary btn-block" onclick="closeModal()">Закрыть</button>
    `);
  }).catch(() => toast('Ошибка загрузки статистики', 'error'));
}

function renderPaywallCard() {
  return `
    <div class="card paywall">
      <div class="paywall-icon">🔒</div>
      <h2 class="paywall-title">Требуется подписка</h2>
      <p class="paywall-text">Оформите подписку от 199 руб./месяц для доступа ко всем материалам</p>
      <button class="btn btn-primary btn-lg" onclick="Router.go('subscription')">Выбрать тариф →</button>
    </div>
  `;
}

// --- TEST PAGE ---
async function renderTestPage(params) {
  try {
    const test = await API.content.getTest(params.topicId);
    return `
      <div class="page-header">
        <h1 class="page-title">📝 ${test.title}</h1>
        <p class="page-subtitle">${test.description || ''} · Проходной балл: ${test.pass_score}%</p>
      </div>
      <div class="test-card" id="testCard">
        <div id="testContent">
          ${renderQuestion(test.questions, 0)}
        </div>
      </div>
    `;
  } catch (err) {
    if (err.code === 'SUBSCRIPTION_REQUIRED') return renderPaywallCard();
    return `<div class="card"><p class="text-muted">Ошибка загрузки теста</p></div>`;
  }
}

let testAnswers = [];
let testStartTime = Date.now();

function renderQuestion(questions, idx) {
  testStartTime = Date.now();
  const q = questions[idx];
  return `
    <div>
      <div class="question-num">Вопрос ${idx + 1} из ${questions.length}</div>
      <div class="progress-bar-container" style="margin-bottom:20px">
        <div class="progress-bar" style="width:${(idx / questions.length) * 100}%"></div>
      </div>
      <div class="question-text">${q.question}</div>
      <div class="options-list">
        ${JSON.parse(q.options || q.options).map((opt, oi) => `
          <button class="option-btn" onclick="selectAnswer(${idx}, ${oi}, this, ${JSON.stringify(questions)})">
            <span style="font-weight:600;margin-right:8px">${String.fromCharCode(65 + oi)}.</span>${opt}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function selectAnswer(questionIdx, answerIdx, btn, questions) {
  testAnswers[questionIdx] = answerIdx;
  document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  setTimeout(() => {
    if (questionIdx + 1 < questions.length) {
      document.getElementById('testContent').innerHTML = renderQuestion(questions, questionIdx + 1);
    } else {
      submitCurrentTest(questions);
    }
  }, 500);
}

async function submitCurrentTest(questions) {
  const topicId = Router.params?.topicId;
  if (!topicId) return;
  try {
    const result = await API.content.submitTest(topicId, { answers: testAnswers, timeTaken: Math.round((Date.now() - testStartTime) / 1000) });
    document.getElementById('testCard').innerHTML = `
      <div style="text-align:center;padding:20px">
        <div style="font-size:56px;margin-bottom:16px">${result.passed ? '🎉' : '📚'}</div>
        <h2 style="font-size:24px;font-weight:700;margin-bottom:8px">${result.passed ? 'Тест пройден!' : 'Почти!'}</h2>
        <div style="font-size:48px;font-weight:700;color:${result.passed ? '#10B981' : 'var(--orange)'};margin:16px 0">${result.score}%</div>
        <p class="text-muted" style="margin-bottom:20px">Правильных ответов: ${result.correct} из ${result.total}</p>
        <div style="text-align:left;margin-bottom:24px">
          ${result.results.map(r => `
            <div style="padding:10px;margin-bottom:8px;background:${r.isCorrect ? '#F0FDF4' : '#FEF2F2'};border-radius:8px">
              <div style="font-size:13px;font-weight:500">${r.question}</div>
              <div style="font-size:12px;color:${r.isCorrect ? '#065F46' : '#991B1B'};margin-top:4px">
                ${r.isCorrect ? '✅' : '❌'} ${r.explanation || ''}
              </div>
            </div>
          `).join('')}
        </div>
        <div class="flex gap-12 justify-center">
          <button class="btn btn-primary" onclick="testAnswers=[];Router.go('test',{topicId:${topicId}})">🔄 Пройти снова</button>
          <button class="btn btn-secondary" onclick="history.back()">← Назад</button>
        </div>
      </div>
    `;
  } catch (err) {
    toast(err.message, 'error');
  }
}
