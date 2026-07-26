import fs from 'node:fs';

const bank = JSON.parse(fs.readFileSync(new URL('../questions.json', import.meta.url), 'utf8'));

const CATEGORIES = ['road-signs', 'traffic-rules', 'speed-limits', 'defensive-driving', 'licensing', 'vehicle-equipment', 'penalties', 'republic-acts', 'vehicle-registration', 'expressway'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

let errors = 0;
const ids = new Set();

if (!/^\d+\.\d+\.\d+$/.test(bank.version || '')) { console.error('FAIL: missing/invalid version'); errors++; }
if (bank.language !== 'en' && bank.language !== 'fil') { console.error('FAIL: invalid language'); errors++; }
if (!Array.isArray(bank.questions)) { console.error('FAIL: questions is not an array'); errors++; process.exit(1); }

for (const q of bank.questions) {
  const loc = q.id || '(unknown)';
  if (!q.id || !/^q-[\w-]+\d{2,}$/.test(q.id)) { console.error(`FAIL: ${loc} bad id`); errors++; continue; }
  if (ids.has(q.id)) { console.error(`FAIL: ${q.id} duplicate id`); errors++; }
  ids.add(q.id);
  if (!CATEGORIES.includes(q.category)) { console.error(`FAIL: ${q.id} bad category ${q.category}`); errors++; }
  if (!q.subcategory) { console.error(`FAIL: ${q.id} missing subcategory`); errors++; }
  if (!DIFFICULTIES.includes(q.difficulty)) { console.error(`FAIL: ${q.id} bad difficulty ${q.difficulty}`); errors++; }
  if (!q.question || !q.question.trim()) { console.error(`FAIL: ${q.id} empty question`); errors++; }
  if (!Array.isArray(q.options) || q.options.length !== 4) { console.error(`FAIL: ${q.id} options must have 4 entries`); errors++; }
  if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) { console.error(`FAIL: ${q.id} bad correct index`); errors++; }
  if (!q.explanation || !q.explanation.trim()) { console.error(`FAIL: ${q.id} empty explanation`); errors++; }
  if (!q.source || !q.source.trim()) { console.error(`FAIL: ${q.id} empty source`); errors++; }
}

const byCategory = {};
for (const q of bank.questions) byCategory[q.category] = (byCategory[q.category] || 0) + 1;
console.log('Questions by category:');
for (const c of CATEGORIES) console.log(`  ${c}: ${byCategory[c] || 0}`);

if (errors > 0) {
  console.error(`\n${errors} validation error(s)`);
  process.exit(1);
}
console.log(`\nOK: ${bank.questions.length} questions validated`);
