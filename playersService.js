// playersService.js
// Nickname-alapú Supabase player létrehozás/lekérdezés.
// Nincs valódi auth — a `players` tábla unique nickname constraint-je
// biztosítja, hogy minden becenév csak egyszer szerepelhet.
//
// A player_id-t lokálisan (AsyncStorage) is cache-eljük, hogy ne kelljen
// minden indításnál Supabase-hívást tenni — csak akkor kérünk újra, ha a
// cache-elt nickname nem egyezik az aktuális nicknévvel, vagy ha még
// nincs cache.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './services/supabaseClient';

const PLAYER_ID_KEY = 'dino_player_id';
const PLAYER_NICKNAME_KEY = 'dino_player_nickname';

async function getCachedPlayer() {
  try {
    const [id, nickname] = await Promise.all([
      AsyncStorage.getItem(PLAYER_ID_KEY),
      AsyncStorage.getItem(PLAYER_NICKNAME_KEY),
    ]);
    if (id && nickname) return { id, nickname };
    return null;
  } catch {
    return null;
  }
}

async function cachePlayer(id, nickname) {
  try {
    await AsyncStorage.setItem(PLAYER_ID_KEY, id);
    await AsyncStorage.setItem(PLAYER_NICKNAME_KEY, nickname);
  } catch (e) {
    console.warn('cachePlayer hiba:', e);
  }
}

/**
 * Visszaadja a player_id-t a megadott nicknévhez.
 * - Ha van érvényes lokális cache ugyanahhoz a nicknévhez, azt használja
 *   (nincs felesleges hálózati hívás).
 * - Ha nincs cache, vagy a nickname megváltozott, lekéri/létrehozza a
 *   Supabase-ben, és frissíti a cache-t.
 * - Hálózati hiba esetén `null`-lal tér vissza, és csendben hagyja, hogy
 *   az app offline módban, Supabase-szinkron nélkül tovább működjön.
 *
 * @param {string} nickname
 * @returns {Promise<string|null>} player_id (uuid) vagy null
 */
export async function getOrCreatePlayerId(nickname) {
  const trimmed = (nickname || '').trim();
  if (!trimmed) return null;

  const cached = await getCachedPlayer();
  if (cached && cached.nickname === trimmed) {
    return cached.id;
  }

  try {
    // 1) Megnézzük, létezik-e már ez a nickname
    const { data: existing, error: selectError } = await supabase
      .from('players')
      .select('id')
      .eq('nickname', trimmed)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existing) {
      await cachePlayer(existing.id, trimmed);
      return existing.id;
    }

    // 2) Nem létezik -> létrehozzuk
    const { data: created, error: insertError } = await supabase
      .from('players')
      .insert({ nickname: trimmed })
      .select('id')
      .single();

    if (insertError) {
      // Ha közben (race condition) más folyamat már létrehozta ugyanezt a
      // nicknevet, az unique constraint hibát dob -> próbáljuk újra lekérni.
      if (insertError.code === '23505') {
        const { data: retryExisting } = await supabase
          .from('players')
          .select('id')
          .eq('nickname', trimmed)
          .maybeSingle();
        if (retryExisting) {
          await cachePlayer(retryExisting.id, trimmed);
          return retryExisting.id;
        }
      }
      throw insertError;
    }

    await cachePlayer(created.id, trimmed);
    return created.id;
  } catch (e) {
    console.warn('getOrCreatePlayerId hiba (offline módban folytatjuk):', e);
    return null;
  }
}

/**
 * Hibakezelt nickname-foglaltság ellenőrzés UI-hoz.
 * Akkor hasznos, ha explicit "ez a név foglalt" üzenetet szeretnénk
 * megjeleníteni MÁS player_id-jával már regisztrált nicknévnél
 * (pl. ha a felhasználó egy korábban általa nem használt, de már
 * foglalt nevet próbál megadni egy másik eszközön).
 *
 * @param {string} nickname
 * @returns {Promise<boolean>} true, ha a nickname szabadon felvehető
 */
export async function isNicknameAvailable(nickname) {
  const trimmed = (nickname || '').trim();
  if (!trimmed) return false;

  try {
    const { data, error } = await supabase
      .from('players')
      .select('id')
      .eq('nickname', trimmed)
      .maybeSingle();
    if (error) throw error;
    return !data;
  } catch (e) {
    console.warn('isNicknameAvailable hiba:', e);
    // Hálózati hiba esetén nem blokkoljuk a felhasználót — engedjük tovább,
    // a getOrCreatePlayerId majd lekezeli a tényleges ütközést.
    return true;
  }
}
