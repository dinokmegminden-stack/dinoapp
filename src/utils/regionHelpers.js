import { REGION_PACKS } from './regionProgress';
import { IMAGE_MAP } from '../constants/imageMap';

export function groupByPackage(list) {
  const map = {};
  list.forEach((d) => {
    const key = d.csomag || 1;
    if (!map[key]) map[key] = [];
    map[key].push(d);
  });
  return Object.keys(map)
    .map(Number)
    .sort((a, b) => a - b)
    .map((csomag) => ({ csomag, dinos: map[csomag] }));
}

// A `csomag` (a `creatures.pack_number` nyers értéke, pl. 1..5 vagy a 99-es
// bónusz) ÖNMAGA a progress-kulcs (lásd App.js handlePassed) — ez a függvény
// csak azt ellenőrzi, hogy az adott régióban érvényes csomagszám-e, nem egy
// tömb-pozíció szerint fordít. (Korábban `REGION_PACKS[eduLevel][csomag-1]`
// pozicionális indexeléssel dolgozott, ami csak véletlenül volt helyes, amíg
// minden csomagszám 1-től induló, folytonos egész volt — a 99-es bónusz
// csomaggal ez már kívül esett volna a tömbön.)
export function csomagToPackId(eduLevel, csomag) {
  return REGION_PACKS[eduLevel]?.includes(csomag) ? csomag : undefined;
}

export function resolveImage(dino) {
  if (dino.image_url) return { uri: dino.image_url };
  return IMAGE_MAP[dino.nev_tudomanyos] || null;
}