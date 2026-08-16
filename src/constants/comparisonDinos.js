// comparisonDinos.js — a "Méretösszehasonlító" képernyő 20 ikonikus dínója.
// A képek itt: assets/images/comparison/<name_hu>.png — átlátszó hátterű,
// oldalnézeti render, hogy a hosszösszehasonlító vizuál valós méretarányt
// mutasson (lásd ComparisonScreen.js). Placeholder képekkel indul (a
// 12-2-dinosaur-png.png másolata) — a valós PNG-ket ugyanazzal a fájlnévvel
// kell felülírni, kódmódosítás nélkül.
export const COMPARISON_NAMES = [
  'Tyrannosaurus',
  'Velociraptor',
  'Spinosaurus',
  'Giganotosaurus',
  'Allosaurus',
  'Therizinosaurus',
  'Dilophosaurus',
  'Deinonychus',
  'Carcharodontosaurus',
  'Compsognathus',
  'Brachiosaurus',
  'Diplodocus',
  'Argentinosaurus',
  'Apatosaurus',
  'Iguanodon',
  'Parasaurolophus',
  'Stegosaurus',
  'Ankylosaurus',
  'Triceratops',
  'Pachycephalosaurus',
];

// Referencia-emberalak a színpadi léptékhez (lásd ComparisonScreen HUMAN_HEIGHT_M).
export const COMPARISON_HUMAN_IMAGE = require('../../assets/images/comparison/human.png');

export const COMPARISON_IMAGE_MAP = {
  Tyrannosaurus: require('../../assets/images/comparison/Tyrannosaurus.png'),
  Velociraptor: require('../../assets/images/comparison/Velociraptor.png'),
  Spinosaurus: require('../../assets/images/comparison/Spinosaurus.png'),
  Giganotosaurus: require('../../assets/images/comparison/Giganotosaurus.png'),
  Allosaurus: require('../../assets/images/comparison/Allosaurus.png'),
  Therizinosaurus: require('../../assets/images/comparison/Therizinosaurus.png'),
  Dilophosaurus: require('../../assets/images/comparison/Dilophosaurus.png'),
  Deinonychus: require('../../assets/images/comparison/Deinonychus.png'),
  Carcharodontosaurus: require('../../assets/images/comparison/Carcharodontosaurus.png'),
  Compsognathus: require('../../assets/images/comparison/Compsognathus.png'),
  Brachiosaurus: require('../../assets/images/comparison/Brachiosaurus.png'),
  Diplodocus: require('../../assets/images/comparison/Diplodocus.png'),
  Argentinosaurus: require('../../assets/images/comparison/Argentinosaurus.png'),
  Apatosaurus: require('../../assets/images/comparison/Apatosaurus.png'),
  Iguanodon: require('../../assets/images/comparison/Iguanodon.png'),
  Parasaurolophus: require('../../assets/images/comparison/Parasaurolophus.png'),
  Stegosaurus: require('../../assets/images/comparison/Stegosaurus.png'),
  Ankylosaurus: require('../../assets/images/comparison/Ankylosaurus.png'),
  Triceratops: require('../../assets/images/comparison/Triceratops.png'),
  Pachycephalosaurus: require('../../assets/images/comparison/Pachycephalosaurus.png'),
};
