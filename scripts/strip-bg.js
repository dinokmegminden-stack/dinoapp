#!/usr/bin/env node
// Gemini a "transparent background" kérésre gyakran nem valódi alfa-csatornát ad,
// hanem egy sík világosszürke/fehér hátteret fest bele a pixelekbe (opak PNG,
// alpha=255 mindenhol) — ez látszik a Méretösszehasonlító képernyőn szürke
// dobozként a dínó mögött. Ez a szkript a sarok-pixel színéből indulva
// flood-fill-lel megkeresi az összefüggő háttérrégiót (csak a szélekhez
// kapcsolódó, hasonló színű pixeleket — a dínó testén lévő hasonló árnyalatú
// foltokat nem bántja, mert azok nincsenek összekötve a szegéllyel), és
// alpha=0-ra állítja, lágy szegéllyel a levágás túl kemény éle ellen.
//
// Használat:
//   node scripts/strip-bg.js assets/images/comparison/Tyrannosaurus.png
//   node scripts/strip-bg.js assets/images/comparison/*.png   (shell glob)
const sharp = require('sharp');
const path = require('path');

const STEP_THRESHOLD = 22; // szín-távolság a SZOMSZÉD (már háttérnek jelölt) pixeltől

async function stripOne(filePath) {
  const img = sharp(filePath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const idx = (x, y) => (y * width + x) * channels;

  const distTo = (i, r, g, b) => {
    const dr = data[i] - r, dg = data[i + 1] - g, db = data[i + 2] - b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  // BFS flood-fill a szélektől befelé, de a színt mindig az ÉPPEN feldolgozott
  // (már háttérnek jelölt) szomszédhoz hasonlítjuk, nem egy fix mag-színhez —
  // így egy sík, de fokozatosan sötétedő/világosodó (vignette) hátteret is
  // végig bejár, miközben a dínó éles kontúrján megáll.
  const visited = new Uint8Array(width * height);
  const isBg = new Uint8Array(width * height);
  const queue = [];
  for (let x = 0; x < width; x++) { queue.push(x, 0); queue.push(x, height - 1); }
  for (let y = 0; y < height; y++) { queue.push(0, y); queue.push(width - 1, y); }
  for (let i = 0; i < queue.length; i += 2) {
    const p = queue[i + 1] * width + queue[i];
    visited[p] = 1;
    isBg[p] = 1;
  }

  let qi = 0;
  while (qi < queue.length) {
    const x = queue[qi++], y = queue[qi++];
    const p = y * width + x;
    const i0 = idx(x, y);
    const r = data[i0], g = data[i0 + 1], b = data[i0 + 2];
    const neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const np = ny * width + nx;
      if (visited[np]) continue;
      visited[np] = 1;
      const d = distTo(idx(nx, ny), r, g, b);
      if (d <= STEP_THRESHOLD) {
        isBg[np] = 1;
        queue.push(nx, ny);
      }
    }
  }

  for (let p = 0; p < width * height; p++) {
    if (isBg[p]) {
      data[p * channels + channels - 1] = 0;
    }
  }

  await sharp(data, { raw: { width, height, channels } })
    .png()
    .toFile(filePath + '.tmp.png');
  const fs = require('fs');
  fs.renameSync(filePath + '.tmp.png', filePath);
  console.log(`OK: ${path.basename(filePath)}`);
}

async function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('Adj meg legalább egy PNG útvonalat.');
    process.exitCode = 1;
    return;
  }
  for (const f of files) {
    await stripOne(f);
  }
}

main().catch((e) => {
  console.error('Hiba:', e && e.message ? e.message : e);
  process.exitCode = 1;
});
