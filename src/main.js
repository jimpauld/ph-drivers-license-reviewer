import { resolveTheme, applyTheme } from './theme.js';
import { createSession, answer, goTo, timeRemainingMs, isExpired, isWarning, result } from './exam-session.js';
import { createPracticeSession, answer as practiceAnswer, next as practiceNext, wrongAnswers as practiceWrong } from './practice-session.js';
import { buildIssueUrl, buildFlagPayload } from './report.js';
import { createIndexedDBStorage } from './storage-idb.js';

const THEME_KEY = 'phdlr:theme';
const REPO = 'jimpauld/ph-drivers-license-reviewer';
const APP_VERSION = '1.0.0';
const storage = createIndexedDBStorage();
let bank = null;
let session = null;
let practice = null;
let timerId = null;
let pendingResume = null;

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

function renderSourceLink(question) {
  if (question.sourceUrl) {
    return el('a', { class: 'feedback-source', href: question.sourceUrl, target: '_blank', rel: 'noopener noreferrer', text: `Show source: ${question.source}` });
  }
  return el('p', { class: 'feedback-source', text: `Source: ${question.source}` });
}

const svgCache = new Map();
function inlineSvg(src) {
  const container = el('div', { class: 'question-image' });
  if (svgCache.has(src)) {
    container.innerHTML = svgCache.get(src);
  } else {
    fetch(src).then((r) => r.text()).then((svg) => {
      svgCache.set(src, svg);
      container.innerHTML = svg;
    }).catch(() => {});
  }
  return container;
}

function renderQuestionActions(question, selected) {
  return el('div', { class: 'question-actions' },
    el('button', { class: 'question-action-btn', onclick: () => openFlagModal(question, selected) }, 'Flag this question'),
    el('button', { class: 'question-action-btn', onclick: () => toggleBookmark(question) }, 'Bookmark')
  );
}

const MODE_LABELS = {
  student: 'Student Permit',
  'non-pro-40': 'Non-Professional (40)',
  'non-pro-60': 'Non-Professional (60)',
  pro: 'Professional'
};

function modeLabel(mode) {
  return MODE_LABELS[mode] || mode.replace(/-/g, ' ');
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
        q.image ? inlineSvg(q.image) : null,
        el('p', { class: 'question-text', text: q.question }),
        renderQuestionActions(q, session.answers[session.currentIndex])
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
        el('button', { class: 'btn btn-primary', onclick: renderModeSelect }, 'Take another exam'),
        el('button', { class: 'btn btn-secondary', onclick: renderHome }, 'Home')
      )
    )
  );
}

function openFlagModal(question, selected) {
  const existing = document.getElementById('flag-modal');
  if (existing) existing.remove();
  const modal = el('div', { id: 'flag-modal', class: 'modal-overlay', onclick: (e) => { if (e.target === modal) modal.remove(); } },
    el('div', { class: 'modal' },
      el('h3', { class: 'modal-title', text: 'Flag this question' }),
      el('p', { class: 'modal-sub', text: question.question }),
      el('label', { class: 'modal-label', for: 'flag-feedback', text: 'What\'s wrong?' }),
      el('textarea', { id: 'flag-feedback', class: 'modal-textarea', rows: 3, placeholder: 'e.g. the correct answer is wrong, the explanation is unclear...' }),
      el('div', { class: 'modal-actions' },
        el('button', { class: 'btn btn-secondary', onclick: () => modal.remove() }, 'Cancel'),
        el('button', { class: 'btn btn-primary', onclick: () => submitFlag(question, selected, modal) }, 'Report via GitHub'),
        el('button', { class: 'btn btn-secondary', onclick: () => saveFlagLocal(question, selected, modal) }, 'Save locally')
      )
    )
  );
  document.body.append(modal);
  document.getElementById('flag-feedback').focus();
}

async function submitFlag(question, selected, modal) {
  const feedback = document.getElementById('flag-feedback').value.trim();
  await storage.flagQuestion(buildFlagPayload(question, { selected, feedback, appVersion: APP_VERSION }));
  const url = buildIssueUrl(REPO, question, { selected, feedback, appVersion: APP_VERSION });
  modal.remove();
  window.open(url, '_blank', 'noopener,noreferrer');
}

async function saveFlagLocal(question, selected, modal) {
  const feedback = document.getElementById('flag-feedback').value.trim();
  await storage.flagQuestion(buildFlagPayload(question, { selected, feedback, appVersion: APP_VERSION }));
  modal.remove();
  toast('Saved locally');
}

async function downloadReports() {
  const blob = await storage.exportFlags();
  const json = JSON.stringify(blob, null, 2);
  const a = el('a');
  a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download = `phdlr-flags-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(a);
  a.click();
  a.remove();
}

function toast(message) {
  const t = el('div', { class: 'toast', text: message });
  document.body.append(t);
  setTimeout(() => t.remove(), 2000);
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
      pendingResume = resumed;
    } else {
      await storage.clearResume();
    }
  }
  session = null;
  renderHome();
}

async function resumeExam() {
  const resumed = pendingResume;
  if (!resumed) return;
  session = createSession(bank, resumed.mode, resumed.seed);
  session = goTo(session, resumed.currentIndex);
  for (let i = 0; i < session.answers.length; i++) {
    if (resumed.answers[i] !== null && resumed.answers[i] !== undefined) {
      session = goTo(session, i);
      session = answer(session, resumed.answers[i]);
    }
  }
  session = goTo(session, resumed.currentIndex);
  session.startedAt = Date.now() - (session.config.timerMinutes * 60 * 1000 - resumed.timeRemainingMs);
  pendingResume = null;
  renderQuiz();
  startTimer();
}

async function discardResume() {
  pendingResume = null;
  await storage.clearResume();
  renderHome();
}

function renderHome() {
  const main = document.getElementById('app-main');
  main.innerHTML = '';
  const children = [
    el('h2', { class: 'screen-title', text: 'PH Driver\'s License Reviewer' }),
    el('p', { class: 'screen-sub', text: 'Practice the Philippine LTO theoretical driving exam. No account. No tracking. Works offline.' })
  ];
  if (pendingResume) {
    children.push(
      el('div', { class: 'resume-prompt' },
        el('span', { class: 'resume-text', text: 'You have an interrupted exam.' }),
        el('div', { class: 'resume-actions' },
          el('button', { class: 'btn btn-primary', onclick: resumeExam }, 'Resume'),
          el('button', { class: 'btn btn-secondary', onclick: discardResume }, 'Discard')
        )
      )
    );
  }
  children.push(
    el('div', { class: 'mode-grid' },
      el('button', { class: 'mode-card', onclick: renderModeSelect },
        el('span', { class: 'mode-card-title', text: 'Mock Exam' }),
        el('span', { class: 'mode-card-desc', text: 'Timed, graded, mimics the real LTO exam format.' })
      ),
      el('button', { class: 'mode-card', onclick: renderCategorySelect },
        el('span', { class: 'mode-card-title', text: 'Practice by Category' }),
        el('span', { class: 'mode-card-desc', text: 'Untimed, with explanations and source links.' })
      )
    ),
    el('div', { class: 'home-links' },
      el('button', { class: 'link-btn', onclick: renderHistory }, 'Exam history'),
      el('button', { class: 'link-btn', onclick: renderBookmarks }, 'Bookmarks'),
      el('button', { class: 'link-btn', onclick: downloadReports }, 'Download my reports')
    )
  );
  main.append(el('section', { class: 'screen' }, ...children));
}

function categoriesInBank() {
  const counts = {};
  for (const q of bank.questions) {
    counts[q.category] = (counts[q.category] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
}

async function renderHistory() {
  const main = document.getElementById('app-main');
  main.innerHTML = '';
  const history = await storage.getHistory();
  const items = history.length === 0
    ? [el('p', { class: 'screen-sub', text: 'No exams yet. Take a mock exam to see your history here.' })]
    : history.map((exam) =>
      el('div', { class: 'history-item' },
        el('div', { class: 'history-row' },
          el('span', { class: 'history-mode', text: modeLabel(exam.mode) }),
          el('span', { class: 'history-badge ' + (exam.passed ? 'pass' : 'fail'), text: exam.passed ? 'PASS' : 'FAIL' })
        ),
        el('div', { class: 'history-row history-meta' },
          el('span', { text: `${exam.correct}/${exam.total} (${Math.round(exam.score * 100)}%)` }),
          el('span', { text: new Date(exam.finishedAt).toLocaleString() })
        )
      )
    );
  main.append(
    el('section', { class: 'screen' },
      el('button', { class: 'back-link', onclick: renderHome, text: '← Back' }),
      el('h2', { class: 'screen-title', text: 'Exam history' }),
      el('div', { class: 'history-list' }, ...items)
    )
  );
}

async function renderBookmarks() {
  const main = document.getElementById('app-main');
  main.innerHTML = '';
  const bookmarks = await storage.getBookmarks();
  const items = bookmarks.length === 0
    ? [el('p', { class: 'screen-sub', text: 'No bookmarks yet. Tap the bookmark button on a question to save it here.' })]
    : bookmarks.map((bm) => {
      const q = bank.questions.find((x) => x.id === bm.questionId) || { question: `(missing) ${bm.questionId}`, options: [] };
      return el('div', { class: 'review-item' },
        el('p', { class: 'review-question', text: q.question }),
        el('button', { class: 'link-btn', onclick: () => removeBookmark(bm.questionId) }, 'Remove bookmark')
      );
    });
  main.append(
    el('section', { class: 'screen' },
      el('button', { class: 'back-link', onclick: renderHome, text: '← Back' }),
      el('h2', { class: 'screen-title', text: 'Bookmarks' }),
      el('div', { class: 'review-list' }, ...items)
    )
  );
}

async function toggleBookmark(question) {
  const bookmarks = await storage.getBookmarks();
  const exists = bookmarks.some((b) => b.questionId === question.id);
  if (exists) {
    await storage.removeBookmark(question.id);
    toast('Bookmark removed');
  } else {
    await storage.addBookmark({ questionId: question.id, at: Date.now() });
    toast('Bookmarked');
  }
}

async function removeBookmark(questionId) {
  await storage.removeBookmark(questionId);
  renderBookmarks();
}

function renderCategorySelect() {
  const main = document.getElementById('app-main');
  main.innerHTML = '';
  const cats = categoriesInBank();
  const cards = cats.map(([cat, count]) =>
    el('button', { class: 'mode-card', onclick: () => startPractice(cat) },
      el('span', { class: 'mode-card-title', text: cat.replace(/-/g, ' ') }),
      el('span', { class: 'mode-card-desc', text: `${count} question${count === 1 ? '' : 's'}` })
    )
  );
  main.append(
    el('section', { class: 'screen' },
      el('button', { class: 'back-link', onclick: renderHome, text: '← Back' }),
      el('h2', { class: 'screen-title', text: 'Choose a category' }),
      el('p', { class: 'screen-sub', text: 'Practice one topic at a time, untimed, with explanations.' }),
      el('div', { class: 'mode-grid' }, ...cards)
    )
  );
}

function startPractice(category) {
  const seed = Math.floor(Math.random() * 1e9);
  practice = createPracticeSession(bank, category, 10, seed);
  renderPractice();
}

function renderPractice() {
  const main = document.getElementById('app-main');
  main.innerHTML = '';
  const q = practice.questions[practice.currentIndex];
  const selected = practice.answers[practice.currentIndex];
  const answered = selected !== null;

  const options = q.options.map((opt, i) => {
    let cls = 'option';
    if (answered) {
      if (i === q.correct) cls += ' correct';
      else if (i === selected) cls += ' incorrect';
      else cls += ' dimmed';
    } else if (selected === i) {
      cls += ' selected';
    }
    return el('button', { class: cls, disabled: answered ? '' : null, onclick: () => selectPractice(i) },
      el('span', { class: 'option-letter', text: String.fromCharCode(65 + i) }),
      el('span', { text: opt })
    );
  });

  const feedback = answered ? el('div', { class: 'feedback' },
    el('p', { class: 'feedback-correct', text: selected === q.correct ? 'Correct' : 'Incorrect' }),
    el('p', { class: 'feedback-explanation', text: q.explanation }),
    renderSourceLink(q)
  ) : null;

  const nav = el('div', { class: 'quiz-nav' },
    el('button', { class: 'btn btn-secondary', onclick: renderCategorySelect }, 'Exit'),
    el('span', { class: 'progress-text', text: `${practice.currentIndex + 1} / ${practice.questions.length}` }),
    el('button', { class: 'btn btn-submit', onclick: finishPractice }, 'Finish & review')
  );
  const nextBtn = practice.currentIndex < practice.questions.length - 1
    ? el('button', { class: 'btn btn-primary', onclick: nextPractice, disabled: answered ? null : '' }, 'Next')
    : null;
  if (nextBtn) nav.append(nextBtn);

  main.append(
    el('section', { class: 'screen quiz practice' },
      el('div', { class: 'progress' },
        el('span', { text: practice.category.replace(/-/g, ' ') })
      ),
      el('div', { class: 'question' },
        q.image ? inlineSvg(q.image) : null,
        el('p', { class: 'question-text', text: q.question }),
        renderQuestionActions(q, practice.answers[practice.currentIndex])
      ),
      el('div', { class: 'options' }, ...options),
      feedback,
      nav
    )
  );
}

function selectPractice(i) {
  practice = practiceAnswer(practice, i);
  renderPractice();
}

function nextPractice() {
  practice = practiceNext(practice);
  renderPractice();
}

function finishPractice() {
  const wrong = practiceWrong(practice);
  renderPracticeReview(wrong);
}

function renderPracticeReview(wrong) {
  const main = document.getElementById('app-main');
  main.innerHTML = '';
  const total = practice.questions.length;
  const answeredCorrect = practice.answers.reduce((acc, a, i) => acc + (a === practice.questions[i].correct ? 1 : 0), 0);
  const correctCount = answeredCorrect;
  const unanswered = practice.answers.filter((a) => a === null).length;

  const wrongItems = wrong.map((w) =>
    el('div', { class: 'review-item' },
      el('p', { class: 'review-question', text: w.question.question }),
      w.question.image ? inlineSvg(w.question.image) : null,
      el('p', { class: 'review-your-answer', text: `Your answer: ${w.question.options[w.selected]}` }),
      el('p', { class: 'review-correct-answer', text: `Correct: ${w.question.options[w.correct]}` }),
      el('p', { class: 'feedback-explanation', text: w.question.explanation }),
      renderSourceLink(w.question)
    )
  );

  main.append(
    el('section', { class: 'screen results' },
      el('div', { class: 'result-banner ' + (wrong.length === 0 && unanswered === 0 ? 'pass' : 'fail') },
        el('span', { class: 'result-status', text: wrong.length === 0 && unanswered === 0 ? 'ALL CORRECT' : 'REVIEW' }),
        el('span', { class: 'result-score', text: `${correctCount}/${total}` }),
        el('span', { class: 'result-threshold', text: `${wrong.length} incorrect${unanswered ? `, ${unanswered} unanswered` : ''}` })
      ),
      wrong.length === 0
        ? el('p', { class: 'screen-sub', text: 'Great job — no incorrect answers to review.' })
        : el('div', { class: 'review-list' }, ...wrongItems),
      el('div', { class: 'results-actions' },
        el('button', { class: 'btn btn-primary', onclick: renderCategorySelect }, 'Practice another category'),
        el('button', { class: 'btn btn-secondary', onclick: renderHome }, 'Home')
      )
    )
  );
}

if (typeof window !== 'undefined') {
  init();
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
}
