import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createMemoryStorage } from '../src/storage-memory.js';

const METHODS = [
  'saveExam', 'getHistory', 'flagQuestion', 'getFlags', 'exportFlags',
  'addBookmark', 'getBookmarks', 'saveResume', 'loadResume', 'clearResume',
  'getSetting', 'setSetting'
];

test('memory storage exposes the full storage interface', () => {
  const s = createMemoryStorage();
  for (const m of METHODS) {
    assert.equal(typeof s[m], 'function', `missing method: ${m}`);
  }
});
