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

// Regisztráció — a register-player Edge Function-ön keresztül megy (lásd
// supabase/functions/register-player/index.ts), nem közvetlen tábla-INSERT-tel:
// az Edge Function IP-alapú limitet tart (max 5 regisztráció / IP) a
// registration_attempts tábla alapján, ezt kliensoldalon nem lehetne kikényszeríteni,
// mert a böngésző-IP csak szerver oldalon látható megbízhatóan.
// Visszatérés: { success, taken, error }.
export async function registerPlayer(nickname, pin) {
  const { data, error } = await supabase.functions.invoke('register-player', {
    body: { nickname, pin },
  });

  if (error) {
    console.warn('registerPlayer hiba:', error);
    return { success: false, taken: false, error };
  }

  if (data?.error === 'too_many_registrations') {
    return { success: false, taken: false, error: { code: 'too_many_registrations' } };
  }

  if (data?.taken) {
    return { success: false, taken: true, error: null };
  }

  if (data?.error) {
    console.warn('registerPlayer hiba:', data.error);
    return { success: false, taken: false, error: data.error };
  }

  return { success: true, taken: false, error: null, player: data.player };
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
