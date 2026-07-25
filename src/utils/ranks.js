// ranks.js — XP-alapú rangrendszer a DínóTudóshoz. Kisiskolástól a professzorig,
// paleo-karrier ívvel. A küszöbök az ADOTT rang eléréséhez szükséges összes XP.
// A számok hangolhatók; a curve nagyjából duplázódik (első rangok gyorsan jönnek).
export const RANKS = [
  { min: 0, name: 'Tojásleső Kisiskolás', icon: '🥚' },
  { min: 400, name: 'Leletgyűjtő', icon: '🦴' },
  { min: 1200, name: 'Nyomkereső', icon: '🔍' },
  { min: 2800, name: 'Ásatásvezető', icon: '⛏️' },
  { min: 5500, name: 'Paleontológus', icon: '🦕' },
  { min: 10000, name: 'Dínó Professzor', icon: '🎓' },
];

// Az XP-hez tartozó aktuális rang + a következő rang és a felé mutató haladás.
// Visszaad: { index, rank, next (vagy null a csúcson), toNext, progress (0..1) }.
export function rankForXP(xp) {
  const x = Math.max(0, Number(xp) || 0);
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (x >= RANKS[i].min) index = i;
  }
  const rank = RANKS[index];
  const next = index < RANKS.length - 1 ? RANKS[index + 1] : null;
  const toNext = next ? Math.max(0, next.min - x) : 0;
  const span = next ? next.min - rank.min : 1;
  const progress = next ? Math.min(1, (x - rank.min) / span) : 1;
  return { index, rank, next, toNext, progress };
}
