// dailyDino.js — determinisztikus "napi lény" kiválasztás egy már betöltött
// listából. Az App.js már egyszer lekéri mind a 6 edu összes lényét
// (allDinos state, lásd App.js preloadCreatures) — nincs értelme ezt itt
// újra Supabase-hívásokkal megismételni, csak a kiválasztást végezzük.
// A dátum-seed garantálja, hogy aznap mindenkinek ugyanaz jöjjön ki.

function dayOfYearSeed() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const dayOfYear = Math.floor(diff / 86400000);
  // +év, hogy évforduló ne ismétlődjön ugyanabban a sorrendben
  return dayOfYear + now.getFullYear() * 366;
}

export function pickDailyDino(allDinos) {
  if (!allDinos || !allDinos.length) return null;
  const idx = dayOfYearSeed() % allDinos.length;
  return allDinos[idx];
}
