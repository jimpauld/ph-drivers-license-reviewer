import { selectQuestions, modeConfig, scoreExam } from './quiz-engine.js';

const MS_PER_MINUTE = 60 * 1000;
const WARNING_WINDOW_MS = 5 * MS_PER_MINUTE;

export function createSession(bank, mode, seed) {
  const config = modeConfig(mode);
  const questions = selectQuestions(bank, mode, seed);
  return {
    mode,
    seed,
    config,
    questions,
    answers: new Array(questions.length).fill(null),
    currentIndex: 0,
    startedAt: Date.now()
  };
}

export function answer(session, optionIndex) {
  const answers = [...session.answers];
  answers[session.currentIndex] = optionIndex;
  return { ...session, answers };
}

export function goTo(session, index) {
  const clamped = Math.max(0, Math.min(index, session.questions.length - 1));
  return { ...session, currentIndex: clamped };
}

export function isComplete(session) {
  return session.answers.every((a) => a !== null);
}

export function timeRemainingMs(session, now) {
  const total = session.config.timerMinutes * MS_PER_MINUTE;
  const elapsed = now - session.startedAt;
  return Math.max(0, total - elapsed);
}

export function isExpired(session, now) {
  return timeRemainingMs(session, now) <= 0;
}

export function isWarning(session, now) {
  const remaining = timeRemainingMs(session, now);
  return remaining > 0 && remaining <= WARNING_WINDOW_MS;
}

export function result(session) {
  return scoreExam(session.answers, session.questions, session.config.passingScore);
}
