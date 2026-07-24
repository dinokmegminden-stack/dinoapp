// LandingMenu — a landing menü RÉGIÓK blokkja: interaktív világtérkép
// (RegionWorldMap). A játékmódok külön, "Játékok" fejléc-gombbal nyíló
// GamingScreen-re kerültek (lásd LandingPage.js + GamingScreen.js), a
// Gyűjtemény pedig a fejlécben, a ranglista-ikon mellett él.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RegionWorldMap from '../components/RegionWorldMap';
import { COLORS } from '../constants/theme';

function SectionLabel({ children }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export default function LandingMenu({ onSelectRegion, regionCounts }) {
  return (
    <View style={styles.menuContainer}>
      <SectionLabel>RÉGIÓK</SectionLabel>
      <RegionWorldMap onSelectRegion={onSelectRegion} regionCounts={regionCounts} />
    </View>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    width: '100%',
  },
  sectionLabel: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 12,
    opacity: 0.9,
  },
});
