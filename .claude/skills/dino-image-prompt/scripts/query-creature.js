#!/usr/bin/env node
// Lekéri egy lény adatait a Supabase `creatures` táblából a DínóKép-prompt
// skillhez, és kiírja JSON-ként azokat a mezőket, amelyekből a prompt épül.
//
// Használat:
//   node query-creature.js "Struthiosaurus"
//   node query-creature.js "Struthiosaurus transylvanicus"
//
// A név a common_name VAGY a scientific_name ellen illeszkedik (részleges,
// kis/nagybetű-érzéketlen). Több találatnál listát ír és kilép, hogy te
// dönthess. A `derived` blokk a skill számára előszámolt, DETERMINISZTIKUS
// levezetéseket ad (ragadozó-e, paleontológus neme) — lásd SKILL.md.

const fs = require('fs');
const path = require('path');

// --- .env felkutatása felfelé (a skill a repón kívüli mappaszinten él) ---
function findRepoRoot(start) {
  let dir = start;
  for (let i = 0; i < 12; i++) {
    if (fs.existsSync(path.join(dir, '.env')) &&
        fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function loadEnv(root) {
  const raw = fs.readFileSync(path.join(root, '.env'), 'utf8');
  const env = {};
  raw.split('\n').forEach((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) return;
    let val = m[2].trim();
    // esetleges idézőjelek le
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[m[1]] = val;
  });
  return env;
}

// --- Determinisztikus levezetések ---
function isPredator(row) {
  const en = (row.diet_eng || '').toLowerCase();
  const hu = (row.diet_hu || '').toLowerCase();
  // Csak a tiszta húsevő "menekül". Mindenevő/növényevő/ismeretlen = nyugodt.
  return en.includes('carn') || hu.includes('ragadoz') || hu.includes('húsev');
}

// Névből számolt, stabil, ~fele-fele nem-váltakozás. A tudományos név
// betűinek (csak a-z) száma dönt: páros = nő, páratlan = férfi. Azért a
// scientific_name, mert az egyedibb és ritkábban ütközik, mint a köznapi.
function paleontologistGender(row) {
  const basis = (row.scientific_name || row.common_name || '').toLowerCase();
  const letters = (basis.match(/[a-z]/g) || []).length;
  return letters % 2 === 0 ? 'nő' : 'férfi';
}

// A prompt hosszhoz és a lépték-logikához használt méret: a max hossz, ennek
// híján a min. Ha egyik sincs, null.
function lengthM(row) {
  if (row.length_m_max != null) return Number(row.length_m_max);
  if (row.length_m_min != null) return Number(row.length_m_min);
  return null;
}

// Méretosztály egy ~1,7 m-es álló emberhez viszonyítva. Ez dönti el, hogy a
// figura hitelesen menekül-e (nagy állat) vagy fölényben van (kis állat).
//   large  = 3 m fölött (érdemben az ember fölé magasodik / hosszabb)
//   medium = 1.5–3 m (nagyjából ember-léptékű)
//   small  = 1.5 m alatt (az ember nagyobb nála)
// Ismeretlen hossznál medium a biztonságos alapértelmezés.
function sizeClass(row) {
  const L = lengthM(row);
  if (L == null) return 'medium';
  if (L >= 3) return 'large';
  if (L >= 1.5) return 'medium';
  return 'small';
}

// Kész angol emberi-klauzula a diet × méret mátrixból, a nemmel behelyettesítve.
// A lépték a lényeg: a viselkedés a valós méretaránnyal legyen hihető — nagy
// ragadozó elől menekül az ember, kis ragadozónál viszont az ember a nagyobb,
// ezért óvatosan megfigyel, nem retteg.
function humanClause(row) {
  const g = paleontologistGender(row) === 'nő' ? 'female' : 'male';
  const pred = isPredator(row);
  const size = sizeClass(row);
  const tail = 'drawn in the identical animated style, showing the scale difference.';

  if (pred) {
    if (size === 'large') {
      return `This dinosaur is a predator: it is shown in an active, menacing pose while a proportionally accurate modern ${g} human paleontologist character flees, running away from it in fear, ${tail}`;
    }
    if (size === 'medium') {
      return `This dinosaur is a predator: it is shown in an alert, threatening pose while a proportionally accurate modern ${g} human paleontologist character backs away warily, keeping a cautious distance, ${tail}`;
    }
    return `This dinosaur is a small predator, noticeably smaller than a human: it is shown in an active, agile pose while a proportionally accurate modern ${g} human paleontologist character crouches nearby, studying it warily at a safe distance, clearly larger than the animal, ${tail}`;
  }
  if (size === 'large') {
    return `This dinosaur is not a predator: it is shown in a calm, natural pose while a proportionally accurate modern ${g} human paleontologist character stands beside it, looking up in awe, ${tail}`;
  }
  return `This dinosaur is not a predator: it is shown in a calm, natural pose while a proportionally accurate modern ${g} human paleontologist character stands nearby, observing it calmly, ${tail}`;
}

async function main() {
  const query = process.argv.slice(2).join(' ').trim();
  if (!query) {
    console.error('Adj meg egy lény-nevet. Pl.: node query-creature.js "Struthiosaurus"');
    process.exit(1);
  }

  const root = findRepoRoot(__dirname);
  if (!root) {
    console.error('Nem találom a repo gyökerét (.env + package.json). Futtasd a DinoApp mappán belül.');
    process.exit(1);
  }

  const env = loadEnv(root);
  const url = env.EXPO_PUBLIC_SUPABASE_URL;
  const key = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('Hiányzik az EXPO_PUBLIC_SUPABASE_URL vagy _ANON_KEY a .env-ből.');
    process.exit(1);
  }

  let createClient;
  try {
    ({ createClient } = require('@supabase/supabase-js'));
  } catch (e) {
    console.error('Nem érhető el a @supabase/supabase-js. Futtasd a DinoApp repóból (node_modules kell).');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  // select('*') — robusztus: nem hasal el, ha egy oszlop (pl. image_url,
  // ami valójában nincs a táblában) hiányzik. A prompt csak a létező mezőket
  // olvassa; a hiányzók undefined-ként jönnek.
  const esc = query.replace(/[%,]/g, ' ');
  const { data, error } = await supabase
    .from('creatures')
    .select('*')
    .or(`common_name.ilike.%${esc}%,scientific_name.ilike.%${esc}%`);

  // A createClient után NEM hívunk process.exit()-et: a supabase-js keep-alive
  // socketje épp záródhat, és a process.exit ilyenkor Windows-on libuv
  // assertion-nel esik el. Helyette process.exitCode-ot állítunk és return-ölünk;
  // a node a socket kiürülése után magától, tisztán kilép a megfelelő kóddal.
  if (error) {
    console.error('Supabase hiba:', error.message || error);
    process.exitCode = 1;
    return;
  }
  if (!data || data.length === 0) {
    console.error(`Nincs találat erre: "${query}".`);
    process.exitCode = 2;
    return;
  }
  if (data.length > 1) {
    // Pontos egyezés előnyben (közel a köznapi/tudományos névhez)
    const exact = data.filter((r) =>
      (r.common_name || '').toLowerCase() === query.toLowerCase() ||
      (r.scientific_name || '').toLowerCase() === query.toLowerCase());
    if (exact.length !== 1) {
      console.error(`Több (${data.length}) találat. Pontosíts. Jelöltek:`);
      data.forEach((r) =>
        console.error(`  - ${r.common_name} (${r.scientific_name})`));
      process.exitCode = 3;
      return;
    }
    data.length = 0;
    data.push(exact[0]);
  }

  const row = data[0];
  const out = {
    ...row,
    derived: {
      is_predator: isPredator(row),
      length_m: lengthM(row),
      size_class: sizeClass(row),
      paleontologist_gender: paleontologistGender(row),
      // Kész angol mondat a prompt DIET-ágába — diet × méret alapján.
      human_clause: humanClause(row),
    },
  };

  console.log(JSON.stringify(out, null, 2));
  // Nincs process.exit(0): hagyjuk a node-ot magától, tisztán kilépni (lásd fent).
}

main().catch((e) => {
  console.error('Váratlan hiba:', e && e.message ? e.message : e);
  process.exitCode = 1;
});
