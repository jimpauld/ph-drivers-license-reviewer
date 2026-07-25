import { resolveTheme, applyTheme } from './theme.js';
import { createSession, answer, goTo, timeRemainingMs, isExpired, isWarning, result } from './exam-session.js';
import { createIndexedDBStorage } from './storage-idb.js';

const THEME_KEY = 'phdlr:theme';
const storage = createIndexedDBStorage();
let bank = null;
let session = null;
let timerId = null;

function getSystemPreference() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : null;
}

function currentTheme() {
  return resolveTheme(localStorage.getItem(THEME_KEY), getSystemPreference());
}

function setTheme(theme) {
  applyTheme(document, theme);
  localStorage.setItem(THEME_KEY, theme);
  updateToggle(theme);
}

function updateToggle(theme) {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;
  const label = toggle.querySelector('.theme-toggle-label');
  toggle.setAttribute('aria-pressed', String(theme === 'dark'));
  if (label) label.textContent = theme === 'dark' ? 'Light' : 'Dark';
}

function initTheme() {
  setTheme(currentTheme());
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => setTheme(currentTheme() === 'dark' ? 'light' : 'dark'));
  }
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_KEY)) setTheme(e.matches ? 'dark' : 'light');
    });
  }
}

async function loadBank() {
  const res = await fetch('questions.json');
  bank = await res.json();
}

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

function renderModeSelect() {
  const main = document.getElementById('app-main');
  main.innerHTML = '';
  const modes = [
    { id: 'student', label: 'Student Permit', desc: '25 questions, 80% to pass, 25 min' },
    { id: 'non-pro-40', label: 'Non-Professional (40)', desc: '40 questions, 75% to pass, 40 min', default: true },
    { id: 'non-pro-60', label: 'Non-Professional (60)', desc: '60 questions, 75% to pass, 60 min' },
    { id: 'pro', label: 'Professional', desc: '60 questions, 75% to pass, 60 min' }
  ];
  const cards = modes.map((m) =>
    el('button', { class: 'mode-card', onclick: () => startExam(m.id) },
      el('span', { class: 'mode-card-title' },
        m.label,
        m.default ? el('span', { class: 'mode-card-badge', text: 'Default' }) : null
      ),
      el('span', { class: 'mode-card-desc', text: m.desc })
    )
  );
  main.append(
    el('section', { class: 'screen' },
      el('h2', { class: 'screen-title', text: 'Choose an exam mode' }),
      el('p', { class: 'screen-sub', text: 'Mimics the real LTO theoretical exam format.' }),
      el('div', { class: 'mode-grid' }, ...cards)
    )
  );
}

async function startExam(mode) {
  const seed = Math.floor(Math.random() * 1e9);
  session = createSession(bank, mode, seed);
  await storage.saveResume(resumeState());
  renderQuiz();
  startTimer();
}

function resumeState() {
  return {
    mode: session.mode,
    seed: session.seed,
    currentIndex: session.currentIndex,
    answers: session.answers,
    timeRemainingMs: timeRemainingMs(session, Date.now()),
    questionIds: session.questions.map((q) => q.id)
  };
}

function startTimer() {
  stopTimer();
  timerId = setInterval(() => {
    const now = Date.now();
    updateTimerDisplay(now);
    if (isExpired(session, now)) {
      stopTimer();
      finishExam();
    }
  }, 1000);
}

function stopTimer() {
  if (timerId) { clearInterval(timerId); timerId = null; }
}

function formatTime(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function renderQuiz() {
  const main = document.getElementById('app-main');
  main.innerHTML = '';
  const q = session.questions[session.currentIndex];
  const answered = session.answers[session.currentIndex];

  const options = q.options.map((opt, i) =>
    el('button', {
      class: 'option' + (answered === i ? ' selected' : ''),
      onclick: () => selectOption(i)
    }, el('span', { class: 'option-letter', text: String.fromCharCode(65 + i) }), el('span', { text: opt }))
  );

  const progress = el('div', { class: 'progress' },
    el('span', { text: `Question ${session.currentIndex + 1} of ${session.questions.length}` }),
    el('span', { id: 'timer', class: 'timer', text: formatTime(timeRemainingMs(session, Date.now())) })
  );

  const nav = el('div', { class: 'quiz-nav' },
    el('button', { class: 'btn btn-secondary', onclick: prevQuestion, disabled: session.currentIndex === 0 ? '' : null }, 'Previous'),
    el('span', { class: 'quiz-dots', id: 'quiz-dots' }),
    el('button', { class: 'btn btn-primary', onclick: nextQuestion, disabled: session.currentIndex === session.questions.length - 1 ? '' : null }, 'Next')
  );

  const submit = el('button', { class: 'btn btn-submit', onclick: finishExam }, 'Submit exam');

  main.append(
    el('section', { class: 'screen quiz' },
      progress,
      el('div', { class: 'question' },
        q.image ? el('img', { class: 'question-image', src: q.image, alt: '' }) : null,
        el('p', { class: 'question-text', text: q.question })
      ),
      el('div', { class: 'options' }, ...options),
      nav,
      submit
    )
  );
  renderDots();
  updateTimerDisplay(Date.now());
}

function renderDots() {
  const dots = document.getElementById('quiz-dots');
  if (!dots) return;
  dots.innerHTML = '';
  for (let i = 0; i < session.questions.length; i++) {
    const dot = el('span', { class: 'dot' + (i === session.currentIndex ? ' current' : '') + (session.answers[i] !== null ? ' answered' : '') });
    dots.append(dot);
  }
}

function commit() {
  storage.saveResume(resumeState());
  renderQuiz();
}

function selectOption(i) {
  session = answer(session, i);
  commit();
}

function prevQuestion() {
  session = goTo(session, session.currentIndex - 1);
  commit();
}

function nextQuestion() {
  session = goTo(session, session.currentIndex + 1);
  commit();
}

function updateTimerDisplay(now) {
  const timer = document.getElementById('timer');
  if (!timer) return;
  const remaining = timeRemainingMs(session, now);
  timer.textContent = formatTime(remaining);
  timer.classList.toggle('warning', isWarning(session, now));
}

async function finishExam() {
  stopTimer();
  const r = result(session);
  const exam = {
    mode: session.mode,
    startedAt: session.startedAt,
    finishedAt: Date.now(),
    score: r.score,
    passingScore: r.passingScore,
    passed: r.passed,
    correct: r.correct,
    total: r.total,
    answers: session.answers.map((a, i) => ({ questionId: session.questions[i].id, selected: a, correct: a === session.questions[i].correct })),
    byCategory: r.byCategory
  };
  await storage.saveExam(exam);
  await storage.clearResume();
  renderResults(r);
}

function renderResults(r) {
  const main = document.getElementById('app-main');
  main.innerHTML = '';
  const pct = Math.round(r.score * 100);
  const passPct = Math.round(r.passingScore * 100);

  const categoryRows = Object.entries(r.byCategory).map(([cat, stats]) =>
    el('div', { class: 'cat-row' },
      el('span', { class: 'cat-name', text: cat }),
      el('span', { class: 'cat-score', text: `${stats.correct}/${stats.total}` })
    )
  );

  main.append(
    el('section', { class: 'screen results' },
      el('div', { class: 'result-banner ' + (r.passed ? 'pass' : 'fail') },
        el('span', { class: 'result-status', text: r.passed ? 'PASSED' : 'FAILED' }),
        el('span', { class: 'result-score', text: `${r.correct}/${r.total} (${pct}%)` }),
        el('span', { class: 'result-threshold', text: `Passing: ${passPct}%` })
      ),
      el('h3', { class: 'results-section-title', text: 'Score by category' }),
      el('div', { class: 'cat-list' }, ...categoryRows),
      el('div', { class: 'results-actions' },
        el('button', { class: 'btn btn-primary', onclick: renderModeSelect }, 'Take another exam')
      )
    )
  );
}

async function init() {
  initTheme();
  await loadBank();
  const resumed = await storage.loadResume();
  if (resumed && resumed.questionIds && resumed.questionIds.length > 0) {
    session = createSession(bank, resumed.mode, resumed.seed);
    const idsMatch = resumed.questionIds.length === session.questions.length
      && resumed.questionIds.every((id, i) => session.questions[i].id === id);
    if (idsMatch) {
      session = goTo(session, resumed.currentIndex);
      for (let i = 0; i < session.answers.length; i++) {
        if (resumed.answers[i] !== null && resumed.answers[i] !== undefined) {
          session = goTo(session, i);
          session = answer(session, resumed.answers[i]);
        }
      }
      session = goTo(session, resumed.currentIndex);
      session.startedAt = Date.now() - (session.config.timerMinutes * 60 * 1000 - resumed.timeRemainingMs);
      renderQuiz();
      startTimer();
    } else {
      await storage.clearResume();
      renderModeSelect();
    }
  } else {
    renderModeSelect();
  }
}

if (typeof window !== 'undefined') {
  init();
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
}
