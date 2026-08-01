// Közös ritkaság-logika a kártya-komponenseknek (SpecimenCard, DinoCard,
// DinoCardModal) — korábban 3 helyen élt ugyanaz a map/normalizálás.
// A valódi `creatures.rarity` 3 magyar tier: Lelet (leggyakoribb) < Kincs <
// Ereklye (legritkább). Két rekordnál tévesen angol "Common" maradt egy
// korábbi migrációból — normalizeRarity() erre "Lelet"-re képezi le.
import { COLORS } from '../constants/theme';

export const RARITY_COLOR = {
  lelet: '#c8ccbe',
  kincs: '#8ecbe6',
  ereklye: COLORS.accent,
};

export function normalizeRarity(raw) {
  return String(raw || '').toLowerCase() === 'common' ? 'Lelet' : raw;
}

export function getRarityColor(raw) {
  return RARITY_COLOR[normalizeRarity(raw || '').toLowerCase()];
}
