// PaleontologistTimeline — vízszintes idővonal a Kutatók fül tetején, a
// klasszikus "függőleges idővonal, két oldalra hasogatott tartalommal" minta
// vízszintesre fordítva: a paleontológus NEM magán a vonalon ül, hanem egy
// ponton (dot) kapcsolódik hozzá, ahonnan egy szár (stem) felfelé vagy lefelé
// vezet a tartalmához — a sorrend szerint felváltva. A név csak hoverre/
// kiválasztásra jelenik meg (a sűrűn egymáshoz közeli születési évek miatt
// egy mindig kiírt teljes név ütközne a szomszédokkal), az évszám viszont
// mindig látszik. Kattintásra a szülő (KutatokScreen) az adott személyhez
// kötött cikkekre szűri a listát — újra kattintva törli a szűrést.
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { COLORS, RADIUS, FONTS } from '../constants/theme';
import { useT } from '../i18n';

const DOT_SIZE = 10;
const STEM_LENGTH = 20;
const BUBBLE_SIZE = 36;
const EDGE_PADDING_PCT = 6; // a legszélső pontok se lógjanak ki a sáv aljáról
const NAME_TOOLTIP_WIDTH = 132;
const NAME_TOOLTIP_GAP = 6;

function yearsLabel(born, died) {
  if (!born) return '';
  return died ? `${born}–${died}` : `${born}–`;
}

// Minden elem (szár + buborék + évszám + névtooltip) egy abszolút pozicionált
// oszlop — semmi nem normál flow-elem, így semelyik állapotváltás (hover,
// kiválasztás) nem tudja átméretezni a szülőt és ezzel elmozdítani a
// kattintható területet a kurzor alól (ez okozta a korábbi vibrálás-hibát).
function PersonColumn({ person, selected, onPress, above }) {
  const [hovered, setHovered] = useState(false);
  const showName = hovered || selected;

  return (
    <View style={styles.column}>
      <View style={[styles.dot, selected && styles.dotSelected]} />
      <View style={[styles.stem, above ? styles.stemAbove : styles.stemBelow, selected && styles.stemSelected]} />

      <Pressable
        onPress={onPress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={[styles.content, above ? styles.contentAbove : styles.contentBelow]}
        accessibilityRole="button"
        accessibilityLabel={person.name}
      >
        <View style={[styles.bubble, selected && styles.bubbleSelected]}>
          <Text style={styles.bubbleEmoji}>{person.emoji || '🧑‍🔬'}</Text>
        </View>
        <Text style={styles.yearLabel}>{person.born_year}</Text>
      </Pressable>

      {showName && (
        <View
          style={[
            styles.nameTooltip,
            above ? styles.nameTooltipAbove : styles.nameTooltipBelow,
            selected && styles.nameTooltipSelected,
          ]}
          pointerEvents="none"
        >
          <Text style={styles.nameTooltipText} numberOfLines={1}>{person.name}</Text>
          <Text style={styles.nameTooltipYears}>{yearsLabel(person.born_year, person.died_year)}</Text>
        </View>
      )}
    </View>
  );
}

export default function PaleontologistTimeline({ people, selectedId, onSelect }) {
  const { t } = useT();
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
      <Text style={styles.title}>{t('paleontologists.timeline_title')}</Text>
      <View style={styles.track}>
        <View style={styles.baseline} />
        {positioned.map((p, i) => (
          <View key={p.id} style={[styles.columnSlot, { left: `${p.leftPct}%` }]}>
            <PersonColumn
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
    height: 160,
    width: '100%',
    position: 'relative',
  },
  baseline: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(254,250,224,0.18)',
  },
  columnSlot: {
    position: 'absolute',
    top: 80,
    transform: [{ translateX: -DOT_SIZE / 2 }],
  },
  column: {
    position: 'relative',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: COLORS.accent,
    borderWidth: 2,
    borderColor: COLORS.bgDark,
  },
  dotSelected: {
    backgroundColor: COLORS.cream,
  },
  stem: {
    position: 'absolute',
    left: DOT_SIZE / 2 - 1,
    width: 2,
    height: STEM_LENGTH,
    backgroundColor: 'rgba(254,250,224,0.3)',
  },
  stemSelected: {
    backgroundColor: COLORS.accent,
  },
  stemAbove: {
    top: -STEM_LENGTH,
  },
  stemBelow: {
    top: DOT_SIZE,
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -BUBBLE_SIZE / 2 + DOT_SIZE / 2 }],
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  contentAbove: {
    bottom: DOT_SIZE / 2 + STEM_LENGTH,
  },
  contentBelow: {
    top: DOT_SIZE / 2 + STEM_LENGTH,
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(20,18,16,0.7)',
    borderWidth: 2,
    borderColor: 'rgba(254,250,224,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        transitionProperty: 'background-color, border-color',
        transitionDuration: '120ms',
      },
    }),
  },
  bubbleSelected: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(221,161,94,0.22)',
  },
  bubbleEmoji: {
    fontSize: 18,
  },
  yearLabel: {
    color: COLORS.cream,
    fontSize: 10.5,
    fontFamily: FONTS.bodyBold,
    opacity: 0.75,
    marginTop: 3,
  },
  nameTooltip: {
    position: 'absolute',
    left: DOT_SIZE / 2 - NAME_TOOLTIP_WIDTH / 2,
    width: NAME_TOOLTIP_WIDTH,
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignItems: 'center',
    ...Platform.select({ web: { whiteSpace: 'nowrap' } }),
  },
  nameTooltipAbove: {
    bottom: DOT_SIZE / 2 + STEM_LENGTH + BUBBLE_SIZE + 18 + NAME_TOOLTIP_GAP,
  },
  nameTooltipBelow: {
    top: DOT_SIZE / 2 + STEM_LENGTH + BUBBLE_SIZE + 18 + NAME_TOOLTIP_GAP,
  },
  nameTooltipSelected: {
    backgroundColor: COLORS.accent,
  },
  nameTooltipText: {
    color: COLORS.bgDark,
    fontSize: 12.5,
    fontFamily: FONTS.bodyBold,
  },
  nameTooltipYears: {
    color: COLORS.bgDark,
    fontSize: 10.5,
    fontFamily: FONTS.body,
    opacity: 0.7,
  },
});
