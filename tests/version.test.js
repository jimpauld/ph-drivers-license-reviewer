import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { isNewerVersion } from '../src/version.js';

test('isNewerVersion returns true when the candidate has a higher version', () => {
  assert.equal(isNewerVersion('1.0.0', '1.0.1'), true);
  assert.equal(isNewerVersion('1.0.0', '1.1.0'), true);
  assert.equal(isNewerVersion('1.0.0', '2.0.0'), true);
});

test('isNewerVersion returns false when the candidate is equal or lower', () => {
  assert.equal(isNewerVersion('1.0.0', '1.0.0'), false);
  assert.equal(isNewerVersion('1.0.1', '1.0.0'), false);
  assert.equal(isNewerVersion('2.0.0', '1.9.9'), false);
});

test('isNewerVersion handles pre-release suffixes', () => {
  assert.equal(isNewerVersion('1.0.0-alpha', '1.0.0'), true);
  assert.equal(isNewerVersion('1.0.0', '1.0.0-beta'), false);
});

test('isNewerVersion returns false for invalid inputs', () => {
  assert.equal(isNewerVersion('1.0.0', 'not-a-version'), false);
  assert.equal(isNewerVersion('not-a-version', '1.0.0'), false);
  assert.equal(isNewerVersion('', '1.0.0'), false);
});
