// src/constants/millionaireXP.js
// "Legyen Ön is XP Milliomos" — pontozási tábla a design doc szerint.
// 10 kérdés, növekvő nehézség, max 100 XP. Nincs safety net: hibánál a már
// megszerzett XP megmarad, de a játék véget ér.

export const MILLIONAIRE_XP_TABLE = [
  { question: 1, difficulty: 'easy', xp: 4 },
  { question: 2, difficulty: 'easy', xp: 5 },
  { question: 3, difficulty: 'easy', xp: 6 },
  { question: 4, difficulty: 'easy', xp: 7 },
  { question: 5, difficulty: 'medium', xp: 9 },
  { question: 6, difficulty: 'medium', xp: 11 },
  { question: 7, difficulty: 'medium', xp: 13 },
  { question: 8, difficulty: 'hard', xp: 14 },
  { question: 9, difficulty: 'hard', xp: 15 },
  { question: 10, difficulty: 'hard', xp: 16 },
];

export const MILLIONAIRE_MAX_XP = 100;

// Nehézségi szintenként szükséges kérdésszám (4 easy, 3 medium, 3 hard)
export const MILLIONAIRE_DIFFICULTY_COUNTS = {
  easy: 4,
  medium: 3,
  hard: 3,
};

export const DIFFICULTY_LABELS = {
  easy: 'Könnyű',
  medium: 'Közepes',
  hard: 'Nehéz',
};
