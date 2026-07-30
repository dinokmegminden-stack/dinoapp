#!/usr/bin/env node
// DínóKép-generáló pipeline: origin/ mappában lévő referenciaképekből Gemini
// image-edit API-val gyárt kártyaképet (festői stílus, méretarányos ember,
// ragadozóknál üldözés-kompozíció), majd sharp-alapú automata ellenőrzéssel
// kiszűri a visszatérő hibákat (fekete/fehér keret, letterbox-csík) és
// újrapróbálja a hibás generálásokat, mielőtt beírná assets/images alá.
//
// Használat:
//   node scripts/generate-dino-images.js --dry                 (csak promptok, nincs API hívás)
//   node scripts/generate-dino-images.js                       (JOBS teljes futtatása)
//   node scripts/generate-dino-images.js --only=Acrocanthosaurus,Maip
//   node scripts/generate-dino-images.js --scan                (JOBS helyett az origin-mappa
//                                                                fájljaiból generál listát —
//                                                                a fájlnév = common_name.ext)
//   node scripts/generate-dino-images.js --out-dir=<mappa>     (assets/images helyett ide ment)
//
// Az origin-mappa útvonala: DINO_ORIGIN_DIR env, alapértelmezetten
// C:\Users\<user>\Desktop\origin — ez lokális, felhasználófüggő mappa,
// nincs a repóban.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN_DIR = process.env.DINO_ORIGIN_DIR || path.join(require('os').homedir(), 'Desktop', 'origin');
const IMAGES_DIR = path.join(ROOT, 'assets', 'images');
let IMAGES_DIR_OVERRIDE = null;

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

const env = loadEnv(path.join(ROOT, '.env'));
const GEMINI_KEY = env.GEMINI_API_KEY;
const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const { createClient } = require(path.join(ROOT, 'node_modules', '@supabase', 'supabase-js'));
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// origin fájl -> { common_name (DB kulcs), out (cél fájlnév assets/images alatt) }
const JOBS = [
  { origin: 'Acrocanthosaurus_atokensis.png', common_name: 'Acrocanthosaurus', out: 'acrocanthosaurus.jpg' },
  { origin: 'Aegyptosaurus_LM.png', common_name: 'Aegyptosaurus', out: 'aegyptosaurus.jpg' },
  { origin: 'AmpelosaurusDB.jpg', common_name: 'Ampelosaurus', out: 'ampelosaurus.jpg' },
  { origin: 'Anchiornis_martyniuk.png', common_name: 'Anchiornis', out: 'anchiornis.jpg' },
  { origin: 'Carnotaurus_Reconstruction_(2022).png', common_name: 'Carnotaurus', out: 'carnotaurus.jpg' },
  { origin: 'Dacentrurus_armatus.png', common_name: 'Dacentrurus', out: 'dacentrurus.jpg' },
  { origin: 'Dilophosaurus_wetherilli.png', common_name: 'Dilophosaurus', out: 'dilophosaurus.jpg' },
  { origin: 'Edmontonia_dinosaur.png', common_name: 'Edmontonia', out: 'edmontonia.jpg' },
  { origin: 'Herrerasaurus_ischigualastensis_Illustration.jpg', common_name: 'Herrerasaurus', out: 'herrerasaurus.jpg' },
  { origin: 'Jakapil_TD.png', common_name: 'Jakapil', out: 'jakapil.jpg' },
  { origin: 'Jobaria_tiguidensis_steveoc.jpg', common_name: 'Jobaria', out: 'jobaria.jpg' },
  { origin: 'Life_reconstruction_of_Corythosaurus_casuarius.png', common_name: 'Corythosaurus', out: 'corythosaurus.jpg' },
  { origin: 'Maip_macrothorax_reconstruction.jpg', common_name: 'Maip', out: 'maip.jpg' },
  { origin: 'Minmi_paravertebra_dinosauria.png', common_name: 'Minmi', out: 'minmi.jpg' },
  { origin: 'Pachycephalosaurus_Reconstruction.jpg', common_name: 'Pachycephalosaurus', out: 'pachycephalosaurus.jpg' },
  { origin: 'Pycnonemosaurus_restoration_2020.jpg', common_name: 'Pycnonemosaurus', out: 'pycnonemosaurus.jpg' },
  { origin: 'Riojasaurus_NT.jpg', common_name: 'Riojasaurus', out: 'riojasaurus.jpg' },
  { origin: 'Rugops_(cropped).png', common_name: 'Rugops', out: 'rugops.jpg' },
  { origin: 'saltasaurusAB-56a252bb3df78cf7727469bb.jpg', common_name: 'Saltasaurus', out: 'saltasaurus.jpg' },
  { origin: 'Sauroposeidon_proteles.jpg', common_name: 'Sauroposeidon', out: 'sauroposeidon.jpg' },
  { origin: 'Sinraptor_NT.jpg', common_name: 'Sinraptor', out: 'sinraptor.jpg' },
  { origin: 'Supersaurus_dinosaur.png', common_name: 'Supersaurus', out: 'supersaurus.jpg' },
  { origin: 'Torvosaurus_tanneri_Reconstruction.png', common_name: 'Torvosaurus', out: 'torvosaurus.jpg' },
  { origin: 'Unenlagia_comahuensis_.jpg', common_name: 'Unenlagia', out: 'unenlagia.jpg' },
  { origin: 'Yiqi_NT.jpg', common_name: 'Yi qi', out: 'yi_qi.jpg' },
  { origin: 'Zhuchengtyrannus_magnus_reconstruction.jpg', common_name: 'Zhuchengtyrannus', out: 'zhuchengtyrannus.jpg' },
  { origin: 'diamantinasaurus.png', common_name: 'Diamantinasaurus', out: 'diamantisaurus.jpg' },
];

const COUNTRY_HU_EN = {
  'Amerikai Egyesült Államok': 'United States',
  'Argentína': 'Argentina',
  'Kína': 'China',
  'Németország': 'Germany',
  'Marokkó': 'Morocco',
  'Ausztrália': 'Australia',
  'Egyiptom': 'Egypt',
  'Niger': 'Niger',
  'Brazília': 'Brazil',
  'Kanada': 'Canada',
  'Franciaország': 'France',
  'Anglia': 'England',
  'Egyesült Királyság': 'United Kingdom',
  'Portugália': 'Portugal',
  'Mongólia': 'Mongolia',
};

const EPOCH_HU_EN = {
  'kora': 'Early',
  'közép': 'Middle',
  'közepső': 'Middle',
  'késő': 'Late',
};

const PERIOD_HU_EN = {
  'Triász': 'Triassic',
  'Jura': 'Jurassic',
  'Kréta': 'Cretaceous',
};

function englishEra(row) {
  const period = PERIOD_HU_EN[row.period_hu] || row.period_hu || 'Mesozoic';
  const epochRaw = (row.epoch_hu || '').split('-')[0];
  const epoch = EPOCH_HU_EN[epochRaw];
  return epoch ? `${epoch} ${period}` : period;
}

function englishLocation(row) {
  const country = COUNTRY_HU_EN[row.discovered_country] || row.discovered_country || '';
  return country ? `(${country})` : '';
}

const HUMAN_HEIGHT_M = 1.75;
const CANVAS_W = 1344;
const CANVAS_H = 768;
const HUMAN_PX = 260; // ~mid-ground human figure height in px, used as the anchor for the math below

function sizeAnalogy(ratio) {
  if (ratio < 1) return 'SMALLER than the human — about cat or small-dog sized';
  if (ratio < 1.5) return 'about the size of a large dog, roughly human-height in length — nowhere near "movie dinosaur" scale';
  if (ratio < 2.5) return 'about the size of a wolf or large deer — noticeably longer than the human is tall, but still a modest, low-key animal, NOT towering';
  if (ratio < 4) return 'about the size of a horse or a small car';
  if (ratio < 6) return 'about the size of a large SUV or minivan';
  if (ratio < 9) return 'about the size of a school bus';
  if (ratio < 14) return 'about the length of two school buses end to end';
  return 'genuinely gigantic — three or more school buses end to end';
}

function buildPrompt(row) {
  const era = englishEra(row);
  const loc = englishLocation(row);
  const humanClause = row.derived.human_clause;
  const length = row.derived.length_m != null ? row.derived.length_m : null;
  const ratio = length != null ? (length / HUMAN_HEIGHT_M) : null;
  const ratioTxt = ratio != null ? ratio.toFixed(2) : '?';
  const targetPx = ratio != null ? Math.round(ratio * HUMAN_PX) : null;
  const targetPct = targetPx != null ? Math.round((targetPx / CANVAS_W) * 100) : null;
  const analogy = ratio != null ? sizeAnalogy(ratio) : '';

  const scaleClause = length != null
    ? `CRITICAL SCALE CHECK — this is the single most important rule, more important than matching the source image's framing. The on-canvas SIZE/SCALE of the dinosaur is explicitly NOT covered by the "keep 90-95% unchanged" instruction above — you must freely rescale the dinosaur smaller if needed, even if that makes it look very different in scale from how it appeared in the source reference image (the source has no human for scale and cannot be trusted for size).

Real math: dinosaur body length ${length} m ÷ human height ${HUMAN_HEIGHT_M} m = ${ratioTxt}. In plain terms, this animal is ${analogy}.

Canvas is ${CANVAS_W}x${CANVAS_H}px. If the human figure is drawn at a natural ~${HUMAN_PX}px standing height, the dinosaur's ENTIRE nose-to-tail length must span only about ${targetPx}px on the canvas — roughly ${targetPct}% of the canvas width. If your drawn dinosaur would span more of the canvas width than that, it is WRONG — make it smaller and move it further from camera / give it more surrounding empty scenery, do not let it dominate the frame just because the reference artwork did.${ratio != null && ratio < 0.35 ? `

EXTREME SIZE WARNING — this animal's real length (${length} m) is only ${ratioTxt}x the human's height — it is genuinely tiny, roughly crow/pigeon-sized or smaller. Illustrators (and AI models) very commonly and WRONGLY inflate small animals to make them "visible/readable" — resist that urge. It will not look cat-sized or dog-sized; keep it small and let the human's pose (crouching, looking down, reaching down) carry the sense of scale instead of enlarging the animal.` : ''}`
    : '';

  return `Edit the attached image instead of generating a new one. Keep the dinosaur's anatomy, colors, and pose 90-95% unchanged — but you may fully repaint its surface rendering/texture to match the target art style described below if the source image is a flat vector/line-art diagram rather than a painted illustration. Anatomical integrity is mandatory: the dinosaur has exactly ONE head, ONE tail, and the correct number of limbs for its species — never duplicate, double, or leave a ghosted/overlapping second copy of any body part (this is a common editing artifact to avoid).

A full-body, wide-angle long shot: a painterly picture-book illustration depiction of the ${row.scientific_name} dinosaur in a natural ${era} environment with minimal, era-appropriate vegetation, set in ${row.region_hu === 'Kárpát-medence' ? 'the Carpathian Basin' : 'the region'} ${loc}. The environment is spacious and open, stretching out around the subjects — a wide field/clearing with the horizon well below the top of the frame — so both the dinosaur and the human read as small figures within a large scene, not a tight close-up. Painterly picture-book illustration style, rich visible brushwork and texture, warm natural lighting, soft atmospheric depth in the background (gentle haze/blur, not sharp-focus render), muted-but-rich natural color palette, illustrative rendering rather than 3D-render or photoreal — like a premium natural-history children's book double-page spread. Soft, painterly edges instead of clean vector lines. The whole image (dinosaur, human, background) must share ONE consistent painterly rendering style — no mixing a flat/line-art subject with a painted background.

The sky is always clear blue, visible in the composition.

${scaleClause}

${humanClause}

HEAD-SIDE POSITIONING — applies regardless of which behavior clause above was used: first identify which direction the dinosaur's head/face is pointing. The human MUST be positioned on that same side (the head/face side), never on the tail side — a human standing near the tail while the head is on the far side of the picture reads as wrong and disconnected, no matter the pose. Mirror/flip the dinosaur horizontally if that's what it takes to put the head on the same side as the human.

DISTANCE BETWEEN THEM — there must be a clearly visible gap of open ground between the human and the dinosaur, but keep it modest: roughly one to two human-body-widths of empty space, not touching/overlapping, but ALSO not a huge stretch of empty ground between them. Do NOT shrink both figures down further just to manufacture a bigger gap — the correct move is a small-to-moderate gap while keeping the dinosaur and human as large as the scale/safe-zone rules above allow. They should read as part of the same close encounter/moment together, not as two distant, separate figures.

COMPOSITION — mandatory hard boundary, check this last before finishing: this must be a full shot / long shot with a spacious, open composition and ample negative space around the subjects — avoid close-ups, avoid tight cropping, avoid macro/portrait framing. Both the dinosaur (nose to tail tip) and the human (head to toe) must be shown completely and read entirely within the frame — no limbs, tails, crests, or heads cut off by the edge of the canvas, ever.

Concretely: draw an invisible safe-zone box starting ${Math.round(CANVAS_W * 0.12)}px from the left edge and ${Math.round(CANVAS_W * 0.12)}px from the right edge (i.e. only the middle ${Math.round(CANVAS_W * 0.76)}px of the ${CANVAS_W}px-wide canvas), and ${Math.round(CANVAS_H * 0.1)}px from the top and bottom edges. EVERY part of the dinosaur — nose, tail tip, crest, claws, wingtips, everything — and the ENTIRE human figure including their feet/boots must be fully INSIDE this safe-zone box, centered with plenty of room around the subjects. The nose touching the left edge, the tail touching the right edge, or the human's boots/head touching the top or bottom edge is WRONG, every time, no exceptions — if the dinosaur is too long to fit inside the safe-zone at the size you drew it, you MUST shrink the whole dinosaur+human group down further until it fits, even if that makes them look small on the canvas. Outside the safe-zone box, on every side, there must be visible, fully-painted empty scenery (sky/ground/plants) with nothing cropped — this is the required breathing room, the negative space that makes the composition feel spacious rather than crowded. Do not zoom in tightly, ever. If in doubt, draw the dinosaur+human group noticeably SMALLER than your first instinct — a composition that looks 'too small' with lots of open scenery around it is CORRECT and desired, a composition that fills the frame or crops any part of either subject is WRONG. NO letterbox bars, NO black bars, NO colored bars of any kind at the top or bottom of the image — the sky and ground must be painted scenery reaching fully to the top and bottom canvas edges.

ABSOLUTELY NO WHITE BORDER, NO PICTURE FRAME, NO MAT, NO PAPER MARGIN, NO BLANK/EMPTY CANVAS AROUND THE IMAGE. NO decorative rectangle, frame, border-box, or vignette outline drawn on top of the scene anywhere in the image. The painted scene must fill the entire 16:9 canvas corner to corner, edge to edge, with zero border of any color — the extra space is created by making the dinosaur and human smaller within the fully-painted scene, never by adding blank space, a frame, or a mat around the artwork.

If the reference image contains a plain grey human silhouette used only as an internal scale marker, IGNORE and DO NOT preserve that silhouette; replace it entirely with your own fully rendered, clothed human paleontologist character per the instructions above, in the correct pose and scale.`;
}

async function fetchCreature(name) {
  const esc = name.replace(/[%,]/g, ' ');
  const { data, error } = await supabase
    .from('creatures')
    .select('*')
    .or(`common_name.ilike.%${esc}%,scientific_name.ilike.%${esc}%`);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error(`Nincs talalat: ${name}`);
  let row = data[0];
  if (data.length > 1) {
    const exact = data.find((r) => (r.common_name || '').toLowerCase() === name.toLowerCase());
    if (exact) row = exact;
  }
  return row;
}

function isPredator(row) {
  const en = (row.diet_eng || '').toLowerCase();
  const hu = (row.diet_hu || '').toLowerCase();
  return en.includes('carn') || hu.includes('ragadoz') || hu.includes('húsev');
}
function paleontologistGender(row) {
  const basis = (row.scientific_name || row.common_name || '').toLowerCase();
  const letters = (basis.match(/[a-z]/g) || []).length;
  return letters % 2 === 0 ? 'nő' : 'férfi';
}
function lengthM(row) {
  if (row.length_m_max != null) return Number(row.length_m_max);
  if (row.length_m_min != null) return Number(row.length_m_min);
  return null;
}
function sizeClass(row) {
  const L = lengthM(row);
  if (L == null) return 'medium';
  if (L >= 3) return 'large';
  if (L >= 1.5) return 'medium';
  return 'small';
}
function humanClause(row) {
  const g = paleontologistGender(row) === 'nő' ? 'female' : 'male';
  const pred = isPredator(row);
  const size = sizeClass(row);
  const tail = 'drawn in the identical painterly style, showing the scale difference.';
  if (pred) {
    if (size === 'large') return `This dinosaur is a predator, actively chasing the human to eat them, running/lunging toward the RIGHT side of the canvas with its mouth open. You MUST horizontally mirror/flip the entire dinosaur reference artwork if its head currently faces left, so that in your output the dinosaur faces and moves toward the right (this only changes facing direction — anatomy, colors, and pose are otherwise preserved 90-95%). This is required because the human paleontologist character always appears on the RIGHT side of this composition, fleeing further right in visible terror, glancing back in fear — with the dinosaur's open mouth close behind them, chasing from the left. The dinosaur's tail must trail off toward the LEFT side of the frame, far away from the human — the human must never be positioned near the tail. A proportionally accurate modern ${g} human paleontologist character is the one fleeing, ${tail}`;
    if (size === 'medium') return `This dinosaur is a predator, alert and threatening, facing/lunging toward the RIGHT side of the canvas — mirror the reference artwork horizontally if needed so it faces right, for the same reason as above. A proportionally accurate modern ${g} human paleontologist character on the right backs away warily, keeping a cautious distance from the mouth on their left, ${tail}`;
    return `This dinosaur is a small predator, noticeably smaller than a human, facing toward the RIGHT side of the canvas — mirror the reference artwork horizontally if needed. It is shown in an active, agile pose while a proportionally accurate modern ${g} human paleontologist character on the right crouches nearby, studying it warily at a safe distance, clearly larger than the animal, ${tail}`;
  }
  if (size === 'large') return `This dinosaur is not a predator: it is shown in a calm, natural pose while a proportionally accurate modern ${g} human paleontologist character stands beside it, looking up in awe, ${tail}`;
  return `This dinosaur is not a predator: it is shown in a calm, natural pose while a proportionally accurate modern ${g} human paleontologist character stands nearby, observing it calmly, ${tail}`;
}

async function generateImageOnce(promptText, originPath) {
  const imgBytes = fs.readFileSync(originPath);
  const imgB64 = imgBytes.toString('base64');
  const mime = originPath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  const model = 'gemini-2.5-flash-image';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
  const body = {
    contents: [{ parts: [{ text: promptText }, { inline_data: { mime_type: mime, data: imgB64 } }] }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: { aspectRatio: '16:9' },
    },
  };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) throw new Error(`API hiba ${res.status}: ${JSON.stringify(json)}`);
  const parts = json?.candidates?.[0]?.content?.parts || [];
  const imgPart = parts.find((p) => p.inlineData || p.inline_data);
  if (!imgPart) throw new Error(`Nincs kep a valaszban: ${json?.candidates?.[0]?.finishMessage || JSON.stringify(json)}`);
  return Buffer.from((imgPart.inlineData || imgPart.inline_data).data, 'base64');
}

// --- Sharp-alapú automata kép-ellenőrzés ---
// Két visszatérő hibát tud megbízhatóan észlelni: (1) tömör fekete/fehér
// sáv a szélen (letterbox / fehér keret), (2) vékony dekoratív keret-vonal
// a vászon belsejébe rajzolva. A "dínó/ember érinti a szélt" (safe-zone)
// hibát NEM lehet megbízhatóan pixel-heurisztikával észlelni (a táj maga is
// textúrált a széleken), ezért azt csak a prompt szövege kényszeríti,
// automata check erre nincs — kézi átnézés még mindig kell hozzá.
async function analyzeImageBuffer(buf) {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const issues = [];

  function px(x, y) {
    const idx = (y * width + x) * channels;
    return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
  }
  function rowStats(y) {
    let sum = 0, min = 255, max = 0;
    for (let x = 0; x < width; x++) {
      const b = px(x, y);
      sum += b; if (b < min) min = b; if (b > max) max = b;
    }
    return { mean: sum / width, min, max };
  }
  function colStats(x) {
    let sum = 0, min = 255, max = 0;
    for (let y = 0; y < height; y++) {
      const b = px(x, y);
      sum += b; if (b < min) min = b; if (b > max) max = b;
    }
    return { mean: sum / height, min, max };
  }

  // 1) Toemoer fekete/feher savok a 4 szelen (letterbox / fehér keret)
  const EDGE_BAND = 6;
  function edgeBandSolid(statsFn) {
    for (let i = 0; i < EDGE_BAND; i++) {
      const s = statsFn(i);
      const solidBlack = s.mean < 20 && (s.max - s.min) < 25;
      const solidWhite = s.mean > 235 && (s.max - s.min) < 25;
      if (!(solidBlack || solidWhite)) return false;
    }
    return true;
  }
  if (edgeBandSolid(rowStats)) issues.push('top-border-bar');
  if (edgeBandSolid((i) => rowStats(height - 1 - i))) issues.push('bottom-border-bar');
  if (edgeBandSolid(colStats)) issues.push('left-border-bar');
  if (edgeBandSolid((i) => colStats(width - 1 - i))) issues.push('right-border-bar');

  // 2) Vekony dekorativ keret-vonal a vaszon belsejebe rajzolva — csak a
  // tipikus zonakban keresi (~5-20% es ~80-95% a szeltol), hogy ne fusson
  // ossze a horizonttal (ami altalaban a kep kozepen van). NEM a sor/oszlop
  // globalis egyenletesseget nezi (egy vekony vonal vegigfuthat egy tarkA
  // hatteren — eg, fa, fold — es a sor ossz-varianciaja emiatt magas marad),
  // hanem PIXELENKENT a lokalis fuggoleges kontrasztot: minden pixelt a tole
  // 5px-re fent/lent levo attlaghoz hasonlit, es azt nezi, a sor/oszlop
  // pixeleinek hany szazaleka ter el KONZISZTENSEN (mind vilagosabb vagy mind
  // sotetebb) a kozvetlen kornyezetenel — ez jelzi a vonalat a tartalomtol
  // fuggetlenul.
  function rowLineFraction(y) {
    let bright = 0, dark = 0;
    const yAbove = Math.max(0, y - 5);
    const yBelow = Math.min(height - 1, y + 5);
    for (let x = 0; x < width; x++) {
      const neighborAvg = (px(x, yAbove) + px(x, yBelow)) / 2;
      const diff = px(x, y) - neighborAvg;
      if (diff > 12) bright++;
      else if (diff < -12) dark++;
    }
    return Math.max(bright, dark) / width;
  }
  function colLineFraction(x) {
    let bright = 0, dark = 0;
    const xLeft = Math.max(0, x - 5);
    const xRight = Math.min(width - 1, x + 5);
    for (let y = 0; y < height; y++) {
      const neighborAvg = (px(xLeft, y) + px(xRight, y)) / 2;
      const diff = px(x, y) - neighborAvg;
      if (diff > 12) bright++;
      else if (diff < -12) dark++;
    }
    return Math.max(bright, dark) / height;
  }
  const LINE_FRACTION_THRESHOLD = 0.6;
  function scanRowsForFrameLine(yFrom, yTo) {
    for (let y = yFrom; y < yTo; y++) {
      if (rowLineFraction(y) > LINE_FRACTION_THRESHOLD) return y;
    }
    return null;
  }
  function scanColsForFrameLine(xFrom, xTo) {
    for (let x = xFrom; x < xTo; x++) {
      if (colLineFraction(x) > LINE_FRACTION_THRESHOLD) return x;
    }
    return null;
  }
  const topLine = scanRowsForFrameLine(Math.round(height * 0.05), Math.round(height * 0.20));
  const bottomLine = scanRowsForFrameLine(Math.round(height * 0.80), Math.round(height * 0.95));
  const leftLine = scanColsForFrameLine(Math.round(width * 0.05), Math.round(width * 0.20));
  const rightLine = scanColsForFrameLine(Math.round(width * 0.80), Math.round(width * 0.95));
  if (topLine != null && bottomLine != null) issues.push('inner-frame-line-horizontal');
  else if (leftLine != null && rightLine != null) issues.push('inner-frame-line-vertical');

  return issues;
}

const MAX_ATTEMPTS = 3;

async function generateImageVerified(promptText, originPath, label) {
  let lastBuf = null;
  let lastIssues = ['never-attempted'];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let buf;
    try {
      buf = await generateImageOnce(promptText, originPath);
    } catch (e) {
      console.error(`  [${label}] ${attempt}/${MAX_ATTEMPTS}. probalkozas API hiba: ${e.message}`);
      lastIssues = [`api-error: ${e.message}`];
      continue;
    }
    const issues = await analyzeImageBuffer(buf);
    lastBuf = buf;
    lastIssues = issues;
    if (issues.length === 0) {
      if (attempt > 1) console.log(`  [${label}] ${attempt}. probalkozasra sikerult.`);
      return { buf, issues: [], attempts: attempt };
    }
    console.warn(`  [${label}] ${attempt}/${MAX_ATTEMPTS}. probalkozas hibas: ${issues.join(', ')} — ujra...`);
  }
  return { buf: lastBuf, issues: lastIssues, attempts: MAX_ATTEMPTS };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const scan = args.includes('--scan');
  const onlyArg = args.find((a) => a.startsWith('--only='));
  const only = onlyArg ? onlyArg.slice('--only='.length).split(',').map((s) => s.trim().toLowerCase()) : null;
  const outDirArg = args.find((a) => a.startsWith('--out-dir='));
  const outDir = outDirArg ? outDirArg.slice('--out-dir='.length) : null;
  return { dry, scan, only, outDir };
}

// Fájlnév -> kimeneti slug (ua. a minta, mint az assets/images meglevo
// fájljainál: kisbetu, ekezet marad, szokoz -> alalvonas).
function slugify(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '_');
}

// --scan: az origin-mappa kepfajljaibol epit JOBS-listat, mivel a fajlnev
// (kiterjesztes nelkul) most mar magaval a common_name-mel egyezik
// (lasd: rename lepes). A "test" almappa es a nem-kep fajlok kimaradnak.
function buildJobsFromOriginDir() {
  const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png']);
  const entries = fs.readdirSync(ORIGIN_DIR, { withFileTypes: true });
  const jobs = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXT.has(ext)) continue;
    const commonName = path.basename(entry.name, path.extname(entry.name));
    const outBase = slugify(commonName);
    const outExt = ext === '.jpeg' ? '.jpg' : ext;
    jobs.push({ origin: entry.name, common_name: commonName, out: `${outBase}${outExt}` });
  }
  return jobs;
}

async function main() {
  const { dry, scan, only, outDir } = parseArgs();
  if (outDir) {
    IMAGES_DIR_OVERRIDE = path.resolve(outDir);
    if (!fs.existsSync(IMAGES_DIR_OVERRIDE)) fs.mkdirSync(IMAGES_DIR_OVERRIDE, { recursive: true });
  }
  const baseJobs = scan ? buildJobsFromOriginDir() : JOBS;
  const jobs = only ? baseJobs.filter((j) => only.includes(j.common_name.toLowerCase())) : baseJobs;
  if (only && jobs.length === 0) {
    console.error('A --only szuresnek nincs talalata a JOBS listaban.');
    process.exitCode = 1;
    return;
  }
  if (scan) console.log(`--scan: ${jobs.length} kep talalva az origin-mappaban.`);

  const results = [];
  const dryOut = [];
  for (const job of jobs) {
    const originPath = path.join(ORIGIN_DIR, job.origin);
    if (!fs.existsSync(originPath)) {
      console.error(`KIHAGYVA (nincs fajl): ${job.origin}`);
      continue;
    }
    try {
      const row = await fetchCreature(job.common_name);
      row.derived = {
        is_predator: isPredator(row),
        length_m: lengthM(row),
        size_class: sizeClass(row),
        paleontologist_gender: paleontologistGender(row),
        human_clause: humanClause(row),
      };
      const prompt = buildPrompt(row);
      if (dry) {
        dryOut.push(`===== ${job.common_name} (${row.scientific_name}) -> ${job.out} =====\n${prompt}\n`);
        results.push({ ...job, status: 'dry' });
        continue;
      }
      console.log(`Generalas: ${job.common_name} (${row.scientific_name}) -> ${job.out}`);
      const { buf, issues, attempts } = await generateImageVerified(prompt, originPath, job.common_name);
      if (!buf) {
        console.error(`  HIBA (${job.common_name}): nem sikerult kepet generalni ${MAX_ATTEMPTS} probalkozas utan (${issues.join(', ')})`);
        results.push({ ...job, status: 'error', error: issues.join(', ') });
        continue;
      }
      const outPath = path.join(IMAGES_DIR_OVERRIDE || IMAGES_DIR, job.out);
      fs.writeFileSync(outPath, buf);
      if (issues.length > 0) {
        console.warn(`  MENTVE, DE FIGYELEM (${job.common_name}): ${attempts} probalkozas utan is maradt hiba: ${issues.join(', ')} -> ${outPath}`);
        results.push({ ...job, status: 'needs-review', error: issues.join(', ') });
      } else {
        console.log(`  OK (${attempts}. probalkozasra) -> ${outPath}`);
        results.push({ ...job, status: 'ok', attempts });
      }
    } catch (e) {
      console.error(`  HIBA (${job.common_name}): ${e.message}`);
      results.push({ ...job, status: 'error', error: e.message });
    }
  }

  if (dry) {
    const outFile = path.join(ROOT, 'scripts', 'prompts_preview.txt');
    fs.writeFileSync(outFile, dryOut.join('\n'));
    console.log(`Dry-run kesz: ${dryOut.length} prompt -> ${outFile}`);
    return;
  }

  console.log('\n--- OSSZEGZES ---');
  results.forEach((r) => {
    const tag = r.status === 'ok' ? 'OK  ' : r.status === 'needs-review' ? 'FIGY' : 'HIBA';
    console.log(`${tag} ${r.common_name} -> ${r.out}${r.error ? ' :: ' + r.error : ''}`);
  });
  const needsReview = results.filter((r) => r.status === 'needs-review');
  if (needsReview.length > 0) {
    console.log(`\n${needsReview.length} kep automata hibat jelzett meg ${MAX_ATTEMPTS} probalkozas utan is — nezd at kezzel: ${needsReview.map((r) => r.out).join(', ')}`);
  }
}

main();
