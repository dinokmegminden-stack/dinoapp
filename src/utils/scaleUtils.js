// utils/scaleUtils.js
import imageCalibration from '../constants/imageCalibration';

const MAX_DISPLAY_HEIGHT = 260; // px

export function getDinoHeightM(creature) {
  return creature.height_m_max ?? creature.height_m_min ?? null;
}

export function getScaledDimensions(character, creature, containerHeight = MAX_DISPLAY_HEIGHT) {
  const calib = imageCalibration[creature.name_hu] || imageCalibration[creature.nev_koznapi];
  if (!calib) return null;

  const dinoHeightM = calib.realHeightM;
  const charHeightM = character.heightCm / 100;

  // Közös lépték: amelyik magasabb (dino hát vagy karakter), az tölti ki a containerHeight-et
  const tallerM = Math.max(charHeightM, dinoHeightM);
  const pixelPerMeter = containerHeight / tallerM;

  // Dino kép megjelenítési mérete a saját natív arányából, skálázva
  const dinoDisplayHeight = calib.imageHeight * (pixelPerMeter / calib.pixelPerMeter);
  const dinoDisplayWidth = calib.imageWidth * (pixelPerMeter / calib.pixelPerMeter);

  // Karakter mérete
  const charHeightPx = charHeightM * pixelPerMeter;
  const charWidthPx = charHeightPx * character.aspectRatio;

  // A karakter talpának a groundY-nál kell lennie a megjelenített (skálázott) képen
  const groundYDisplay = calib.groundY * (pixelPerMeter / calib.pixelPerMeter);
  const characterBottom = dinoDisplayHeight - groundYDisplay;

  return {
    dino: { width: dinoDisplayWidth, height: dinoDisplayHeight },
    character: { width: charWidthPx, height: charHeightPx },
    characterBottom,
  };
}