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
  runnerBtn: '#606c38',   // Dínófutam gomb (játékmód, nem régió)
  runnerBtnShadow: '#283618',
  hangmanBtn: '#6b4226',  // Akasztófa gomb (játékmód, nem régió)
  hangmanBtnShadow: '#3e2416',
  heroYellow: '#ffce1f',      // HeroTop "DÍNÓ EXPEDÍCIÓ" cím és sáv színe
  heroYellowDark: '#b8860b',  // hozzá tartozó sötétebb shadow/talp szín

  // Earthy safari paletta (múzeumi tábla kártyák, régió-szintek) — korábban
  // csak `COLORS.gold || '#DDA15E'` / `COLORS.action || '#BC6C25'` fallback-ként
  // élt szét több fájlban, itt lett hivatalosan felvéve.
  darkGreen: '#283618',
  olive: '#606C38',
  gold: '#DDA15E',
  action: '#BC6C25',
};

export const RADIUS = { button: 14, card: 12, cardLarge: 18, pill: 999 };

// ---------------------------------------------------------------------------
// ORGANIC — a claude.ai/design "Organic" rendszer sötét változata, ahogy a
// "Dino Tudos Home" terv felülírja a világos alapot:
//   --color-bg #1a1712 · --color-surface #2a251d · --color-text #f3e7d2
// Meleg, lekerekített rendszer terrakotta (accent) és zsálya (accent2) hanggal,
// Caprasimo címekkel Figtree kenyérszöveg fölött. Csak a landing használja —
// a többi képernyő a fenti COLORS/RADIUS tokeneken marad.
// ---------------------------------------------------------------------------
export const ORGANIC = {
  bg: '#1a1712',
  surface: '#2a251d',
  surfaceSoft: 'rgba(42,37,29,0.6)',   // color-mix(surface 60%, transparent)
  imageWell: '#141210',                 // képek mögötti mély tónus
  text: '#f3e7d2',
  textStrong: '#f3e7d2',
  text82: 'rgba(243,231,210,0.82)',
  text78: 'rgba(243,231,210,0.78)',
  text70: 'rgba(243,231,210,0.70)',
  text65: 'rgba(243,231,210,0.65)',
  text60: 'rgba(243,231,210,0.60)',
  text55: 'rgba(243,231,210,0.55)',
  divider: 'rgba(243,231,210,0.15)',
  track: 'rgba(243,231,210,0.12)',      // haladásjelző sáv alapja
  wellSoft: 'rgba(243,231,210,0.06)',

  accent: '#c67139',
  accent100: '#fff2eb',
  accent400: '#f6a06b',
  accent600: '#b2622d',
  accent700: '#8c491a',
  accent800: '#643312',
  accentTint16: 'rgba(198,113,57,0.16)',
  accentBorder40: 'rgba(198,113,57,0.40)',
  accentBorder24: 'rgba(198,113,57,0.24)',

  accent2: '#7a8a5e',
  accent2_100: '#f0fae1',
  accent2_400: '#aebf92',
  accent2_800: '#3d472b',

  // A tervlap sugarai (a rendszer 8/16/28-as skálája + a lapon használt
  // köztes értékek), gombok/pillek 999.
  radiusSm: 8,
  radiusMd: 16,
  radiusLg: 28,
  radiusTile: 20,
  radiusPanel: 22,
  radiusMedia: 24,
  radiusPill: 999,

  // --space-* skála (1.10× sűrűség)
  space1: 4.4,
  space2: 8.8,
  space3: 13.2,
  space4: 17.6,
  space6: 26.4,
  space8: 35.2,

  fontHeading: 'Caprasimo_400Regular',
  fontBody: 'Figtree_400Regular',
  fontBodySemi: 'Figtree_600SemiBold',
  fontBodyBold: 'Figtree_700Bold',
};
