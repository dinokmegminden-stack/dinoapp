// dailyChallenge.js — a Játékmódok képernyő "A nap kihívása" bannerének
// determinisztikus mód-választása (a dailyDino.js mintáját követi, ugyanaz a
// dátum-seed, hogy aznap mindenkinek ugyanaz a kiemelt mód jöjjön ki) + a
// hozzá járó +50%-os bónusz XP naponta egyszeri jóváírása. Csak eszközön
// (AsyncStorage) él, ugyanúgy, mint a teljes XP-rendszer (lásd XPBar.js).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addXP } from '../components/XPBar';

const CLAIM_KEY = 'dino_daily_challenge_claim_v1';
const BONUS_RATIO = 0.5;

// A GamingScreen GAMES tömbjének key-sorrendjével egyezik — itt csak a
// determinisztikus választáshoz kell egy stabil, ismert sorrendű lista.
export const DAILY_CHALLENGE_GAME_KEYS = ['memory', 'whoami', 'lightning', 'millionaire', 'runner', 'hangman'];

function dayOfYearSeed() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const dayOfYear = Math.floor(diff / 86400000);
  return dayOfYear + now.getFullYear() * 366;
}

function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// A mai kiemelt játékmód kulcsa (pl. 'memory') — mindenkinek ugyanaz aznap.
export function getDailyChallengeGameKey() {
  const idx = dayOfYearSeed() % DAILY_CHALLENGE_GAME_KEYS.length;
  return DAILY_CHALLENGE_GAME_KEYS[idx];
}

// Aznap már bejáratott-e a bónusz (a bannernek is ez kell, hogy "Teljesítve
// mára ✓" állapotot mutasson a CTA helyett).
export async function isDailyChallengeClaimedToday() {
  try {
    const raw = await AsyncStorage.getItem(CLAIM_KEY);
    if (!raw) return false;
    const { date } = JSON.parse(raw);
    return date === todayStr();
  } catch {
    return false;
  }
}

// Egy játékmód teljesítésekor hívandó (a mód saját addXP(finalXP) hívása
// UTÁN) — ha ez a mai kiemelt mód és a bónusz még nincs aznap bejáratva,
// jóváírja a +50%-ot és bejegyzi a claimet. Visszaadja a jóváírt bónusz XP-t
// (0, ha nem járt), hogy a hívó képernyő ki tudja írni egy toast/üzenetben.
export async function claimDailyChallengeBonus(gameKey, xpEarned) {
  if (!xpEarned || xpEarned <= 0) return 0;
  if (gameKey !== getDailyChallengeGameKey()) return 0;
  if (await isDailyChallengeClaimedToday()) return 0;

  const bonus = Math.round(xpEarned * BONUS_RATIO);
  if (bonus <= 0) return 0;

  await AsyncStorage.setItem(CLAIM_KEY, JSON.stringify({ date: todayStr(), gameKey }));
  await addXP(bonus);
  return bonus;
}
