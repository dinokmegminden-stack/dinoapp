import { supabase } from './supabaseClient';
import { getPlayerIdByNickname } from './playersService';

// FIGYELEM: a `player_progress` táblának NINCS `nickname` oszlopa (lásd
// data/sqls/create_player_progress_table.sql) — a player_id (UUID, FK a
// players.id-ra) az egyetlen azonosító, hogy ne legyen redundáns/state-elavulós
// másolat a nicknameből.
export async function saveProgressToServer(playerId, progressData) {
  try {
    const { data, error } = await supabase
      .from('player_progress')
      .upsert(
        {
          player_id: playerId,
          progress_data: progressData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'player_id' }
      )
      .select();

    if (error) {
      console.warn('saveProgressToServer error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('saveProgressToServer exception:', err);
    return false;
  }
}

export async function loadProgressFromServer(playerId) {
  try {
    const { data, error } = await supabase
      .from('player_progress')
      .select('progress_data')
      .eq('player_id', playerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found, return null (new player)
        return null;
      }
      console.warn('loadProgressFromServer error:', error);
      return null;
    }

    return data?.progress_data || null;
  } catch (err) {
    console.warn('loadProgressFromServer exception:', err);
    return null;
  }
}

// Nincs `nickname` oszlop a player_progress táblában — előbb feloldjuk a
// player_id-t (players.nickname unique), aztán azzal kérdezünk.
export async function loadProgressFromServerByNickname(nickname) {
  const playerId = await getPlayerIdByNickname(nickname);
  if (!playerId) return null;
  return loadProgressFromServer(playerId);
}
