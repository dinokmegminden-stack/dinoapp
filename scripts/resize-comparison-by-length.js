#!/usr/bin/env node
// A 20 Méretösszehasonlító-PNG szélességét a valódi hosszra (length_m, DB)
// állítja, PX_PER_METER arányban — a leghosszabb dínó lesz a legszélesebb
// kép pixelben is, nem csak futásidőben skálázva. Magasság arányosan követi
// (nincs torzítás). Csak assets/images/comparison alatt, human.png kimarad.
//
// Használat: node scripts/resize-comparison-by-length.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'assets', 'images', 'comparison');
const PX_PER_METER = 50.68571429;

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

async function main() {
  const env = loadEnv(path.join(ROOT, '.env'));
  const { createClient } = require(path.join(ROOT, 'node_modules', '@supabase', 'supabase-js'));
  const supabase = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

  const { data, error } = await supabase.from('creatures').select('*').in('common_name', COMPARISON_NAMES);
  if (error) {
    console.error('Supabase hiba:', error.message || error);
    process.exitCode = 1;
    return;
  }
  const byName = new Map(data.map((r) => [r.common_name, r]));

  for (const name of COMPARISON_NAMES) {
    const row = byName.get(name);
    const filePath = path.join(DIR, `${name}.png`);
    if (!row) {
      console.error(`HIBA: nincs Supabase találat "${name}"-ra, kihagyva`);
      continue;
    }
    if (!fs.existsSync(filePath)) {
      console.error(`HIBA: nincs fájl ${filePath}, kihagyva`);
      continue;
    }
    const lengthM = row.length_m_max ?? row.length_m_min;
    if (lengthM == null) {
      console.error(`HIBA: nincs length_m adat "${name}"-hoz, kihagyva`);
      continue;
    }
    // Előbb a valódi tartalom-bbox-ra vágunk (átlátszó margó eltávolítása) —
    // enélkül a fajonként eltérő üres szegély miatt a lábak nem ugyanarra a
    // pixel-magasságra esnének a dobozon belül, hiába egyezik a doboz alja.
    const trimmed = await sharp(filePath).trim().toBuffer();
    const targetWidth = Math.round(lengthM * PX_PER_METER);
    const buf = await sharp(trimmed).resize({ width: targetWidth }).png().toBuffer();
    fs.writeFileSync(filePath, buf);
    const meta = await sharp(buf).metadata();
    console.log(`${name}: ${lengthM} m -> ${meta.width}x${meta.height}px`);
  }
}

main().catch((e) => {
  console.error('Váratlan hiba:', e && e.message ? e.message : e);
  process.exitCode = 1;
});
