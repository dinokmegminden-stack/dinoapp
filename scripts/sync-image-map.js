#!/usr/bin/env node
// Végigmegy az assets/images/ mappán, és minden olyan kikommentelt
// IMAGE_MAP sort aktivál (kikommenteletlenít) a src/constants/imageMap.js-ben,
// amelynek a fájlja időközben megjelent a mappában.
//
// Futtatás: npm run sync-images (manuálisan), vagy automatikusan a
// SessionStart hookon keresztül minden Claude Code munkamenet elején.
//
// Szándékosan case-sensitive: ha a fájl léte csak kis/nagybetűben tér el
// a require()-ben szereplő névtől, NEM aktiválja automatikusan, hanem
// figyelmeztet — ugyanez a hiba okozott egy Vercel build-kiesést korábban
// (Windows nem érzékeny kis/nagybetűre, a Linux build igen).
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'assets', 'images');
const IMAGE_MAP_PATH = path.join(ROOT, 'src', 'constants', 'imageMap.js');

const COMMENTED_ENTRY = /^(\s*)\/\/\s*("(?:[^"\\]|\\.)*":\s*require\('\.\.\/\.\.\/assets\/images\/([^']+)'\),?)\s*$/;

function main() {
  const files = fs
    .readdirSync(IMAGES_DIR)
    .filter((f) => fs.statSync(path.join(IMAGES_DIR, f)).isFile());

  const exact = new Set(files);
  const byLowerCase = new Map();
  files.forEach((f) => byLowerCase.set(f.toLowerCase(), f));

  const lines = fs.readFileSync(IMAGE_MAP_PATH, 'utf8').split('\n');
  const activated = [];
  const caseWarnings = [];

  const updated = lines.map((line) => {
    const match = line.match(COMMENTED_ENTRY);
    if (!match) return line;
    const [, indent, entry, filename] = match;

    if (exact.has(filename)) {
      activated.push(filename);
      return `${indent}${entry}`;
    }

    const actualCasing = byLowerCase.get(filename.toLowerCase());
    if (actualCasing && actualCasing !== filename) {
      caseWarnings.push({ expected: filename, actual: actualCasing });
    }

    return line;
  });

  if (activated.length > 0) {
    fs.writeFileSync(IMAGE_MAP_PATH, updated.join('\n'));
    console.log(`imageMap.js: ${activated.length} kép aktiválva — ${activated.join(', ')}`);
  } else {
    console.log('imageMap.js: nincs új, aktiválható kép.');
  }

  if (caseWarnings.length > 0) {
    console.warn('\nFigyelem — kis/nagybetű eltérés, NEM lett automatikusan aktiválva:');
    caseWarnings.forEach(({ expected, actual }) => {
      console.warn(`  imageMap.js "${expected}" vár, de a mappában "${actual}" van. Nevezd át "${expected}"-re, vagy futtasd újra a szkriptet átnevezés után.`);
    });
  }
}

main();
