// CollectionTimeline — a gyűjtemény idővonal-nézete: minden dínó egy pont, a
// függőleges tengelyen az idő (Ma, régebbi fent), a vízszintes tengelyen pedig
// a klasszikus Ornithischia/Saurischia törzsfa-ábra 7 ága (lásd dinoTaxonomy.js)
// egy-egy fix szélességű oszlopban, plusz egy külön oszlop a pteroszauruszoknak.
// Csak függőlegesen görgethető — a 8 oszlop mindig a teljes elérhető szélességbe
// tördelődik, nincs vízszintes scroll. Zárolt (még nem gyűjtött) dínóknál az ág
// színére festett kérdőjel látszik, gyűjtés után a kártyakép jelenik meg (a
// keret színe ugyanaz az ág-szín marad, hogy gyűjtés előtt/után is felismerhető
// legyen, melyik családhoz tartozik).
import React, { useMemo, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Platform, Pressable, useWindowDimensions } from 'react-native';
import { IMAGE_MAP, MISSING_IMAGE } from '../constants/imageMap';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { TIMELINE_BRANCHES, getTimelineBranchKey } from '../utils/dinoTaxonomy';

const MYA_MAX = 237;
const MYA_SPAN = MYA_MAX - 66;
const PX_PER_MA = 20;
const TOTAL_HEIGHT = MYA_SPAN * PX_PER_MA;

const DOT_SIZE = 15;
const SUB_COL_WIDTH = 19; // egy párhuzamos "sáv" szélessége egy ágon belül (dot + kis rés)
const MIN_GAP_PY = 26; // két pont középpontja között ennyinek kell lennie, különben új alsáv kell
const RULER_WIDTH = 32;
const HEADER_HEIGHT = 40;

const AXIS_TICKS = [220, 200, 180, 160, 140, 120, 100, 80];

const stickyHeaderStyle = Platform.select({
  web: { position: 'sticky', top: 0, zIndex: 5 },
  default: {},
});

function mToY(mya) {
  return (MYA_MAX - mya) * PX_PER_MA;
}

// Egy ágon belül a közeli időpontú dínókat külön alsávokba szórja, hogy a
// pontok ne fedjék egymást — mohó "swimlane" csomagolás, de a rendelkezésre
// álló oszlopszélesség miatt legfeljebb `capSubCols` alsáv fér el; efölött
// (pl. amikor 5-6 dínó pontosan ugyanabból a korból származik) a pontok inkább
// egymásra csúsznak egy kicsit, mint hogy vízszintes scrollt igényeljenek.
function packColumn(items, capSubCols) {
  const sorted = [...items].sort((a, b) => a.yPx - b.yPx);
  const subColLastY = new Array(Math.max(1, capSubCols)).fill(-Infinity);
  const placed = sorted.map((item) => {
    let idx = subColLastY.findIndex((lastY) => item.yPx - lastY >= MIN_GAP_PY);
    if (idx === -1) {
      idx = subColLastY.indexOf(Math.min(...subColLastY));
    }
    subColLastY[idx] = item.yPx;
    return { ...item, subCol: idx };
  });
  return placed;
}

function TimelineMarker({ dino, unlocked, color, yPx, subCol }) {
  const [hovered, setHovered] = useState(false);
  const imageSource = IMAGE_MAP[dino.name_hu] || MISSING_IMAGE;
  const left = subCol * SUB_COL_WIDTH + (SUB_COL_WIDTH - DOT_SIZE) / 2;
  const showTooltip = unlocked && hovered;

  return (
    <Pressable
      style={[styles.marker, { top: yPx - DOT_SIZE / 2, left }, showTooltip && styles.markerHovered]}
      onHoverIn={() => unlocked && setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      {showTooltip && (
        <View style={styles.tooltip} pointerEvents="none">
          <Text style={styles.tooltipText} numberOfLines={1}>{dino.name_hu}</Text>
          <View style={styles.tooltipArrow} />
        </View>
      )}
      {unlocked ? (
        imageSource ? (
          <Image
            source={imageSource}
            style={[styles.markerImage, { borderColor: color }, showTooltip && styles.markerImageHovered]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.markerImage, styles.markerFallback, { borderColor: color }, showTooltip && styles.markerImageHovered]}>
            <Text style={styles.markerFallbackText}>🦴</Text>
          </View>
        )
      ) : (
        <View style={[styles.markerImage, styles.markerLocked, { borderColor: color, backgroundColor: `${color}33` }]}>
          <Text style={[styles.markerLockedText, { color }]}>?</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function CollectionTimeline({ allDinos, progress }) {
  // RN Web-en a View onLayout megbízhatatlanul (gyakran 0 szélességgel) sül el,
  // ezért useWindowDimensions + a Shell.js/CollectionScreen.js ismert
  // szélesség-szabályai (isWideWeb töréspont, innerWide/inner max-width,
  // padding-ok) alapján számoljuk ki az elérhető rácsszélességet, nem onLayout-tal.
  const { width: winWidth } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && winWidth >= 700;
  const shellContentWidth = isWideWeb ? Math.min(winWidth, 750) - 56 : Math.min(winWidth, 480);
  const gridWidth = shellContentWidth - 32; // timelineWrapper paddingHorizontal (16+16)

  // Kis biztonsági margó (kerekítési hibák a 8 oszlopra osztásnál), hogy a
  // pontok soha ne lógjanak ki a rácsból — nincs vízszintes scroll, ami elfedné.
  const columnWidth = gridWidth > 0 ? Math.floor((gridWidth - RULER_WIDTH - 6) / TIMELINE_BRANCHES.length) : 0;
  const capSubCols = columnWidth > 0 ? Math.max(1, Math.floor((columnWidth - 4) / SUB_COL_WIDTH)) : 1;

  const { lanes, collectedCount, totalCount } = useMemo(() => {
    const buckets = {};
    TIMELINE_BRANCHES.forEach((b) => { buckets[b.key] = []; });

    let collected = 0;
    let total = 0;

    (allDinos || []).forEach((dino) => {
      const branchKey = getTimelineBranchKey(dino);
      if (!branchKey || dino.mya_min == null || dino.mya_max == null) return;

      const unlocked = progress?.[dino.edu]?.[dino.csomag]?.quizPassed === true;
      const midMya = (dino.mya_min + dino.mya_max) / 2;

      total += 1;
      if (unlocked) collected += 1;

      buckets[branchKey].push({ dino, unlocked, yPx: mToY(midMya) });
    });

    const built = TIMELINE_BRANCHES.map((branch) => ({
      ...branch,
      items: packColumn(buckets[branch.key], capSubCols),
    }));

    return { lanes: built, collectedCount: collected, totalCount: total };
  }, [allDinos, progress, capSubCols]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Törzsfa idővonal</Text>
        <View style={styles.progressPill}>
          <Text style={styles.progressPillText}>{collectedCount} / {totalCount}</Text>
        </View>
      </View>

      <ScrollView style={styles.verticalScroll}>
        <View style={[styles.columnsHeader, stickyHeaderStyle]}>
          <View style={{ width: RULER_WIDTH }} />
          {lanes.map((lane) => (
            <View key={lane.key} style={[styles.columnHeaderCell, { width: columnWidth }]}>
              <View style={[styles.columnHeaderDot, { backgroundColor: lane.color }]} />
              <Text style={styles.columnHeaderText} numberOfLines={1}>{lane.shortLabel}</Text>
            </View>
          ))}
        </View>

        <View style={styles.body}>
          <View style={[styles.ruler, { height: TOTAL_HEIGHT }]}>
            {AXIS_TICKS.map((tick) => (
              <View key={tick} style={[styles.rulerTick, { top: mToY(tick) }]}>
                <Text style={styles.rulerTickText}>{tick}</Text>
              </View>
            ))}
          </View>

          {lanes.map((lane) => (
            <View key={lane.key} style={[styles.laneColumn, { width: columnWidth, height: TOTAL_HEIGHT }]}>
              {lane.items.map(({ dino, unlocked, yPx, subCol }) => (
                <TimelineMarker key={dino.id} dino={dino} unlocked={unlocked} color={lane.color} yPx={yPx} subCol={subCol} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  headerTitle: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  progressPill: {
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.pill,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  progressPillText: {
    color: COLORS.bgDark,
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '800',
  },
  // RN Web-specifikus: a #root DOM elem nem flex konténer, így a flex:1 lánc
  // nem korlátozza megbízhatóan a magasságot (lásd Shell.js hasonló problémáját) —
  // itt a tartalom hosszú (~4200px), ezért explicit vh-alapú maxHeight kell a
  // belső (kizárólag függőleges) görgetéshez.
  verticalScroll: Platform.select({
    web: { maxHeight: '70vh', minHeight: 0 },
    default: { flex: 1, minHeight: 0 },
  }),
  columnsHeader: {
    flexDirection: 'row',
    height: HEADER_HEIGHT,
    backgroundColor: COLORS.bgDark,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(254,250,224,0.15)',
  },
  columnHeaderCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnHeaderDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginBottom: 2,
  },
  columnHeaderText: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 9,
    fontWeight: '600',
    opacity: 0.85,
  },
  body: { flexDirection: 'row' },
  ruler: { width: RULER_WIDTH, position: 'relative' },
  rulerTick: { position: 'absolute', left: 0, right: 0, transform: [{ translateY: -6 }] },
  rulerTickText: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 9,
    opacity: 0.6,
    textAlign: 'right',
    paddingRight: 4,
  },
  laneColumn: { position: 'relative' },
  marker: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    zIndex: 1,
    ...Platform.select({ web: { cursor: 'pointer' }, default: {} }),
  },
  markerHovered: { zIndex: 20 },
  markerImage: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 1.5,
  },
  markerImageHovered: {
    borderWidth: 2.5,
    borderColor: COLORS.cream,
    transform: [{ scale: 1.6 }],
  },
  markerFallback: {
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerFallbackText: { fontSize: 8 },
  markerLocked: {
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerLockedText: {
    fontFamily: FONTS.bold,
    fontSize: 9,
    fontWeight: '800',
  },
  tooltip: {
    position: 'absolute',
    bottom: DOT_SIZE + 8,
    left: '50%',
    transform: [{ translateX: -50 }],
    alignItems: 'center',
    zIndex: 30,
  },
  tooltipText: {
    color: COLORS.bgDark,
    backgroundColor: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '700',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    minWidth: 100,
    maxWidth: 160,
    textAlign: 'center',
  },
  tooltipArrow: {
    width: 8,
    height: 8,
    backgroundColor: COLORS.cream,
    transform: [{ rotate: '45deg' }],
    marginTop: -4,
  },
});
