import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import Shell from '../components/Shell';
import HeaderBar from '../components/HeaderBar';
import CollectionFilterSidebar from '../components/CollectionFilterSidebar';
import { IMAGE_MAP, MISSING_IMAGE } from '../constants/imageMap';
import { isGuestMode } from '../utils/guestMode';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { REGION_ORDER, EDU_LABELS } from '../utils/regionProgress';
import { ALREND_HU } from '../utils/alrendHu';

const NUM_COLUMNS = 1;

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

function normalizeRarity(raw) {
  return String(raw || '').toLowerCase() === 'common' ? 'Lelet' : raw;
}

const RARITY_COLOR = {
  lelet: '#c8ccbe',
  kincs: '#8ecbe6',
  ereklye: COLORS.accent,
};

const REGION_LABEL_ORDER = REGION_ORDER.map((edu) => EDU_LABELS[edu]);
const ALREND_ORDER = Object.values(ALREND_HU);

const NON_FILTERABLE_VALUES = new Set(['ismeretlen', '']);

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

function chunk(list, size) {
  const rows = [];
  for (let i = 0; i < list.length; i += size) rows.push(list.slice(i, i + size));
  return rows;
}

function AlbumCard({ dino }) {
  const imageSource = IMAGE_MAP[dino.name_hu] || MISSING_IMAGE;
  const rarityColor = RARITY_COLOR[normalizeRarity(dino.rarity || '').toLowerCase()];
  const length = dino.length_m_max ?? dino.length_m_min;
  const lengthStr = length ? `${length}m` : '—';

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardImageWrapper}>
          {imageSource ? (
            <Image source={imageSource} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={[styles.cardImage, styles.cardImageFallback]}>
              <Text style={styles.cardImageFallbackText}>🦴</Text>
            </View>
          )}
          {!!rarityColor && (
            <View style={[styles.rarityBadge, { borderColor: rarityColor }]}>
              <Text style={styles.rarityBadgeIcon}>💎</Text>
            </View>
          )}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{dino.name_hu}</Text>
          <Text style={styles.cardLatin} numberOfLines={1}>{dino.name_latin}</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoCellHalf}>
              <Text style={styles.infoLabel}>Korszak</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{dino.period || '—'}</Text>
            </View>
            <View style={styles.infoCellHalf}>
              <Text style={styles.infoLabel}>Hossz</Text>
              <Text style={styles.infoValue}>{lengthStr}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoCellHalf}>
              <Text style={styles.infoLabel}>Étrend</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{dino.diet_hu || '—'}</Text>
            </View>
            <View style={styles.infoCellHalf}>
              <Text style={styles.infoLabel}>Család</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{dino.csalad_hu || '—'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoCellFull}>
              <Text style={styles.infoLabel}>Felfedezés</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{dino.discoverer_name || '—'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoCellFull}>
              <Text style={styles.infoLabel}>Ország</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{dino.discovered_country || '—'}</Text>
            </View>
          </View>
          {dino.description_hu && (
            <Text style={styles.cardDesc} numberOfLines={3}>{dino.description_hu}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const FILTER_FIELDS = [
  { key: 'epoch', field: 'epoch', title: 'Kor', order: EPOCH_ORDER, transform: normalizeEpoch },
  { key: 'region', field: 'region', title: 'Régió', order: REGION_LABEL_ORDER },
  { key: 'country', field: 'discovered_country', title: 'Felfedezés országa', order: [] },
  { key: 'diet', field: 'diet_hu', title: 'Étrend', order: [], transform: normalizeDiet },
  { key: 'alrend', field: 'alrend', title: 'Dinoszaurusz-csoport', order: ALREND_ORDER, transform: (v) => ALREND_HU[v] || v },
  { key: 'csalad', field: 'csalad_hu', title: 'Család', order: [] },
];

export default function AlbumScreen({ nickname, allDinos, progress, onNavigate, onBack }) {
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
    return FILTER_FIELDS.map(({ key, field, title, order, transform }) => ({
      key,
      ...buildFilterCategory(unlockedDinos || [], field, order, title, transform),
    }));
  }, [unlockedDinos]);

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

  const cardRows = useMemo(() => chunk(filteredDinos, NUM_COLUMNS), [filteredDinos]);

  return (
    <Shell
      header={<HeaderBar currentView="album" nickname={nickname} progress={progress} onNavigate={onNavigate} />}
      contentMaxWidth={isWide ? 1920 : undefined}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

        <View style={styles.header}>
          <Text style={styles.title}>📖 ALBUMOD</Text>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.headerHint}>
          A felnyitott csomagaid lényei, kereshetően.
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
              Mind
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
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {cardRows.length === 0 ? (
              <Text style={styles.empty}>Nincs a szűrőknek megfelelő lény.</Text>
            ) : (
              cardRows.map((row, idx) => (
                <View key={idx} style={styles.row}>
                  {row.map((dino) => (
                    <AlbumCard key={dino.id} dino={dino} />
                  ))}
                </View>
              ))
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
    marginTop: 0,
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
  row: {
    flexDirection: 'column',
  },
  card: {
    backgroundColor: 'rgba(254,250,224,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(221,161,94,0.5)',
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  cardImageWrapper: {
    width: 140,
    aspectRatio: 16 / 9,
    backgroundColor: '#1a1a1a',
    position: 'relative',
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    flexShrink: 0,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageFallbackText: {
    fontSize: 24,
  },
  rarityBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rarityBadgeIcon: {
    fontSize: 8,
  },
  cardInfo: {
    flex: 1,
    minHeight: 0,
  },
  cardName: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '700',
  },
  cardLatin: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  infoCellHalf: {
    flex: 1,
  },
  infoCellFull: {
    flex: 1,
  },
  infoLabel: {
    color: COLORS.accent,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    opacity: 0.8,
  },
  infoValue: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 12,
    opacity: 0.9,
  },
  cardDesc: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 11,
    opacity: 0.75,
    marginTop: 8,
    lineHeight: 16,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(244,67,54,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
