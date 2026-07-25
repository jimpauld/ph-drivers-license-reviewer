import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { pickCategory, selectQuestions, scoreExam } from '../src/quiz-engine.js';

function makeBank(counts) {
  const questions = [];
  let n = 0;
  for (const [category, num] of Object.entries(counts)) {
    for (let i = 0; i < num; i++) {
      n++;
      questions.push({
        id: `q-${category}-${i}`,
        category,
        subcategory: 'general',
        difficulty: 'easy',
        question: `Question ${n} for ${category}`,
        options: ['A', 'B', 'C', 'D'],
        correct: 0,
        explanation: 'because',
        source: 'test'
      });
    }
  }
  return { version: '1.0.0', language: 'en', questions };
}

test('pickCategory returns up to count questions from one category', () => {
  const bank = makeBank({ 'road-signs': 10, 'penalties': 5 });
  const picked = pickCategory(bank, 'road-signs', 4, 1);
  assert.equal(picked.length, 4);
  assert.ok(picked.every((q) => q.category === 'road-signs'));
});

test('pickCategory returns all available when fewer than count', () => {
  const bank = makeBank({ 'road-signs': 3 });
  const picked = pickCategory(bank, 'road-signs', 10, 1);
  assert.equal(picked.length, 3);
});

test('pickCategory is deterministic for the same seed', () => {
  const bank = makeBank({ 'road-signs': 12 });
  assert.deepEqual(pickCategory(bank, 'road-signs', 5, 99), pickCategory(bank, 'road-signs', 5, 99));
});

test('pickCategory returns empty for an unknown category', () => {
  const bank = makeBank({ 'road-signs': 5 });
  assert.deepEqual(pickCategory(bank, 'nope', 5, 1), []);
});

test('selectQuestions returns exactly modeConfig.questions when the bank is large enough', () => {
  const bank = makeBank({
    'road-signs': 60, 'traffic-rules': 40, 'speed-limits': 30,
    'defensive-driving': 30, 'licensing': 30, 'vehicle-equipment': 20,
    'penalties': 30, 'republic-acts': 20, 'vehicle-registration': 20, 'expressway': 10
  });
  const selected = selectQuestions(bank, 'student', 1);
  assert.equal(selected.length, 25);
});

test('selectQuestions is deterministic for the same seed', () => {
  const bank = makeBank({
    'road-signs': 60, 'traffic-rules': 40, 'speed-limits': 30,
    'defensive-driving': 30, 'licensing': 30, 'vehicle-equipment': 20,
    'penalties': 30, 'republic-acts': 20, 'vehicle-registration': 20, 'expressway': 10
  });
  assert.deepEqual(selectQuestions(bank, 'pro', 7), selectQuestions(bank, 'pro', 7));
});

test('selectQuestions returns no duplicates', () => {
  const bank = makeBank({
    'road-signs': 60, 'traffic-rules': 40, 'speed-limits': 30,
    'defensive-driving': 30, 'licensing': 30, 'vehicle-equipment': 20,
    'penalties': 30, 'republic-acts': 20, 'vehicle-registration': 20, 'expressway': 10
  });
  const selected = selectQuestions(bank, 'non-pro-60', 3);
  const ids = selected.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('selectQuestions returns all available when the bank is smaller than the mode length', () => {
  const bank = makeBank({ 'road-signs': 5, 'penalties': 5 });
  const selected = selectQuestions(bank, 'pro', 1);
  assert.equal(selected.length, 10);
});

test('selectQuestions respects topic weighting (student over-weights road-signs)', () => {
  const bank = makeBank({
    'road-signs': 60, 'traffic-rules': 40, 'speed-limits': 30,
    'defensive-driving': 30, 'licensing': 30, 'vehicle-equipment': 20,
    'penalties': 30, 'republic-acts': 20, 'vehicle-registration': 20, 'expressway': 10
  });
  const student = selectQuestions(bank, 'student', 42);
  const pro = selectQuestions(bank, 'pro', 42);
  const studentSignShare = student.filter((q) => q.category === 'road-signs').length / student.length;
  const proSignShare = pro.filter((q) => q.category === 'road-signs').length / pro.length;
  assert.ok(studentSignShare > proSignShare, `student sign share ${studentSignShare} should exceed pro ${proSignShare}`);
});

test('scoreExam computes score, per-category breakdown, and pass/fail', () => {
  const questions = [
    { id: 'q1', category: 'road-signs', correct: 0 },
    { id: 'q2', category: 'road-signs', correct: 1 },
    { id: 'q3', category: 'penalties', correct: 2 }
  ];
  const answers = [0, 1, 0];
  const result = scoreExam(answers, questions, 0.75);
  assert.equal(result.total, 3);
  assert.equal(result.correct, 2);
  assert.equal(result.score, 2 / 3);
  assert.deepEqual(result.byCategory, {
    'road-signs': { correct: 2, total: 2 },
    'penalties': { correct: 0, total: 1 }
  });
  assert.equal(result.passed, false);
});

test('scoreExam reports passed=true when score meets the threshold', () => {
  const questions = [
    { id: 'q1', category: 'road-signs', correct: 0 },
    { id: 'q2', category: 'road-signs', correct: 1 }
  ];
  const answers = [0, 1];
  const result = scoreExam(answers, questions, 0.75);
  assert.equal(result.correct, 2);
  assert.equal(result.passed, true);
});

test('scoreExam treats a null answer as incorrect', () => {
  const questions = [{ id: 'q1', category: 'road-signs', correct: 0 }];
  const result = scoreExam([null], questions, 0.75);
  assert.equal(result.correct, 0);
  assert.equal(result.passed, false);
});
