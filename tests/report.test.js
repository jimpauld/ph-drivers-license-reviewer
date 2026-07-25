import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { buildIssueUrl, buildFlagPayload } from '../src/report.js';

const REPO = 'jimpauld/ph-drivers-license-reviewer';

function paramsOf(url) {
  const q = url.split('?')[1];
  return new URLSearchParams(q);
}

function sampleQuestion() {
  return {
    id: 'q-001',
    category: 'road-signs',
    question: 'A red, octagonal road sign means:',
    options: ['STOP', 'YIELD', 'NO ENTRY', 'SPEED LIMIT'],
    correct: 0,
    source: 'FDM Vol. 1, Road Traffic Signs'
  };
}

test('buildIssueUrl produces a GitHub new-issue URL for the repo', () => {
  const url = buildIssueUrl(REPO, sampleQuestion(), { selected: 2, feedback: 'wrong answer', appVersion: '1.0.0' });
  assert.ok(url.startsWith(`https://github.com/${REPO}/issues/new`));
});

test('buildIssueUrl encodes the question id in the title', () => {
  const url = buildIssueUrl(REPO, sampleQuestion(), { selected: 2, feedback: '', appVersion: '1.0.0' });
  assert.equal(paramsOf(url).get('title'), 'Flagged question: q-001');
});

test('buildIssueUrl includes the question text in the body', () => {
  const url = buildIssueUrl(REPO, sampleQuestion(), { selected: 2, feedback: '', appVersion: '1.0.0' });
  assert.ok(paramsOf(url).get('body').includes('A red, octagonal road sign means:'));
});

test('buildIssueUrl includes the selected answer label in the body', () => {
  const url = buildIssueUrl(REPO, sampleQuestion(), { selected: 2, feedback: '', appVersion: '1.0.0' });
  assert.ok(paramsOf(url).get('body').includes('NO ENTRY'));
});

test('buildIssueUrl includes the expected correct answer label in the body', () => {
  const url = buildIssueUrl(REPO, sampleQuestion(), { selected: 2, feedback: '', appVersion: '1.0.0' });
  assert.ok(paramsOf(url).get('body').includes('STOP'));
});

test('buildIssueUrl includes user feedback in the body', () => {
  const url = buildIssueUrl(REPO, sampleQuestion(), { selected: 2, feedback: 'this is wrong', appVersion: '1.0.0' });
  assert.ok(paramsOf(url).get('body').includes('this is wrong'));
});

test('buildIssueUrl includes the app version in the body', () => {
  const url = buildIssueUrl(REPO, sampleQuestion(), { selected: 2, feedback: '', appVersion: '1.0.0' });
  assert.ok(paramsOf(url).get('body').includes('1.0.0'));
});

test('buildIssueUrl handles a null selected answer', () => {
  const url = buildIssueUrl(REPO, sampleQuestion(), { selected: null, feedback: '', appVersion: '1.0.0' });
  assert.ok(paramsOf(url).get('body').includes('(not answered)'));
});

test('buildFlagPayload returns a JSON-serializable object with the flag fields', () => {
  const payload = buildFlagPayload(sampleQuestion(), { selected: 2, feedback: 'wrong', appVersion: '1.0.0' });
  assert.equal(payload.questionId, 'q-001');
  assert.equal(payload.question, 'A red, octagonal road sign means:');
  assert.equal(payload.selected, 2);
  assert.equal(payload.selectedLabel, 'NO ENTRY');
  assert.equal(payload.correct, 0);
  assert.equal(payload.correctLabel, 'STOP');
  assert.equal(payload.feedback, 'wrong');
  assert.equal(payload.appVersion, '1.0.0');
  assert.equal(typeof payload.at, 'number');
  assert.equal(JSON.stringify(payload).length > 0, true);
});
