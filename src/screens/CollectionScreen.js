// CollectionScreen (a spec DinoGallery.js-ének megfelelője) — redesign spec 5. pont.
// SectionList csomagonként (nem taxonomy_category szerint), mert nagy gyűjteménynél
// kevesebb re-render buggal jár, mint a FlatList + manuális header-injektálás.
// Zárolt (quiz még nem sikerült) csomagoknál placeholder slotok jelennek meg,
// hogy a felhasználó lássa mennyi van még hátra — nem tűnnek el a listából.
import React, { useMemo, useState } from 'react';
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
import CollectionTimeline from '../components/CollectionTimeline';
import CollectionFilterSidebar from '../components/CollectionFilterSidebar';
import SpecimenCard from '../components/SpecimenCard';
import { isGuestMode } from '../utils/guestMode';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { REGION_ORDER, REGION_PACKS, EDU_LABELS, PASS_THRESHOLD } from '../utils/regionProgress';
import { ALREND_HU } from '../utils/alrendHu';

// Vendégeknek nincs kép a kártyákon (isGuestMode), így a csomagos rács- és
// idővonal-nézet helyett egy tiszta, csak-név listát kapnak, kor szerint
// csoportosítva — a facts.app encyclopédia-listájának mintájára. Sorrend:
// legkésőbbi kréta a legelöl, legkorábbi triász a legvégén (fordított
// geológiai sorrend, ahogy kérték — nem az őslénytani "régi elöl" konvenció).
// A `epoch_hu` mezőben volt egy "közép-jura"/"középső-jura" írásmód-kettősség
// (lásd data/sqls/normalize_epoch_hu_kozep_jura.sql) — itt védekezésből
// kliensoldalon is egységesítjük, ha a javítás még nem futott le.
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

// "ragadozó" és "húsevő" ugyanazt jelenti a DB-ben (lásd
// data/sqls/normalize_diet_hu_ragadozo_husevo.sql) — kliensoldali védőháló,
// ha a javítás még nem futott le.
function normalizeDiet(diet) {
  return diet === 'ragadozó' ? 'húsevő' : diet;
}

// Kánoni sorrendek a szűrőpanelhez — ugyanazok, mint amiket a többi
// képernyő már használ (EDU_LABELS/REGION_ORDER, alrendHu.js), hogy a
// szűrő-listák sorrendje ne alfabetikus-véletlenszerű legyen, hanem
// következetes az app többi részével.
const REGION_LABEL_ORDER = REGION_ORDER.map((edu) => EDU_LABELS[edu]);
const ALREND_ORDER = Object.values(ALREND_HU);

// Ezek nem valódi, szűrhető tények, hanem "nincs adat" placeholderek —
// sem kategória-opcióként, sem dínó-tulajdonságként nem szabad megjelenniük.
const NON_FILTERABLE_VALUES = new Set(['ismeretlen', '']);

function sortByOrder(values, order) {
  const seen = new Set(values);
  const ordered = order.filter((v) => seen.has(v));
  const rest = values.filter((v) => !order.includes(v)).sort((a, b) => a.localeCompare(b, 'hu'));
  return [...ordered, ...rest];
}

// diet_hu összetett értékeket is tartalmaz (pl. "húsevő, mindenevő") — ezeket
// vesszőnél szétbontjuk, hogy a szűrő minden valódi étrend-értéket felajánljon,
// és egy összetett-értékű dínó mindkét (vagy több) kategóriájában megjelenjen.
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
  { key: 'epoch', field: 'epoch', title: 'Kor', order: EPOCH_ORDER, transform: normalizeEpoch },
  { key: 'region', field: 'region', title: 'Régió', order: REGION_LABEL_ORDER },
  { key: 'country', field: 'discovered_country', title: 'Felfedezés országa', order: [] },
  { key: 'diet', field: 'diet_hu', title: 'Étrend', order: [], transform: normalizeDiet },
  { key: 'alrend', field: 'alrend', title: 'Dinoszaurusz-csoport', order: ALREND_ORDER, transform: (v) => ALREND_HU[v] || v },
  { key: 'csalad', field: 'csalad_hu', title: 'Család', order: [] },
];

export default function CollectionScreen({ nickname, allDinos, progress, onNavigate, onBack }) {
  const guest = isGuestMode();
  const { width } = useWindowDimensions();
  const isNarrow = width < 700;
  const isWide = width >= 1024;
  // Katalógus — mindenkinek elérhető, kor szerinti névlista szűrőkkel.
  // Saját Album egy külön menüpont (csak regisztrált felhasználók).
  const [viewMode, setViewMode] = useState('csomagok'); // 'csomagok' | 'idovonal'
  const [filters, setFilters] = useState({}); // { [categoryKey]: Set<string> }
  const [lengthRange, setLengthRange] = useState({ min: '', max: '' }); // testhossz (m), string mezők a TextInputhoz
  const [selectedLetter, setSelectedLetter] = useState(null); // Levelező szűrő

  const distinctLetters = useMemo(() => {
    const letters = new Set();
    (allDinos || []).forEach((d) => {
      const firstLetter = (d.name_hu || '').charAt(0).toUpperCase();
      if (firstLetter) letters.add(firstLetter);
    });
    return Array.from(letters).sort();
  }, [allDinos]);

  const filterCategories = useMemo(() => {
    return FILTER_FIELDS.map(({ key, field, title, order, transform }) => ({
      key,
      ...buildFilterCategory(allDinos || [], field, order, title, transform),
    }));
  }, [allDinos]);

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

  // Kategórián belül VAGY (elég egy egyező érték, pl. összetett étrendnél),
  // kategóriák között ÉS — üres kategória nem szűkít. A testhossz külön,
  // numerikus tartomány-szűrő (nincs benne a FILTER_FIELDS checkbox-listában).
  const filteredDinos = useMemo(() => {
    const activeFields = FILTER_FIELDS.filter(({ key }) => (filters[key] || new Set()).size > 0);
    const minLen = lengthRange.min !== '' ? Number(lengthRange.min) : null;
    const maxLen = lengthRange.max !== '' ? Number(lengthRange.max) : null;

    if (activeFields.length === 0 && minLen == null && maxLen == null && !selectedLetter) return allDinos || [];

    return (allDinos || []).filter((d) => {
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
  }, [allDinos, filters, lengthRange, selectedLetter]);

  const epochSections = useMemo(() => {
    const byEpoch = new Map();
    (filteredDinos || []).forEach((d) => {
      const key = normalizeEpoch(d.epoch);
      if (!key) return;
      if (!byEpoch.has(key)) byEpoch.set(key, []);
      byEpoch.get(key).push(d);
    });

    return EPOCH_ORDER.filter((key) => byEpoch.has(key)).map((key) => ({
      key,
      title: EPOCH_LABEL_HU[key] || key,
      data: [...byEpoch.get(key)].sort((a, b) => a.name_hu.localeCompare(b.name_hu, 'hu')),
    }));
  }, [filteredDinos]);

  return (
    <Shell
      header={<HeaderBar currentView="collection" nickname={nickname} progress={progress} onNavigate={onNavigate} />}
      contentMaxWidth={isWide ? 1920 : undefined}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

        <View style={styles.header}>
          <Text style={styles.title}>🗂️ KATALÓGUS</Text>
        </View>

        <Text style={styles.headerHint}>
          Az összes felfedezhető lény, kor szerint csoportosítva, szűrőkkel.
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
        <View style={[styles.guestBody, isNarrow && styles.guestBodyNarrow]}>
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
            {epochSections.length === 0 ? (
              <Text style={styles.empty}>Nincs a szűrőknek megfelelő lény.</Text>
            ) : (
              epochSections.map((section) => (
                <View key={section.key} style={styles.epochBlock}>
                  <Text style={styles.epochBlockTitle}>{section.title.toUpperCase()}</Text>
                  {section.data.map((d) => (
                    <SpecimenCard key={d.id} dino={d} showDescription={false} />
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressPill: {
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.pill,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  progressPillText: {
    color: COLORS.bgDark,
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '800',
  },
  headerHint: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 15,
    opacity: 0.75,
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  mainTabRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 14,
  },
  mainTabBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(254,250,224,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.12)',
  },
  mainTabBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  mainTabText: {
    color: COLORS.cream,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    opacity: 0.75,
  },
  mainTabTextActive: {
    color: COLORS.bgDark,
    opacity: 1,
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: 'rgba(254,250,224,0.06)',
    borderRadius: RADIUS.pill,
    padding: 3,
  },
  viewToggleBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
  },
  viewToggleBtnActive: {
    backgroundColor: COLORS.bgMid,
  },
  viewToggleText: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    opacity: 0.6,
  },
  viewToggleTextActive: {
    opacity: 1,
  },
  timelineWrapper: {
    flex: 1,
    minHeight: 0,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  guestBody: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
    paddingHorizontal: 16,
  },
  guestBodyNarrow: {
    flexDirection: 'column',
  },
  sidebarNarrow: {
    width: '100%',
  },
  list: {
    flex: 1,
    marginTop: 10,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,18,25,0.5)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(221,161,94,0.35)',
    paddingBottom: 6,
    paddingTop: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sectionBadgeUnlocked: {
    color: '#8DA34D',
    fontSize: 15,
    fontWeight: '900',
  },
  sectionBadgeLocked: {
    fontSize: 15,
    opacity: 0.7,
  },
  epochBlock: {
    marginBottom: 24,
  },
  epochBlockTitle: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  epochBlockNames: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 24,
    opacity: 0.9,
  },
  letterFilterScroll: {
    flexGrow: 0,
    maxHeight: 45,
    marginHorizontal: 16,
    marginTop: 12,
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
});
