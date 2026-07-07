// Lightning Quiz — image recognition quiz generator
// 5 seconds per question, 10 questions max, 3 lives

import { IMAGE_MAP } from '../constants/imageMap';

function shuffle(arr) {
  return [...arr].map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}

function distinctValues(pool, field) {
  return [...new Set(pool.map((d) => d[field]).filter((v) => v !== null && v !== undefined && v !== ''))];
}

// Pick 3 distractors (wrong names) for the correct dino
// Try from the same region/pack first, fallback to full pool if not enough
function pickWrongAnswers(correctDino, regionPool, fullPool) {
  const correctName = correctDino.name_hu;

  // Get candidates from region pool
  let candidates = regionPool
    .filter((d) => d.name_hu !== correctName && IMAGE_MAP[d.name_hu])
    .map((d) => d.name_hu);

  // Shuffle and take up to 3
  candidates = shuffle(candidates).slice(0, 3);

  // If not enough, fallback to full pool
  if (candidates.length < 3 && fullPool) {
    const fallback = fullPool
      .filter((d) => d.name_hu !== correctName && !candidates.includes(d.name_hu) && IMAGE_MAP[d.name_hu])
      .map((d) => d.name_hu);
    candidates = [...candidates, ...shuffle(fallback)].slice(0, 3);
  }

  return candidates;
}

// Generate a single lightning quiz question
export function generateLightningQuestion(regionPool, fullPool, excludeIds = []) {
  // Filter dinos that have images
  const candidates = regionPool
    .filter((d) => !excludeIds.includes(d.id) && IMAGE_MAP[d.name_hu]);

  if (candidates.length === 0) {
    return null;
  }

  // Pick a random correct dino
  const correctDino = candidates[Math.floor(Math.random() * candidates.length)];

  // Get 3 wrong answers
  const wrongNames = pickWrongAnswers(correctDino, regionPool, fullPool);

  if (wrongNames.length < 3) {
    return null; // Not enough distractors
  }

  // Mix all 4 answers
  const allAnswers = shuffle([correctDino.name_hu, ...wrongNames]);

  return {
    correctDino,
    options: allAnswers,
    correctIndex: allAnswers.indexOf(correctDino.name_hu),
  };
}
