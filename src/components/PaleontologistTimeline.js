// PaleontologistTimeline — vízszintes idővonal a Kutatók fül tetején.
// Minden paleontológus egy ember-emoji "könyvjelző", a születési éve szerint
// balról jobbra elhelyezve. Hoverre (web) a név + életévek buborékban
// jelenik meg; kattintásra a szülő (KutatokScreen) az adott személyhez
// kötött cikkekre szűri a listát — újra kattintva törli a szűrést.
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { COLORS, RADIUS, FONTS } from '../constants/theme';

const MARKER_SIZE = 40;
const EDGE_PADDING_PCT = 6; // a legszélső pontok se lógjanak ki a sáv aljáról
const TOOLTIP_WIDTH = 132;
const TOOLTIP_GAP = 8;

function yearsLabel(born, died) {
  if (!born) return '';
  return died ? `${born}–${died}` : `${born}–`;
}

// A tooltipnek FIX méretűnek és abszolút pozíciójúnak kell lennie — ha
// normál flow-elemként ülne a marker mellett/alatt, a megjelenésekor
// megnövelné a szülő (markerWrap) szélességét, ami az `alignItems: 'center'`
// miatt ÚJRAKÖZÉPRE IGAZÍTANÁ magát a markert is. Ez az egérkurzor alól
// mozdítja ki a markert, ami hoverOut-ot vált ki, mire a tooltip eltűnik,
// a marker visszaugrik a kurzor alá, ami újra hoverIn-t vált ki — végtelen
// vibrálás. Az abszolút pozicionálás azért old meg mindent, mert a tooltip
// megjelenése/eltűnése ekkor semmilyen hatással nincs a marker méretére
// vagy helyére.
function Marker({ person, selected, onPress, above }) {
  const [hovered, setHovered] = useState(false);
  const showTooltip = hovered || selected;

  return (
    <View style={styles.markerWrap}>
      <Pressable
        onPress={onPress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={[styles.marker, selected && styles.markerSelected]}
        accessibilityRole="button"
        accessibilityLabel={person.name}
      >
        <Text style={styles.markerEmoji}>{person.emoji || '🧑‍🔬'}</Text>
      </Pressable>
      {showTooltip && (
        <View
          style={[
            styles.tooltip,
            above ? styles.tooltipAbove : styles.tooltipBelow,
            selected && styles.tooltipSelected,
          ]}
          pointerEvents="none"
        >
          <Text style={styles.tooltipName} numberOfLines={1}>{person.name}</Text>
          <Text style={styles.tooltipYears}>{yearsLabel(person.born_year, person.died_year)}</Text>
        </View>
      )}
    </View>
  );
}

export default function PaleontologistTimeline({ people, selectedId, onSelect }) {
  const positioned = useMemo(() => {
    const withYear = (people || []).filter((p) => p.born_year != null);
    if (withYear.length === 0) return [];
    const years = withYear.map((p) => p.born_year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const span = maxYear - minYear || 1;
    return withYear.map((p) => {
      const ratio = (p.born_year - minYear) / span;
      const pct = EDGE_PADDING_PCT + ratio * (100 - EDGE_PADDING_PCT * 2);
      return { ...p, leftPct: pct };
    });
  }, [people]);

  if (positioned.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>KUTATÓK IDŐVONALA</Text>
      <View style={styles.track}>
        <View style={styles.baseline} />
        {positioned.map((p, i) => (
          <View key={p.id} style={[styles.markerSlot, { left: `${p.leftPct}%` }]}>
            <Marker
              person={p}
              selected={selectedId === p.id}
              onPress={() => onSelect(selectedId === p.id ? null : p.id)}
              above={i % 2 === 0}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 820,
    marginBottom: 24,
  },
  title: {
    color: COLORS.accent,
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
    letterSpacing: 1.5,
    opacity: 0.7,
    marginBottom: 14,
  },
  track: {
    height: 130,
    width: '100%',
    position: 'relative',
  },
  baseline: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(254,250,224,0.18)',
  },
  markerSlot: {
    position: 'absolute',
    top: 35,
    transform: [{ translateX: -MARKER_SIZE / 2 }],
    alignItems: 'center',
  },
  markerWrap: {
    position: 'relative',
    alignItems: 'center',
  },
  marker: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(20,18,16,0.7)',
    borderWidth: 2,
    borderColor: 'rgba(254,250,224,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transitionProperty: 'background-color, border-color',
        transitionDuration: '120ms',
      },
    }),
  },
  markerSelected: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(221,161,94,0.22)',
  },
  markerEmoji: {
    fontSize: 20,
  },
  tooltip: {
    position: 'absolute',
    left: (MARKER_SIZE - TOOLTIP_WIDTH) / 2,
    width: TOOLTIP_WIDTH,
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignItems: 'center',
    ...Platform.select({ web: { whiteSpace: 'nowrap' } }),
  },
  tooltipBelow: {
    top: MARKER_SIZE + TOOLTIP_GAP,
  },
  tooltipAbove: {
    bottom: MARKER_SIZE + TOOLTIP_GAP,
  },
  tooltipSelected: {
    backgroundColor: COLORS.accent,
  },
  tooltipName: {
    color: COLORS.bgDark,
    fontSize: 12.5,
    fontFamily: FONTS.bodyBold,
  },
  tooltipYears: {
    color: COLORS.bgDark,
    fontSize: 10.5,
    fontFamily: FONTS.body,
    opacity: 0.7,
  },
});
