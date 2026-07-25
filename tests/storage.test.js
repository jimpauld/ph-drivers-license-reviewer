import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createMemoryStorage } from '../src/storage-memory.js';

function sampleExam(n) {
  return {
    id: `exam-${n}`,
    mode: 'student',
    startedAt: 1700000000000 + n,
    finishedAt: 1700000000000 + n + 60000,
    score: 0.8,
    passingScore: 0.8,
    passed: true,
    answers: [{ questionId: 'q-001', selected: 0, correct: true }],
    byCategory: { 'road-signs': { correct: 1, total: 1 } }
  };
}

test('saveExam stores an exam and getHistory returns it', async () => {
  const s = createMemoryStorage();
  await s.saveExam(sampleExam(1));
  const history = await s.getHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].id, 'exam-1');
});

test('saveExam generates an id when none is provided', async () => {
  const s = createMemoryStorage();
  const exam = sampleExam(1);
  delete exam.id;
  await s.saveExam(exam);
  const history = await s.getHistory();
  assert.equal(history.length, 1);
  assert.ok(typeof history[0].id === 'string' && history[0].id.length > 0);
});

test('getHistory returns exams newest-first', async () => {
  const s = createMemoryStorage();
  await s.saveExam(sampleExam(1));
  await s.saveExam(sampleExam(2));
  const history = await s.getHistory();
  assert.equal(history[0].id, 'exam-2');
  assert.equal(history[1].id, 'exam-1');
});

test('flagQuestion stores a flag and getFlags returns it', async () => {
  const s = createMemoryStorage();
  await s.flagQuestion({ questionId: 'q-001', reason: 'wrong answer', at: 123 });
  const flags = await s.getFlags();
  assert.equal(flags.length, 1);
  assert.equal(flags[0].questionId, 'q-001');
  assert.equal(flags[0].reason, 'wrong answer');
});

test('flagQuestion is idempotent per questionId (updates reason)', async () => {
  const s = createMemoryStorage();
  await s.flagQuestion({ questionId: 'q-001', reason: 'first', at: 1 });
  await s.flagQuestion({ questionId: 'q-001', reason: 'second', at: 2 });
  const flags = await s.getFlags();
  assert.equal(flags.length, 1);
  assert.equal(flags[0].reason, 'second');
});

test('exportFlags returns a JSON-serializable blob', async () => {
  const s = createMemoryStorage();
  await s.flagQuestion({ questionId: 'q-001', reason: 'x', at: 1 });
  await s.flagQuestion({ questionId: 'q-002', reason: 'y', at: 2 });
  const blob = await s.exportFlags();
  assert.equal(blob.version, 1);
  assert.ok(Array.isArray(blob.flags));
  assert.equal(blob.flags.length, 2);
  assert.equal(JSON.stringify(blob).length > 0, true);
});

test('addBookmark stores a bookmark and getBookmarks returns it', async () => {
  const s = createMemoryStorage();
  await s.addBookmark({ questionId: 'q-005', at: 9 });
  const bookmarks = await s.getBookmarks();
  assert.equal(bookmarks.length, 1);
  assert.equal(bookmarks[0].questionId, 'q-005');
});

test('addBookmark is idempotent per questionId', async () => {
  const s = createMemoryStorage();
  await s.addBookmark({ questionId: 'q-005', at: 1 });
  await s.addBookmark({ questionId: 'q-005', at: 2 });
  const bookmarks = await s.getBookmarks();
  assert.equal(bookmarks.length, 1);
});

test('removeBookmark deletes a bookmark', async () => {
  const s = createMemoryStorage();
  await s.addBookmark({ questionId: 'q-005', at: 1 });
  await s.addBookmark({ questionId: 'q-006', at: 2 });
  await s.removeBookmark('q-005');
  const bookmarks = await s.getBookmarks();
  assert.equal(bookmarks.length, 1);
  assert.equal(bookmarks[0].questionId, 'q-006');
});

test('removeBookmark is a no-op for a missing bookmark', async () => {
  const s = createMemoryStorage();
  await s.removeBookmark('q-999');
  const bookmarks = await s.getBookmarks();
  assert.equal(bookmarks.length, 0);
});

test('setBank stores a bank and getBank returns it', async () => {
  const s = createMemoryStorage();
  assert.equal(await s.getBank(), null);
  const b = { version: '1.2.3', questions: [] };
  await s.setBank(b);
  assert.deepEqual(await s.getBank(), b);
});

test('saveResume and loadResume round-trip an in-progress exam', async () => {
  const s = createMemoryStorage();
  const state = {
    mode: 'non-pro-60',
    seed: 42,
    currentIndex: 17,
    answers: [0, 2, null, 1],
    timeRemainingMs: 1234000,
    questionIds: ['q-001', 'q-002', 'q-003', 'q-004']
  };
  await s.saveResume(state);
  const loaded = await s.loadResume();
  assert.deepEqual(loaded, state);
});

test('loadResume returns null when nothing is saved', async () => {
  const s = createMemoryStorage();
  const loaded = await s.loadResume();
  assert.equal(loaded, null);
});

test('clearResume removes saved resume state', async () => {
  const s = createMemoryStorage();
  await s.saveResume({ mode: 'student', seed: 1, currentIndex: 0, answers: [], timeRemainingMs: 0, questionIds: [] });
  await s.clearResume();
  assert.equal(await s.loadResume(), null);
});

test('getSetting returns the default when unset', async () => {
  const s = createMemoryStorage();
  assert.equal(await s.getSetting('theme', 'light'), 'light');
});

test('setSetting stores and getSetting returns it', async () => {
  const s = createMemoryStorage();
  await s.setSetting('theme', 'dark');
  assert.equal(await s.getSetting('theme', 'light'), 'dark');
});
