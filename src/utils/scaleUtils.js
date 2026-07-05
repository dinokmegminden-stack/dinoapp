import imageCalibration from '../constants/imageCalibration';

const MAX_DISPLAY_HEIGHT = 260;

export function getScaledDimensions(character, creature, containerHeight = MAX_DISPLAY_HEIGHT) {
  console.log('🔍 getScaledDimensions hívás:');
  console.log('  creature.name_hu:', creature.name_hu);
  console.log('  character:', character);
  console.log('  imageCalibration kulcsok:', Object.keys(imageCalibration));

  const calib = imageCalibration[creature.name_hu] || imageCalibration[creature.nev_koznapi];
  console.log('  calib talált:', calib);

  if (!calib) {
    console.warn('❌ Nincs kalibráció a', creature.name_hu || creature.nev_koznapi, 'számára');
    return null;
  }

  const dinoHeightM = calib.realHeightM;
  const charHeightM = character.heightCm / 100;
  console.log('  dinoHeightM:', dinoHeightM, 'charHeightM:', charHeightM);
  console.log('  character.aspectRatio:', character.aspectRatio);

  const tallerM = Math.max(charHeightM, dinoHeightM);
  const pixelPerMeter = containerHeight / tallerM;

  const dinoDisplayHeight = calib.imageHeight * (pixelPerMeter / calib.pixelPerMeter);
  const dinoDisplayWidth = calib.imageWidth * (pixelPerMeter / calib.pixelPerMeter);
  const charHeightPx = charHeightM * pixelPerMeter;
  const charWidthPx = charHeightPx * character.aspectRatio;
  const groundYDisplay = calib.groundY * (pixelPerMeter / calib.pixelPerMeter);
  const characterBottom = dinoDisplayHeight - groundYDisplay;

  console.log('  dims:', { dino: { width: dinoDisplayWidth, height: dinoDisplayHeight }, character: { width: charWidthPx, height: charHeightPx }, characterBottom });

  return {
    dino: { width: dinoDisplayWidth, height: dinoDisplayHeight },
    character: { width: charWidthPx, height: charHeightPx },
    characterBottom,
  };
}