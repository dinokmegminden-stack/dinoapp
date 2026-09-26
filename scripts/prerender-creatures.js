#!/usr/bin/env node
// SEO: minden lényhez statikus HTML-adatlapot generál a dist/dino/<slug>/ alá,
// mert az Expo single-page build a Google számára egy üres <div id="root">.
// Az `expo export` UTÁN fut (lásd `npm run build`), a friss Supabase-adatokból;
// a képet az IMAGE_MAP alapján a már exportált (hash-elt nevű) assetre linkeli, és újraírja a sitemap-et.
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SITE = 'https://dmmlexikon.hu';
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// Helyben a .env-ből, Vercelen a projekt env-változóiból jön.
try { process.loadEnvFile(path.join(ROOT, '.env')); } catch {}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const slugify = (s) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const range = (min, max, unit) => {
  if (min == null && max == null) return null;
  const fmt = (n) => Number(n).toLocaleString('hu-HU');
  return min != null && max != null && Number(min) !== Number(max)
    ? `${fmt(min)}–${fmt(max)} ${unit}`
    : `${fmt(min ?? max)} ${unit}`;
};

// Csak az aktív (nem kikommentelt) IMAGE_MAP-sorok: "Név": require('../../assets/images/fájl')
function readImageMap() {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'constants', 'imageMap.js'), 'utf8');
  const map = {};
  for (const m of src.matchAll(/^\s*"((?:[^"\\]|\\.)*)":\s*require\('\.\.\/\.\.\/assets\/images\/([^']+)'\)/gm)) {
    map[m[1]] = m[2];
  }
  return map;
}

const PAGE_CSS = `
  body{margin:0;font-family:system-ui,sans-serif;background:#1b1a17;color:#f3ecdc;line-height:1.6}
  main{max-width:760px;margin:0 auto;padding:24px 16px 48px}
  a{color:#f2b544}
  nav{font-size:14px;margin-bottom:16px}
  h1{margin:0 0 4px;font-size:32px;line-height:1.2}
  .sci{margin:0 0 20px;font-style:italic;opacity:.8}
  img{width:100%;height:auto;border-radius:12px;display:block}
  dl{display:grid;grid-template-columns:max-content 1fr;gap:6px 16px;margin:24px 0}
  dt{opacity:.7}dd{margin:0}
  .cta{display:inline-block;margin-top:16px;padding:12px 20px;background:#f2b544;color:#1b1a17;border-radius:999px;font-weight:700;text-decoration:none}
  ul.list{columns:2;padding-left:18px}
  @media (max-width:480px){ul.list{columns:1}}
`;

function layout({ title, description, canonical, image, body, jsonLd }) {
  return `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${canonical}" />
<link rel="icon" href="/favicon.ico" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="DMM Lexikon – Dínók Meg Minden (DMM)" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${image}" />
<meta property="og:locale" content="hu_HU" />
<meta name="twitter:card" content="summary_large_image" />
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : ''}
<style>${PAGE_CSS}</style>
</head>
<body><main>
${body}
</main></body>
</html>
`;
}

function creaturePage(c, slug, imagePath) {
  const url = `${SITE}/dino/${slug}/`;
  const image = imagePath ? `${SITE}${imagePath}` : `${SITE}/og-image.png`;
  const facts = [
    ['Tudományos név', c.scientific_name],
    ['Régió', c.region_hu],
    ['Időszak', [c.period_hu, c.epoch_hu].filter(Boolean).join(', ')],
    ['Kor', range(c.mya_start, c.mya_end, 'millió éve')],
    ['Hossz', range(c.length_m_min, c.length_m_max, 'm')],
    ['Tömeg', range(c.weight_kg_min, c.weight_kg_max, 'kg')],
    ['Táplálkozás', c.diet_hu],
    ['Felfedezés', [c.discovered_country, c.discovery_year].filter(Boolean).join(', ')],
  ].filter(([, v]) => v);

  const description = c.description_hu.length > 155
    ? c.description_hu.slice(0, 152).replace(/\s+\S*$/, '') + '…'
    : c.description_hu;

  return layout({
    title: `${c.common_name} (${c.scientific_name}) – őslény adatlap | DMM Lexikon`,
    description,
    canonical: url,
    image,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `${c.common_name} (${c.scientific_name})`,
      description,
      image,
      inLanguage: 'hu',
      url,
      publisher: { '@type': 'Organization', name: 'Dínók Meg Minden' },
    },
    body: `
<nav><a href="/">DMM Lexikon</a> › <a href="/dino/">Őslények</a> › ${esc(c.common_name)}</nav>
<article>
<h1>${esc(c.common_name)}</h1>
<p class="sci">${esc(c.scientific_name)}</p>
${imagePath ? `<img src="${imagePath}" alt="${esc(`${c.common_name} (${c.scientific_name}) rekonstrukciós illusztráció`)}" />` : ''}
<p>${esc(c.description_hu)}</p>
<dl>${facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
</article>
<p>Gyűjtsd be a(z) ${esc(c.common_name)} kártyáját, és teszteld a tudásod kvízekben – ingyen, regisztráció nélkül!</p>
<a class="cta" href="/">Játssz a DMM Lexikonnal</a>`,
  });
}

function indexPage(entries) {
  const byRegion = {};
  for (const e of entries) (byRegion[e.c.region_hu || 'Egyéb'] ||= []).push(e);
  const sections = Object.entries(byRegion)
    .sort(([a], [b]) => a.localeCompare(b, 'hu'))
    .map(([region, list]) => `<h2 id="${slugify(region)}">${esc(region)}</h2><ul class="list">${list
      .sort((a, b) => a.c.common_name.localeCompare(b.c.common_name, 'hu'))
      .map(({ c, slug }) => `<li><a href="/dino/${slug}/">${esc(c.common_name)}</a> <i>${esc(c.scientific_name)}</i></li>`)
      .join('')}</ul>`)
    .join('\n');

  return layout({
    title: 'Dinoszauruszok és őslények régiónként | DMM Lexikon',
    description: `${entries.length} dinoszaurusz és őslény adatlapja a Kárpát-medencétől Észak-Amerikáig: kor, méret, táplálkozás, lelőhely.`,
    canonical: `${SITE}/dino/`,
    image: `${SITE}/og-image.png`,
    body: `
<nav><a href="/">DMM Lexikon</a> › Őslények</nav>
<h1>Dinoszauruszok és őslények</h1>
<p>${entries.length} őslény adatlapja ${Object.keys(byRegion).length} régióból. Kattints bármelyikre, vagy <a href="/">gyűjtsd a kártyáikat a játékban</a>!</p>
${sections}`,
  });
}

async function main() {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    throw new Error('Nincs dist/index.html — előbb futtasd: expo export --platform web');
  }
  const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  const { data, error } = await supabase
    .from('creatures')
    .select('common_name,scientific_name,region_hu,period_hu,epoch_hu,diet_hu,mya_start,mya_end,length_m_min,length_m_max,weight_kg_min,weight_kg_max,discovered_country,discovery_year,description_hu')
    .neq('pack_number', 100);
  if (error) throw error;

  const imageMap = readImageMap();
  // Az expo export a képeket dist/assets/assets/images/<név>.<hash>.<kiterj> néven teszi ki.
  const exportedImages = {};
  for (const f of fs.readdirSync(path.join(DIST, 'assets', 'assets', 'images'))) {
    exportedImages[f.replace(/\.[0-9a-f]{32}(\.[^.]+)$/, '$1')] = `/assets/assets/images/${encodeURIComponent(f)}`;
  }
  const outDir = path.join(DIST, 'dino');
  fs.rmSync(outDir, { recursive: true, force: true });

  const entries = [];
  const seen = new Set();
  for (const c of data) {
    if (!c.common_name || !c.scientific_name || !c.description_hu) continue;
    const slug = slugify(c.scientific_name);
    if (seen.has(slug)) { console.warn(`Duplikált slug, kihagyva: ${slug}`); continue; }
    seen.add(slug);

    const dir = path.join(outDir, slug);
    fs.mkdirSync(dir, { recursive: true });
    const imagePath = exportedImages[imageMap[c.common_name]];
    fs.writeFileSync(path.join(dir, 'index.html'), creaturePage(c, slug, imagePath));
    entries.push({ c, slug });
  }
  fs.writeFileSync(path.join(outDir, 'index.html'), indexPage(entries));

  const urls = ['/', '/dino/', ...entries.map((e) => `/dino/${e.slug}/`)];
  fs.writeFileSync(
    path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${SITE}${u}</loc></url>`)
      .join('\n')}\n</urlset>\n`
  );
  console.log(`Prerender kész: ${entries.length} adatlap + /dino/ index, sitemap ${urls.length} URL.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
