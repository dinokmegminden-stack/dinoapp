import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Platform } from 'react-native';

const DESKTOP_BREAKPOINT = 768;

// --- Régió-konfiguráció ------------------------------------------------------

const REGIONS = [
  { edu: 1, label: 'Kárpát-medence', bg: '#2F3E2F', text: '#FFFDEE', icon: '🏔️' },
  { edu: 2, label: 'Európa', bg: '#78866B', text: '#FFFDEE', icon: '🇪🇺' },
  { edu: 3, label: 'Afrika', bg: '#D6A870', text: '#FFFDEE', icon: '🌍' },
  { edu: 4, label: 'Ázsia', bg: '#FBF7E4', text: '#2F3E2F', icon: '🐉' },
  { edu: 5, label: 'Amerika', bg: '#D1914A', text: '#FFFDEE', icon: '🌎' },
];

// --- Egy sáv/kártya -----------------------------------------------------------

function RegionRow({ region, isDesktop, onPress }) {
  const [hovered, setHovered] = useState(false);

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
      <Text style={styles.rowIcon}>{region.icon}</Text>
      <Text style={[styles.rowLabel, { color: region.text }]}>{region.label}</Text>
    </Pressable>
  );
}

// --- Fő komponens ---------------------------------------------------------------

export default function LandingMenu({ onSelectRegion }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const columns = width >= 1100 ? 3 : 2;

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
  rowIcon: {
    fontSize: 40,
  },
  rowLabel: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: SERIF_FONT,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});
