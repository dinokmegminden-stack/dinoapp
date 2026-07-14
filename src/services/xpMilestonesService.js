// src/services/xpMilestonesService.js
// "Ki mennyi idő alatt érte el az 1000 XP-t" ranglista — az `xp_milestones`
// tábla egyszer rögzíti, amikor egy játékos átlépi a küszöböt (lásd
// XPBar.js addXP()). A players.created_at-hoz képest eltelt idő a lekérdezésnél
// számolódik ki, nincs külön tárolva.
// A creaturesService.js mintáját követi: sosem dob, hiba esetén console.warn.

import { supabase } from './supabaseClient';
import { getWeekStartISO } from './leaderboardService';

export async function logXPMilestone(playerId, milestone) {
  if (!playerId || !milestone) return;

  const { error } = await supabase
    .from('xp_milestones')
    .insert({ player_id: playerId, milestone });

  // 23505 = unique constraint (player_id, milestone) — már rögzítve volt, nem hiba.
  if (error && error.code !== '23505') {
    console.warn('logXPMilestone hiba:', error);
  }
}

export async function getXPMilestoneLeaderboard(milestone, { limit = 20, period = 'all' } = {}) {
  let query = supabase
    .from('xp_milestones')
    .select('id, player_id, achieved_at')
    .eq('milestone', milestone);

  if (period === 'week') {
    query = query.gte('achieved_at', getWeekStartISO());
  }

  const { data: milestones, error } = await query;

  if (error) {
    console.warn('getXPMilestoneLeaderboard hiba:', error);
    return [];
  }
  if (!milestones || milestones.length === 0) return [];

  const playerIds = [...new Set(milestones.map((m) => m.player_id))];
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id, nickname, created_at')
    .in('id', playerIds);

  if (playersError) {
    console.warn('getXPMilestoneLeaderboard (players) hiba:', playersError);
  }

  const playerById = new Map((players || []).map((p) => [p.id, p]));

  return milestones
    .map((m) => {
      const player = playerById.get(m.player_id);
      if (!player) return null;
      const elapsedMs = new Date(m.achieved_at).getTime() - new Date(player.created_at).getTime();
      return { id: m.id, nickname: player.nickname, elapsedMs, achievedAt: m.achieved_at };
    })
    .filter(Boolean)
    .sort((a, b) => a.elapsedMs - b.elapsedMs)
    .slice(0, limit);
}
