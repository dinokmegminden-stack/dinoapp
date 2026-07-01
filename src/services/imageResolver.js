export function resolveImage(dino, IMAGE_MAP) {
  if (dino?.image_url) {
    return { uri: dino.image_url };
  }
  return IMAGE_MAP[dino.nev_tudomanyos] || null;
}
