#!/usr/bin/env node
// A Méretösszehasonlító képarányait build-időben égeti be egy statikus
// táblázatba (src/constants/comparisonImageDims.js), a PNG-k TÉNYLEGES
// pixelméretéből (sharp). A képernyő ezt importálja — nem Image onLoad-ból
// olvassa futásidőben, mert a natív méret az `onLoad` eseményből nem
// megbízhatóan érhető el minden platformon/build-en (pl. a statikus web
// exportban máshogy viselkedhet, mint az Expo dev szerveren) — ha az arány
// sosem frissül a valós méretre, a `resizeMode="contain"` a képet a rossz
// arányú dobozba "levelezőboríték"-ozza, és a dínó vizuálisan a doboz belsejében
// lebeg a talajvonal fölött, ahelyett hogy a doboz aljához simulna.
//
// Használat: node scripts/generate-comparison-dims.js
// Futtasd újra minden alkalommal, ha bármelyik comparison PNG lecserélődik.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'assets', 'images', 'comparison');
const OUT = path.join(ROOT, 'src', 'constants', 'comparisonImageDims.js');

const NAMES = [
  'Tyrannosaurus', 'Velociraptor', 'Spinosaurus', 'Giganotosaurus', 'Allosaurus',
  'Therizinosaurus', 'Dilophosaurus', 'Deinonychus', 'Carcharodontosaurus', 'Compsognathus',
  'Brachiosaurus', 'Diplodocus', 'Argentinosaurus', 'Apatosaurus', 'Iguanodon',
  'Parasaurolophus', 'Stegosaurus', 'Ankylosaurus', 'Triceratops', 'Pachycephalosaurus',
  'human',
];

async function main() {
  const entries = {};
  for (const name of NAMES) {
    const file = path.join(DIR, `${name}.png`);
    const meta = await sharp(file).metadata();
    entries[name] = { width: meta.width, height: meta.height };
  }

  const body = `// AUTO-GENERÁLT — ne szerkeszd kézzel, futtasd helyette:
//   node scripts/generate-comparison-dims.js
// A Méretösszehasonlító képernyő minden PNG-jének TÉNYLEGES pixelmérete,
// hogy a képarányt ne kelljen futásidőben (Image onLoad) kitalálni.
export const COMPARISON_IMAGE_DIMS = ${JSON.stringify(entries, null, 2)};
`;
  fs.writeFileSync(OUT, body, 'utf8');
  console.log(`Kiírva: ${OUT} (${NAMES.length} kép)`);
}

main().catch((e) => {
  console.error('Hiba:', e && e.message ? e.message : e);
  process.exitCode = 1;
});
