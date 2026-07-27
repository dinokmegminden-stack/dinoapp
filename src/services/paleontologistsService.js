import { supabase } from './supabaseClient';

// Paleontológusok az idővonal-sávhoz — a Kutatók fül tetején. Legrégebbi
// születésű elöl, hogy az idővonal balról jobbra haladjon.
export async function fetchPaleontologists() {
  const { data, error } = await supabase
    .from('paleontologists')
    .select('id, name, born_year, died_year, discovery_location, notable_discoveries, emoji')
    .order('born_year', { ascending: true });

  if (error) {
    console.warn('Supabase hiba (paleontologists):', error);
    return [];
  }
  return data || [];
}

// Cikk <-> paleontológus kapcsolótábla — a kliens ebből építi fel, kinek
// melyik cikke van, ahelyett hogy PostgREST embedded select-tel joinolna
// (lásd CLAUDE.md: nem minden FK-szerű oszlopnak van formális constraintje
// a többi táblánál, a leaderboardService.js/xpMilestonesService.js is emiatt
// kliensoldali joinnal dolgozik — itt ugyan van FK, de a mintát követjük).
export async function fetchArticlePaleontologistLinks() {
  const { data, error } = await supabase
    .from('research_article_paleontologists')
    .select('article_id, paleontologist_id');

  if (error) {
    console.warn('Supabase hiba (research_article_paleontologists):', error);
    return [];
  }
  return data || [];
}
