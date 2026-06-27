// regionProgress.js
// Régió- és pakk-szintű progress / unlock logika a Dínó Milliomos kártyajátékhoz.
// AsyncStorage-alapú, nickname szerint particionált, backend nélkül.

import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Konfiguráció: régiók és a bennük lévő pakkok sorrendje -----------------
// Minden régióhoz tetszőleges számú pakk tartozhat (10-30 dínó -> pl. 3-6 pakk).
// A packIds csak azonosítók; a tényleges dínólistát a *_dinosaurs.json fájlok tárolják.

export const REGION_ORDER = ['karpat_medence', 'europa', 'afrika', 'asia', 'america'];

export const REGION_PACKS = {
  karpat_medence: ['km_pack1', 'km_pack2', 'km_pack3'],
  europa: ['eu_pack1', 'eu_pack2', 'eu_pack3', 'eu_pack4', 'eu_pack5'],
  afrika: ['af_pack1', 'af_pack2'],
  asia: ['as_pack1', 'as_pack2', 'as_pack3', 'as_pack4'],
  america: ['am_pack1', 'am_pack2', 'am_pack3', 'am_pack4', 'am_pack5'],
};

const STORAGE_PREFIX = 'dino_progress_';
const PASS_THRESHOLD = 0.8; // 80%-os teszteredmény szükséges a pakk lezárásához

// --- Storage kulcs nickname szerint -----------------------------------------

function storageKey(nickname) {
  return `${STORAGE_PREFIX}${nickname}`;
}

// --- Alap progress objektum --------------------------------------------------
// Struktúra:
// {
//   karpat_medence: {
//     km_pack1: { quizPassed: true, bestScore: 1.0, attempts: 2 },
//     km_pack2: { quizPassed: false, bestScore: 0.6, attempts: 1 }
//   },
//   europa: { ... }
// }

function createEmptyProgress() {
  const progress = {};
  REGION_ORDER.forEach((region) => {
    progress[region] = {};
    REGION_PACKS[region].forEach((packId) => {
      progress[region][packId] = { quizPassed: false, bestScore: 0, attempts: 0 };
    });
  });
  return progress;
}

// --- Betöltés / mentés --------------------------------------------------------

export async function loadProgress(nickname) {
  try {
    const raw = await AsyncStorage.getItem(storageKey(nickname));
    if (!raw) return createEmptyProgress();

    const parsed = JSON.parse(raw);
    // Védelem: ha új régió/pakk került be a configba egy frissítéssel,
    // hiányzó kulcsokat pótoljuk, hogy ne dobjon hibát a régi mentett state.
    const merged = createEmptyProgress();
    REGION_ORDER.forEach((region) => {
      REGION_PACKS[region].forEach((packId) => {
        if (parsed[region]?.[packId]) {
          merged[region][packId] = parsed[region][packId];
        }
      });
    });
    return merged;
  } catch (e) {
    console.warn('loadProgress hiba, üres progress visszaadva:', e);
    return createEmptyProgress();
  }
}

export async function saveProgress(nickname, progress) {
  try {
    await AsyncStorage.setItem(storageKey(nickname), JSON.stringify(progress));
    return true;
  } catch (e) {
    console.warn('saveProgress hiba:', e);
    return false;
  }
}

// --- Pakk eredmény rögzítése ---------------------------------------------------

export async function recordPackQuizResult(nickname, regionId, packId, scoreRatio) {
  const progress = await loadProgress(nickname);
  const entry = progress[regionId]?.[packId];
  if (!entry) {
    console.warn(`Ismeretlen régió/pakk: ${regionId}/${packId}`);
    return progress;
  }

  entry.attempts += 1;
  entry.bestScore = Math.max(entry.bestScore, scoreRatio);
  if (scoreRatio >= PASS_THRESHOLD) {
    entry.quizPassed = true;
  }

  await saveProgress(nickname, progress);
  return progress;
}

// --- Pakk feloldási logika ------------------------------------------------------
// Egy pakk akkor nyitható, ha:
//  - ő az első pakk a régióban ÉS a régió maga is feloldott, VAGY
//  - az előző pakk a régióban már quizPassed === true

export function isPackUnlocked(regionId, packId, progress) {
  const packs = REGION_PACKS[regionId];
  if (!packs) return false;

  const packIdx = packs.indexOf(packId);
  if (packIdx === -1) return false;

  // Az első pakk feloldása a régió saját feloldásától függ
  if (packIdx === 0) {
    return isRegionUnlocked(regionId, progress);
  }

  const prevPackId = packs[packIdx - 1];
  return progress[regionId]?.[prevPackId]?.quizPassed === true;
}

// --- Régió feloldási logika -------------------------------------------------------
// Egy régió akkor nyitható, ha az előző régió ÖSSZES pakkja quizPassed === true.
// (Az első régió, karpat_medence, mindig nyitott.)

export function isRegionUnlocked(regionId, progress) {
  const idx = REGION_ORDER.indexOf(regionId);
  if (idx === -1) return false;
  if (idx === 0) return true;

  const prevRegion = REGION_ORDER[idx - 1];
  const prevPacks = REGION_PACKS[prevRegion];

  return prevPacks.every((packId) => progress[prevRegion]?.[packId]?.quizPassed === true);
}

// --- Segédfüggvények UI-hoz --------------------------------------------------------

// Hány pakk van kész egy régióban (progress bar-hoz)
export function regionCompletionRatio(regionId, progress) {
  const packs = REGION_PACKS[regionId];
  if (!packs || packs.length === 0) return 0;
  const passedCount = packs.filter((packId) => progress[regionId]?.[packId]?.quizPassed).length;
  return passedCount / packs.length;
}

// Teljes játék végigjátszási arány (összes pakk az 5 régióban)
export function overallCompletionRatio(progress) {
  let total = 0;
  let passed = 0;
  REGION_ORDER.forEach((region) => {
    REGION_PACKS[region].forEach((packId) => {
      total += 1;
      if (progress[region]?.[packId]?.quizPassed) passed += 1;
    });
  });
  return total === 0 ? 0 : passed / total;
}

// A következő még feloldható, de még nem teljesített pakk megkeresése
// (hasznos egy "Folytatás" gombhoz a főmenün)
export function findNextPack(progress) {
  for (const region of REGION_ORDER) {
    if (!isRegionUnlocked(region, progress)) continue;
    for (const packId of REGION_PACKS[region]) {
      if (!progress[region][packId].quizPassed && isPackUnlocked(region, packId, progress)) {
        return { region, packId };
      }
    }
  }
  return null; // mindent teljesített
}
