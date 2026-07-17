// src/services/favoritesService.js
// A `player_favorites` tábla (player_id, creature_id, created_at, összetett PK)
// kezelése — a creaturesService.js / xpMilestonesService.js mintáját követi:
// sosem dob, hiba esetén console.warn + biztonságos visszatérési érték.

import { supabase } from './supabaseClient';

export async function getFavoriteIds(playerId) {
  if (!playerId) return [];

  const { data, error } = await supabase
    .from('player_favorites')
    .select('creature_id')
    .eq('player_id', playerId);

  if (error) {
    console.warn('getFavoriteIds hiba:', error);
    return [];
  }

  return (data || []).map((row) => row.creature_id);
}

export async function addFavorite(playerId, creatureId) {
  if (!playerId || !creatureId) return;

  const { error } = await supabase
    .from('player_favorites')
    .insert({ player_id: playerId, creature_id: creatureId });

  // 23505 = unique constraint (player_id, creature_id) — már be volt jelölve, nem hiba.
  if (error && error.code !== '23505') {
    console.warn('addFavorite hiba:', error);
  }
}

export async function removeFavorite(playerId, creatureId) {
  if (!playerId || !creatureId) return;

  const { error } = await supabase
    .from('player_favorites')
    .delete()
    .eq('player_id', playerId)
    .eq('creature_id', creatureId);

  if (error) {
    console.warn('removeFavorite hiba:', error);
  }
}
