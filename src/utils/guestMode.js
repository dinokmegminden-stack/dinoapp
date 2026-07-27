// guestMode.js — egyszerű modul-szintű flag (ugyanaz a minta, mint az
// XPBar.js activePlayerId-je), hogy a DinoCard-családnak (TradingCard,
// DailyDinoCard, CollectionScreen MiniDinoCard) ne kelljen minden egyes
// képernyőn át propként vezetni az isGuest-et. App.js egyszer állítja be,
// amikor a játékos "Tovább regisztráció nélkül" gombbal lép be.
let guestMode = false;

export function setGuestMode(value) {
  guestMode = value;
}

export function isGuestMode() {
  return guestMode;
}
