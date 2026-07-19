// src/constants/nicknameParts.js
// A nickname-generátor 3 építőeleme: híres dínó + genus-szó (a `creatures` tábla
// latin_name_ending mezőjének valós, betöltött értékeiből, lásd getGenusOptions)
// + véletlen 3 jegyű szám.

export const NICKNAME_DINOS = [
  'T-Rex',
  'Velociraptor',
  'Triceratops',
  'Stegosaurus',
  'Brachiosaurus',
  'Spinosaurus',
  'Ankylosaurus',
  'Diplodocus',
  'Pteranodon',
  'Allosaurus',
  'Parasaurolophus',
  'Iguanodon',
  'Compsognathus',
  'Deinonychus',
  'Carnotaurus',
  'Gallimimus',
  'Pachycephalosaurus',
  'Dilophosaurus',
  'Archaeopteryx',
  'Therizinosaurus',
  'Styracosaurus',
  'Maiasaura',
  'Oviraptor',
  'Baryonyx',
  'Kentrosaurus',
  'Giganotosaurus',
  'Segnosaurus',
  'Corythosaurus',
  'Euoplocephalus',
  'Protoceratops',
];

// A `creatures` tábla `latin_name_ending` mezőjének (fajnév-végződés, pl. "rex",
// "bataar", "horridus") egyedi, nem üres értékei — ezekből választ a játékos
// "genus" néven a nickname 2. tagjaként.
export function getGenusOptions(allDinos) {
  const values = (allDinos || [])
    .map((d) => d.latin_name_ending)
    .filter((v) => v && v.trim() !== '');
  return [...new Set(values)].sort();
}

const NICKNAME_NUMBER_MIN = 10;
const NICKNAME_NUMBER_MAX = 99;

export function generateNicknameNumber() {
  return NICKNAME_NUMBER_MIN + Math.floor(Math.random() * (NICKNAME_NUMBER_MAX - NICKNAME_NUMBER_MIN + 1));
}

// A végleges nickname formátuma: kisbetűs, aláhúzással elválasztott
// (pl. "tyrannosaurus_eger_188"), nem a pickerben megjelenő szép alak.
export function buildNickname(dino, genus, number) {
  return `${dino}_${genus}_${number}`.toLowerCase();
}

export function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}
