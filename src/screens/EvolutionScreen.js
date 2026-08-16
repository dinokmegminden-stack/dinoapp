// EvolutionScreen — "dínó evolúció" idővonal: 7 régió-sor (a fix EDU-sorrend
// szerint), a vízszintes tengelyen a millió év (250 → 65 MÉE, balról jobbra
// haladva fiatalodik). Minden lény egy pont a régiója sorában, az első
// előfordulásánál (a legrégebbi mya-határnál, `mya_max`), mellette a
// köznapi névvel. Hover: 16:9 kártyakép tooltipben. Csak vízszintesen
// görgethető — a régiónevek balra rögzítve (position:sticky, web-only,
// lásd CollectionTimeline.js hasonló mintáját a függőleges tengelyen).
import React, { useMemo, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Shell from '../components/Shell';
import HeaderBar from '../components/HeaderBar';
import { IMAGE_MAP, MISSING_IMAGE } from '../constants/imageMap';
import { COLORS, RADIUS, FONTS } from '../constants/theme';
import { useT } from '../i18n';

const MYA_DOMAIN_MAX = 245;
const MYA_DOMAIN_MIN = 50;
const COL_WIDTH = 46; // px / 5 millió év
const TICKS = [];
for (let m = MYA_DOMAIN_MAX; m >= MYA_DOMAIN_MIN; m -= 5) TICKS.push(m);

const LABEL_COL_WIDTH = 132;
const EPOCH_ROW_HEIGHT = 26;
const RULER_HEIGHT = 34;
const SUBROW_HEIGHT = 22;
const ROW_MIN_HEIGHT = 40;
const ROW_PADDING = 8;
const DOT_SIZE = 9;
const MARKER_GAP_PX = 88; // két címke középpontja között ennyi hely kell, különben új alsáv

// A számsor fölötti sávok geológiai KORSZAKOK (epoch), nem korok (period) —
// ugyanaz a felosztás, mint a CollectionTimeline.js-ben (a hat epoch-kulcs a
// collection.epoch.* namespace-ből jön, hogy ne duplikáljuk a fordítást),
// kiegészítve egy paleogén sávval a domain (245–50 MÉE) alsó végéhez.
const EPOCHS = [
  { key: 'late_triassic', ns: 'collection', start: 245, end: 201.4 },
  { key: 'early_jurassic', ns: 'collection', start: 201.4, end: 174.7 },
  { key: 'mid_jurassic', ns: 'collection', start: 174.7, end: 163.5 },
  { key: 'late_jurassic', ns: 'collection', start: 163.5, end: 145 },
  { key: 'early_cretaceous', ns: 'collection', start: 145, end: 100.5 },
  { key: 'late_cretaceous', ns: 'collection', start: 100.5, end: 66 },
  { key: 'paleogene', ns: 'evolution', start: 66, end: 50 },
];

// A fix EDU-sorrend (1..7) — ugyanaz, mint a régióválasztóban (regionProgress.js
// EDU_LABELS-je), de itt saját HU/EN fordítással, mert a landing-menü címkéi
// csak magyarul élnek.
const REGIONS = [
  { edu: 1, key: 'carpathian' },
  { edu: 2, key: 'europe' },
  { edu: 3, key: 'africa' },
  { edu: 4, key: 'asia' },
  { edu: 5, key: 'south_america' },
  { edu: 6, key: 'north_america' },
  { edu: 7, key: 'australia' },
];

const stickyLeftStyle = Platform.select({
  web: { position: 'sticky', left: 0, zIndex: 5 },
  default: {},
});

function xForMya(mya) {
  const clamped = Math.min(MYA_DOMAIN_MAX, Math.max(MYA_DOMAIN_MIN, mya));
  return ((MYA_DOMAIN_MAX - clamped) / 5) * COL_WIDTH;
}

// Az azonos régión belüli, egymáshoz közeli (átfedő címkéjű) lényeket
// alsávokba szórja — de középről kifelé (0, +1, -1, +2, -2, …), nem fentről
// lefelé, hogy egy magányos (a sorban máshol lévő zsúfoltságtól független)
// lény mindig a sor függőleges közepén (0. alsáv) landoljon, ne tolja fel
// egy távoli, sűrű klaszter csak azért, mert az is ugyanabban a sorban van.
function packRow(items) {
  const sorted = [...items].sort((a, b) => a.xPx - b.xPx);
  const slotLastX = new Map();
  const placed = sorted.map((item) => {
    let chosen = null;
    for (let k = 0; chosen === null && k < sorted.length; k++) {
      const candidates = k === 0 ? [0] : [k, -k];
      for (const slot of candidates) {
        const lastX = slotLastX.has(slot) ? slotLastX.get(slot) : -Infinity;
        if (item.xPx - lastX >= MARKER_GAP_PX) {
          chosen = slot;
          break;
        }
      }
    }
    if (chosen === null) chosen = 0;
    slotLastX.set(chosen, item.xPx);
    return { ...item, subRow: chosen };
  });

  const slots = placed.map((p) => p.subRow);
  const minSlot = Math.min(0, ...slots);
  const maxSlot = Math.max(0, ...slots);
  const normalized = placed.map((p) => ({ ...p, subRow: p.subRow - minSlot }));
  return { placed: normalized, subRowCount: Math.max(1, maxSlot - minSlot + 1) };
}

function EvoMarker({ dino, xPx, subRow, topOffset }) {
  const [hovered, setHovered] = useState(false);
  const imageSource = dino.image_url ? { uri: dino.image_url } : (IMAGE_MAP[dino.name_hu] || MISSING_IMAGE);

  return (
    <Pressable
      style={[styles.marker, { left: xPx, top: topOffset + subRow * SUBROW_HEIGHT }]}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      {hovered && (
        <View style={styles.tooltip} pointerEvents="none">
          <Image source={imageSource} style={styles.tooltipImage} resizeMode="cover" />
          <Text style={styles.tooltipText} numberOfLines={1}>{dino.name_hu}</Text>
        </View>
      )}
      <View style={[styles.dot, hovered && styles.dotHovered]} />
      <Text style={[styles.markerLabel, hovered && styles.markerLabelHovered]} numberOfLines={1}>
        {dino.name_hu}
      </Text>
    </Pressable>
  );
}

export default function EvolutionScreen({ nickname, progress, allDinos, onNavigate, onBack }) {
  const { t } = useT();

  const { rows, gridWidth } = useMemo(() => {
    const byEdu = new Map();
    REGIONS.forEach((r) => byEdu.set(r.edu, []));

    (allDinos || []).forEach((dino) => {
      if (dino.mya_max == null || !byEdu.has(dino.edu)) return;
      byEdu.get(dino.edu).push({ dino, xPx: xForMya(dino.mya_max) });
    });

    const built = REGIONS.map((region) => {
      const { placed, subRowCount } = packRow(byEdu.get(region.edu) || []);
      const height = Math.max(ROW_MIN_HEIGHT, subRowCount * SUBROW_HEIGHT + ROW_PADDING);
      const topOffset = (height - subRowCount * SUBROW_HEIGHT) / 2;
      return { ...region, items: placed, height, topOffset };
    });

    return { rows: built, gridWidth: (TICKS.length - 1) * COL_WIDTH + 60 };
  }, [allDinos]);

  return (
    <Shell header={<HeaderBar currentView="evolution" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={onBack} accessibilityRole="button" accessibilityLabel={t('common.back')}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.cream} />
          </Pressable>
          <View>
            <Text style={styles.title}>{t('evolution.title')}</Text>
            <Text style={styles.hint}>{t('evolution.hint')}</Text>
          </View>
        </View>

        <ScrollView horizontal style={styles.hScroll} contentContainerStyle={styles.hScrollContent}>
          <View style={styles.table}>
            <View style={[styles.labelCol, stickyLeftStyle]}>
              <View style={[styles.labelCell, { height: EPOCH_ROW_HEIGHT + RULER_HEIGHT }]} />
              {rows.map((row) => (
                <View key={row.edu} style={[styles.labelCell, { height: row.height }]}>
                  <Text style={styles.regionLabel} numberOfLines={2}>{t(`evolution.region_${row.key}`)}</Text>
                </View>
              ))}
            </View>

            <View style={{ width: gridWidth }}>
              <View style={[styles.epochRow, { height: EPOCH_ROW_HEIGHT, width: gridWidth }]}>
                {EPOCHS.map((epoch) => {
                  const start = Math.min(epoch.start, MYA_DOMAIN_MAX);
                  const end = Math.max(epoch.end, MYA_DOMAIN_MIN);
                  if (start <= end) return null;
                  const left = xForMya(start);
                  const width = xForMya(end) - left;
                  const label = epoch.ns === 'collection'
                    ? t(`collection.epoch.${epoch.key}`)
                    : t(`evolution.epoch_${epoch.key}`);
                  return (
                    <View key={epoch.key} style={[styles.epochBand, { left, width }]}>
                      <Text style={styles.epochText} numberOfLines={1}>{label}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={[styles.ruler, { height: RULER_HEIGHT, width: gridWidth }]}>
                {TICKS.map((tick) => (
                  <View key={tick} style={[styles.tickWrap, { left: xForMya(tick) }]}>
                    <View style={styles.tickLine} />
                    <Text style={styles.tickText}>{tick}</Text>
                  </View>
                ))}
              </View>

              {rows.map((row) => (
                <View key={row.edu} style={[styles.dataRow, { height: row.height, width: gridWidth }]}>
                  {TICKS.map((tick) => (
                    <View key={tick} style={[styles.gridLine, { left: xForMya(tick) }]} />
                  ))}
                  {row.items.map(({ dino, xPx, subRow }) => (
                    <EvoMarker key={dino.id} dino={dino} xPx={xPx} subRow={subRow} topOffset={row.topOffset} />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 999,
    backgroundColor: 'rgba(20,18,16,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    color: COLORS.accent,
    fontSize: 22,
    fontFamily: FONTS.heading,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  hint: {
    color: COLORS.cream,
    opacity: 0.6,
    fontFamily: FONTS.body,
    fontSize: 13,
    marginTop: 4,
  },
  hScroll: { flex: 1, width: '100%' },
  hScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  table: {
    flexDirection: 'row',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.10)',
  },
  labelCol: {
    width: LABEL_COL_WIDTH,
    backgroundColor: COLORS.bgDark,
  },
  labelCell: {
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(254,250,224,0.10)',
  },
  regionLabel: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  epochRow: {
    position: 'relative',
  },
  epochBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRightWidth: 1,
    borderRightColor: 'rgba(254,250,224,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  epochText: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  ruler: {
    position: 'relative',
    backgroundColor: 'rgba(254,250,224,0.04)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(254,250,224,0.10)',
  },
  tickWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    width: COL_WIDTH,
    marginLeft: -COL_WIDTH / 2,
  },
  tickLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(254,250,224,0.10)',
  },
  tickText: {
    color: COLORS.cream,
    opacity: 0.6,
    fontFamily: FONTS.body,
    fontSize: 10,
    marginTop: 10,
  },
  dataRow: {
    position: 'relative',
    backgroundColor: 'rgba(16,14,12,0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(254,250,224,0.08)',
  },
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(254,250,224,0.06)',
  },
  marker: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    height: SUBROW_HEIGHT,
    ...Platform.select({ web: { cursor: 'pointer' }, default: {} }),
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: COLORS.accent,
    borderWidth: 1.5,
    borderColor: COLORS.bgDark,
  },
  dotHovered: {
    backgroundColor: COLORS.cream,
    transform: [{ scale: 1.3 }],
  },
  markerLabel: {
    color: COLORS.cream,
    opacity: 0.85,
    fontFamily: FONTS.body,
    fontSize: 11,
    marginLeft: 4,
  },
  markerLabelHovered: {
    color: COLORS.accent,
    opacity: 1,
    fontFamily: FONTS.bold,
  },
  tooltip: {
    position: 'absolute',
    bottom: SUBROW_HEIGHT + 6,
    left: 0,
    alignItems: 'center',
    zIndex: 30,
  },
  tooltipImage: {
    width: 300,
    height: 169,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  tooltipText: {
    color: COLORS.bgDark,
    backgroundColor: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '700',
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: RADIUS.pill,
    marginTop: 6,
    maxWidth: 300,
    textAlign: 'center',
  },
});
