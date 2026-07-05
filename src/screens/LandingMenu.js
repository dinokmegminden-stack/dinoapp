import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const DESKTOP_BREAKPOINT = 768;

// --- Régió-konfiguráció ------------------------------------------------------

const REGIONS = [
  { edu: 1, label: 'Kárpát-medence', bg: '#2F3E2F', text: '#FFFDEE', Icon: CarpathianIcon },
  { edu: 2, label: 'Európa', bg: '#78866B', text: '#FFFDEE', Icon: EuropeIcon },
  { edu: 3, label: 'Afrika', bg: '#D6A870', text: '#FFFDEE', Icon: AfricaIcon },
  { edu: 4, label: 'Ázsia', bg: '#FBF7E4', text: '#2F3E2F', Icon: AsiaIcon },
  { edu: 5, label: 'Amerika', bg: '#D1914A', text: '#FFFDEE', Icon: AmericaIcon },
];

// --- Duotone kontinens-ikonok --------------------------------------------------

function CarpathianIcon({ color, size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d="M 22 36 
           C 25 25, 40 16, 55 18 
           C 68 20, 82 22, 88 35 
           C 92 42, 86 52, 92 60
           C 96 66, 91 75, 84 78
           C 72 82, 60 90, 48 85
           C 38 82, 25 88, 15 82
           C 8 78, 12 68, 10 60
           C 8 52, 16 46, 15 42
           Z"
        fill={color}
        fillOpacity={0.25}
        stroke={color}
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function EuropeIcon({ color, size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d="M30 10 C34 14 30 20 36 22 C44 24 42 14 50 16 C58 18 54 28 62 30 C70 32 74 24 80 30 C86 36 78 42 82 50 C86 58 76 56 74 64 C72 72 78 78 70 84 C62 90 58 80 50 82 C42 84 40 92 32 88 C24 84 30 76 24 70 C18 64 10 66 12 56 C14 46 22 48 22 38 C22 28 16 26 20 18 C24 10 26 6 30 10 Z"
        fill={color}
        fillOpacity={0.25}
        stroke={color}
        strokeWidth={3}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AfricaIcon({ color, size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d="M50 8 C62 8 70 18 72 28 C74 36 82 40 80 50 C78 60 68 62 66 70 C64 78 56 92 48 92 C40 92 38 80 34 72 C30 64 20 60 22 48 C24 38 18 32 24 22 C28 14 40 8 50 8 Z"
        fill={color}
        fillOpacity={0.25}
        stroke={color}
        strokeWidth={3}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AsiaIcon({ color, size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d="M14 34 C24 24 34 30 42 24 C50 18 56 8 66 14 C76 20 70 30 78 36 C86 42 92 38 90 48 C88 58 76 54 72 62 C68 70 74 78 64 80 C54 82 52 72 44 74 C36 76 34 86 26 82 C18 78 24 70 18 64 C12 58 6 60 8 50 C10 40 8 42 14 34 Z"
        fill={color}
        fillOpacity={0.25}
        stroke={color}
        strokeWidth={3}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AmericaIcon({ color, size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d="M46 6 C54 6 58 14 64 16 C70 18 76 14 76 22 C76 30 68 30 66 36 C64 42 70 44 66 50 C62 56 54 52 52 58 C50 64 56 66 52 72 C48 78 44 72 42 78 C40 84 44 90 38 92 C32 94 32 86 30 80 C28 74 22 76 22 68 C22 60 28 60 28 52 C28 44 22 42 26 36 C30 30 36 32 38 26 C40 20 34 16 40 12 C44 9 42 6 46 6 Z"
        fill={color}
        fillOpacity={0.25}
        stroke={color}
        strokeWidth={3}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// --- Egy sáv/kártya -----------------------------------------------------------

function RegionRow({ region, isDesktop, onPress }) {
  const [hovered, setHovered] = useState(false);
  const Icon = region.Icon;

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
      <View style={styles.rowIcon}>
        <Icon color={region.text} size={40} />
      </View>
      <Text style={[styles.rowLabel, { color: region.text }]}>{region.label}</Text>
    </Pressable>
  );
}

// --- Fő komponens ---------------------------------------------------------------

export default function LandingMenu({ onSelectRegion }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  return (
    <View style={styles.container}>
      <View style={styles.list}>
        {REGIONS.map((region) => (
          <View key={region.edu} style={styles.fullWidthItem}>
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
  rowIcon: {
    width: 40,
    height: 40,
  },
  rowLabel: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: SERIF_FONT,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});