// src/services/gameEventsService.js
// Játékmód-indítások/-befejezések naplózása a `game_events` táblába (lásd a
// séma tervezéskori döntéseit: player_id FK, nincs tárolt duration_ms — a
// hossz a completed_at - started_at különbségéből számolható lekérdezéskor).
// A creaturesService.js/playersService.js mintáját követi: sosem dob, hiba
// esetén console.warn + null/no-op.

import { supabase } from './supabaseClient';
import { toDateKey } from '../utils/visitStats';

export async function trackGameStart({ playerId, gameType, region = null, eduLevel = null }) {
  if (!playerId) return null;

  const { data, error } = await supabase
    .from('game_events')
    .insert({ player_id: playerId, game_type: gameType, region, edu_level: eduLevel })
    .select('id')
    .single();

  if (error) {
    console.warn('trackGameStart hiba:', error);
    return null;
  }

  return data?.id ?? null;
}

export async function trackGameComplete(eventId) {
  if (!eventId) return;

  const { error } = await supabase
    .from('game_events')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', eventId);

  if (error) {
    console.warn('trackGameComplete hiba:', error);
  }
}

// A Játékmódok képernyő "Xszer játszva" jelvényéhez (GamingScreen) — csak a
// LEZÁRT (completed_at != null) eseményeket számoljuk, game_type szerint
// csoportosítva. Kliensoldali reduce, mert a játékos game_events sora kicsi
// (nincs szükség szerver-oldali GROUP BY-ra egy RPC-vel).
export async function getGamePlayCounts(playerId) {
  if (!playerId) return {};

  const { data, error } = await supabase
    .from('game_events')
    .select('game_type')
    .eq('player_id', playerId)
    .not('completed_at', 'is', null);

  if (error) {
    console.warn('getGamePlayCounts hiba:', error);
    return {};
  }

  const counts = {};
  (data || []).forEach((row) => {
    counts[row.game_type] = (counts[row.game_type] || 0) + 1;
  });
  return counts;
}

// A játékos irányítópultjának (PlayerDashboardScreen) naptár- és
// széria-nézetéhez: minden nap, amikor legalább egy game_event indult —
// egyedi, helyi időzóna szerinti "ÉÉÉÉ-HH-NN" kulcsok, növekvő sorrendben.
export async function getVisitDates(playerId) {
  if (!playerId) return [];

  const { data, error } = await supabase
    .from('game_events')
    .select('started_at')
    .eq('player_id', playerId)
    .order('started_at', { ascending: true });

  if (error) {
    console.warn('getVisitDates hiba:', error);
    return [];
  }

  const dateKeys = new Set((data || []).map((row) => toDateKey(new Date(row.started_at))));
  return [...dateKeys].sort();
}
