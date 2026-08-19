// src/utils/millionaireQuizGenerator.js
// "Legyen Ön is XP Milliomos" kérdésválogatás.
// Forrás: assets/quiz_questions.json — tényleges mezőnevek (ellenőrizve):
// { id, difficulty: 'easy'|'medium'|'hard', question, options: [4], correctIndex, hint }
// (a `hint` a JSON-ban megvan, de a képernyő nem használja — nincs segítség/joker ebben a módban)

import { MILLIONAIRE_DIFFICULTY_COUNTS, MILLIONAIRE_XP_TABLE } from '../constants/millionaireXP';

const QUESTIONS = require('../../assets/quiz_questions.json');

function shuffle(arr) {
  return [...arr].map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}

// A statikus corpus ~220 "Melyik évben fedezték fel a X-t?" kérdését futásidőben
// két gazdagabb formára cseréljük:
//   A) "Melyik évben és ki fedezte fel a X dinoszauruszt?" — válasz: (év – felfedező),
//      a corpusból (év = helyes opció, felfedező = `hint`), ezért mindig működik.
//   B) "Melyik dínót fedezte fel Z, X-ben, Y területén?" — válasz: a dínó neve,
//      a szerver (creatures) adataiból (év + ország + felfedező). Csak ott, ahol a
//      lény szerepel a betöltött listában; egyébként az A formára esünk vissza.
const YEAR_ONLY_RE = /^Melyik évben fedezték fel a (.+)-t\?$/;
const DISCOVERER_RE = /^A felfedez[őo]\s+(.+?)\s+volt\.?$/i;

// Egy corpus-kérdésből kinyert (név, év, felfedező), vagy null.
function discoveryPair(q) {
  const name = YEAR_ONLY_RE.exec(q.question)?.[1];
  const who = DISCOVERER_RE.exec(String(q.hint || '').trim())?.[1];
  const year = q.options?.[q.correctIndex];
  if (!name || !who || !year) return null;
  return { name, year, who, answer: `${year} – ${who}` };
}

// Az összes ilyen kérdésből épített (év – felfedező) készlet az A-forma rossz opcióihoz.
const DISCOVERY_ANSWER_POOL = [
  ...new Set(QUESTIONS.map((q) => discoveryPair(q)?.answer).filter(Boolean)),
];

// A zárójeles kiegészítést ("(elemezte …)") levágjuk, hogy a kérdés rövid maradjon.
function primaryName(s) {
  return String(s || '').replace(/\s*\(.*\)\s*/g, '').trim();
}

function buildFormA(q, pair) {
  const distractors = shuffle(DISCOVERY_ANSWER_POOL.filter((a) => a !== pair.answer)).slice(0, 3);
  if (distractors.length < 3) return q;
  const options = shuffle([pair.answer, ...distractors]);
  return {
    ...q,
    question: `Melyik évben és ki fedezte fel a ${pair.name} dinoszauruszt?`,
    options,
    correctIndex: options.indexOf(pair.answer),
  };
}

function buildFormB(q, dino, namePool) {
  const distractors = shuffle(namePool.filter((n) => n !== dino.name_hu)).slice(0, 3);
  if (distractors.length < 3) return null;
  const options = shuffle([dino.name_hu, ...distractors]);
  const who = primaryName(dino.discoverer_name);
  return {
    ...q,
    question: `Melyik dínót fedezte fel ${who}, ${dino.discovery_year}-ben, ${dino.discovered_country} területén?`,
    options,
    correctIndex: options.indexOf(dino.name_hu),
  };
}

function upgradeDiscoveryQuestions(selected, allDinos = []) {
  const byName = new Map(
    allDinos
      .filter((d) => d.name_hu && d.discovery_year && d.discovered_country && d.discoverer_name)
      .map((d) => [d.name_hu, d])
  );
  const namePool = [...byName.keys()];

  return selected.map((q) => {
    const pair = discoveryPair(q);
    if (!pair) return q;
    const dino = byName.get(pair.name);
    // Ahol van szerveradat, dobással váltunk A és B között; egyébként mindig A.
    if (dino && Math.random() < 0.5) {
      return buildFormB(q, dino, namePool) || buildFormA(q, pair);
    }
    return buildFormA(q, pair);
  });
}

const TOTAL_QUESTIONS = MILLIONAIRE_XP_TABLE.length;

// Érvényes kérdés: van szöveg, pontosan 4 opció, és a correctIndex az opciókra mutat.
function isValidQuestion(q) {
  return (
    q &&
    typeof q.question === 'string' &&
    q.question.length > 0 &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    Number.isInteger(q.correctIndex) &&
    q.correctIndex >= 0 &&
    q.correctIndex < q.options.length
  );
}

// Ha egy nehézségi poolban nincs elég kérdés, a szomszédos szintről pótolunk
// (medium hiányában easy-ből, hard hiányában medium-ból és fordítva).
const FALLBACK_ORDER = {
  easy: ['medium', 'hard'],
  medium: ['easy', 'hard'],
  hard: ['medium', 'easy'],
};

/**
 * 15 kérdés kiválasztása: 5 easy → 5 medium → 5 hard, poolon belül randomizálva.
 * A nehézségi sorrend fix (easy→medium→hard), így illeszkedik a
 * MILLIONAIRE_XP_TABLE soraihoz.
 * Visszatérés: 15 elemű tömb, vagy üres tömb, ha nincs elég érvényes kérdés.
 */
export function buildMillionaireQuiz(allDinos = []) {
  const valid = QUESTIONS.filter(isValidQuestion);

  const pools = {
    easy: shuffle(valid.filter((q) => q.difficulty === 'easy')),
    medium: shuffle(valid.filter((q) => q.difficulty === 'medium')),
    hard: shuffle(valid.filter((q) => q.difficulty === 'hard')),
  };

  const usedIds = new Set();
  const selected = [];

  for (const [difficulty, count] of Object.entries(MILLIONAIRE_DIFFICULTY_COUNTS)) {
    const picked = [];

    const takeFrom = (pool) => {
      for (const q of pool) {
        if (picked.length >= count) break;
        if (usedIds.has(q.id)) continue;
        picked.push(q);
        usedIds.add(q.id);
      }
    };

    takeFrom(pools[difficulty]);

    if (picked.length < count) {
      console.warn(
        `Millionaire kvíz: kevés '${difficulty}' kérdés (${picked.length}/${count}), fallback pool használata.`
      );
      for (const fallback of FALLBACK_ORDER[difficulty]) {
        if (picked.length >= count) break;
        takeFrom(pools[fallback]);
      }
    }

    selected.push(...picked);
  }

  if (selected.length < TOTAL_QUESTIONS) {
    console.warn(`Millionaire kvíz: összesen csak ${selected.length}/${TOTAL_QUESTIONS} kérdés áll rendelkezésre.`);
    return [];
  }

  return upgradeDiscoveryQuestions(selected, allDinos);
}
