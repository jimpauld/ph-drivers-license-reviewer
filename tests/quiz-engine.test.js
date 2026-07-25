import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { shuffle, modeConfig, weightTopics } from '../src/quiz-engine.js';

test('shuffle returns a new array with the same elements', () => {
  const input = [1, 2, 3, 4, 5];
  const out = shuffle(input, 123);
  assert.notEqual(out, input);
  assert.equal(out.length, input.length);
  assert.deepEqual(out.slice().sort((a, b) => a - b), input);
});

test('shuffle is deterministic for the same seed', () => {
  const input = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  assert.deepEqual(shuffle(input, 42), shuffle(input, 42));
});

test('shuffle with different seeds usually differs', () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  assert.notDeepEqual(shuffle(input, 1), shuffle(input, 2));
});

test('shuffle does not mutate the input', () => {
  const input = [1, 2, 3];
  const snapshot = [...input];
  shuffle(input, 7);
  assert.deepEqual(input, snapshot);
});

test('modeConfig returns the right shape for every mode', () => {
  const student = modeConfig('student');
  assert.equal(student.questions, 25);
  assert.equal(student.passingScore, 0.80);
  assert.equal(student.timerMinutes, 25);

  const np40 = modeConfig('non-pro-40');
  assert.equal(np40.questions, 40);
  assert.equal(np40.passingScore, 0.75);
  assert.equal(np40.timerMinutes, 40);

  const np60 = modeConfig('non-pro-60');
  assert.equal(np60.questions, 60);
  assert.equal(np60.passingScore, 0.75);
  assert.equal(np60.timerMinutes, 60);

  const pro = modeConfig('pro');
  assert.equal(pro.questions, 60);
  assert.equal(pro.passingScore, 0.75);
  assert.equal(pro.timerMinutes, 60);
});

test('modeConfig throws on unknown mode', () => {
  assert.throws(() => modeConfig('motorcycle'), /unknown mode/);
});

test('weightTopics returns weights that sum to 1 for every mode', () => {
  for (const mode of ['student', 'non-pro-40', 'non-pro-60', 'pro']) {
    const w = weightTopics(mode);
    const sum = Object.values(w).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 1e-9, `${mode} weights sum to ${sum}, expected 1`);
  }
});

test('weightTopics skews student toward signs and basic rules', () => {
  const s = weightTopics('student');
  const p = weightTopics('pro');
  assert.ok(s['road-signs'] > p['road-signs'], 'student weights road-signs higher than pro');
  assert.ok(s['traffic-rules'] >= p['traffic-rules'], 'student weights traffic-rules at least as high as pro');
});

test('weightTopics skews pro toward RAs, registration, and penalties', () => {
  const s = weightTopics('student');
  const p = weightTopics('pro');
  assert.ok(p['republic-acts'] > s['republic-acts'], 'pro weights republic-acts higher than student');
  assert.ok(p['penalties'] > s['penalties'], 'pro weights penalties higher than student');
  assert.ok(p['vehicle-registration'] > s['vehicle-registration'], 'pro weights vehicle-registration higher than student');
});
