// dailyStreak — lokális (AsyncStorage) napi belépési széria ezen az eszközön.
// A szerveren nincs streak-adat, ezért kliensoldalon követjük: hány egymást
// követő NAPON nyitották meg az appot. Ha ma már regisztráltuk, a szám nem nő;
// ha tegnap volt az utolsó, +1; ha régebben (kihagyott nap), 1-re áll vissza.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'daily_streak_v1';

// Helyi (nem UTC) dátum YYYY-MM-DD alakban, hogy a "nap" a felhasználó
// időzónája szerint teljen.
function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBetween(aStr, bStr) {
  const a = new Date(`${aStr}T00:00:00`);
  const b = new Date(`${bStr}T00:00:00`);
  return Math.round((b - a) / 86400000);
}

// Regisztrálja a mai megnyitást és visszaadja az aktuális széria-hosszt (napok).
export async function recordAndGetStreak() {
  const today = todayStr();
  try {
    const raw = await AsyncStorage.getItem(KEY);
    let count = 1;
    if (raw) {
      const { lastDate, count: prev } = JSON.parse(raw);
      if (lastDate === today) {
        return prev || 1; // ma már számoltuk
      }
      const gap = daysBetween(lastDate, today);
      count = gap === 1 ? (prev || 0) + 1 : 1; // tegnap → +1, különben újraindul
    }
    await AsyncStorage.setItem(KEY, JSON.stringify({ lastDate: today, count }));
    return count;
  } catch (e) {
    console.warn('dailyStreak hiba:', e);
    return 1;
  }
}
