// src/constants/nicknameParts.js
// A nickname-generátor 3 építőeleme: egy jelző (lentebb rögzített lista) +
// a `creatures` tábla magyar köznapi nevének (common_name / name_hu) egyedi
// értékei + egy "00"-tól "99"-ig szabadon választható szám.

export const NICKNAME_ADJECTIVES = [
  'Őskövület',
  'Rövidkarú',
  'Vastagbőrű',
  'Tüskés',
  'Fogatlan',
  'Ragadozó',
  'Kipusztult',
  'Sárkány',
  'Falánk',
  'Agyatlan',
  'Páncélos',
  'Vega',
  'Vérszomjas',
  'Nehézsúlyú',
  'Daliás',
  'Üvöltő',
  'Fenevad',
  'Bestia',
  'Huncut',
  'Szörnyeteg',
];

// A `creatures` tábla magyar köznapi nevének (common_name / name_hu) egyedi,
// nem üres értékei — ezekből választ a játékos a nickname 2. tagjaként.
export function getCommonNameOptions(allDinos) {
  const values = (allDinos || [])
    .map((d) => String(d.name_hu || '').trim())
    .filter((v) => v !== '');
  return [...new Set(values)].sort();
}

// A nickname 3. tagja: a játékos maga választja a pickerből, "00"-tól "99"-ig.
export const NICKNAME_NUMBER_OPTIONS = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0'));

// A végleges nickname formátuma: kisbetűs, aláhúzással elválasztott
// (pl. "ragadozó_tirannoszaurusz_18").
export function buildNickname(adjective, commonName, number) {
  return `${adjective}_${commonName}_${number}`.toLowerCase();
}

export function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}
