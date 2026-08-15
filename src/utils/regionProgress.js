// regionProgress.js
// Régió- és pakk-szintű progress / unlock logika a Dínó Milliomos kártyajátékhoz.
// AsyncStorage-alapú, nickname szerint particionált.
//
// HUB MODEL: a régiók egyenrangú választások, nincs lánc-feloldás köztük.
// Amerika Dél-re (edu=5) és Észak-ra (edu=6) bontva.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveProgressToServer } from '../services/playerProgressService';

// --- EDU → Megjelenített régiónév map (UI-hoz) ------------------------------


export const EDU_LABELS = {
  1: 'Kárpát-medence',
  2: 'Európa',
  3: 'Afrika',
  4: 'Ázsia',
  5: 'Dél-Amerika',
  6: 'Észak-Amerika',
  7: 'Ausztrália',
};

export const REGION_ORDER = [1, 2, 3, 4, 5, 6, 7];
export const STARTER_REGIONS = REGION_ORDER;

// A 99-es "bónusz" csomag (creatures.pack_number = 99) minden régióban a
// lánc VÉGÉN áll — a szekvenciális isPackUnlocked() logika miatt csak akkor
// nyílik ki, ha a régió összes rendes csomagja már teljesítve van.
export const BONUS_PACK = 99;

export const REGION_PACKS = {
  1: [1, 2, 3, BONUS_PACK],
  2: [1, 2, 3, 4, 5, BONUS_PACK],
  3: [1, 2, BONUS_PACK],
  4: [1, 2, 3, 4, 5, BONUS_PACK],
  5: [1, 2, 3, 4, BONUS_PACK],
  6: [1, 2, 3, 4, 5, BONUS_PACK],
  7: [1, 2],
};



// Régió string → edu szám (App.js routing kompatibilitás)
export const REGION_TO_EDU = {
  karpat: 1,
  europa: 2,
  afrika: 3,
  asia: 4,
  del_amerika: 5,
  eszak_amerika: 6,
  ausztralia: 7,
};

const STORAGE_PREFIX = 'dino_progress_v2_';
export const PASS_THRESHOLD = 0.8; // exportálva: RegionLevel.js is ezt használja a UI-gate-hez

// --- Storage kulcs nickname szerint -----------------------------------------

function storageKey(nickname) {
  return `${STORAGE_PREFIX}${nickname}`;
}

// --- Alap progress objektum --------------------------------------------------

export function createEmptyProgress() {
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

// Tetszőleges (esetleg HIÁNYOS) progress objektumot teljes kulcs-készletűre
// egészít ki (minden edu + pakk jelen). MINDEN progress-fogyasztó (findNextPack,
// overallCompletionRatio, regionCollectionStats, …) teljes alakot feltételez —
// a szerverről jövő nyers progress_data viszont lehet régi/hiányos, ezért mielőtt
// state-be tesszük, ezen átengedjük (különben render-időben elszáll → üres app).
export function mergeProgress(raw) {
  const parsed = raw || {};
  const merged = createEmptyProgress();
  REGION_ORDER.forEach((edu) => {
    REGION_PACKS[edu].forEach((packNum) => {
      if (parsed[edu]?.[packNum]) {
        merged[edu][packNum] = parsed[edu][packNum];
      }
    });
  });
  return merged;
}

export async function loadProgress(nickname) {
  try {
    const raw = await AsyncStorage.getItem(storageKey(nickname));
    if (!raw) return createEmptyProgress();
    return mergeProgress(JSON.parse(raw));
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

// Tiszta (I/O nélküli) mutáció — a vendég módnak kell, ahol a haladás csak a
// React state-ben él, sosem kerül AsyncStorage-ba (lásd App.js handlePassed).
export function applyPackQuizResult(progress, eduLevel, packNumber, scoreRatio) {
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

  return progress;
}

export async function recordPackQuizResult(nickname, eduLevel, packNumber, scoreRatio, playerId) {
  const progress = await loadProgress(nickname);
  applyPackQuizResult(progress, eduLevel, packNumber, scoreRatio);
  await saveProgress(nickname, progress);

  // Sync to server if playerId available
  if (playerId) {
    saveProgressToServer(playerId, progress).catch(err => {
      console.warn('Failed to sync progress to server:', err);
    });
  }

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

// Lény-alapú (nem csomag-alapú) gyűjtési statisztika — pl. "83 / 111 dínó".
// overallCompletionRatio() ehhez képest csomagok arányát adja (pl. 15/20 pakk),
// ami eltérő számot adna, mert a pakkok nem egyenlő méretűek.
export function creatureCollectionStats(allDinos, progress) {
  let collected = 0;
  let total = 0;
  (allDinos || []).forEach((dino) => {
    total += 1;
    if (progress?.[dino.edu]?.[dino.csomag]?.quizPassed === true) collected += 1;
  });
  return { collected, total };
}

// Régiónkénti (edu) gyűjtési statisztika a landing dashboardhoz: minden régióra
// { collected, total } — a total az adott edu összes lénye, a collected azoké,
// amelyek pakkja már teljesített kvízű (quizPassed). A creatureCollectionStats
// lény-alapú logikáját bontja régiókra.
export function regionCollectionStats(allDinos, progress) {
  const perEdu = {};
  REGION_ORDER.forEach((edu) => { perEdu[edu] = { collected: 0, total: 0 }; });
  (allDinos || []).forEach((dino) => {
    const edu = dino.edu;
    if (!perEdu[edu]) return;
    perEdu[edu].total += 1;
    if (progress?.[edu]?.[dino.csomag]?.quizPassed === true) perEdu[edu].collected += 1;
  });
  return perEdu;
}

export function findNextPack(progress) {
  const p = progress || {};
  for (const edu of REGION_ORDER) {
    if (!isRegionUnlocked(edu, p)) continue;
    for (const packNum of REGION_PACKS[edu]) {
      // Optional chaining: a szerverről jövő progress hiányos lehet (egy edu
      // vagy pakk kulcs nélkül) — ilyenkor a pakk "még nem teljesített", NEM
      // dobunk. (Enélkül a LandingPage render-időben hívott findNextPack
      // elszállt egy bejelentkezett usernél → üres képernyő.)
      if (!p[edu]?.[packNum]?.quizPassed && isPackUnlocked(edu, packNum, p)) {
        return { eduLevel: edu, packNumber: packNum };
      }
    }
  }
  return null;
}