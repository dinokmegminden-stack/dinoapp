// src/utils/quizGenerator.js
// A csomag-kvízek generálásának egyetlen, központi helye.

function shuffle(arr) {
  return [...arr].map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}

const FALLBACK_DISTRACTORS = {
  korszak: ['triász', 'kora kréta', 'jura', 'perm'],
  hossz: ['1 m', '15 m', '0.5 m', '20 m'],
  felfedezo: ['ismeretlen kutató', 'Charles Darwin', 'Richard Owen'],
  nev_tudomanyos: ['Tyrannosaurus rex', 'Triceratops horridus', 'Velociraptor mongoliensis'],
};

const FACT_TEMPLATES = [
  { field: 'nev_tudomanyos', text: (d) => `Mi a "${d.nev_koznapi}" tudományos neve?` },
  { field: 'korszak', text: (d) => `Melyik korszakban élt a ${d.nev_koznapi}?` },
  { field: 'hossz', text: (d) => `Mekkora volt körülbelül a ${d.nev_koznapi} testhossza?` },
  { field: 'felfedezo', text: (d) => `Ki fedezte fel a ${d.nev_koznapi}-t?` },
];

function pickDistractors(correctValue, pool, field, count = 3) {
  const values = [
    ...new Set(
      pool
        .map((d) => d[field])
        .filter((v) => v && v !== 'ismeretlen' && v !== correctValue)
    ),
  ];
  let distractors = shuffle(values).slice(0, count);
  if (distractors.length < count && FALLBACK_DISTRACTORS[field]) {
    const extra = FALLBACK_DISTRACTORS[field].filter((v) => v !== correctValue && !distractors.includes(v));
    distractors = [...distractors, ...extra].slice(0, count);
  }
  return distractors;
}

function buildFactQuestion(dino, template, pool) {
  const correct = dino[template.field];
  const distractors = pickDistractors(correct, pool, template.field, 3);
  const options = shuffle([correct, ...distractors]);
  return {
    type: 'fact',
    question: template.text(dino),
    options,
    correctIndex: options.indexOf(correct),
  };
}

function parseLength(hossz) {
  const n = parseFloat(String(hossz ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function buildComparisonQuestion(dinoA, dinoB) {
  const lenA = parseLength(dinoA.hossz);
  const lenB = parseLength(dinoB.hossz);
  if (lenA == null || lenB == null || lenA === lenB) return null;

  const longer = lenA > lenB ? dinoA : dinoB;
  const options = shuffle([dinoA.nev_koznapi, dinoB.nev_koznapi]);
  return {
    type: 'comparison',
    question: `Melyik volt hosszabb: a ${dinoA.nev_koznapi} vagy a ${dinoB.nev_koznapi}?`,
    options,
    correctIndex: options.indexOf(longer.nev_koznapi),
  };
}

function allPairs(list) {
  const pairs = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      pairs.push([list[i], list[j]]);
    }
  }
  return shuffle(pairs);
}

/**
 * Kérdésszám = csomag dínóinak száma + 2.
 * 1 ténykérdés / dínó, a maradék összehasonlító kérdés (hossz alapján).
 * Ha nincs elég használható összehasonlítás (pl. hiányzó hossz-adat),
 * a hiányt tényke kérdésekkel tölti fel.
 */
export function buildQuiz(packageDinos, fullPool) {
  if (!packageDinos || packageDinos.length === 0) return [];

  const questionCount = packageDinos.length + 2;
  const pool = fullPool && fullPool.length ? fullPool : packageDinos;

  const factQuestions = packageDinos.map((d) =>
    buildFactQuestion(d, shuffle(FACT_TEMPLATES)[0], pool)
  );

  const needed = questionCount - factQuestions.length;
  const comparisonQuestions = [];
  if (needed > 0) {
    for (const [a, b] of allPairs(packageDinos)) {
      if (comparisonQuestions.length >= needed) break;
      const q = buildComparisonQuestion(a, b);
      if (q) comparisonQuestions.push(q);
    }
  }

  let combined = [...factQuestions, ...comparisonQuestions];
  const extraTemplates = shuffle(FACT_TEMPLATES);
  let fillIndex = 0;
  while (combined.length < questionCount) {
    const dino = packageDinos[fillIndex % packageDinos.length];
    const template = extraTemplates[fillIndex % extraTemplates.length];
    combined.push(buildFactQuestion(dino, template, pool));
    fillIndex++;
    if (fillIndex > questionCount * 2) break;
  }

  return shuffle(combined).slice(0, questionCount);
}