// Az `alrend` (pl. Theropoda, Sauropodomorpha) mezőnek nincs magyar oszlopa a
// DB-ben (a `csalad_hu` csak a jóval finomabb felbontású családot fordítja,
// 60+ egyedi érték, a legtöbb 1-3 taggal) — csak 6 alrend-érték létezik, itt
// kézzel rögzítve. Közös hely a whoAmIQuizGenerator.js és a quizGenerator.js
// számára, hogy a fordítás egy helyen éljen.
export const ALREND_HU = {
  Theropoda: 'ragadozók',
  Sauropodomorpha: 'hosszúnyakúak',
  Thyreophora: 'páncélosok',
  Ornithopoda: 'madárlábúak',
  Marginocephalia: 'szarvas- és vastagfejűek',
  Pterodactyloidea: 'repülő hüllők',
  // Alias: néhány lény `alrend`-je a szűkebb `Sauropoda`, nem a `Sauropodomorpha`
  // — ugyanaz a magyar csoport, ne jelenjen meg külön szűrő-opcióként.
  Sauropoda: 'hosszúnyakúak',
};

export function getFamilyHu(alrend) {
  return ALREND_HU[alrend] || alrend;
}
