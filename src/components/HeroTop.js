// src/components/HeroTop.js — redesign: nincs külön ikon/érme a cím fölött,
// csak a "DÍNÓ TUDÓS" felirat.
import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import {
  useFonts as useLuckiest,
  LuckiestGuy_400Regular,
} from '@expo-google-fonts/luckiest-guy';
import {
  useFonts as useFredoka,
  Fredoka_400Regular,
} from '@expo-google-fonts/fredoka';
import { COLORS } from '../constants/theme';

// Amíg az allDinos még nem töltött be (App.js preloadCreatures), ezt írjuk ki
// helyette — a `creatures` tábla jelenlegi tartalma szerinti tényleges szám
// (lásd data/111 db.csv). Ha allDinos betöltött, a valós hossza felülírja.
const TOTAL_CREATURES_FALLBACK = 111;

export default function HeroTop({ isWide = false, totalCreatures }) {
  const { width } = useWindowDimensions();

  const [luckiestLoaded] = useLuckiest({ LuckiestGuy_400Regular });
  const [fredokaLoaded] = useFredoka({ Fredoka_400Regular });

  const fontsLoaded = luckiestLoaded && fredokaLoaded;
  const titleSize = width < 768 ? 32 : 40;
  const creatureCount = totalCreatures || TOTAL_CREATURES_FALLBACK;

  return (
    <View style={[styles.container, isWide && styles.containerWide]}>
      <View style={[styles.heroCard, isWide && styles.heroCardWide]}>
        <View style={[styles.titleBlock, isWide && styles.titleBlockWide]}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.mainTitle,
                isWide && styles.mainTitleWide,
                {
                  fontSize: titleSize,
                  fontFamily: fontsLoaded ? 'LuckiestGuy_400Regular' : 'System',
                },
              ]}
            >
              DÍNÓ TUDÓS
            </Text>
          </View>
          <Text
            style={[
              styles.subtitle,
              isWide && styles.subtitleWide,
              { fontFamily: fontsLoaded ? 'Fredoka_400Regular' : 'System' },
            ]}
          >
            Gyűjts, tanulj, játssz!
          </Text>
          <Text
            style={[
              styles.valueProp,
              isWide && styles.valuePropWide,
              { fontFamily: fontsLoaded ? 'Fredoka_400Regular' : 'System' },
            ]}
          >
            Fedezz fel {creatureCount} őslényt 6 kontinensről — gyűjtsd, tanuld meg, játssz velük!
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 2,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  containerWide: {
    paddingHorizontal: 0,
    alignItems: 'flex-start',
  },
  heroCard: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    paddingVertical: 4,
  },
  heroCardWide: {
    maxWidth: '100%',
    alignItems: 'flex-start',
  },
  titleBlock: {
    alignItems: 'center',
    transform: [{ rotate: '-3deg' }],
  },
  titleBlockWide: {
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mainTitle: {
    color: COLORS.accent,
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 0,
    textShadowColor: COLORS.accentDark,
    textShadowOffset: { width: 3, height: 5 },
    textShadowRadius: 1,
  },
  mainTitleWide: {
    textAlign: 'left',
  },
  subtitle: {
    color: COLORS.accent,
    fontSize: 16,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 4,
  },
  subtitleWide: {
    textAlign: 'left',
  },
  valueProp: {
    color: COLORS.cream,
    opacity: 0.85,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  valuePropWide: {
    textAlign: 'left',
  },
});
