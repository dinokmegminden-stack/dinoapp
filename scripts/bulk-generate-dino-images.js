#!/usr/bin/env node
// Bulk-generálja a hiányzó dínó-kártyaképeket a data/missing_dino_image_prompts_*.txt
// promptjaiból + a felhasználó által gyűjtött referenciaképekből (image-to-image
// edit a Gemini API-val). Ez szándékosan ELTÉR a dino-image-prompt skill kézi
// munkafolyamatától (lásd .claude/skills/dino-image-prompt/SKILL.md) — a
// felhasználó kifejezetten tömeges, szkriptelt generálást kért.
//
// Futtatás: node scripts/bulk-generate-dino-images.js
// Előfeltétel: GEMINI_API_KEY a .env-ben.
//
// Miután lefutott: npm run sync-images (vagy a SessionStart hook) aktiválja
// az imageMap.js sorokat az újonnan létrejött assets/images/ fájlokhoz.

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash-image';
const PROMPTS_FILE = path.join(__dirname, '..', 'data', 'missing_dino_image_prompts_2026_07_27.txt');
const REFERENCE_DIR = 'C:\\Users\\Ryzen\\Desktop\\origin';
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'images');
const DELAY_MS = 6000; // szabad csomag rate-limitje miatt (kb. 10 kérés/perc)

// Egyedi fájlnév-felülbírálás ott, ahol a génusz-név nem elég (két szavas
// nevek, vagy ahol több jelölt fájl is van ugyanarra a lényre).
const NAME_OVERRIDES = {
  'Torvosaurus gurneyi': { key: 'torvosaurus_gurneyi', refHint: 'torvosaurus' },
  'Yi qi': { key: 'yi_qi', refHint: 'yiqi' },
  'Saltasaurus': { key: 'saltasaurus', refHint: 'saltasaurusab' }, // két Saltasaurus-kép közül az egy-alakos, nem a "two dinosaures"
};

function parsePrompts(text) {
  const blocks = text.split(/\n\[\d+\.\s*/).slice(1); // az első darab a fejléc, eldobjuk
  return blocks.map((block) => {
    const nameEnd = block.indexOf(']');
    const name = block.slice(0, nameEnd).trim();
    const prompt = block.slice(nameEnd + 1).trim();
    return { name, prompt };
  });
}

function genusHint(name) {
  const override = NAME_OVERRIDES[name];
  if (override) return override.refHint;
  return name.split(/\s+/)[0].toLowerCase();
}

function outputKey(name) {
  const override = NAME_OVERRIDES[name];
  if (override) return override.key;
  return name.toLowerCase();
}

function findReferenceFile(name, files) {
  const hint = genusHint(name);
  const matches = files.filter((f) => f.toLowerCase().replace(/[^a-z]/g, '').includes(hint.replace(/[^a-z]/g, '')));
  return matches[0] || null;
}

function extMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

async function editImage(prompt, imagePath) {
  const imageBytes = fs.readFileSync(imagePath);
  const mimeType = extMimeType(imagePath);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: imageBytes.toString('base64') } },
            ],
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inline_data || p.inlineData);
  if (!imagePart) {
    const textPart = parts.find((p) => p.text);
    throw new Error(`Nincs kép a válaszban. ${textPart ? `Modell szövege: ${textPart.text.slice(0, 200)}` : JSON.stringify(data).slice(0, 300)}`);
  }
  const inline = imagePart.inline_data || imagePart.inlineData;
  return Buffer.from(inline.data, 'base64');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!API_KEY) {
    console.error('Hiányzik a GEMINI_API_KEY a .env-ből.');
    process.exit(1);
  }
  if (!fs.existsSync(PROMPTS_FILE)) {
    console.error(`Nem található a prompt-fájl: ${PROMPTS_FILE}`);
    process.exit(1);
  }
  if (!fs.existsSync(REFERENCE_DIR)) {
    console.error(`Nem található a referenciakép-mappa: ${REFERENCE_DIR}`);
    process.exit(1);
  }

  const entries = parsePrompts(fs.readFileSync(PROMPTS_FILE, 'utf8'));
  const refFiles = fs.readdirSync(REFERENCE_DIR).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));

  console.log(`${entries.length} prompt betöltve, ${refFiles.length} referenciakép a mappában.\n`);

  const results = [];
  for (const { name, prompt } of entries) {
    const refFile = findReferenceFile(name, refFiles);
    if (!refFile) {
      console.warn(`[HIÁNYZIK] ${name}: nincs illeszkedő referenciakép, kihagyva.`);
      results.push({ name, status: 'no-reference' });
      continue;
    }

    const key = outputKey(name);
    const outPath = path.join(OUTPUT_DIR, `${key}.jpg`);
    process.stdout.write(`[${name}] <- ${refFile} ... `);

    try {
      const imageBuffer = await editImage(prompt, path.join(REFERENCE_DIR, refFile));
      fs.writeFileSync(outPath, imageBuffer);
      console.log(`OK -> assets/images/${key}.jpg`);
      results.push({ name, status: 'ok', outPath });
    } catch (err) {
      console.log(`HIBA: ${err.message}`);
      results.push({ name, status: 'error', error: err.message });
    }

    await sleep(DELAY_MS);
  }

  const ok = results.filter((r) => r.status === 'ok').length;
  const failed = results.filter((r) => r.status !== 'ok');
  console.log(`\n${ok}/${entries.length} kép elkészült.`);
  if (failed.length > 0) {
    console.log('Nem sikerült / kimaradt:');
    failed.forEach((f) => console.log(`  - ${f.name}: ${f.status === 'no-reference' ? 'nincs referenciakép' : f.error}`));
  }
  if (ok > 0) {
    console.log('\nFuttasd le: npm run sync-images  (aktiválja az imageMap.js sorokat)');
  }
}

main();
