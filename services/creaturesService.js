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
    nev_koznapi: safe(row.name_hu || row.nev_koznapi),
    nev_tudomanyos: safe(row.name_latin || row.nev_tudomanyos),
    korszak: safe(row.era || row.korszak),
    hossz: safe(row.length_m_min || row.hossz),
    felfedezo: safe(row.discoverer_name || row.felfedezo),
    mya_min: safe(row.mya_min),
    mya_max: safe(row.mya_max),
    csomag: Number(row.pack_number || row.csomag || 1),
    edu: Number(row.edu || row.education_level || 1),
    image_url: row.image_url || null,
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
