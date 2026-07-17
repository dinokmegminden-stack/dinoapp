import { useCallback, useEffect, useState } from 'react';
import { getFavoriteIds, addFavorite, removeFavorite } from '../services/favoritesService';

export const MAX_FAVORITES = 10;

// Optimista frissítésű kedvenc-kezelő: a UI azonnal reagál, a Supabase-hívás
// háttérben fut. Hiba esetén (pl. hálózat) visszaáll az előző állapotra.
export function useFavorites(playerId) {
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!playerId) {
      setFavoriteIds(new Set());
      setLoaded(false);
      return;
    }
    let mounted = true;
    getFavoriteIds(playerId).then((ids) => {
      if (!mounted) return;
      setFavoriteIds(new Set(ids));
      setLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [playerId]);

  const isFavorite = useCallback((creatureId) => favoriteIds.has(creatureId), [favoriteIds]);

  // true = sikerült (be- vagy kijelölve), false = elutasítva (pl. betelt a 10-es keret).
  const toggleFavorite = useCallback((creatureId) => {
    if (!playerId || !creatureId) return false;

    if (favoriteIds.has(creatureId)) {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(creatureId);
        return next;
      });
      removeFavorite(playerId, creatureId);
      return true;
    }

    if (favoriteIds.size >= MAX_FAVORITES) {
      return false;
    }

    setFavoriteIds((prev) => new Set(prev).add(creatureId));
    addFavorite(playerId, creatureId);
    return true;
  }, [playerId, favoriteIds]);

  return { favoriteIds, isFavorite, toggleFavorite, favoriteCount: favoriteIds.size, loaded };
}
