import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

const DESKTOP_BREAKPOINT = 768;

// --- Régió-konfiguráció ------------------------------------------------------

const REGIONS = [
  { edu: 1, label: 'Kárpát-medence', bg: '#2F3E2F', bgDark: '#1C2A1C', text: '#FFFDEE', icon: '🏔️' },
  { edu: 2, label: 'Európa', bg: '#78866B', bgDark: '#586347', text: '#FFFDEE', icon: '🇪🇺' },
  { edu: 3, label: 'Afrika', bg: '#D6A870', bgDark: '#B3854F', text: '#FFFDEE', icon: '🌍' },
  { edu: 4, label: 'Ázsia', bg: '#FBF7E4', bgDark: '#E4DCC0', text: '#2F3E2F', icon: '🐉' },
  { edu: 5, label: 'Amerika', bg: '#D1914A', bgDark: '#A96F32', text: '#FFFDEE', icon: '🌎' },
];

// --- Halvány lábnyom-minta háttér ------------------------------------------

function FootprintPattern({ color }) {
  const footprint = (x, y, rotation = 0, scale = 1) => (
    <Path
      key={`${x}-${y}`}
      d="M0 4 C-2 4 -3 2 -3 0 C-3 -2 -2 -4 0 -4 C2 -4 3 -2 3 0 C3 2 2 4 0 4 Z M-5 -6 C-6 -6 -6.5 -7 -6.5 -8 C-6.5 -9 -6 -10 -5 -10 C-4 -10 -3.5 -9 -3.5 -8 C-3.5 -7 -4 -6 -5 -6 Z M5 -6 C4 -6 3.5 -7 3.5 -8 C3.5 -9 4 -10 5 -10 C6 -10 6.5 -9 6.5 -8 C6.5 -7 6 -6 5 -6 Z"
      fill={color}
      transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}
    />
  );

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 400 140"
      style={StyleSheet.absoluteFill}
      preserveAspectRatio="xMidYMid slice"
    >
      {footprint(60, 30, -15, 2.2)}
      {footprint(140, 90, 10, 2.6)}
      {footprint(230, 40, -8, 2)}
      {footprint(310, 100, 15, 2.4)}
      {footprint(370, 25, -20, 1.8)}
    </Svg>
  );
}

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
        isDesktop && styles.rowDesktop,
        isDesktop && hovered && styles.rowDesktopHovered,
      ]}
    >
      <LinearGradient
        colors={[region.bg, region.bgDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <FootprintPattern color={region.text} style={{ opacity: 0.06 }} />
      <Text style={styles.rowIcon}>{region.icon}</Text>
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
    overflow: 'hidden',
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