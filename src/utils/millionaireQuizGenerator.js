// src/utils/millionaireQuizGenerator.js
// "Legyen Ön is XP Milliomos" kérdésválogatás.
// Forrás: assets/quiz_questions.json — tényleges mezőnevek (ellenőrizve):
// { id, difficulty: 'easy'|'medium'|'hard', question, options: [4], correctIndex, hint }

import { MILLIONAIRE_DIFFICULTY_COUNTS, MILLIONAIRE_XP_TABLE } from '../constants/millionaireXP';

const TOTAL_QUESTIONS = MILLIONAIRE_XP_TABLE.length;

const QUESTIONS = require('../../assets/quiz_questions.json');

function shuffle(arr) {
  return [...arr].map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}

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
export function buildMillionaireQuiz() {
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

  return selected;
}
