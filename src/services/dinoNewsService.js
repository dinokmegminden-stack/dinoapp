import { supabase } from './supabaseClient';

// A tudományos név első fele (genus) — ezt használjuk megjelenített címként és a
// kép-kulcsként (IMAGE_MAP), így nem kell kitalált magyar közneves oszlopra
// támaszkodni. Pl. "Uragasaurus kalasinensis" → "Uragasaurus".
export function genusOf(scientificName) {
  return String(scientificName || '').trim().split(/\s+/)[0] || '';
}

// Dínós Hírek lekérése a `dino_news` táblából — a landing bal sávjához. A
// legfrissebb, publikált bejegyzések elöl. Hiba/hozzáférés hiányában üres tömb
// (a hívó a placeholder-re esik vissza). RLS: a táblán publikus SELECT policy
// kell (is_published = true), különben anon kulccsal 0 sor jön vissza.
export async function fetchDinoNews(limit = 10) {
  const { data, error } = await supabase
    .from('dino_news')
    .select('id, published_at, scientific_name, common_name, news_text, creature_id, source_url')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('Supabase hiba (dino_news):', error);
    return [];
  }
  return data || [];
}
