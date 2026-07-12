// regionProgress.js
// Régió- és pakk-szintű progress / unlock logika a Dínó Milliomos kártyajátékhoz.
// AsyncStorage-alapú, nickname szerint particionált.
//
// HUB MODEL: a régiók egyenrangú választások, nincs lánc-feloldás köztük.
// Amerika Dél-re (edu=5) és Észak-ra (edu=6) bontva.

import AsyncStorage from '@react-native-async-storage/async-storage';

// --- EDU → Megjelenített régiónév map (UI-hoz) ------------------------------


export const EDU_LABELS = {
  1: 'Kárpát-medence',
  2: 'Európa',
  3: 'Afrika',
  4: 'Ázsia',
  5: 'Dél-Amerika',
  6: 'Észak-Amerika',
};

export const REGION_ORDER = [1, 2, 3, 4, 5, 6];
export const STARTER_REGIONS = REGION_ORDER;

export const REGION_PACKS = {
  1: [1, 2, 3],
  2: [1, 2, 3, 4, 5],
  3: [1, 2],
  4: [1, 2, 3, 4, 5],
  5: [1, 2, 3, 4],
  6: [1, 2, 3, 4, 5],
};



// Régió string → edu szám (App.js routing kompatibilitás)
export const REGION_TO_EDU = {
  karpat: 1,
  europa: 2,
  afrika: 3,
  asia: 4,
  del_amerika: 5,
  eszak_amerika: 6,
};

const STORAGE_PREFIX = 'dino_progress_v2_';
export const PASS_THRESHOLD = 0.8; // exportálva: RegionLevel.js is ezt használja a UI-gate-hez

// --- Storage kulcs nickname szerint -----------------------------------------

function storageKey(nickname) {
  return `${STORAGE_PREFIX}${nickname}`;
}

// --- Alap progress objektum --------------------------------------------------

function createEmptyProgress() {
  const progress = {};
  REGION_ORDER.forEach((edu) => {
    progress[edu] = {};
    REGION_PACKS[edu].forEach((packNum) => {
      progress[edu][packNum] = { quizPassed: false, bestScore: 0, attempts: 0 };
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
    const merged = createEmptyProgress();
    REGION_ORDER.forEach((edu) => {
      REGION_PACKS[edu].forEach((packNum) => {
        if (parsed[edu]?.[packNum]) {
          merged[edu][packNum] = parsed[edu][packNum];
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

export async function recordPackQuizResult(nickname, eduLevel, packNumber, scoreRatio) {
  const progress = await loadProgress(nickname);
  const entry = progress[eduLevel]?.[packNumber];
  if (!entry) {
    console.warn(`Ismeretlen edu/pakk: ${eduLevel}/${packNumber}`);
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
// Az 1. csomag nyitott, ha a régió maga fel van oldva (hub modelben mindig).
// Többi csomagnál: az előző pack quizPassed === true kell.

export function isPackUnlocked(eduLevel, packNumber, progress) {
  const packs = REGION_PACKS[eduLevel];
  if (!packs) return false;

  const packIdx = packs.indexOf(packNumber);
  if (packIdx === -1) return false;

  if (packIdx === 0) {
    return isRegionUnlocked(eduLevel, progress);
  }

  const prevPackNum = packs[packIdx - 1];
  return progress[eduLevel]?.[prevPackNum]?.quizPassed === true;
}

// --- Régió feloldási logika -------------------------------------------------------
// Hub model: minden régió egyenrangú, egyik sincs másikhoz láncolva.

export function isRegionUnlocked(eduLevel, progress) {
  return REGION_ORDER.includes(eduLevel);
}

// --- Segédfüggvények UI-hoz --------------------------------------------------------

export function regionCompletionRatio(eduLevel, progress) {
  const packs = REGION_PACKS[eduLevel];
  if (!packs || packs.length === 0) return 0;
  const passedCount = packs.filter((packNum) => progress[eduLevel]?.[packNum]?.quizPassed).length;
  return passedCount / packs.length;
}

export function overallCompletionRatio(progress) {
  let total = 0;
  let passed = 0;
  REGION_ORDER.forEach((edu) => {
    REGION_PACKS[edu].forEach((packNum) => {
      total += 1;
      if (progress[edu]?.[packNum]?.quizPassed) passed += 1;
    });
  });
  return total === 0 ? 0 : passed / total;
}

export function findNextPack(progress) {
  for (const edu of REGION_ORDER) {
    if (!isRegionUnlocked(edu, progress)) continue;
    for (const packNum of REGION_PACKS[edu]) {
      if (!progress[edu][packNum].quizPassed && isPackUnlocked(edu, packNum, progress)) {
        return { eduLevel: edu, packNumber: packNum };
      }
    }
  }
  return null;
}