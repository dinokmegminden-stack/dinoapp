import { supabase } from './supabaseClient';

// Kutatók lekérése a `research_articles` táblából — a Kutatók fülhöz. A
// legfrissebb, publikált cikkek elöl. Hiba/hozzáférés hiányában üres tömb.
// RLS: publikus SELECT policy kell (is_published = true), különben anon
// kulccsal 0 sor jön vissza (lásd dinoNewsService.js ugyanezt a mintát).
export async function fetchResearchArticles(limit = 20) {
  const { data, error } = await supabase
    .from('research_articles')
    .select('id, title, published_at, body_text, source_url, author')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('Supabase hiba (research_articles):', error);
    return [];
  }
  return data || [];
}
