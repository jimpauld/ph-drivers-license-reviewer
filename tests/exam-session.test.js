import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createSession, answer, goTo, isComplete, timeRemainingMs, isExpired, isWarning, result } from '../src/exam-session.js';

function bigBank() {
  const cats = ['road-signs', 'traffic-rules', 'speed-limits', 'defensive-driving', 'licensing', 'vehicle-equipment', 'penalties', 'republic-acts', 'vehicle-registration', 'expressway'];
  const questions = [];
  let n = 0;
  for (const category of cats) {
    for (let i = 0; i < 15; i++) {
      n++;
      questions.push({
        id: `q-${category}-${i}`,
        category,
        subcategory: 'general',
        difficulty: 'easy',
        question: `Question ${n}`,
        options: ['A', 'B', 'C', 'D'],
        correct: i % 4,
        explanation: 'because',
        source: 'test'
      });
    }
  }
  return { version: '1.0.0', language: 'en', questions };
}

test('createSession selects the right number of questions for the mode', () => {
  const bank = bigBank();
  const s = createSession(bank, 'student', 1);
  assert.equal(s.questions.length, 25);
  assert.equal(s.mode, 'student');
  assert.equal(s.currentIndex, 0);
  assert.equal(s.answers.length, 25);
  assert.ok(s.answers.every((a) => a === null));
});

test('createSession captures config and seed', () => {
  const bank = bigBank();
  const s = createSession(bank, 'pro', 7);
  assert.equal(s.config.questions, 60);
  assert.equal(s.config.passingScore, 0.75);
  assert.equal(s.config.timerMinutes, 60);
  assert.equal(s.seed, 7);
});

test('answer records the selected option for the current question', () => {
  const bank = bigBank();
  const s = createSession(bank, 'student', 1);
  const updated = answer(s, 2);
  assert.equal(updated.answers[0], 2);
  assert.equal(updated.currentIndex, 0);
});

test('answer does not mutate the original session', () => {
  const bank = bigBank();
  const s = createSession(bank, 'student', 1);
  answer(s, 2);
  assert.equal(s.answers[0], null);
});

test('goTo moves the current index within bounds', () => {
  const bank = bigBank();
  const s = createSession(bank, 'student', 1);
  const s2 = goTo(s, 5);
  assert.equal(s2.currentIndex, 5);
  const s3 = goTo(s2, 0);
  assert.equal(s3.currentIndex, 0);
});

test('goTo clamps to valid range', () => {
  const bank = bigBank();
  const s = createSession(bank, 'student', 1);
  assert.equal(goTo(s, -1).currentIndex, 0);
  assert.equal(goTo(s, 999).currentIndex, s.questions.length - 1);
});

test('isComplete is true when every question is answered', () => {
  const bank = bigBank();
  let s = createSession(bank, 'student', 1);
  assert.equal(isComplete(s), false);
  for (let i = 0; i < s.questions.length; i++) {
    s = answer(goTo(s, i), 0);
  }
  assert.equal(isComplete(s), true);
});

test('timeRemainingMs computes remaining from startedAt and config', () => {
  const bank = bigBank();
  const startedAt = 1000000;
  const s = { ...createSession(bank, 'student', 1), startedAt };
  assert.equal(timeRemainingMs(s, startedAt + 10000), 25 * 60 * 1000 - 10000);
});

test('isExpired is true when time runs out', () => {
  const bank = bigBank();
  const startedAt = 1000000;
  const s = { ...createSession(bank, 'student', 1), startedAt };
  assert.equal(isExpired(s, startedAt + 25 * 60 * 1000), true);
  assert.equal(isExpired(s, startedAt + 25 * 60 * 1000 - 1), false);
});

test('isWarning is true in the last 5 minutes', () => {
  const bank = bigBank();
  const startedAt = 1000000;
  const s = { ...createSession(bank, 'student', 1), startedAt };
  const totalMs = 25 * 60 * 1000;
  assert.equal(isWarning(s, startedAt + totalMs - 10 * 60 * 1000), false);
  assert.equal(isWarning(s, startedAt + totalMs - 5 * 60 * 1000), true);
  assert.equal(isWarning(s, startedAt + totalMs - 5 * 60 * 1000 - 1), false);
  assert.equal(isWarning(s, startedAt + totalMs - 1), true);
});

test('result scores the exam and reports pass/fail with per-category breakdown', () => {
  const bank = bigBank();
  let s = createSession(bank, 'student', 1);
  for (let i = 0; i < s.questions.length; i++) {
    s = answer(goTo(s, i), s.questions[i].correct);
  }
  const r = result(s);
  assert.equal(r.total, 25);
  assert.equal(r.correct, 25);
  assert.equal(r.passed, true);
  assert.ok(r.byCategory['road-signs']);
});

test('result reports failed when below threshold', () => {
  const bank = bigBank();
  let s = createSession(bank, 'student', 1);
  for (let i = 0; i < s.questions.length; i++) {
    s = answer(goTo(s, i), (s.questions[i].correct + 1) % 4);
  }
  const r = result(s);
  assert.equal(r.correct, 0);
  assert.equal(r.passed, false);
});
