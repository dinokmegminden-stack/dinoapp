#!/usr/bin/env node
// Batch Gemini-prompt gyártó a Méretösszehasonlító képernyő 20 dínójához
// (src/constants/comparisonDinos.js COMPARISON_NAMES). Minden fajhoz lekéri
// a Supabase creatures sorát, és egy stílus-zárolt, oldalnézeti, átlátszó
// hátterű, fotórealisztikus promptot ír egy fájlba — ezt a felhasználó
// kézzel másolja be Geminibe (nincs API-hívás, nincs fájlírás a képekhez).
//
// Használat:
//   node scripts/generate-comparison-prompts.js
//   node scripts/generate-comparison-prompts.js --out=scripts/output/comparison-prompts.txt
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
// comparisonDinos.js requires RN-style PNG imports (require('*.png')) that
// plain Node can't load, so the name list is duplicated here rather than
// imported — keep this in sync with src/constants/comparisonDinos.js.
const COMPARISON_NAMES = [
  'Tyrannosaurus', 'Velociraptor', 'Spinosaurus', 'Giganotosaurus', 'Allosaurus',
  'Therizinosaurus', 'Dilophosaurus', 'Deinonychus', 'Carcharodontosaurus', 'Compsognathus',
  'Brachiosaurus', 'Diplodocus', 'Argentinosaurus', 'Apatosaurus', 'Iguanodon',
  'Parasaurolophus', 'Stegosaurus', 'Ankylosaurus', 'Triceratops', 'Pachycephalosaurus',
];

function loadEnv(envPath) {
  const out = {};
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function buildPrompt(row) {
  const name = row.scientific_name || row.common_name || row.name_hu;
  return `Photorealistic, full-body lateral (side) view of ${name}, standing in a neutral walking or standing pose on a plain flat ground line, facing left. Naturalistic skin/feather texture and coloring based on current paleoart consensus, accurate anatomy and proportions. Isolated on a transparent background — no scenery, no plants, no other animals, no text, no watermark. Even, soft studio-style lighting, no harsh shadows. Same rendering style, lighting, and camera framing as the rest of this series so the images can be placed side by side and compared by size.`;
}

async function main() {
  const outArg = process.argv.find((a) => a.startsWith('--out='));
  const outPath = outArg ? path.resolve(ROOT, outArg.slice('--out='.length)) : path.join(ROOT, 'scripts', 'output', 'comparison-prompts.txt');

  const env = loadEnv(path.join(ROOT, '.env'));
  const url = env.EXPO_PUBLIC_SUPABASE_URL;
  const key = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const { createClient } = require(path.join(ROOT, 'node_modules', '@supabase', 'supabase-js'));
  const supabase = createClient(url, key);

  const { data, error } = await supabase.from('creatures').select('*').in('common_name', COMPARISON_NAMES);
  if (error) {
    console.error('Supabase hiba:', error.message || error);
    process.exitCode = 1;
    return;
  }

  const byName = new Map(data.map((r) => [r.common_name, r]));
  const lines = [];
  COMPARISON_NAMES.forEach((name, i) => {
    const row = byName.get(name);
    if (!row) {
      lines.push(`### ${i + 1}. ${name} — HIBA: nincs Supabase találat common_name="${name}"-ra\n`);
      return;
    }
    lines.push(`### ${i + 1}. ${name} (${row.scientific_name || '?'})`);
    lines.push(`Fájlnév: assets/images/comparison/${name}.png (transparent PNG)`);
    lines.push(`Wikipedia referencia-kép URL: [TÖLTSD KI — life restoration kép a fajhoz]`);
    lines.push('');
    lines.push(buildPrompt(row));
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`Kiírva: ${outPath} (${data.length}/${COMPARISON_NAMES.length} faj)`);
}

main().catch((e) => {
  console.error('Váratlan hiba:', e && e.message ? e.message : e);
  process.exitCode = 1;
});
