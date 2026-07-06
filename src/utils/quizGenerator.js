// src/utils/quizGenerator.js
// A csomag-kvízek generálásának egyetlen, központi helye.
// Mezőnevek a creaturesService.js / adaptCreature() kimenetéhez igazítva:
// name_hu, name_latin, latin_name_ending, epoch, discoverer_name, discovery_year, length_m_min/max, edu.

function shuffle(arr) {
  return [...arr].map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}

function distinctValues(pool, field) {
  return [...new Set(pool.map((d) => d[field]).filter((v) => v !== null && v !== undefined && v !== ''))];
}

// Csak az adott edu level pool-jából válogat rossz válaszokat is — nincs kívülről fallback.
function pickDistinctDistractors(correctValue, pool, field, count = 3) {
  const values = distinctValues(pool, field).filter((v) => v !== correctValue);
  return shuffle(values).slice(0, count);
}

function buildEpochQuestion(dino, pool) {
  if (!dino.epoch) return null;
  const distractors = pickDistinctDistractors(dino.epoch, pool, 'epoch', 3);
  if (distractors.length === 0) return null;
  const options = shuffle([dino.epoch, ...distractors]);
  return {
    type: 'fact',
    question: `Melyik korszakban élt a ${dino.name_hu}?`,
    options,
    correctIndex: options.indexOf(dino.epoch),
  };
}

function buildDiscovererQuestion(dino, pool) {
  if (!dino.discoverer_name) return null;
  const distractors = pickDistinctDistractors(dino.discoverer_name, pool, 'discoverer_name', 3);
  if (distractors.length === 0) return null;
  const options = shuffle([dino.discoverer_name, ...distractors]);
  return {
    type: 'fact',
    question: `Ki fedezte fel a ${dino.name_hu}-t?`,
    options,
    correctIndex: options.indexOf(dino.discoverer_name),
  };
}

function buildDiscoveryYearQuestion(dino, pool) {
  if (!dino.discovery_year) return null;
  const distractors = pickDistinctDistractors(dino.discovery_year, pool, 'discovery_year', 3);
  if (distractors.length === 0) return null;
  const options = shuffle([dino.discovery_year, ...distractors]).map(String);
  return {
    type: 'fact',
    question: `Mikor fedezték fel a ${dino.name_hu}-t?`,
    options,
    correctIndex: options.indexOf(String(dino.discovery_year)),
  };
}

// A genus-részt a name_latin mezőből vonjuk le a latin_name_ending levágásával —
// nincs whitespace-alapú találgatás, mindkét mező a Supabase-ből jön.
function genusFromLatin(nameLatin, ending) {
  const full = String(nameLatin || '').trim();
  const suffix = String(ending || '').trim();
  if (!full) return '';
  if (suffix && full.toLowerCase().endsWith(suffix.toLowerCase())) {
    return full.slice(0, full.length - suffix.length).trim();
  }
  return full.split(/\s+/)[0] || '';
}

// A teljes tudományos név kérdésnél a válaszlehetőségek csak a fajnévben (latin_name_ending)
// térnek el — a genus minden opcióban a helyes dínóé marad. A rossz fajnév-végződéseket
// más dínóktól kölcsönözzük (name_hu alapján megkülönböztetve az egyedeket).
function buildLatinNameQuestion(dino, pool) {
  const ending = dino.latin_name_ending;
  if (!dino.name_latin || !ending) return null;

  const genus = genusFromLatin(dino.name_latin, ending);
  if (!genus) return null;

  const otherDinos = pool.filter((d) => d.name_hu !== dino.name_hu);
  const distractorEndings = shuffle(
    distinctValues(otherDinos, 'latin_name_ending').filter((e) => e !== ending)
  ).slice(0, 3);
  if (distractorEndings.length === 0) return null;

  const options = shuffle([ending, ...distractorEndings]).map((e) => `${genus} ${e}`);
  return {
    type: 'fact',
    question: `Mi a ${dino.name_hu} teljes tudományos neve?`,
    options,
    correctIndex: options.indexOf(`${genus} ${ending}`),
  };
}

const FACT_BUILDERS = [
  buildEpochQuestion,
  buildDiscovererQuestion,
  buildDiscoveryYearQuestion,
  buildLatinNameQuestion,
];

function buildFactQuestionForDino(dino, pool) {
  for (const builder of shuffle(FACT_BUILDERS)) {
    const q = builder(dino, pool);
    if (q) return q;
  }
  return null;
}

// --- Hossz-összehasonlító kérdés ---------------------------------------------

function midLength(d) {
  const min = d.length_m_min;
  const max = d.length_m_max;
  if (min == null && max == null) return null;
  if (min != null && max != null) return (Number(min) + Number(max)) / 2;
  return Number(max ?? min);
}

function buildComparisonQuestion(dinoA, dinoB) {
  const lenA = midLength(dinoA);
  const lenB = midLength(dinoB);
  if (lenA == null || lenB == null || lenA === lenB) return null;

  const longer = lenA > lenB ? dinoA : dinoB;
  const options = shuffle([dinoA.name_hu, dinoB.name_hu]);
  return {
    type: 'comparison',
    question: `Melyik volt hosszabb: a ${dinoA.name_hu} vagy a ${dinoB.name_hu}?`,
    options,
    correctIndex: options.indexOf(longer.name_hu),
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
 * Kérdésszám: minimum 5. Ha a csomagban 5-nél több dínó van, akkor dínószám + 1.
 * 1 ténykérdés / dínó (korszak (epoch) / felfedező / felfedezés éve / teljes név — véletlen sorrendben próbálva,
 * amíg van elég adat), a maradék összehasonlító kérdés (hossz alapján).
 * A rossz válaszok mindig csak az adott edu level (régió) dínóinak distinct értékei közül jönnek —
 * nincs régión kívüli vagy kitalált fallback érték.
 * Ha a valós adatokból (hiányzó mezők/túl kevés distinct érték miatt) nem jön ki elég egyedi kérdés,
 * a hiányzó darabszámot a már legenerált kérdések ismétlésével tölti fel — a minimum darabszám
 * garantált, de sok hiányzó adat esetén előfordulhat ismétlődő kérdés.
 */
export function buildQuiz(packageDinos, fullPool) {
  if (!packageDinos || packageDinos.length === 0) return [];

  const eduLevel = packageDinos[0].edu;
  const basePool = fullPool && fullPool.length ? fullPool : packageDinos;
  const pool = eduLevel != null ? basePool.filter((d) => d.edu === eduLevel) : basePool;

  const questionCount = packageDinos.length > 5 ? packageDinos.length + 1 : 5;

  // 1. kör: minden dínóhoz egy ténykérdés (az első sikeres builder, véletlen sorrendben próbálva)
  const factQuestions = packageDinos
    .map((d) => buildFactQuestionForDino(d, pool))
    .filter(Boolean);

  // 2. kör: hossz-összehasonlító kérdések a hiányzó darabszámig
  const comparisonQuestions = [];
  const needed = questionCount - factQuestions.length;
  if (needed > 0) {
    for (const [a, b] of allPairs(packageDinos)) {
      if (comparisonQuestions.length >= needed) break;
      const q = buildComparisonQuestion(a, b);
      if (q) comparisonQuestions.push(q);
    }
  }

  let combined = [...factQuestions, ...comparisonQuestions];

  // 3. kör: minden dínó × minden builder kombináció kimerítése (nem csak az első sikeres),
  // hogy a hiányos mezők ellenére is minél több egyedi kérdés szülessen.
  if (combined.length < questionCount) {
    for (const dino of packageDinos) {
      for (const builder of FACT_BUILDERS) {
        if (combined.length >= questionCount) break;
        const q = builder(dino, pool);
        if (q) combined.push(q);
      }
      if (combined.length >= questionCount) break;
    }
  }

  // 4. kör: ha még mindig kevés (nagyon hiányos adatok), az allPairs-t is kimerítjük
  if (combined.length < questionCount) {
    for (const [a, b] of allPairs(packageDinos)) {
      if (combined.length >= questionCount) break;
      const q = buildComparisonQuestion(a, b);
      if (q) combined.push(q);
    }
  }

  // 5. végső garancia: ha a valós adatokból ennyi sem jön ki, a meglévő kérdéseket
  // ismételve töltjük fel a minimum darabszámig.
  if (combined.length > 0) {
    let repeatIndex = 0;
    while (combined.length < questionCount) {
      combined.push(combined[repeatIndex % combined.length]);
      repeatIndex++;
    }
  }

  return shuffle(combined).slice(0, questionCount);
}
