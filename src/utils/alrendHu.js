// Az `alrend` (pl. Theropoda, Sauropodomorpha) mezőnek nincs magyar oszlopa a
// DB-ben (a `csalad_hu` csak a jóval finomabb felbontású családot fordítja,
// 60+ egyedi érték, a legtöbb 1-3 taggal) — csak 6 alrend-érték létezik, itt
// kézzel rögzítve. Közös hely a whoAmIQuizGenerator.js és a quizGenerator.js
// számára, hogy a fordítás egy helyen éljen.
export const ALREND_HU = {
  Theropoda: 'ragadozó dinoszauruszok',
  Sauropodomorpha: 'hosszúnyakú dinoszauruszok',
  Thyreophora: 'páncélos dinoszauruszok',
  Ornithopoda: 'madárlábú dinoszauruszok',
  Marginocephalia: 'szarvas- és vastagfejű dinoszauruszok',
  Pterodactyloidea: 'repülő hüllők',
};

export function getFamilyHu(alrend) {
  return ALREND_HU[alrend] || alrend;
}
