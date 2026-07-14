// dinoTaxonomy.js — a gyűjtemény idővonal-nézetéhez: a Supabase `alrend`/`csalad`
// mezőiből állítja elő a klasszikus Ornithischia/Saurischia törzsfa-ábra 7 ágát,
// plusz egy 8. (nem dinoszaurusz) sávot a pteroszauruszoknak.

// A `color` az ág (család) vizuális azonosítója az idővonalon — a zárolt
// (még nem gyűjtött) dínók kérdőjele is ezt a színt kapja, hogy a felfedezés
// előtt is lásd, melyik törzsfa-ághoz tartozik egy pont.
export const TIMELINE_BRANCHES = [
  { key: 'pterosauria', label: 'Pteroszauruszok', shortLabel: 'Ptero', color: '#9c8fb0' },
  { key: 'ornithopoda', label: 'Ornithopoda', shortLabel: 'Orni', color: '#0a9396' },
  { key: 'pachycephalosauria', label: 'Pachycephalosauria', shortLabel: 'Pachy', color: '#ee9b00' },
  { key: 'ceratopsia', label: 'Ceratopsia', shortLabel: 'Cera', color: '#ca6702' },
  { key: 'ankylosauria', label: 'Ankylosauria', shortLabel: 'Anky', color: '#94a187' },
  { key: 'stegosauria', label: 'Stegosauria', shortLabel: 'Stego', color: '#bb3e03' },
  { key: 'sauropodomorpha', label: 'Sauropodomorpha', shortLabel: 'Sauro', color: '#0077b6' },
  { key: 'theropoda', label: 'Theropoda', shortLabel: 'Thero', color: '#ae2012' },
];

// A Thyreophora/Marginocephalia alrendeket a `csalad` mező bontja tovább —
// a bázisi (nem "-idae" végű saját családú) fajok a közelebbi rokon águkhoz kerülnek:
// Scelidosaurus -> Ankylosauria, Psittacosaurus -> Ceratopsia.
const STEGOSAURIA_FAMILIES = new Set(['Stegosauridae']);
const PACHYCEPHALOSAURIA_FAMILIES = new Set(['Pachycephalosauridae']);

export function getTimelineBranchKey(dino) {
  const alrend = dino?.alrend;
  const csalad = dino?.csalad;

  if (alrend === 'Theropoda') return 'theropoda';
  if (alrend === 'Sauropodomorpha') return 'sauropodomorpha';
  if (alrend === 'Ornithopoda') return 'ornithopoda';
  if (alrend === 'Thyreophora') {
    return STEGOSAURIA_FAMILIES.has(csalad) ? 'stegosauria' : 'ankylosauria';
  }
  if (alrend === 'Marginocephalia') {
    return PACHYCEPHALOSAURIA_FAMILIES.has(csalad) ? 'pachycephalosauria' : 'ceratopsia';
  }
  if (alrend === 'Pterodactyloidea') return 'pterosauria';

  return null;
}
