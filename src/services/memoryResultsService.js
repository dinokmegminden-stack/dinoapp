// src/services/memoryResultsService.js
// A "Párok" memóriajáték eredményeinek mentése — a creaturesService.js mintáját
// követi: async függvény, { data, error } destrukturálás, hiba esetén
// console.warn + fallback, sosem dob.

import { supabase } from './supabaseClient';

// level: 1 (kezdő), 2 (haladó), 3 (profi) — lásd DIFFICULTIES a MemoryGameScreen.js-ben.
export async function saveMemoryResult({ nickname, moves, seconds, level }) {
  const { data, error } = await supabase
    .from('memory_results')
    .insert({ nickname, moves, seconds, level })
    .select()
    .single();

  if (error) {
    console.warn('saveMemoryResult hiba:', error);
    return { success: false, error };
  }

  return { success: true, result: data };
}
