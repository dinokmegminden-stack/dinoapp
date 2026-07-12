// src/utils/hungarianGrammar.js
// Magyar nyelvtani segédfüggvények a "Ki vagyok én?" kvíz leíró mondatához
// (helyhatározó rag az országnévhez, időhatározó rag az évszámhoz,
// egyes/többes szám a felfedező(k) igéjéhez).

// Az adatbázisban előforduló discovered_country értékek rögzített, helyes
// alakjai — a helynevek ragozása (Magyarország -on, Thaiföld -ön, Argentína
// -ban stb.) tele van kivétellel, ezért szótárból biztosabb, mint algoritmussal
// kitalálni.
const COUNTRY_LOCATIVE = {
  'Amerikai Egyesült Államok': 'Amerikai Egyesült Államokban',
  'Argentína': 'Argentínában',
  'Ausztrália': 'Ausztráliában',
  'Belgium': 'Belgiumban',
  'Brazília': 'Brazíliában',
  'Dél-afrikai Köztársaság': 'Dél-afrikai Köztársaságban',
  'Egyesült Királyság': 'Egyesült Királyságban',
  'Egyiptom': 'Egyiptomban',
  'Kanada': 'Kanadában',
  'Kína': 'Kínában',
  'Madagaszkár': 'Madagaszkárban',
  'Magyarország': 'Magyarországon',
  'Mongólia': 'Mongóliában',
  'Niger': 'Nigerben',
  'Németország': 'Németországban',
  'Olaszország': 'Olaszországban',
  'Portugália': 'Portugáliában',
  'Románia': 'Romániában',
  'Spanyolország': 'Spanyolországban',
  'Tanzánia': 'Tanzániában',
  'Thaiföld': 'Thaiföldön',
};

const BACK_VOWELS = /[aáoóuú]/;
const FRONT_VOWELS = /[eéiíöőüű]/;

// Ismeretlen országnévhez tartalék: durva magánhangzó-illeszkedés + rövid
// a/e hangzónyúlás — csak akkor fut le, ha a fenti szótárban nincs találat.
function fallbackCountryLocative(country) {
  const lastChar = country.slice(-1);
  let stem = country;
  if (lastChar === 'a') stem = country.slice(0, -1) + 'á';
  else if (lastChar === 'e') stem = country.slice(0, -1) + 'é';

  const hasBack = BACK_VOWELS.test(country);
  const hasFront = FRONT_VOWELS.test(country);
  const suffix = hasBack || !hasFront ? 'ban' : 'ben';
  return `${stem}${suffix}`;
}

export function getCountryLocative(country) {
  if (COUNTRY_LOCATIVE[country]) return COUNTRY_LOCATIVE[country];
  console.warn(`hungarianGrammar: nincs rögzített ragozás ehhez az országhoz: "${country}", tartalék szabály használva.`);
  return fallbackCountryLocative(country);
}

// Az évszám kiejtett alakjának utolsó szava dönti el a magánhangzó-illeszkedést
// (pl. 2010 → "kétezertíz" → "tíz" magas hangrendű → -ben; 1848 → "...negyvennyolc"
// → "nyolc" mély hangrendű → -ban). Számoknál — szemben a helynevekkel — ez a
// szabály kivétel nélkül működik.
const UNIT_FRONT = new Set([1, 2, 4, 5, 7, 9]); // egy, kettő, négy, öt, hét, kilenc
const TENS_FRONT = new Set([1, 4, 5, 7, 9]); // tíz, negyven, ötven, hetven, kilencven

export function getYearLocative(year) {
  const y = Math.abs(Math.trunc(year));
  const unit = y % 10;
  let isFront;
  if (unit !== 0) {
    isFront = UNIT_FRONT.has(unit);
  } else {
    const tensDigit = Math.floor((y % 100) / 10);
    if (tensDigit !== 0) {
      isFront = TENS_FRONT.has(tensDigit);
    } else {
      const hundredDigit = Math.floor((y % 1000) / 100);
      isFront = hundredDigit === 0; // "...száz" (mély) vs "...ezer" (magas)
    }
  }
  return `${year}-${isFront ? 'ben' : 'ban'}`;
}

// A discoverer_name szabad szöveg — több felfedező felsorolása "és"/"&"/vessző
// jelzi (pl. "Mátyás Zoltán, Csiki Zoltán és munkatársaik"), ilyenkor többes
// számú ige kell ("fedeztek fel"), egyetlen névnél egyes szám ("fedezett fel").
// A "(leírta X és Y)" zárójeles és ", leírta X" végződésű betoldás a FAJT leíró
// tudós(oka)t nevezi meg, nem társfelfedezőt — ezt le kell vágni, különben az
// itteni "és"/vessző tévesen többes számot jelezne egyetlen felfedezőnél is.
export function getDiscovererVerb(discovererName) {
  const withoutDescriber = discovererName
    .replace(/\s*\(leírta[^)]*\)/gi, '')
    .replace(/,?\s*leírta\s+.*/i, '');
  const isPlural = / és |&|,/.test(withoutDescriber);
  return isPlural ? 'fedeztek fel' : 'fedezett fel';
}

export function lowercaseFirst(text) {
  if (!text) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}
