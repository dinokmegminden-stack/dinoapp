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

export function csomagToPackId(eduLevel, csomag) {
  return REGION_PACKS[eduLevel]?.[csomag - 1];
}

export function resolveImage(dino) {
  if (dino.image_url) return { uri: dino.image_url };
  return IMAGE_MAP[dino.nev_tudomanyos] || null;
}