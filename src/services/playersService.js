// src/services/playersService.js
// A nickname-regisztráció Supabase-rétege — a creaturesService.js mintáját követi:
// async függvény, { data, error } destrukturálás, hiba esetén console.warn + fallback,
// sosem dob.

import { supabase } from './supabaseClient';

// Előzetes, felhasználóbarát ellenőrzés — a végső garancia a `players.nickname`
// unique constraint-je (lásd registerPlayer), ez csak gyorsabb visszajelzést ad
// versenyhelyzet nélküli esetben.
export async function isNicknameTaken(nickname) {
  const { data, error } = await supabase
    .from('players')
    .select('id')
    .eq('nickname', nickname)
    .maybeSingle();

  if (error) {
    console.warn('isNicknameTaken hiba:', error);
    return false;
  }

  return !!data;
}

// Visszatérő játékosnál (nickname AsyncStorage-ból betöltve) csak a nickname áll
// rendelkezésre — ez adja vissza a Supabase `players.id`-t a game_events FK-hoz.
export async function getPlayerIdByNickname(nickname) {
  const { data, error } = await supabase
    .from('players')
    .select('id')
    .eq('nickname', nickname)
    .maybeSingle();

  if (error) {
    console.warn('getPlayerIdByNickname hiba:', error);
    return null;
  }

  return data?.id ?? null;
}

// Regisztráció — a `nickname` oszlop unique constraint-je véd a versenyhelyzet ellen
// akkor is, ha két játékos majdnem egyszerre próbálja ugyanazt a kombinációt lefoglalni.
// A `pin`-t a hívó generálja (lásd nicknameParts.js generatePin) — az oszlop
// select-joga anon-tól el van véve, ezért explicit oszloplistával kérünk vissza
// mindent RAJTA KÍVÜL, nem `.select()`-tel (az a `pin`-t is visszakérné, ami hibázna).
// Visszatérés: { success, taken, error }.
export async function registerPlayer(nickname, pin) {
  const { data, error } = await supabase
    .from('players')
    .insert({ nickname, pin })
    .select('id, nickname, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, taken: true, error: null };
    }
    console.warn('registerPlayer hiba:', error);
    return { success: false, taken: false, error };
  }

  return { success: true, taken: false, error: null, player: data };
}

// Eszközváltás után a játékos a becenevével + PIN-jével "folytathatja" a régi
// profilját — a players.pin oszlopot közvetlenül nem lehet kiolvasni (lásd
// Supabase revoke), ezért egy security definer RPC végzi az összevetést, és
// csak találat esetén adja vissza a player_id-t.
export async function resumePlayerWithPin(nickname, pin) {
  const { data, error } = await supabase.rpc('verify_player_pin', {
    p_nickname: nickname,
    p_pin: pin,
  });

  if (error) {
    console.warn('resumePlayerWithPin hiba:', error);
    return null;
  }

  return data ?? null;
}
