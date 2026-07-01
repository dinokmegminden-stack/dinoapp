// src/screens/regionProgress.js

// --- Régiók csomagstruktúrája ---
// Minden régió egy tömb, amely a csomagok azonosítóit tartalmazza.
// A csomagok indexe: csomag - 1 (1. csomag → index 0)

export const REGION_PACKS = {
  karpat:  ['karpat_1', 'karpat_2', 'karpat_3'],
  europa:  ['europa_1', 'europa_2', 'europa_3', 'europa_4'],
  afrika:  ['afrika_1', 'afrika_2', 'afrika_3'],
  azsia:   ['azsia_1', 'azsia_2', 'azsia_3', 'azsia_4'],
  amerika: ['amerika_1', 'amerika_2', 'amerika_3'],
};

// --- Csomag feloldási logika ---
// A csomag akkor nyitható meg, ha:
// - az előző csomag tesztje hibátlan (quizPassed === true)
// - vagy ez az első csomag

export function isPackUnlocked(regionKey, packId, progress) {
  if (!regionKey || !packId) return false;

  const regionProgress = progress?.[regionKey];

  // Első csomag mindig nyitott
  const packs = REGION_PACKS[regionKey];
  const firstPack = packs?.[0];
  if (packId === firstPack) return true;

  // Előző csomag azonosítása
  const packIndex = packs.indexOf(packId);
  const prevPackId = packs[packIndex - 1];

  // Ha nincs előző csomag → hiba
  if (!prevPackId) return false;

  // Ha az előző csomag tesztje hibátlan → nyitott
  return regionProgress?.[prevPackId]?.quizPassed === true;
}
