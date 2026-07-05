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

const FOSSIL_PATTERN_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%2334495e' fill-opacity='0.6'%3E%3Cpath d='M10 15c-1.5 0-3 1-3 2.5S8.5 20 10 20s3-1 3-2.5S11.5 15 10 15zm3 3.5c0 .8-.7 1.5-1.5 1.5h-3C7.7 20 7 19.3 7 18.5v-1c0-.8.7-1.5 1.5-1.5h3c.8 0 1.5.7 1.5 1.5v1zM5 17c0-1.7 1.3-3 3-3h4c1.7 0 3 1.3 3 3v1c0 1.7-1.3 3-3 3H8c-1.7 0-3-1.3-3-3v-1z'/%3E%3Crect x='45' y='15' width='12' height='4' rx='2'/%3E%3Crect x='49' y='11' width='4' height='12' rx='2'/%3E%3Cpath d='M20 50h4v4h-4zm6 0h4v4h-4zm-3 5h4v4h-4z'/%3E%3Cpath d='M60 45c2-2 5-2 7 0l4 4c2 2 2 5 0 7l-4 4c-2 2-5 2-7 0l-4-4c-2-2-2-5 0-7l4-4z'/%3E%3C/g%3E%3C/svg%3E";

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
    ...Platform.select({
      web: {
        backgroundImage: `url("${FOSSIL_PATTERN_URI}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '80px 80px',
      },
    }),
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