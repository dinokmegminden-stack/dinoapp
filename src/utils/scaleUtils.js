// utils/scaleUtils.js
const MAX_DISPLAY_HEIGHT = 260; // px

export function getDinoHeightM(creature) {
  return creature.height_m_max ?? creature.height_m_min ?? null;
}

export function getDinoLengthM(creature) {
  return creature.length_m_max ?? creature.length_m_min ?? null;
}

export function getScaledDimensions(character, creature, containerHeight = MAX_DISPLAY_HEIGHT) {
  const charHeightM = character.heightCm / 100;
  const dinoHeightM = getDinoHeightM(creature);
  const dinoLengthM = getDinoLengthM(creature);

  if (dinoHeightM == null) {
    return null; // hívó félnek kezelnie kell (pl. ne jelenjen meg az összehasonlítás)
  }

  const dinoAspect = dinoLengthM ? dinoLengthM / dinoHeightM : 1.5;
  const tallerM = Math.max(charHeightM, dinoHeightM);
  const pixelPerMeter = containerHeight / tallerM;

  const charHeightPx = charHeightM * pixelPerMeter;
  const dinoHeightPx = dinoHeightM * pixelPerMeter;

  return {
    character: { height: charHeightPx, width: charHeightPx * character.aspectRatio },
    dino: { height: dinoHeightPx, width: dinoHeightPx * dinoAspect },
  };
}