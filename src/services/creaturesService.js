import { supabase } from './supabaseClient';

// Biztonságos szövegkezelés (React error #130 ellen)
function safe(value) {
  if (value == null) return '';
  if (typeof value === 'object') return '';
  return String(value);
}

// Dínó adat adaptálása (minden mező safe)
export function adaptCreature(row) {
  return {
    id: row.id,
    // TradingCard.js natívan ezeket várja:
    name_hu: safe(row.common_name),
    name_latin: safe(row.scientific_name),
    // visszamenőleges kompatibilitás régi hívóknak (pl. BrowseScreen lista-nézet, ha még a régi kulcsokat használja):
    nev_koznapi: safe(row.common_name),
    nev_tudomanyos: safe(row.scientific_name),
    korszak: safe(row.era_hu),
    hossz: safe(row.length_m_min),
    felfedezo: safe(row.discoverer_name),
    // valódi Supabase mezőnevek passthrough-ja (pl. quizGenerator.js ezeket várja):
    epoch: safe(row.epoch_hu),
    discoverer_name: safe(row.discoverer_name),
    // FIGYELEM: a Supabase oszlop valódi neve `latin_name_end` (nem `latin_name_ending`) —
    // korábban ez a mező mindig üres volt emiatt (érintette a quizGenerator.js
    // buildLatinNameQuestion-jét is, ami emiatt sosem generált kérdést).
    latin_name_ending: safe(row.latin_name_end),
    mya_min: row.mya_end != null ? Number(row.mya_end) : null,
    mya_max: row.mya_start != null ? Number(row.mya_start) : null,
    csomag: Number(row.pack_number || 1),
    edu: Number(row.edu || row.education_level || 1),
    image_url: row.image_url || null,
    description_hu: safe(row.description_hu),
    period: safe(row.period_hu),
    region: safe(row.region_hu),
    rarity: safe(row.rarity),
    // A korábbi taxonomy_group/taxonomy_hu/taxonomy_category/pbdb_class_hu oszlopok
    // megszűntek — a rend/alrend/csalad hármas váltotta fel őket (lásd whoAmIQuizGenerator.js).
    rend: safe(row.rend),
    alrend: safe(row.alrend),
    csalad: safe(row.csalad),
    diet_hu: safe(row.diet_hu),
    diet_eng: safe(row.diet_eng),
    discovered_country: safe(row.discovered_country),
    discovery_year: row.discovery_year != null ? Number(row.discovery_year) : null,
    weight_kg_min: row.weight_kg_min != null ? Number(row.weight_kg_min) : null,
    weight_kg_max: row.weight_kg_max != null ? Number(row.weight_kg_max) : null,
    height_m_min: row.height_m_min != null ? Number(row.height_m_min) : null,
    height_m_max: row.height_m_max != null ? Number(row.height_m_max) : null,
    length_m_min: row.length_m_min != null ? Number(row.length_m_min) : null,
    length_m_max: row.length_m_max != null ? Number(row.length_m_max) : null,
  };
}

// Régió dínóinak lekérése edu alapján — a pack_number = 100 jelöli az "OUT OF GAME"
// dínókat (még nincs végleges pakkba sorolva), ezeket egyelőre kizárjuk.
export async function fetchCreaturesByEdu(eduLevel) {
  const { data, error } = await supabase
    .from('creatures')
    .select('*')
    .eq('edu', eduLevel)
    .neq('pack_number', 100);

  if (error) {
    console.warn('Supabase hiba:', error);
    return [];
  }

  return (data || []).map(adaptCreature);
}
