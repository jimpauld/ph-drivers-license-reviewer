import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { resolveTheme, applyTheme } from '../src/theme.js';

test('resolveTheme returns stored value when valid', () => {
  assert.equal(resolveTheme('dark', null), 'dark');
  assert.equal(resolveTheme('light', null), 'light');
});

test('resolveTheme falls back to system preference when no stored value', () => {
  assert.equal(resolveTheme(null, 'dark'), 'dark');
  assert.equal(resolveTheme(null, 'light'), 'light');
});

test('resolveTheme defaults to light when nothing is set', () => {
  assert.equal(resolveTheme(null, null), 'light');
});

test('resolveTheme ignores invalid stored values', () => {
  assert.equal(resolveTheme('purple', null), 'light');
  assert.equal(resolveTheme('purple', 'dark'), 'dark');
});

test('applyTheme sets data-theme attribute on document root', () => {
  const calls = [];
  const fakeDocument = {
    get documentElement() { return { setAttribute: (k, v) => calls.push([k, v]) }; }
  };
  applyTheme(fakeDocument, 'dark');
  applyTheme(fakeDocument, 'light');
  assert.deepEqual(calls, [['data-theme', 'dark'], ['data-theme', 'light']]);
});
