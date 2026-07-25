// A Dínó Lexikon web-tipográfiájának kanonikus család-nevei. A tényleges
// fájlokat az App.js tölti be központilag (useAppFonts) — itt csak a nevek élnek,
// betöltésig a rendszer a generikus fallbackre esik vissza.
//   Címsorok / anchor: Rokkitt (szögletes, kőbe vésett slab serif).
//   Törzsszöveg / UI: Inter (magas x-magasság, képernyőn tisztán olvasható).
// Megjegyzés: a tudományos (latin) neveket ez NEM érinti — azok maradnak Cinzel
// (lásd CLAUDE.md betűtípus-szabály), külön töltve az érintett komponensekben.
export const FONTS = {
  heading: 'Rokkitt_700Bold',           // kiemelt címsorok
  headingXBold: 'Rokkitt_800ExtraBold', // fő címek (h1)
  body: 'Inter_400Regular',             // bekezdés, hosszú lexikon-szöveg
  bold: 'Inter_700Bold',                // gomb, térkép-szám, kvíz-opció (meglévő kulcs)
  bodyBold: 'Inter_700Bold',            // alias a bold-ra (landing komponensek)
};
