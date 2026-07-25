import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createPracticeSession, answer, next, isComplete, wrongAnswers } from '../src/practice-session.js';

function bankWith(category, count) {
  const questions = [];
  for (let i = 0; i < count; i++) {
    questions.push({
      id: `q-${category}-${i}`,
      category,
      subcategory: 'general',
      difficulty: 'easy',
      question: `Question ${i} for ${category}`,
      options: ['A', 'B', 'C', 'D'],
      correct: i % 4,
      explanation: `explanation ${i}`,
      source: `source ${i}`,
      sourceUrl: `https://example.com/${i}`
    });
  }
  return { version: '1.0.0', language: 'en', questions };
}

test('createPracticeSession selects up to count questions from one category', () => {
  const bank = bankWith('road-signs', 10);
  const s = createPracticeSession(bank, 'road-signs', 5, 1);
  assert.equal(s.questions.length, 5);
  assert.equal(s.category, 'road-signs');
  assert.equal(s.currentIndex, 0);
  assert.equal(s.answers.length, 5);
  assert.ok(s.answers.every((a) => a === null));
});

test('createPracticeSession returns all available when fewer than count', () => {
  const bank = bankWith('road-signs', 3);
  const s = createPracticeSession(bank, 'road-signs', 10, 1);
  assert.equal(s.questions.length, 3);
});

test('createPracticeSession is deterministic for the same seed', () => {
  const bank = bankWith('road-signs', 12);
  const a = createPracticeSession(bank, 'road-signs', 5, 99);
  const b = createPracticeSession(bank, 'road-signs', 5, 99);
  assert.deepEqual(a.questions.map((q) => q.id), b.questions.map((q) => q.id));
});

test('createPracticeSession has no timer config', () => {
  const bank = bankWith('road-signs', 5);
  const s = createPracticeSession(bank, 'road-signs', 5, 1);
  assert.equal(s.config, null);
});

test('answer records the selected option for the current question', () => {
  const bank = bankWith('road-signs', 5);
  const s = createPracticeSession(bank, 'road-signs', 5, 1);
  const updated = answer(s, 2);
  assert.equal(updated.answers[0], 2);
  assert.equal(updated.currentIndex, 0);
});

test('answer does not mutate the original session', () => {
  const bank = bankWith('road-signs', 5);
  const s = createPracticeSession(bank, 'road-signs', 5, 1);
  answer(s, 2);
  assert.equal(s.answers[0], null);
});

test('next advances the current index', () => {
  const bank = bankWith('road-signs', 5);
  const s = createPracticeSession(bank, 'road-signs', 5, 1);
  const s2 = next(s);
  assert.equal(s2.currentIndex, 1);
});

test('next clamps at the last question', () => {
  const bank = bankWith('road-signs', 5);
  const s = createPracticeSession(bank, 'road-signs', 5, 1);
  const atEnd = next(next(next(next(s))));
  const past = next(atEnd);
  assert.equal(past.currentIndex, s.questions.length - 1);
});

test('isComplete is true when every question is answered', () => {
  const bank = bankWith('road-signs', 3);
  let s = createPracticeSession(bank, 'road-signs', 3, 1);
  assert.equal(isComplete(s), false);
  s = answer(s, 0);
  s = next(s);
  s = answer(s, 1);
  s = next(s);
  s = answer(s, 2);
  assert.equal(isComplete(s), true);
});

test('wrongAnswers lists questions answered incorrectly with selected and correct', () => {
  const bank = bankWith('road-signs', 4);
  let s = createPracticeSession(bank, 'road-signs', 4, 1);
  s = answer(s, s.questions[0].correct);
  s = next(s);
  s = answer(s, (s.questions[1].correct + 1) % 4);
  s = next(s);
  s = answer(s, s.questions[2].correct);
  s = next(s);
  s = answer(s, (s.questions[3].correct + 1) % 4);
  const wrong = wrongAnswers(s);
  assert.equal(wrong.length, 2);
  assert.equal(wrong[0].question.id, s.questions[1].id);
  assert.equal(wrong[0].selected, (s.questions[1].correct + 1) % 4);
  assert.equal(wrong[0].correct, s.questions[1].correct);
  assert.equal(wrong[1].question.id, s.questions[3].id);
});

test('wrongAnswers is empty when all correct', () => {
  const bank = bankWith('road-signs', 3);
  let s = createPracticeSession(bank, 'road-signs', 3, 1);
  for (let i = 0; i < s.questions.length; i++) {
    s = answer(s, s.questions[i].correct);
    s = next(s);
  }
  assert.equal(wrongAnswers(s).length, 0);
});
