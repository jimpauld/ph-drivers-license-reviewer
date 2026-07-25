function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(arr, seed) {
  const rng = mulberry32(seed);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const MODE_CONFIG = {
  student: { questions: 25, passingScore: 0.80, timerMinutes: 25 },
  'non-pro-40': { questions: 40, passingScore: 0.75, timerMinutes: 40 },
  'non-pro-60': { questions: 60, passingScore: 0.75, timerMinutes: 60 },
  pro: { questions: 60, passingScore: 0.75, timerMinutes: 60 }
};

export function modeConfig(mode) {
  const cfg = MODE_CONFIG[mode];
  if (!cfg) throw new Error(`unknown mode: ${mode}`);
  return { ...cfg };
}

const TOPIC_WEIGHTS = {
  student: {
    'road-signs': 0.30,
    'traffic-rules': 0.20,
    'speed-limits': 0.12,
    'defensive-driving': 0.10,
    'licensing': 0.08,
    'vehicle-equipment': 0.07,
    'penalties': 0.06,
    'republic-acts': 0.04,
    'vehicle-registration': 0.02,
    'expressway': 0.01
  },
  'non-pro-40': {
    'road-signs': 0.25,
    'traffic-rules': 0.17,
    'speed-limits': 0.10,
    'defensive-driving': 0.10,
    'licensing': 0.08,
    'vehicle-equipment': 0.07,
    'penalties': 0.10,
    'republic-acts': 0.07,
    'vehicle-registration': 0.04,
    'expressway': 0.02
  },
  pro: {
    'road-signs': 0.20,
    'traffic-rules': 0.17,
    'speed-limits': 0.10,
    'defensive-driving': 0.10,
    'licensing': 0.08,
    'vehicle-equipment': 0.07,
    'penalties': 0.12,
    'republic-acts': 0.10,
    'vehicle-registration': 0.05,
    'expressway': 0.01
  }
};

TOPIC_WEIGHTS['non-pro-60'] = TOPIC_WEIGHTS['non-pro-40'];

export function weightTopics(mode) {
  const w = TOPIC_WEIGHTS[mode];
  if (!w) throw new Error(`unknown mode: ${mode}`);
  return { ...w };
}

export function pickCategory(bank, category, count, seed = 0) {
  const pool = bank.questions.filter((q) => q.category === category);
  return shuffle(pool, seed).slice(0, count);
}

function byCategory(bank) {
  const map = {};
  for (const q of bank.questions) {
    (map[q.category] ||= []).push(q);
  }
  return map;
}

export function selectQuestions(bank, mode, seed) {
  const { questions: target } = modeConfig(mode);
  const weights = weightTopics(mode);
  const pools = byCategory(bank);

  const categories = Object.keys(weights).sort();
  const rawTargets = categories.map((c) => weights[c] * target);
  const floorTargets = rawTargets.map((v) => Math.floor(v));
  let remaining = target - floorTargets.reduce((a, b) => a + b, 0);

  const fractions = categories.map((c, i) => ({ c, f: rawTargets[i] - floorTargets[i] }));
  fractions.sort((x, y) => y.f - x.f || (x.c < y.c ? -1 : 1));
  for (let i = 0; i < fractions.length && remaining > 0; i++) {
    floorTargets[i] += 1;
    remaining -= 1;
  }

  const selected = [];
  let shortfall = 0;
  for (let i = 0; i < categories.length; i++) {
    const c = categories[i];
    let want = floorTargets[i];
    const available = (pools[c] || []).length;
    if (want > available) {
      shortfall += want - available;
      want = available;
    }
    selected.push(...shuffle(pools[c] || [], seed + i).slice(0, want));
  }

  while (shortfall > 0) {
    let placed = false;
    for (let i = 0; i < categories.length && shortfall > 0; i++) {
      const c = categories[i];
      const have = selected.filter((q) => q.category === c).length;
      const available = (pools[c] || []).length;
      if (have < available) {
        const extra = shuffle(pools[c], seed + 100 + i)
          .filter((q) => !selected.includes(q))
          .slice(0, 1);
        if (extra.length) {
          selected.push(extra[0]);
          shortfall -= 1;
          placed = true;
        }
      }
    }
    if (!placed) break;
  }

  return shuffle(selected, seed + 9999);
}

export function scoreExam(answers, questions, passingScore) {
  let correct = 0;
  const categoryStats = {};
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const cat = q.category;
    categoryStats[cat] ||= { correct: 0, total: 0 };
    categoryStats[cat].total += 1;
    if (answers[i] === q.correct) {
      correct += 1;
      categoryStats[cat].correct += 1;
    }
  }
  const total = questions.length;
  const score = total > 0 ? correct / total : 0;
  return {
    correct,
    total,
    score,
    passingScore,
    passed: total > 0 && score >= passingScore,
    byCategory: categoryStats
  };
}
