import fs from 'node:fs';
import path from 'node:path';

const GENERATED_DIR = new URL('./generated/', import.meta.url);
const OUTPUT = new URL('../questions.json', import.meta.url);

const CATEGORY_TARGETS = {
  'road-signs': 300,
  'traffic-rules': 200,
  'speed-limits': 120,
  'defensive-driving': 120,
  'licensing': 100,
  'vehicle-equipment': 80,
  'penalties': 120,
  'republic-acts': 80,
  'vehicle-registration': 50,
  'expressway': 30
};

function loadCategory(category) {
  const file = path.join(fileURLToPath(GENERATED_DIR), `${category}.json`);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function fileURLToPath(url) {
  return url.pathname.replace(/^\//, '').replace(/\//g, path.sep);
}

const questions = [];
for (const category of Object.keys(CATEGORY_TARGETS)) {
  const items = loadCategory(category);
  questions.push(...items);
  const target = CATEGORY_TARGETS[category];
  if (items.length < target) {
    console.warn(`WARN: ${category} has ${items.length}/${target} questions`);
  }
}

const bank = {
  version: '2.0.0',
  language: 'en',
  questions
};

fs.writeFileSync(fileURLToPath(OUTPUT), JSON.stringify(bank, null, 2) + '\n');
console.log(`Assembled ${questions.length} questions into questions.json`);
