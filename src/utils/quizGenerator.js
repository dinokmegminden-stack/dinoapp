// src/utils/quizGenerator.js
// A csomag-kvízek generálásának egyetlen, központi helye.
// Mezőnevek a creaturesService.js / adaptCreature() kimenetéhez igazítva:
// name_hu, name_latin, latin_name_ending, epoch, discoverer_name, discovery_year,
// length_m_min/max, mya_min/max, edu.

import { ALREND_HU } from './alrendHu';

function shuffle(arr) {
  return [...arr].map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}

function distinctValues(pool, field) {
  return [...new Set(pool.map((d) => d[field]).filter((v) => v !== null && v !== undefined && v !== ''))];
}

// Rossz válaszokat az adott pool-ból veszi, ha kevés, fallback pool-ból is szed.
function pickDistinctDistractors(correctValue, pool, field, count = 3, fallbackPool = null) {
  const values = distinctValues(pool, field).filter((v) => v !== correctValue);
  if (values.length >= count) {
    return shuffle(values).slice(0, count);
  }
  // Ha nincs elég distraktort az edu-szintű pool-ból, fallback pool-ból szedünk
  if (fallbackPool) {
    const fallbackValues = distinctValues(fallbackPool, field).filter((v) => v !== correctValue && !values.includes(v));
    const combined = [...values, ...shuffle(fallbackValues)];
    return combined.slice(0, count);
  }
  return values; // Ha nincs fallback, visszaadjuk amit találtunk
}

// --- Ténykérdések (1 dínóról szólnak) -----------------------------------------

function buildEpochQuestion(dino, pool, fullPool = null) {
  if (!dino.epoch) return null;
  const distractors = pickDistinctDistractors(dino.epoch, pool, 'epoch', 3, fullPool);
  if (distractors.length < 3) return null;
  const options = shuffle([dino.epoch, ...distractors]);
  return {
    type: 'fact',
    question: `Melyik korszakban élt a ${dino.name_hu}?`,
    options,
    correctIndex: options.indexOf(dino.epoch),
  };
}

// Egyesített kérdés: felfedezés éve + felfedező egyetlen kérdésben, egyetlen
// (év, felfedező) párként megjelenő válaszlehetőségekkel — a korábbi két külön
// kérdés (ki / mikor) helyett, egyszerűsítésként.
function buildDiscoveryQuestion(dino, pool, fullPool = null) {
  if (!dino.discovery_year || !dino.discoverer_name) return null;

  const formatAnswer = (d) => `${d.discovery_year} – ${d.discoverer_name}`;
  const correct = formatAnswer(dino);

  const eligible = (list) =>
    list.filter((d) => d.discovery_year && d.discoverer_name && d.name_hu !== dino.name_hu);

  const dedupe = (values) => [...new Set(values)].filter((v) => v !== correct);

  let distractors = dedupe(shuffle(eligible(pool)).map(formatAnswer)).slice(0, 3);

  if (distractors.length < 3 && fullPool) {
    const fallbackValues = dedupe(shuffle(eligible(fullPool)).map(formatAnswer)).filter(
      (v) => !distractors.includes(v)
    );
    distractors = [...distractors, ...fallbackValues].slice(0, 3);
  }

  if (distractors.length < 3) return null;

  const options = shuffle([correct, ...distractors]);
  return {
    type: 'fact',
    question: `Melyik évben és ki fedezte fel a ${dino.name_hu} dinoszauruszt?`,
    options,
    correctIndex: options.indexOf(correct),
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
function buildLatinNameQuestion(dino, pool, fullPool = null) {
  const ending = dino.latin_name_ending;
  if (!dino.name_latin || !ending) return null;

  const genus = genusFromLatin(dino.name_latin, ending);
  if (!genus) return null;

  const otherDinos = pool.filter((d) => d.name_hu !== dino.name_hu);
  let distractorEndings = shuffle(
    distinctValues(otherDinos, 'latin_name_ending').filter((e) => e !== ending)
  ).slice(0, 3);

  if (distractorEndings.length < 3 && fullPool) {
    const fallbackDinos = fullPool.filter((d) => d.name_hu !== dino.name_hu);
    const fallbackEndings = distinctValues(fallbackDinos, 'latin_name_ending').filter(
      (e) => e !== ending && !distractorEndings.includes(e)
    );
    distractorEndings = [...distractorEndings, ...shuffle(fallbackEndings)].slice(0, 3);
  }

  if (distractorEndings.length < 3) return null;

  const options = shuffle([ending, ...distractorEndings]).map((e) => `${genus} ${e}`);
  return {
    type: 'fact',
    question: `Mi a ${dino.name_hu} teljes tudományos neve?`,
    options,
    correctIndex: options.indexOf(`${genus} ${ending}`),
  };
}

function buildCountryQuestion(dino, pool, fullPool = null) {
  if (!dino.discovered_country) return null;
  const distractors = pickDistinctDistractors(dino.discovered_country, pool, 'discovered_country', 3, fullPool);
  if (distractors.length < 3) return null;
  const options = shuffle([dino.discovered_country, ...distractors]);
  return {
    type: 'fact',
    question: `Melyik országban fedezték fel a ${dino.name_hu}-t?`,
    options,
    correctIndex: options.indexOf(dino.discovered_country),
  };
}

// "ismeretlen" nem valódi étrend-tény, sem helyes válaszként, sem rossz
// válaszként nem használható (lásd whoAmIQuizGenerator.js ugyanezt a szűrést).
// "ragadozó" és "húsevő" ugyanazt jelenti a DB-ben (lásd
// data/sqls/normalize_diet_hu_ragadozo_husevo.sql) — enélkül egy kérdésnek
// két, egymással felcserélhető "helyes" válasza lehetne. Kliensoldali
// védőháló, ha a javítás még nem futott le.
function normalizeDiet(diet) {
  return diet === 'ragadozó' ? 'húsevő' : diet;
}

function buildDietQuestion(dino, pool, fullPool = null) {
  const dietOf = (d) => normalizeDiet(d.diet_hu);
  const dinoDiet = dietOf(dino);
  if (!dinoDiet || dinoDiet === 'ismeretlen') return null;
  const dietPool = pool.filter((d) => dietOf(d) && dietOf(d) !== 'ismeretlen').map((d) => ({ ...d, diet_hu: dietOf(d) }));
  const fallbackDietPool = fullPool
    ? fullPool.filter((d) => dietOf(d) && dietOf(d) !== 'ismeretlen').map((d) => ({ ...d, diet_hu: dietOf(d) }))
    : null;
  const distractors = pickDistinctDistractors(dinoDiet, dietPool, 'diet_hu', 3, fallbackDietPool);
  if (distractors.length < 3) return null;
  const options = shuffle([dinoDiet, ...distractors]);
  return {
    type: 'fact',
    question: `Mi volt a ${dino.name_hu} étrendje?`,
    options,
    correctIndex: options.indexOf(dinoDiet),
  };
}

// A `csalad_hu` (60+ egyedi érték, a legtöbb 1-3 taggal) alkalmatlan erre: a
// család neve szinte mindig a génusz nevéből képzett latin szó (pl.
// "Megalosaurus" → "Megalosauridák"), így a helyes válasz sokszor puszta
// szótő-egyezéssel kitalálható, biológiai tudás nélkül. Az `alrend` (csak
// 6 érték, lásd alrendHu.js) sokkal népesebb csoportokat ad, és a lefordított
// magyar elnevezések (pl. "ragadozó dinoszauruszok") nem hordoznak
// szótő-egyezést a dínó nevével.
function buildOrderQuestion(dino, pool, fullPool = null) {
  if (!dino.alrend) return null;
  const distractors = pickDistinctDistractors(dino.alrend, pool, 'alrend', 3, fullPool);
  if (distractors.length < 3) return null;
  const options = shuffle([dino.alrend, ...distractors]).map((a) => ALREND_HU[a] || a);
  return {
    type: 'fact',
    question: `Melyik dinoszaurusz-csoportba tartozott a ${dino.name_hu}?`,
    options,
    correctIndex: options.indexOf(ALREND_HU[dino.alrend] || dino.alrend),
  };
}

const FACT_BUILDERS = [
  buildEpochQuestion,
  buildDiscoveryQuestion,
  buildLatinNameQuestion,
  buildCountryQuestion,
  buildDietQuestion,
  buildOrderQuestion,
];

// --- Összehasonlító kérdések (2 dínóról szólnak) ------------------------------

function midLength(d) {
  const min = d.length_m_min;
  const max = d.length_m_max;
  if (min == null && max == null) return null;
  if (min != null && max != null) return (Number(min) + Number(max)) / 2;
  return Number(max ?? min);
}

function buildLengthComparisonQuestion(dinoA, dinoB) {
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

function midMya(d) {
  const min = d.mya_min === '' || d.mya_min == null ? null : Number(d.mya_min);
  const max = d.mya_max === '' || d.mya_max == null ? null : Number(d.mya_max);
  const validMin = min != null && !Number.isNaN(min) ? min : null;
  const validMax = max != null && !Number.isNaN(max) ? max : null;
  if (validMin == null && validMax == null) return null;
  if (validMin != null && validMax != null) return (validMin + validMax) / 2;
  return validMax ?? validMin;
}

// Nagyobb mya érték = régebben élt (a millió év a jelenhez képest visszafelé számít).
function buildAgeComparisonQuestion(dinoA, dinoB) {
  const myaA = midMya(dinoA);
  const myaB = midMya(dinoB);
  if (myaA == null || myaB == null || myaA === myaB) return null;

  const older = myaA > myaB ? dinoA : dinoB;
  const options = shuffle([dinoA.name_hu, dinoB.name_hu]);
  return {
    type: 'comparison',
    question: `Melyik élt régebben: a ${dinoA.name_hu} vagy a ${dinoB.name_hu}?`,
    options,
    correctIndex: options.indexOf(older.name_hu),
  };
}

// --- Igaz/Hamis típusok (assertion questions) ---------------------------------

function buildSizeAssertionQuestion(dino, pool) {
  const len = midLength(dino);
  if (len == null) return null;

  // 50% igaz, 50% hamis
  const isTrue = Math.random() > 0.5;
  let statement = '';
  let correctAnswer = '';

  if (isTrue) {
    const comparison = len > 10 ? 'nagyobb' : len > 5 ? 'közepes' : 'kisebb';
    statement = `A ${dino.name_hu} ${comparison} méretű volt (${len.toFixed(1)}m).`;
    correctAnswer = 'Igaz';
  } else {
    const falseLen = len > 10 ? len / 2 : len * 2;
    statement = `A ${dino.name_hu} körülbelül ${falseLen.toFixed(1)}m hosszú volt.`;
    correctAnswer = 'Hamis';
  }

  const options = shuffle(['Igaz', 'Hamis']);
  return {
    type: 'assertion',
    question: statement,
    options,
    correctIndex: options.indexOf(correctAnswer),
  };
}

function buildTimeAssertionQuestion(dino, pool) {
  const mya = midMya(dino);
  if (mya == null) return null;

  const isTrue = Math.random() > 0.5;
  let statement = '';
  let correctAnswer = '';

  if (isTrue) {
    const timeDescription = mya > 100 ? 'a Jura korban' : mya > 65 ? 'a Kréta korban' : 'az őskori időkben';
    statement = `A ${dino.name_hu} ${mya.toFixed(0)} millió éve élt (${timeDescription}).`;
    correctAnswer = 'Igaz';
  } else {
    const falseEra = mya > 100 ? '10 millió' : '150 millió';
    statement = `A ${dino.name_hu} körülbelül ${falseEra} éve élt.`;
    correctAnswer = 'Hamis';
  }

  const options = shuffle(['Igaz', 'Hamis']);
  return {
    type: 'assertion',
    question: statement,
    options,
    correctIndex: options.indexOf(correctAnswer),
  };
}

// --- Leírás-alapú kérdések ---

function buildDescriptionQuestion(dino, pool, fullPool = null) {
  if (!dino.description_hu || dino.description_hu.length < 50) return null;

  const desc = dino.description_hu.substring(0, 150);
  const distractors = shuffle(
    pool.filter((d) => d.name_hu !== dino.name_hu && d.description_hu).slice(0, 3)
  ).slice(0, 3);

  if (distractors.length < 3) return null;

  const options = shuffle([dino.name_hu, ...distractors.map((d) => d.name_hu)]);
  return {
    type: 'description',
    question: `Melyik dinoszauruszra vonatkozik ez a leírás?\n\n"${desc}..."`,
    options,
    correctIndex: options.indexOf(dino.name_hu),
  };
}

// --- Család-alapú kérdések ---

function buildFamilyQuestion(dino, pool, fullPool = null) {
  if (!dino.csalad_hu || dino.csalad_hu.length < 2) return null;
  const distractors = pickDistinctDistractors(dino.csalad_hu, pool, 'csalad_hu', 3, fullPool);
  if (distractors.length < 3) return null;
  const options = shuffle([dino.csalad_hu, ...distractors]);
  return {
    type: 'fact',
    question: `Melyik családba tartozott a ${dino.name_hu}?`,
    options,
    correctIndex: options.indexOf(dino.csalad_hu),
  };
}

// --- Rend-alapú kérdések ---

function buildOrderTypeQuestion(dino, pool, fullPool = null) {
  if (!dino.rend) return null;
  const distractors = pickDistinctDistractors(dino.rend, pool, 'rend', 3, fullPool);
  if (distractors.length < 3) return null;
  const options = shuffle([dino.rend, ...distractors]);
  return {
    type: 'fact',
    question: `Melyik rendbe (Saurischia/Ornithischia/Pterosauria) tartozott a ${dino.name_hu}?`,
    options,
    correctIndex: options.indexOf(dino.rend),
  };
}

const COMPARISON_BUILDERS = [buildLengthComparisonQuestion, buildAgeComparisonQuestion];

const ASSERTION_BUILDERS = [buildSizeAssertionQuestion, buildTimeAssertionQuestion];

const NEW_FACT_BUILDERS = [
  buildDescriptionQuestion,
  buildFamilyQuestion,
  buildOrderTypeQuestion,
];

function allPairs(list) {
  const pairs = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      pairs.push([list[i], list[j]]);
    }
  }
  return pairs;
}

// --- 3-Way rank (A, B, C közül melyik a legkisebb/legnagyobb) ----

function buildRankingQuestion(dinoA, dinoB, dinoC, criteria = 'length') {
  if (criteria === 'length') {
    const lens = [dinoA, dinoB, dinoC].map((d) => ({ dino: d, len: midLength(d) }));
    if (lens.some((l) => l.len == null)) return null;
    const sorted = lens.sort((a, b) => a.len - b.len);
    const smallest = sorted[0].dino;
    const options = shuffle([dinoA.name_hu, dinoB.name_hu, dinoC.name_hu]);
    return {
      type: 'ranking',
      question: `Melyik volt a legkisebb közülük?\n${dinoA.name_hu}, ${dinoB.name_hu}, ${dinoC.name_hu}`,
      options,
      correctIndex: options.indexOf(smallest.name_hu),
    };
  } else if (criteria === 'age') {
    const ages = [dinoA, dinoB, dinoC].map((d) => ({ dino: d, mya: midMya(d) }));
    if (ages.some((a) => a.mya == null)) return null;
    const sorted = ages.sort((a, b) => b.mya - a.mya);
    const oldest = sorted[0].dino;
    const options = shuffle([dinoA.name_hu, dinoB.name_hu, dinoC.name_hu]);
    return {
      type: 'ranking',
      question: `Melyik élt a legrégebben közülük?\n${dinoA.name_hu}, ${dinoB.name_hu}, ${dinoC.name_hu}`,
      options,
      correctIndex: options.indexOf(oldest.name_hu),
    };
  }
  return null;
}

function allTriples(list) {
  const triples = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      for (let k = j + 1; k < list.length; k++) {
        triples.push([list[i], list[j], list[k]]);
      }
    }
  }
  return triples;
}

// --- Jelöltlista + kvóta alapú kiválasztás ------------------------------------

// Minden dínóhoz minden ténytípust, minden dínópárhoz minden összehasonlítást legenerálunk,
// és egy stabil kulccsal (builder név + dínó id / rendezett id-pár) dedupoljuk — így ugyanaz
// a kérdés soha nem kerülhet be kétszer a jelöltlistába.
function buildCandidates(packageDinos, pool, fullPool) {
  const seen = new Set();
  const candidates = [];

  const tryAdd = (key, question, dinoIds) => {
    if (!question || seen.has(key)) return;
    seen.add(key);
    candidates.push({ dinoIds, question });
  };

  // Összes fact builder
  const allFactBuilders = [...FACT_BUILDERS, ...NEW_FACT_BUILDERS];
  for (const dino of packageDinos) {
    for (const builder of allFactBuilders) {
      tryAdd(`${builder.name}:${dino.id}`, builder(dino, pool, fullPool), [dino.id]);
    }
    // Assertion builders (igaz/hamis)
    for (const builder of ASSERTION_BUILDERS) {
      // Każdy assertion létrehozhat más-más igaz/hamis ágat — stabil seed kell
      const seed = Math.abs(parseInt(dino.id.toString().slice(0, 8), 16) % 2);
      tryAdd(`${builder.name}:${dino.id}:${seed}`, builder(dino, pool, fullPool), [dino.id]);
    }
  }

  // Pair-based comparisons
  for (const [a, b] of allPairs(packageDinos)) {
    const pairKey = [a.id, b.id].sort().join(':');
    for (const builder of COMPARISON_BUILDERS) {
      tryAdd(`${builder.name}:${pairKey}`, builder(a, b), [a.id, b.id]);
    }
  }

  // Triple-based ranking (csak ha 3+ dínó van a csomagban)
  if (packageDinos.length >= 3) {
    for (const [a, b, c] of allTriples(packageDinos)) {
      const tripleKey = [a.id, b.id, c.id].sort().join(':');
      tryAdd(
        `buildRankingQuestion:length:${tripleKey}`,
        buildRankingQuestion(a, b, c, 'length'),
        [a.id, b.id, c.id]
      );
      tryAdd(
        `buildRankingQuestion:age:${tripleKey}`,
        buildRankingQuestion(a, b, c, 'age'),
        [a.id, b.id, c.id]
      );
    }
  }

  return candidates;
}

// Kvóta alapú kiválasztás: mindig azt a jelöltet választja, amelyik a legkevesebbszer
// érintett dínó(k)ról szól — így nem kerülhet be két kérdés ugyanarról a dínóról addig,
// amíg minden dínóról nem volt legalább egy kérdés.
function selectByQuota(candidates, questionCount) {
  const usedCount = new Map();
  const remaining = shuffle(candidates);
  const selected = [];

  const scoreOf = (cand) => Math.max(...cand.dinoIds.map((id) => usedCount.get(id) || 0));

  while (selected.length < questionCount && remaining.length > 0) {
    remaining.sort((a, b) => scoreOf(a) - scoreOf(b));
    const pick = remaining.shift();
    selected.push(pick.question);
    pick.dinoIds.forEach((id) => usedCount.set(id, (usedCount.get(id) || 0) + 1));
  }

  return selected;
}

/**
 * Kérdésszám: minimum 5. Több kérdéstípus miatt dinamikusan több lehet.
 * Ténykérdés-típusok: korszak, felfedezés, latin név, ország, étrend, alrend, család, rend, leírás.
 * Igaz/Hamis: méret, idő.
 * Összehasonlító: hossz, kor.
 * Ranking (3-way): hossz, kor.
 * Mindig 4 opció per kérdés. A rossz válaszok előbb az adott edu level (régió) pool-ból,
 * ha kevés, a fullPool-ból is szedünk (nem korlátozódunk az edu szintre).
 * Minden lehetséges kérdés egyszer generálódik (dedupolt jelöltlista), majd kvóta alapján
 * választunk úgy, hogy minden dínóról legalább egy kérdés bekerüljön.
 */
export function buildQuiz(packageDinos, fullPool) {
  if (!packageDinos || packageDinos.length === 0) return [];

  const eduLevel = packageDinos[0].edu;
  const basePool = fullPool && fullPool.length ? fullPool : packageDinos;
  const pool = eduLevel != null ? basePool.filter((d) => d.edu === eduLevel) : basePool;

  // Több típus = több kérdés: min 8, vagy dínó-szám × 1.5
  const questionCount = Math.max(8, Math.ceil(packageDinos.length * 1.5));

  const candidates = buildCandidates(packageDinos, pool, basePool);
  const selected = selectByQuota(candidates, questionCount);

  return shuffle(selected);
}
