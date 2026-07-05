import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const DESKTOP_BREAKPOINT = 768;

// --- Inline SVG kontinens-sziluettek (egyszerűsített, stilizált kontúrok) ---

function KarpatIcon({ color }) {
  return (
    <Svg width="72" height="72" viewBox="0 0 100 100">
      <Path
        d="M30 55 Q20 40 32 28 Q45 18 58 26 Q72 32 70 48 Q76 58 66 68 Q54 78 40 72 Q26 68 30 55 Z"
        fill={color}
        opacity={0.9}
      />
      <Path
        d="M32 50 Q42 44 52 48 Q62 52 66 46"
        stroke={color}
        strokeWidth={2}
        fill="none"
        opacity={0.5}
      />
    </Svg>
  );
}

function EuropaIcon({ color }) {
  return (
    <Svg width="72" height="72" viewBox="0 0 100 100">
      <Path
        d="M22 30 L34 22 L46 28 L54 20 L66 26 L72 38 L64 46 L70 56 L62 66 L50 62 L44 72 L32 68 L28 56 L18 50 L22 38 Z"
        fill={color}
        opacity={0.9}
      />
    </Svg>
  );
}

function AfrikaIcon({ color }) {
  return (
    <Svg width="72" height="72" viewBox="0 0 100 100">
      <Path
        d="M42 12 Q60 14 64 30 Q70 38 66 48 Q72 58 62 72 Q56 86 46 84 Q42 74 46 64 Q36 60 34 48 Q26 42 30 30 Q28 18 42 12 Z"
        fill={color}
        opacity={0.9}
      />
    </Svg>
  );
}

function AsiaIcon({ color }) {
  return (
    <Svg width="72" height="72" viewBox="0 0 100 100">
      <Path
        d="M14 40 L28 24 L46 20 L60 28 L78 22 L88 34 L84 48 L90 58 L76 66 L68 60 L54 68 L40 64 L30 70 L18 62 L22 50 Z"
        fill={color}
        opacity={0.9}
      />
    </Svg>
  );
}

function AmerikaIcon({ color }) {
  return (
    <Svg width="72" height="72" viewBox="0 0 100 100">
      <Path
        d="M40 10 L54 8 L60 20 L52 30 L58 38 L50 46 L54 54 L46 62 L50 72 L42 88 L36 74 L40 60 L34 50 L40 40 L34 30 L38 20 Z"
        fill={color}
        opacity={0.9}
      />
    </Svg>
  );
}

// --- Régió-konfiguráció ------------------------------------------------------

const REGIONS = [
  { edu: 1, label: 'Kárpát-medence', bg: '#2F3E2F', text: '#FFFDEE', Icon: KarpatIcon },
  { edu: 2, label: 'Európa', bg: '#78866B', text: '#FFFDEE', Icon: EuropaIcon },
  { edu: 3, label: 'Afrika', bg: '#D6A870', text: '#FFFDEE', Icon: AfrikaIcon },
  { edu: 4, label: 'Ázsia', bg: '#FBF7E4', text: '#2F3E2F', Icon: AsiaIcon },
  { edu: 5, label: 'Amerika', bg: '#D1914A', text: '#FFFDEE', Icon: AmerikaIcon },
];

// --- Egy sáv/kártya -----------------------------------------------------------

function RegionRow({ region, isDesktop, onPress }) {
  const [hovered, setHovered] = useState(false);
  const { Icon } = region;

  return (
    <Pressable
      onPress={() => onPress(region.edu)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.row,
        { backgroundColor: region.bg },
        isDesktop && styles.rowDesktop,
        isDesktop && hovered && styles.rowDesktopHovered,
      ]}
    >
      <Icon color={region.text} />
      <Text style={[styles.rowLabel, { color: region.text }]}>{region.label}</Text>
    </Pressable>
  );
}

// --- Fő komponens ---------------------------------------------------------------

export default function LandingMenu({ onSelectRegion }) {
  const { width } = useWindowDimensions();
  //const isDesktop = width >= DESKTOP_BREAKPOINT;
  const isDesktop = false;
  const columns = width >= 1100 ? 5 : 1;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.list,
          isDesktop && [styles.grid, { maxWidth: columns * 340 }],
        ]}
      >
        {REGIONS.map((region) => (
          <View
            key={region.edu}
            style={isDesktop ? { width: `${100 / columns}%`, padding: 8 } : styles.fullWidthItem}
          >
            <RegionRow region={region} isDesktop={isDesktop} onPress={onSelectRegion} />
          </View>
        ))}
      </View>
    </View>
  );
}

const SERIF_FONT = Platform.select({
  web: "'Times New Roman', Georgia, serif",
  default: 'serif',
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1f16',
  },
  list: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center',
  },
  fullWidthItem: {
    width: '100%',
  },
  row: {
    width: '100%',
    minHeight: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 20,
    paddingHorizontal: 28,
    paddingVertical: 18,
  },
  rowDesktop: {
    borderRadius: 18,
    minHeight: 140,
    ...Platform.select({
      web: {
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        cursor: 'pointer',
      },
    }),
  },
  rowDesktopHovered: {
    transform: [{ scale: 1.03 }],
    ...Platform.select({
      web: {
        boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
      },
    }),
  },
  rowLabel: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: SERIF_FONT,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});
