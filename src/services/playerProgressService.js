import { supabase } from './supabaseClient';

export async function saveProgressToServer(playerId, nickname, progressData) {
  try {
    const { data, error } = await supabase
      .from('player_progress')
      .upsert(
        {
          player_id: playerId,
          nickname,
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

export async function loadProgressFromServerByNickname(nickname) {
  try {
    const { data, error } = await supabase
      .from('player_progress')
      .select('progress_data, player_id')
      .eq('nickname', nickname)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.warn('loadProgressFromServerByNickname error:', error);
      return null;
    }

    return data?.progress_data || null;
  } catch (err) {
    console.warn('loadProgressFromServerByNickname exception:', err);
    return null;
  }
}
