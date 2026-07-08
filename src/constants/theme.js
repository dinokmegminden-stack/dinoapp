// theme.js — a UI redesign kanonikus design tokenjei.
// Minden szín innen importálandó; ne maradjon hardcode-olt hex a komponensekben.
// (A régi colors.js a migráció végéig él, új kód már ezt használja.)

export const COLORS = {
  bgDark: '#283618',      // fő háttér, header szöveg árnyék
  bgMid: '#606C38',       // régió gombok, borderek
  bgMidLight: '#7d8a4a',  // másodlagos kategória (Gyűjtemény gomb)
  accent: '#DDA15E',      // elsődleges CTA, XP badge, latin név
  accentDark: '#BC6C25',  // másodlagos CTA, hover shadow
  cream: '#FEFAE0',       // kártya háttér, világos szöveg
  cardMuted: '#f0e9cf',   // metadata sor háttér a kártyákon
  parokBtn: '#a56a3f',    // Párok gomb (játékmód, nem régió)
  parokBtnShadow: '#6e4529',
};

export const RADIUS = { button: 14, card: 12, cardLarge: 18, pill: 999 };
