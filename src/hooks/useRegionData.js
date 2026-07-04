import { useEffect, useMemo, useState } from 'react';
import { fetchCreaturesByEdu } from '../services/creaturesService';
import { groupByPackage } from '../utils/regionHelpers';

export function useRegionData(eduLevel, enabled = true) {
  const [creatures, setCreatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || eduLevel == null) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      const data = await fetchCreaturesByEdu(eduLevel);
      if (!mounted) return;
      setCreatures(data || []);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [enabled, eduLevel]);

  const packages = useMemo(() => groupByPackage(creatures), [creatures]);

  return { creatures, packages, loading, error };
}