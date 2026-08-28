import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import Shell from '../components/Shell';
import HeaderBar from '../components/HeaderBar';
import CollectionFilterSidebar from '../components/CollectionFilterSidebar';
import AlbumCard from '../components/AlbumCard';
import ProgressRing from '../components/ProgressRing';
import { isGuestMode } from '../utils/guestMode';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { REGION_ORDER, EDU_LABELS, regionCollectionStats } from '../utils/regionProgress';
import { ALREND_HU } from '../utils/alrendHu';
import { useT } from '../i18n';


const EPOCH_ORDER = ['késő-kréta', 'kora-kréta', 'késő-jura', 'közép-jura', 'kora-jura', 'késő-triász'];
const EPOCH_LABEL_HU = {
  'késő-kréta': 'Késő-kréta',
  'kora-kréta': 'Kora-kréta',
  'késő-jura': 'Késő-jura',
  'közép-jura': 'Közép-jura',
  'kora-jura': 'Kora-jura',
  'késő-triász': 'Késő-triász',
};

function normalizeEpoch(epoch) {
  return epoch === 'középső-jura' ? 'közép-jura' : epoch;
}

function normalizeDiet(diet) {
  return diet === 'ragadozó' ? 'húsevő' : diet;
}


const REGION_LABEL_ORDER = REGION_ORDER.map((edu) => EDU_LABELS[edu]);
const ALREND_ORDER = [...new Set(Object.values(ALREND_HU))];

const NON_FILTERABLE_VALUES = new Set(['ismeretlen', '']);

// Az Album megnyitásakor nem az összes feloldott lényt rendereljük ki (100%-os
// gyűjteménynél ez 111 kártya + 111 kép egyszerre, ami érezhetően lassú), csak
// az első adagot — a többi görgetéskor töltődik hozzá.
const PAGE_SIZE = 20;

function sortByOrder(values, order) {
  const seen = new Set(values);
  const ordered = order.filter((v) => seen.has(v));
  const rest = values.filter((v) => !order.includes(v)).sort((a, b) => a.localeCompare(b, 'hu'));
  return [...ordered, ...rest];
}

function splitMultiValue(raw) {
  return String(raw || '')
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v && !NON_FILTERABLE_VALUES.has(v));
}

function buildFilterCategory(dinos, field, order, title, transform = (v) => v) {
  const counts = new Map();
  for (const d of dinos) {
    for (const raw of splitMultiValue(d[field])) {
      const v = transform(raw);
      if (!v || NON_FILTERABLE_VALUES.has(v)) continue;
      counts.set(v, (counts.get(v) || 0) + 1);
    }
  }
  const values = sortByOrder([...counts.keys()], order || []);
  return {
    title,
    options: values.map((value) => ({ value, count: counts.get(value) })),
  };
}



const FILTER_FIELDS = [
  { key: 'epoch', field: 'epoch', titleKey: 'collection.filter_epoch', order: EPOCH_ORDER, transform: normalizeEpoch },
  { key: 'region', field: 'region', titleKey: 'collection.filter_region', order: REGION_LABEL_ORDER },
  { key: 'country', field: 'discovered_country', titleKey: 'collection.filter_country', order: [] },
  { key: 'diet', field: 'diet_hu', titleKey: 'collection.filter_diet', order: [], transform: normalizeDiet },
  { key: 'alrend', field: 'alrend', titleKey: 'collection.filter_group', order: ALREND_ORDER, transform: (v) => ALREND_HU[v] || v },
  { key: 'csalad', field: 'csalad_hu', titleKey: 'collection.filter_family', order: [] },
];

export default function AlbumScreen({ nickname, allDinos, progress, onNavigate, onBack }) {
  const { t, lang } = useT();
  const { width } = useWindowDimensions();
  const isNarrow = width < 700;
  const isWide = width >= 1024;
  const [filters, setFilters] = useState({});
  const [lengthRange, setLengthRange] = useState({ min: '', max: '' });
  const [selectedLetter, setSelectedLetter] = useState(null);

  // Get only unlocked creatures from all dinos
  const unlockedDinos = useMemo(() => {
    const unlocked = [];
    (allDinos || []).forEach((d) => {
      const edu = d.edu;
      const csomag = d.csomag;
      if (progress?.[edu]?.[csomag]?.quizPassed === true) {
        unlocked.push(d);
      }
    });
    return unlocked;
  }, [allDinos, progress]);

  const distinctLetters = useMemo(() => {
    const letters = new Set();
    (unlockedDinos || []).forEach((d) => {
      const firstLetter = (d.name_hu || '').charAt(0).toUpperCase();
      if (firstLetter) letters.add(firstLetter);
    });
    return Array.from(letters).sort();
  }, [unlockedDinos]);

  const filterCategories = useMemo(() => {
    return FILTER_FIELDS.map(({ key, field, titleKey, order, transform }) => ({
      key,
      ...buildFilterCategory(unlockedDinos || [], field, order, t(titleKey), transform),
    }));
  }, [unlockedDinos, lang]);

  const handleToggleFilter = (categoryKey, value) => {
    setFilters((prev) => {
      const next = { ...prev };
      const current = new Set(next[categoryKey] || []);
      if (current.has(value)) current.delete(value);
      else current.add(value);
      next[categoryKey] = current;
      return next;
    });
  };

  const handleClearFilters = () => {
    setFilters({});
    setLengthRange({ min: '', max: '' });
    setSelectedLetter(null);
  };

  const handleLengthRangeChange = (field, value) => {
    setLengthRange((prev) => ({ ...prev, [field]: value }));
  };

  const filteredDinos = useMemo(() => {
    const activeFields = FILTER_FIELDS.filter(({ key }) => (filters[key] || new Set()).size > 0);
    const minLen = lengthRange.min !== '' ? Number(lengthRange.min) : null;
    const maxLen = lengthRange.max !== '' ? Number(lengthRange.max) : null;

    if (activeFields.length === 0 && minLen == null && maxLen == null && !selectedLetter) return unlockedDinos || [];

    return (unlockedDinos || []).filter((d) => {
      if (selectedLetter) {
        const firstLetter = (d.name_hu || '').charAt(0).toUpperCase();
        if (firstLetter !== selectedLetter) return false;
      }

      const categoryMatch = activeFields.every(({ key, field, transform }) => {
        const selected = filters[key];
        const values = splitMultiValue(d[field]).map(transform || ((v) => v));
        return values.some((v) => selected.has(v));
      });
      if (!categoryMatch) return false;

      if (minLen != null || maxLen != null) {
        const len = d.length_m_max ?? d.length_m_min;
        if (len == null) return false;
        if (minLen != null && len < minLen) return false;
        if (maxLen != null && len > maxLen) return false;
      }
      return true;
    });
  }, [unlockedDinos, filters, lengthRange, selectedLetter]);

  // 6 KPI karika a fejlécben — régiónkénti gyűjtési arány (lény-alapú, nem
  // pakk-alapú, hogy egyezzen az Album valódi tartalmával).
  const regionStats = useMemo(() => regionCollectionStats(allDinos, progress), [allDinos, progress]);

  // Régiónként csoportosítva — így gyűjtik őket (hub-modell, lásd CLAUDE.md).
  const regionSections = useMemo(() => {
    const byRegion = new Map();
    (filteredDinos || []).forEach((d) => {
      const edu = d.edu;
      if (!byRegion.has(edu)) byRegion.set(edu, []);
      byRegion.get(edu).push(d);
    });

    return REGION_ORDER.filter((edu) => byRegion.has(edu)).map((edu) => ({
      key: edu,
      title: EDU_LABELS[edu] || edu,
      data: [...byRegion.get(edu)].sort((a, b) => a.name_hu.localeCompare(b.name_hu, 'hu')),
    }));
  }, [filteredDinos]);

  // Fokozatos betöltés: induláskor csak PAGE_SIZE kártya, görgetésre bővül.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Szűrő/betű/hossz váltásnál újra az elejéről — különben egy szűkítés után
  // is a korábban felgörgetett (nagy) mennyiség renderelődne ki egyszerre.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters, lengthRange, selectedLetter]);

  const totalCount = filteredDinos.length;

  // A régiós szekciókat a látható darabszám erejéig vágjuk vissza, a régiók
  // sorrendjét megtartva (a kártyák így nem ugrálnak betöltés közben).
  const visibleSections = useMemo(() => {
    let budget = visibleCount;
    const out = [];
    for (const section of regionSections) {
      if (budget <= 0) break;
      const data = section.data.slice(0, budget);
      budget -= data.length;
      out.push({ ...section, data });
    }
    return out;
  }, [regionSections, visibleCount]);

  const hasMore = visibleCount < totalCount;

  return (
    <Shell
      header={<HeaderBar currentView="album" nickname={nickname} progress={progress} onNavigate={onNavigate} />}
      contentMaxWidth={isWide ? 1920 : undefined}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

        <View style={styles.header}>
          <Text style={styles.title}>{t('collection.album_title')}</Text>
        </View>

        <View style={styles.kpiRow}>
          {REGION_ORDER.map((edu) => {
            const stats = regionStats[edu] || { collected: 0, total: 0 };
            const ratio = stats.total > 0 ? stats.collected / stats.total : 0;
            return (
              <View key={edu} style={styles.kpiItem}>
                <ProgressRing size={52} stroke={4} ratio={ratio} color={COLORS.accent} trackColor="rgba(254,250,224,0.12)">
                  <Text style={styles.kpiPercent}>{Math.round(ratio * 100)}%</Text>
                </ProgressRing>
                <Text style={styles.kpiLabel} numberOfLines={2}>
                  {EDU_LABELS[edu]}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.headerHint}>
          {t('collection.album_hint')}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.letterFilterScroll}
          contentContainerStyle={styles.letterFilterContent}
        >
          <TouchableOpacity
            style={[styles.letterBtn, !selectedLetter && styles.letterBtnActive]}
            onPress={() => setSelectedLetter(null)}
          >
            <Text style={[styles.letterText, !selectedLetter && styles.letterTextActive]}>
              {t('collection.all')}
            </Text>
          </TouchableOpacity>
          {distinctLetters.map((letter) => (
            <TouchableOpacity
              key={letter}
              style={[styles.letterBtn, selectedLetter === letter && styles.letterBtnActive]}
              onPress={() => setSelectedLetter(letter === selectedLetter ? null : letter)}
            >
              <Text style={[styles.letterText, selectedLetter === letter && styles.letterTextActive]}>
                {letter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.body, isNarrow && styles.bodyNarrow]}>
          <CollectionFilterSidebar
            categories={filterCategories}
            selected={filters}
            onToggle={handleToggleFilter}
            onClear={handleClearFilters}
            lengthRange={lengthRange}
            onLengthRangeChange={handleLengthRangeChange}
            style={isNarrow && styles.sidebarNarrow}
          />
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
          >
            {visibleSections.length === 0 ? (
              <Text style={styles.empty}>{t('collection.empty')}</Text>
            ) : (
              <>
                {visibleSections.map((section) => (
                  <View key={section.key} style={styles.regionBlock}>
                    <Text style={styles.regionBlockTitle}>{section.title.toUpperCase()}</Text>
                    <View style={styles.grid}>
                      {section.data.map((dino) => (
                        <AlbumCard key={dino.id} dino={dino} />
                      ))}
                    </View>
                  </View>
                ))}
                {hasMore && (
                  <TouchableOpacity style={styles.loadMoreBtn} onPress={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                    <Text style={styles.loadMoreBtnText}>
                      {t('collection.load_more', { count: totalCount - visibleCount })}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  title: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerHint: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 15,
    opacity: 0.75,
    paddingHorizontal: 20,
    paddingTop: 6,
    marginBottom: 12,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  kpiItem: {
    alignItems: 'center',
    width: 76,
  },
  kpiPercent: {
    color: COLORS.cream,
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    fontWeight: '700',
  },
  kpiLabel: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 10,
    opacity: 0.75,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 12,
  },
  letterFilterScroll: {
    flexGrow: 0,
    maxHeight: 45,
    marginHorizontal: 16,
  },
  letterFilterContent: {
    gap: 6,
    paddingHorizontal: 4,
  },
  letterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(254,250,224,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(221,161,94,0.3)',
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  letterText: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.7,
  },
  letterTextActive: {
    color: COLORS.bgDark,
    opacity: 1,
  },
  body: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingHorizontal: 16,
  },
  bodyNarrow: {
    flexDirection: 'column',
  },
  sidebarNarrow: {
    width: '100%',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  empty: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    opacity: 0.7,
    marginTop: 20,
  },
  // Ugyanaz a stílus, mint a Katalógusban (CollectionScreen) — a két lista
  // lapozója így egyformán néz ki.
  loadMoreBtn: {
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(221,161,94,0.16)',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  loadMoreBtnText: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
  },
  regionBlock: {
    marginBottom: 24,
  },
  regionBlockTitle: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
});
