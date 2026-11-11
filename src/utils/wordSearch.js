// wordSearch.js — a "Dínó Szókereső" játék rácsgenerátora. Kizárólag tiszta JS
// (nincs RN-függés), hogy node-dal is futtatható/ellenőrizhető legyen.
// A szavak a lények KÖZNAPI nevei (creatures.common_name = adaptCreature name_hu),
// nagybetűsítve, A-Z-re szűrve. A rács alap 20×20, 3 szó rejtve, 8 irányban.

const DIRECTIONS = [
  [0, 1], [1, 0], [1, 1], [1, -1],
  [0, -1], [-1, 0], [-1, -1], [-1, 1],
];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Ékezet-eltávolítás + A-Z szűrés (a magyar köznapi nevek gyakran genus-alakúak,
// de ez a normalizálás a biztonság kedvéért az ékezeteseket is kezeli).
export function normalizeWord(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

function randInt(n) {
  return Math.floor(Math.random() * n);
}

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Megpróbálja egy szót elhelyezni; átfedés csak ott engedett, ahol a betű egyezik.
function placeWord(grid, size, word) {
  for (const [dr, dc] of shuffled(DIRECTIONS)) {
    for (let attempt = 0; attempt < 200; attempt++) {
      const r0 = randInt(size);
      const c0 = randInt(size);
      const rEnd = r0 + dr * (word.length - 1);
      const cEnd = c0 + dc * (word.length - 1);
      if (rEnd < 0 || rEnd >= size || cEnd < 0 || cEnd >= size) continue;

      const cells = [];
      let ok = true;
      for (let i = 0; i < word.length; i++) {
        const r = r0 + dr * i;
        const c = c0 + dc * i;
        const existing = grid[r][c];
        if (existing !== null && existing !== word[i]) { ok = false; break; }
        cells.push([r, c]);
      }
      if (!ok) continue;

      cells.forEach(([r, c], i) => { grid[r][c] = word[i]; });
      return cells;
    }
  }
  return null; // nem fért el (a hívó kihagyja)
}

// { grid: string[][], placements: [{ word, cells:[[r,c]...] }] }
// A ténylegesen elhelyezett szavak listája jön vissza (a be nem féröket eldobja).
export function generateWordSearch(rawWords, size = 20) {
  const words = rawWords
    .map(normalizeWord)
    .filter((w) => w.length >= 3 && w.length <= size);

  const grid = Array.from({ length: size }, () => Array(size).fill(null));
  const placements = [];
  for (const word of words.sort((a, b) => b.length - a.length)) {
    const cells = placeWord(grid, size, word);
    if (cells) placements.push({ word, cells });
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === null) grid[r][c] = LETTERS[randInt(26)];
    }
  }
  return { grid, placements };
}

// A két megkoppintott cella közti egyenes (vízszintes/függőleges/átlós) cellái,
// vagy null, ha a két pont nem egy engedett egyenesen van.
export function lineCells([r0, c0], [r1, c1]) {
  const dr = Math.sign(r1 - r0);
  const dc = Math.sign(c1 - c0);
  const lenR = Math.abs(r1 - r0);
  const lenC = Math.abs(c1 - c0);
  if (!(lenR === 0 || lenC === 0 || lenR === lenC)) return null; // nem egyenes
  const steps = Math.max(lenR, lenC);
  const cells = [];
  for (let i = 0; i <= steps; i++) cells.push([r0 + dr * i, c0 + dc * i]);
  return cells;
}

function cellKey([r, c]) { return `${r},${c}`; }

// Egy kijelölés (cellalista) megfelel-e egy elhelyezett szónak — irányfüggetlen,
// halmaz-egyenlőség (előre/hátra is jó). A talált szó indexét adja vissza, vagy -1.
export function matchSelection(selectionCells, placements) {
  if (!selectionCells) return -1;
  const selKeys = new Set(selectionCells.map(cellKey));
  return placements.findIndex(
    (p) => p.cells.length === selKeys.size && p.cells.every((c) => selKeys.has(cellKey(c)))
  );
}
