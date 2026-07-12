// src/utils/whoAmIQuizGenerator.js
// "Ki vagyok én?" — a dínó elárul pár tényt magáról (felfedező, felfedezés éve,
// ország, étrend, pbdb_class_hu szerinti család), a játékosnak 4 név közül kell kiválasztania,
// melyik dínóról van szó. A 3 rossz válasz mindig a helyes dínóéval megegyező
// pbdb_class_hu családból származik, hogy a család-tény ne árulja el a megoldást.

import { getCountryLocative, getYearLocative, getDiscovererVerb, lowercaseFirst } from './hungarianGrammar';

const MIN_CLASS_SIZE = 4; // 1 helyes + 3 rossz válasz ugyanabból a családból

function shuffle(arr) {
  return [...arr].map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}

// Csak azok a dínók jöhetnek szóba (kérdésként és/vagy rossz válaszként), amelyeknél
// megvan minden szükséges tény, és a családjuk ("ismeretlen" kivételével) legalább
// MIN_CLASS_SIZE tagot számlál — enélkül nem lenne miből 3 rossz választ kiválogatni.
function eligibleDinosByClass(pool) {
  const withFacts = pool.filter(
    (d) =>
      d.name_hu &&
      d.discoverer_name &&
      d.discovery_year &&
      d.discovered_country &&
      d.diet_hu &&
      d.diet_hu !== 'ismeretlen' &&
      d.pbdb_class_hu &&
      d.pbdb_class_hu !== 'ismeretlen'
  );

  const byClass = new Map();
  for (const dino of withFacts) {
    if (!byClass.has(dino.pbdb_class_hu)) byClass.set(dino.pbdb_class_hu, []);
    byClass.get(dino.pbdb_class_hu).push(dino);
  }

  for (const [cls, dinos] of byClass) {
    if (dinos.length < MIN_CLASS_SIZE) byClass.delete(cls);
  }

  return byClass;
}

function buildQuestionForDino(dino, classmates) {
  const distractors = shuffle(classmates.filter((d) => d.name_hu !== dino.name_hu)).slice(0, 3);
  if (distractors.length < 3) return null;

  const options = shuffle([dino.name_hu, ...distractors.map((d) => d.name_hu)]);
  return {
    dino,
    options,
    correctIndex: options.indexOf(dino.name_hu),
  };
}

// A leíró mondat mindig ezt a formát követi:
// "Én egy {étrend}, {család} közé tartozó dínó voltam, {felfedező(k)}
// {fedezett/fedeztek fel} {év}, {ország}." — a kiemelt mezőket a képernyő
// félkövéren jeleníti meg, ezért itt szegmensekre bontva adjuk vissza.
export function buildWhoAmIClueSegments(dino) {
  const verb = getDiscovererVerb(dino.discoverer_name);
  return [
    { text: 'Én egy ' },
    { text: dino.diet_hu, bold: true },
    { text: ', ' },
    { text: lowercaseFirst(dino.pbdb_class_hu), bold: true },
    { text: ' közé tartozó dínó voltam, ' },
    { text: dino.discoverer_name, bold: true },
    { text: ` ${verb} ` },
    { text: getYearLocative(dino.discovery_year), bold: true },
    { text: ', ' },
    { text: getCountryLocative(dino.discovered_country), bold: true },
    { text: '.' },
  ];
}

/**
 * "Ki vagyok én?" kvíz összeállítása.
 * @param {Array} allDinos - a teljes (edu-szűretlen) dínó pool az adaptCreature() kimenetében.
 * @param {number} questionCount - hány kérdés kerüljön a körbe (alapértelmezés 10).
 * @returns {Array} kérdések tömbje: { dino, options: string[4], correctIndex }
 */
export function buildWhoAmIQuiz(allDinos, questionCount = 10) {
  if (!allDinos || allDinos.length === 0) return [];

  const byClass = eligibleDinosByClass(allDinos);
  if (byClass.size === 0) return [];

  const questions = [];
  for (const classmates of byClass.values()) {
    for (const dino of classmates) {
      const question = buildQuestionForDino(dino, classmates);
      if (question) questions.push(question);
    }
  }

  return shuffle(questions).slice(0, questionCount);
}
