// services/creaturesService.js
import { supabase } from './supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'creatures_cache_edu_';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 óra

// --- Fő lekérdező függvény (edu-alapú) ---------------------------------------
// eduLevel: 1=Kárpát-medence, 2=Európa, 3=Afrika, 4=Ázsia, 5=Amerika
// Kizárja a NHM bulk importot (pack_number >= 5 vagy edu IS NULL).

export async function getCreaturesByEdu(eduLevel) {
  const cacheKey = `${CACHE_PREFIX}${eduLevel}`;

  // 1. Cache ellenőrzés
  try {
    const cachedRaw = await AsyncStorage.getItem(cacheKey);
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw);
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return { data: cached.data, fromCache: true };
      }
    }
  } catch (e) {
    console.warn('Cache olvasási hiba:', e);
  }

  // 2. Supabase lekérés
  const { data, error } = await supabase
    .from('creatures')
    .select('*')
    .eq('edu', eduLevel)
    .lt('pack_number', 5)        // kizárja a 100-as NHM bulk szemetet
    .not('edu', 'is', null)      // csak kitöltött edu sorokat
    .order('pack_number', { ascending: true });

  if (error) {
    console.error('Supabase creatures hiba:', error);
    // Fallback: lejárt cache inkább mint semmi
    try {
      const cachedRaw = await AsyncStorage.getItem(cacheKey);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        return { data: cached.data, fromCache: true, stale: true };
      }
    } catch (_) {}
    return { data: null, error };
  }

  const adapted = data.map(adaptCreature);

  // 3. Cache frissítése
  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify({ data: adapted, timestamp: Date.now() }));
  } catch (e) {
    console.warn('Cache írási hiba:', e);
  }

  return { data: adapted, fromCache: false };
}

// --- Cache törlés -------------------------------------------------------------

export async function clearCreaturesCache(eduLevel) {
  if (eduLevel != null) {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${eduLevel}`);
  } else {
    const keys = await AsyncStorage.getAllKeys();
    const eduKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(eduKeys);
  }
}

// --- Mezőnév-adapter: Supabase-sor -> a meglévő UI/kvízgenerátor által várt alak ---
// (a korábbi karpatok.json / europa.json / afrika.json mezőneveit utánozza,
// hogy a Level*.js fájlokban a JSX és a kérdésgenerátor érintetlen maradhasson)
export function adaptCreature(row) {
  return {
    nev_koznapi: row.name_hu,
    nev_tudomanyos: row.name_latin,
    csomag: row.pack_number,
    korszak: row.epoch,
    kor_millioev: formatMyaRange(row.mya_min, row.mya_max),
    hossz: formatRange(row.length_m_min, row.length_m_max, 'm'),
    felfedezo: row.discoverer_name,
    leiras: row.description_hu,
    discovery_year: row.discovery_year,
    image_url: row.image_url,
    rarity: row.rarity,
    _raw: row,
  };
}

function formatMyaRange(min, max) {
  if (min == null && max == null) return 'ismeretlen';
  if (min == null) return `${max} millió évvel ezelőtt`;
  if (max == null) return `${min} millió évvel ezelőtt`;
  if (min === max) return `${min} millió évvel ezelőtt`;
  return `${min}–${max} millió évvel ezelőtt`;
}

function formatRange(min, max, unit) {
  if (min == null && max == null) return 'ismeretlen';
  if (min == null) return `${max} ${unit}`;
  if (max == null) return `${min} ${unit}`;
  if (min === max) return `${min} ${unit}`;
  return `${min}–${max} ${unit}`;
}
