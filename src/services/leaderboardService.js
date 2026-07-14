// src/services/leaderboardService.js
// A négy játékmód (Párok/Ki vagyok én?/5mp Képkvíz/XP Milliomos) idő-alapú
// ranglistái — a `leaderboard_entries` táblát használja (region nullable-re
// állítva, mivel ezek a játékok nem régióhoz kötöttek). Csak hibátlan
// (0 hibás lépés/válasz) futások kerülnek fel — ezt a hívó screen dönti el,
// itt csak a mentés/lekérdezés történik.
// A creaturesService.js mintáját követi: sosem dob, hiba esetén console.warn.
//
// level_type értékek: 'memory_1' | 'memory_2' | 'memory_3' | 'whoami' |
// 'lightning' | 'millionaire'.

import { supabase } from './supabaseClient';

const TOP_N = 10;

// A hét hétfő 00:00-kor kezdődik (helyi idő) — ez a "heti" ranglista határa.
export function getWeekStartISO() {
  const now = new Date();
  const day = now.getDay(); // 0 = vasárnap, 1 = hétfő, ...
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

// Visszaadja, hogy az új eredmény új személyes rekord-e, és bekerült-e a
// Top 10-be (mindig teljes, "all time" ranglista alapján — a heti nézet
// böngészésre való, az ünneplés nem attól függ, hogy éppen melyik nézetet
// látja a felhasználó). A rekord-ellenőrzés a beszúrás ELŐTTI legjobb időhöz
// képest történik, a rangsorolás pedig a beszúrás UTÁN.
export async function submitLeaderboardEntry({ playerId, levelType, completionTimeMs }) {
  const failResult = { success: false, isNewPersonalBest: false, isTopTen: false };
  if (!playerId || !levelType || completionTimeMs == null) return failResult;

  const { data: previousBest, error: previousBestError } = await supabase
    .from('leaderboard_entries')
    .select('completion_time_ms')
    .eq('player_id', playerId)
    .eq('level_type', levelType)
    .order('completion_time_ms', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (previousBestError) {
    console.warn('submitLeaderboardEntry (previousBest) hiba:', previousBestError);
  }

  const { error } = await supabase
    .from('leaderboard_entries')
    .insert({ player_id: playerId, level_type: levelType, completion_time_ms: completionTimeMs });

  if (error) {
    console.warn('submitLeaderboardEntry hiba:', error);
    return failResult;
  }

  const isNewPersonalBest = !previousBest || completionTimeMs < previousBest.completion_time_ms;

  const { count, error: countError } = await supabase
    .from('leaderboard_entries')
    .select('id', { count: 'exact', head: true })
    .eq('level_type', levelType)
    .lt('completion_time_ms', completionTimeMs);

  if (countError) {
    console.warn('submitLeaderboardEntry (rank) hiba:', countError);
  }

  const isTopTen = countError ? false : (count ?? 0) < TOP_N;

  return { success: true, isNewPersonalBest, isTopTen };
}

export function getCelebrationMessage({ isNewPersonalBest, isTopTen }) {
  if (isTopTen && isNewPersonalBest) return '🏆 Top 10 és új rekord!';
  if (isTopTen) return '🏆 Bekerültél a Top 10-be!';
  if (isNewPersonalBest) return '🎉 Új személyes rekord!';
  return null;
}

// Nem PostgREST embedded select-tel (players(nickname)) dolgozunk, mert nem
// biztos, hogy van formális FK constraint player_id -> players.id — helyette
// két lekérdezés, kliensoldali join a nickname-ekhez.
export async function getLeaderboard(levelType, { limit = 20, period = 'all' } = {}) {
  let query = supabase
    .from('leaderboard_entries')
    .select('id, player_id, completion_time_ms, achieved_at')
    .eq('level_type', levelType);

  if (period === 'week') {
    query = query.gte('achieved_at', getWeekStartISO());
  }

  const { data: entries, error } = await query
    .order('completion_time_ms', { ascending: true })
    .limit(limit);

  if (error) {
    console.warn('getLeaderboard hiba:', error);
    return [];
  }
  if (!entries || entries.length === 0) return [];

  const playerIds = [...new Set(entries.map((e) => e.player_id))];
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id, nickname')
    .in('id', playerIds);

  if (playersError) {
    console.warn('getLeaderboard (players) hiba:', playersError);
  }

  const nicknameById = new Map((players || []).map((p) => [p.id, p.nickname]));

  return entries.map((e) => ({
    id: e.id,
    nickname: nicknameById.get(e.player_id) || '???',
    completionTimeMs: e.completion_time_ms,
    achievedAt: e.achieved_at,
  }));
}
