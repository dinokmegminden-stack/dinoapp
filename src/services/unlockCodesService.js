// src/services/unlockCodesService.js
// "Kód beváltása" — Super Thanks támogatóknak kézzel generált, egyszer
// felhasználható kódok, amik az összes csomagot megnyitják. A `creaturesService.js`
// mintáját követi: sosem dob, hiba esetén console.warn + fallback.
//
// Az egyszeri felhasználás garanciáját NEM a kliens, hanem egyetlen feltételes
// UPDATE adja: `WHERE used_by_player_id IS NULL` — a Postgres sor-szintű
// zárolása miatt két egyidejű beváltás közül fizikailag csak az egyik érhet célba,
// a másik 0 sort módosít. Nincs szükség külön "foglalt" flag-re a players
// táblán: az, hogy egy játékos teljesen ki van nyitva, abból derül ki, hogy
// létezik-e `unlock_codes` sor `used_by_player_id = playerId`-vel.

import { supabase } from './supabaseClient';

export async function redeemUnlockCode(code, playerId) {
  const cleanCode = String(code || '').trim().toUpperCase();
  if (!cleanCode || !playerId) return { success: false, reason: 'invalid' };

  const { data, error } = await supabase
    .from('unlock_codes')
    .update({ used_by_player_id: playerId, used_at: new Date().toISOString() })
    .eq('code', cleanCode)
    .is('used_by_player_id', null)
    .select('id');

  if (error) {
    console.warn('redeemUnlockCode hiba:', error);
    return { success: false, reason: 'error' };
  }
  if (!data || data.length === 0) {
    return { success: false, reason: 'not_found_or_used' };
  }
  return { success: true };
}

export async function hasFullUnlock(playerId) {
  if (!playerId) return false;

  const { data, error } = await supabase
    .from('unlock_codes')
    .select('id')
    .eq('used_by_player_id', playerId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('hasFullUnlock hiba:', error);
    return false;
  }
  return !!data;
}
