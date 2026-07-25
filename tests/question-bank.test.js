import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import { selectQuestions, pickCategory, scoreExam } from '../src/quiz-engine.js';

const raw = fs.readFileSync(new URL('../questions.json', import.meta.url), 'utf8');
const bank = JSON.parse(raw);

const CATEGORIES = [
  'road-signs', 'traffic-rules', 'speed-limits', 'defensive-driving',
  'licensing', 'vehicle-equipment', 'penalties', 'republic-acts',
  'vehicle-registration', 'expressway'
];

test('questions.json has the required top-level fields', () => {
  assert.equal(typeof bank.version, 'string');
  assert.equal(bank.language, 'en');
  assert.ok(Array.isArray(bank.questions));
});

test('every question matches the schema', () => {
  for (const q of bank.questions) {
    assert.ok(typeof q.id === 'string' && q.id.length > 0, `id: ${q.id}`);
    assert.ok(CATEGORIES.includes(q.category), `category: ${q.category}`);
    assert.equal(typeof q.subcategory, 'string');
    assert.ok(['easy', 'medium', 'hard'].includes(q.difficulty), `difficulty: ${q.difficulty}`);
    assert.equal(typeof q.question, 'string');
    assert.ok(q.question.length > 0);
    assert.ok(Array.isArray(q.options) && q.options.length === 4, 'options must have 4 entries');
    assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 4);
    assert.equal(typeof q.explanation, 'string');
    assert.equal(typeof q.source, 'string');
    if ('sourceUrl' in q) assert.equal(typeof q.sourceUrl, 'string');
    if ('image' in q) assert.equal(typeof q.image, 'string');
  }
});

test('question ids are unique', () => {
  const ids = bank.questions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('sample bank spans multiple categories', () => {
  const used = new Set(bank.questions.map((q) => q.category));
  assert.ok(used.size >= 6, `only ${used.size} categories`);
});

test('the sample bank can drive a full student exam', () => {
  const selected = selectQuestions(bank, 'student', 1);
  assert.ok(selected.length > 0);
  assert.ok(selected.length <= 25);
});

test('pickCategory works against the sample bank', () => {
  const signs = pickCategory(bank, 'road-signs', 3, 1);
  assert.ok(signs.every((q) => q.category === 'road-signs'));
});

test('scoreExam works against the sample bank', () => {
  const selected = selectQuestions(bank, 'student', 1);
  const answers = selected.map((q) => q.correct);
  const result = scoreExam(answers, selected, 0.80);
  assert.equal(result.correct, selected.length);
  assert.equal(result.passed, true);
});
