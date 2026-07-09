// src/constants/millionaireXP.js
// "Legyen Ön is XP Milliomos" — pontozási tábla a design doc szerint.
// 15 kérdés, növekvő nehézség, max 200 XP. Nincs safety net: hibánál a már
// megszerzett XP megmarad, de a játék véget ér.
// A max XP szándékosan nem arányos a 10-kérdéses verzió 100 XP-jével —
// a Milliomos kivétel a többi aktivitás XP/órás egyensúlyához képest,
// és a hibátlan 15/15 objektíve nehezebb, mint a régi 10/10 volt.

export const MILLIONAIRE_XP_TABLE = [
  { question: 1, difficulty: 'easy', xp: 4 },
  { question: 2, difficulty: 'easy', xp: 5 },
  { question: 3, difficulty: 'easy', xp: 6 },
  { question: 4, difficulty: 'easy', xp: 7 },
  { question: 5, difficulty: 'easy', xp: 8 },
  { question: 6, difficulty: 'medium', xp: 10 },
  { question: 7, difficulty: 'medium', xp: 11 },
  { question: 8, difficulty: 'medium', xp: 12 },
  { question: 9, difficulty: 'medium', xp: 13 },
  { question: 10, difficulty: 'medium', xp: 14 },
  { question: 11, difficulty: 'hard', xp: 17 },
  { question: 12, difficulty: 'hard', xp: 19 },
  { question: 13, difficulty: 'hard', xp: 22 },
  { question: 14, difficulty: 'hard', xp: 25 },
  { question: 15, difficulty: 'hard', xp: 27 },
];

export const MILLIONAIRE_MAX_XP = 200;

// Nehézségi szintenként szükséges kérdésszám (5 easy, 5 medium, 5 hard)
export const MILLIONAIRE_DIFFICULTY_COUNTS = {
  easy: 5,
  medium: 5,
  hard: 5,
};

export const DIFFICULTY_LABELS = {
  easy: 'Könnyű',
  medium: 'Közepes',
  hard: 'Nehéz',
};
