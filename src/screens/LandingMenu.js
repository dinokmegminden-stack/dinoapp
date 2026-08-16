// LandingMenu — a landing menü RÉGIÓK blokkja: interaktív világtérkép
// (RegionWorldMap). A játékmódok külön, "Játékok" fejléc-gombbal nyíló
// GamingScreen-re kerültek (lásd LandingPage.js + GamingScreen.js), a
// Gyűjtemény pedig a fejlécben, a ranglista-ikon mellett él.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RegionWorldMap from '../components/RegionWorldMap';
import { COLORS, FONTS } from '../constants/theme';
import { useT } from '../i18n';

function SectionLabel({ children }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export default function LandingMenu({ onSelectRegion, regionCounts, regionRatios, highlightEdu, onHoverRegion }) {
  const { t } = useT();
  return (
    <View style={styles.menuContainer}>
      <SectionLabel>{t('landing.regions_label')}</SectionLabel>
      <RegionWorldMap
        onSelectRegion={onSelectRegion}
        regionCounts={regionCounts}
        regionRatios={regionRatios}
        highlightEdu={highlightEdu}
        onHoverRegion={onHoverRegion}
      />
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
    fontFamily: FONTS.heading,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 12,
    opacity: 0.9,
  },
});
