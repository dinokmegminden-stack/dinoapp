// theme.js — a UI redesign kanonikus design tokenjei.
// Minden szín innen importálandó; ne maradjon hardcode-olt hex a komponensekben.
// (A régi colors.js a migráció végéig él, új kód már ezt használja.)

export const COLORS = {
  bgDark: '#001219',      // fő háttér, header szöveg árnyék
  bgMid: '#005f73',       // régió gombok, borderek (egységesen, nem régiónként)
  bgMidLight: '#0a9396',  // másodlagos kategória (Gyűjtemény gomb)
  accent: '#ee9b00',      // elsődleges CTA, XP badge, latin név
  accentDark: '#ca6702',  // másodlagos CTA, hover shadow
  cream: '#FEFAE0',       // kártya háttér, világos szöveg
  cardMuted: '#f0e9cf',   // metadata sor háttér a kártyákon
  parokBtn: '#ae2012',    // Párok gomb (játékmód, nem régió)
  parokBtnShadow: '#9b2226',
  whoAmIBtn: '#bb3e03',   // Ki vagyok én? gomb (játékmód, nem régió)
  whoAmIBtnShadow: '#001219',
};

export const RADIUS = { button: 14, card: 12, cardLarge: 18, pill: 999 };
