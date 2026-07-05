import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Platform } from 'react-native';

const DESKTOP_BREAKPOINT = 768;

const REGIONS = [
  { edu: 1, label: 'Kárpát-medence' },
  { edu: 2, label: 'Európa' },
  { edu: 3, label: 'Afrika' },
  { edu: 4, label: 'Ázsia' },
  { edu: 5, label: 'Amerika' },
];

function RegionButton({ region, isDesktop, onPress }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={() => onPress(region.edu)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.glassBtn,
        isDesktop && styles.glassBtnDesktop,
        hovered && styles.glassBtnHovered,
      ]}
    >
      <Text style={styles.glassBtnText}>{region.label}</Text>
    </Pressable>
  );
}

export default function LandingMenu({ onSelectRegion }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  return (
    <View style={styles.hero}>
      <View style={styles.list}>
        {REGIONS.map((region) => (
          <RegionButton
            key={region.edu}
            region={region}
            isDesktop={isDesktop}
            onPress={onSelectRegion}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    width: '100%',
    minHeight: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C3E50',
  },
  list: {
    width: '100%',
    maxWidth: 420,
    gap: 20,
    paddingHorizontal: 24,
  },
  glassBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 36,
    alignItems: 'center',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      },
    }),
  },
  glassBtnDesktop: {
    paddingVertical: 20,
  },
  glassBtnHovered: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.25)',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px 0 rgba(0,0,0,0.4)',
        transform: 'translateY(-2px)',
      },
    }),
  },
  glassBtnText: {
    color: '#ECEFF1',
    fontFamily: Platform.select({
      web: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      default: 'System',
    }),
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});