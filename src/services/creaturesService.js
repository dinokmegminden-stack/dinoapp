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
    // DinoCard.js natívan ezeket várja:
    name_hu: safe(row.name_hu),
    name_latin: safe(row.name_latin),
    // visszamenőleges kompatibilitás régi hívóknak (pl. BrowseScreen lista-nézet, ha még a régi kulcsokat használja):
    nev_koznapi: safe(row.name_hu),
    nev_tudomanyos: safe(row.name_latin),
    korszak: safe(row.era),
    hossz: safe(row.length_m_min),
    felfedezo: safe(row.discoverer_name),
    mya_min: safe(row.mya_min),
    mya_max: safe(row.mya_max),
    csomag: Number(row.pack_number || 1),
    edu: Number(row.edu || row.education_level || 1),
    image_url: row.image_url || null,
    description_hu: safe(row.description_hu),
    period: safe(row.period),
    region: safe(row.region),
    rarity: safe(row.rarity),
    taxonomy_group: safe(row.taxonomy_group),
    taxonomy_hu: safe(row.taxonomy_hu),
    diet_hu: safe(row.diet_hu),
    diet_eng: safe(row.diet_eng),
    discovery_year: row.discovery_year != null ? Number(row.discovery_year) : null,
    weight_kg_min: row.weight_kg_min != null ? Number(row.weight_kg_min) : null,
    weight_kg_max: row.weight_kg_max != null ? Number(row.weight_kg_max) : null,
    height_m_min: row.height_m_min != null ? Number(row.height_m_min) : null,
    height_m_max: row.height_m_max != null ? Number(row.height_m_max) : null,
    length_m_min: row.length_m_min != null ? Number(row.length_m_min) : null,
    length_m_max: row.length_m_max != null ? Number(row.length_m_max) : null,
  };
}

// Régió dínóinak lekérése edu alapján
export async function fetchCreaturesByEdu(eduLevel) {
  const { data, error } = await supabase
    .from('creatures')
    .select('*')
    .eq('edu', eduLevel);

  if (error) {
    console.warn('Supabase hiba:', error);
    return [];
  }

  return (data || []).map(adaptCreature);
}
