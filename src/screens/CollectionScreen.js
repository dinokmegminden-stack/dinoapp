// CollectionScreen (a spec DinoGallery.js-ének megfelelője) — redesign spec 5. pont.
// SectionList csomagonként (nem taxonomy_category szerint), mert nagy gyűjteménynél
// kevesebb re-render buggal jár, mint a FlatList + manuális header-injektálás.
// Zárolt (quiz még nem sikerült) csomagoknál placeholder slotok jelennek meg,
// hogy a felhasználó lássa mennyi van még hátra — nem tűnnek el a listából.
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SectionList,
  ScrollView,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import Shell from '../components/Shell';
import HeaderBar from '../components/HeaderBar';
import CollectionTimeline from '../components/CollectionTimeline';
import CollectionFilterSidebar from '../components/CollectionFilterSidebar';
import { IMAGE_MAP, MISSING_IMAGE } from '../constants/imageMap';
import { isGuestMode } from '../utils/guestMode';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { REGION_ORDER, REGION_PACKS, EDU_LABELS, PASS_THRESHOLD } from '../utils/regionProgress';
import { ALREND_HU } from '../utils/alrendHu';

const NUM_COLUMNS = 3;

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

// A valódi `creatures.rarity` 3 magyar tier: Lelet (leggyakoribb) < Kincs <
// Ereklye (legritkább). Két rekordnál tévesen angol "Common" maradt egy
// korábbi migrációból — normalizeRarity() erre "Lelet"-re képezi le, hogy a
// szűrőlistában és a kártya-jelvényen sose jelenjen meg angol szó.
function normalizeRarity(raw) {
  return String(raw || '').toLowerCase() === 'common' ? 'Lelet' : raw;
}

const RARITY_COLOR = {
  lelet: '#c8ccbe',
  kincs: '#8ecbe6',
  ereklye: COLORS.accent,
};

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

function chunk(list, size) {
  const rows = [];
  for (let i = 0; i < list.length; i += size) rows.push(list.slice(i, i + size));
  return rows;
}

function MiniDinoCard({ dino }) {
  const imageSource = isGuestMode() ? null : (IMAGE_MAP[dino.name_hu] || MISSING_IMAGE);
  const rarityColor = RARITY_COLOR[normalizeRarity(dino.rarity || '').toLowerCase()];

  return (
    <View style={styles.card}>
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
      <Text style={styles.cardName} numberOfLines={2}>{dino.name_hu}</Text>
    </View>
  );
}

function LockedSlot() {
  return (
    <View style={[styles.card, styles.lockedCard]}>
      <View style={[styles.cardImageWrapper, styles.lockedImageWrapper]}>
        <Text style={styles.lockedIcon}>🔒</Text>
      </View>
      <Text style={styles.lockedText}>Zárolva</Text>
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

export default function CollectionScreen({ nickname, allDinos, progress, onNavigate, onBack }) {
  const guest = isGuestMode();
  const { width } = useWindowDimensions();
  const isNarrow = width < 700;
  const isWide = width >= 1024;
  // 'enciklopedia' — mindenkinek elérhető, kép nélküli, kor szerinti névlista
  // szűrőkkel; 'album' — csak regisztráltaknak, a saját kinyitott pakkjaik
  // valódi kártyaképekkel (a korábbi Csomagok/Idővonal nézet). Vendégnél az
  // "album" fül nem váltható át, csak regisztrációra buzdít.
  const [mainTab, setMainTab] = useState(guest ? 'enciklopedia' : 'album');
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

  const { sections, collectedCount, totalCount } = useMemo(() => {
    let collected = 0;
    let total = 0;
    const built = [];

    REGION_ORDER.forEach((edu) => {
      REGION_PACKS[edu].forEach((packId) => {
        const packDinos = (allDinos || [])
          .filter((d) => d.edu === edu && d.csomag === packId)
          .sort((a, b) => a.name_hu.localeCompare(b.name_hu, 'hu'));
        if (packDinos.length === 0) return;

        const unlocked = progress?.[edu]?.[packId]?.quizPassed === true;
        total += packDinos.length;
        if (unlocked) collected += packDinos.length;

        built.push({
          key: `${edu}-${packId}`,
          title: `${packId}. CSOMAG · ${EDU_LABELS[edu] || edu}`,
          unlocked,
          data: chunk(packDinos, NUM_COLUMNS),
        });
      });
    });

    return { sections: built, collectedCount: collected, totalCount: total };
  }, [allDinos, progress]);

  return (
    <Shell
      header={<HeaderBar currentView="collection" nickname={nickname} progress={progress} onNavigate={onNavigate} />}
      contentMaxWidth={isWide ? 1920 : undefined}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

        <View style={styles.header}>
          <Text style={styles.title}>🗂️ GYŰJTEMÉNY</Text>
          <View style={styles.headerRight}>
            {mainTab === 'album' && (
              <View style={styles.progressPill}>
                <Text style={styles.progressPillText}>{collectedCount} / {totalCount}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Text style={styles.backBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mainTabRow}>
          <TouchableOpacity
            style={[styles.mainTabBtn, mainTab === 'enciklopedia' && styles.mainTabBtnActive]}
            onPress={() => setMainTab('enciklopedia')}
          >
            <Text style={[styles.mainTabText, mainTab === 'enciklopedia' && styles.mainTabTextActive]}>
              📖 Enciklopédia
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mainTabBtn, mainTab === 'album' && styles.mainTabBtnActive]}
            onPress={() => (guest ? onNavigate?.('join') : setMainTab('album'))}
          >
            <Text style={[styles.mainTabText, mainTab === 'album' && styles.mainTabTextActive]}>
              🖼️ Saját album{guest ? ' 🔒' : ''}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.headerHint}>
          {mainTab === 'enciklopedia'
            ? 'Az összes felfedezhető lény, kor szerint csoportosítva, szűrőkkel.'
            : `Egy csomag kártyái akkor oldódnak fel, ha a záró kvízt legalább ${Math.round(PASS_THRESHOLD * 100)}%-ra teljesíted.`}
        </Text>

        {mainTab === 'enciklopedia' ? (
          <>
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
                    <View style={styles.epochThumbRow}>
                      {section.data.map((d) => {
                        const imageSource = IMAGE_MAP[d.name_hu] || MISSING_IMAGE;
                        return (
                          <View key={d.id} style={styles.epochThumb}>
                            <Image source={imageSource} style={styles.epochThumbImage} resizeMode="cover" />
                            <Text style={styles.epochThumbName} numberOfLines={2}>{d.name_hu}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            </View>
          </>
        ) : (
          <>
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[styles.viewToggleBtn, viewMode === 'csomagok' && styles.viewToggleBtnActive]}
                onPress={() => setViewMode('csomagok')}
              >
                <Text style={[styles.viewToggleText, viewMode === 'csomagok' && styles.viewToggleTextActive]}>
                  Csomagok
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewToggleBtn, viewMode === 'idovonal' && styles.viewToggleBtnActive]}
                onPress={() => setViewMode('idovonal')}
              >
                <Text style={[styles.viewToggleText, viewMode === 'idovonal' && styles.viewToggleTextActive]}>
                  Idővonal
                </Text>
              </TouchableOpacity>
            </View>

            {viewMode === 'csomagok' ? (
          <SectionList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            sections={sections}
            keyExtractor={(row) => row.map((d) => d.id).join('-')}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.unlocked ? (
                  <Text style={styles.sectionBadgeUnlocked}>✓</Text>
                ) : (
                  <Text style={styles.sectionBadgeLocked}>🔒</Text>
                )}
              </View>
            )}
            renderItem={({ item: row, section }) => (
              <View style={styles.row}>
                {row.map((dino) =>
                  section.unlocked ? (
                    <MiniDinoCard key={dino.id} dino={dino} />
                  ) : (
                    <LockedSlot key={dino.id} />
                  )
                )}
              </View>
            )}
            stickySectionHeadersEnabled={false}
          />
            ) : (
              <View style={styles.timelineWrapper}>
                <CollectionTimeline allDinos={allDinos} progress={progress} />
              </View>
            )}
          </>
        )}
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
  epochThumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  epochThumb: {
    width: 200,
  },
  epochThumbImage: {
    width: 200,
    height: 112.5,
    borderRadius: RADIUS.card,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  epochThumbName: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 12.5,
    marginTop: 4,
    opacity: 0.9,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  card: {
    width: '31%',
    backgroundColor: 'rgba(254,250,224,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(221,161,94,0.5)',
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    paddingBottom: 6,
  },
  cardImageWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1a1a1a',
    position: 'relative',
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
    fontSize: 20,
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
  cardName: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingTop: 5,
    textAlign: 'center',
  },
  lockedCard: {
    borderStyle: 'dashed',
    borderColor: 'rgba(254,250,224,0.3)',
    backgroundColor: 'transparent',
  },
  lockedImageWrapper: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedIcon: {
    fontSize: 22,
    opacity: 0.6,
  },
  lockedText: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 15,
    opacity: 0.5,
    textAlign: 'center',
    paddingTop: 5,
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
