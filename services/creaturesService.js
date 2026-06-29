// services/creaturesService.js
import { supabase } from './supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'creatures_cache_';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 óra

export async function getCreaturesByRegion(region) {
  const cacheKey = `${CACHE_PREFIX}${region}`;

  // 1. Próbáljuk a cache-t, ha friss
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
    .eq('region', region)
    .order('pack_number', { ascending: true });

  if (error) {
    console.error('Supabase creatures hiba:', error);
    // Fallback: ha van bármilyen (akár lejárt) cache, azt adjuk vissza inkább mint semmit
    try {
      const cachedRaw = await AsyncStorage.getItem(cacheKey);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        return { data: cached.data, fromCache: true, stale: true };
      }
    } catch (_) {
      // nincs cache sem, visszaadjuk a hibát
    }
    return { data: null, error };
  }

  // 3. Cache frissítése
  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    console.warn('Cache írási hiba:', e);
  }

  return { data, fromCache: false };
}

export async function clearCreaturesCache(region) {
  if (region) {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${region}`);
  } else {
    const keys = await AsyncStorage.getAllKeys();
    const regionKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(regionKeys);
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
