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

export default function HeroTop() {
  const { width } = useWindowDimensions();

  const [luckiestLoaded] = useLuckiest({ LuckiestGuy_400Regular });
  const [fredokaLoaded] = useFredoka({ Fredoka_400Regular });

  const fontsLoaded = luckiestLoaded && fredokaLoaded;
  const titleSize = width < 768 ? 38 : 50;

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.mainTitle,
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
              { fontFamily: fontsLoaded ? 'Fredoka_400Regular' : 'System' },
            ]}
          >
            Gyűjts, tanulj, játssz!
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 4,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroCard: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    paddingVertical: 8,
  },
  titleBlock: {
    alignItems: 'center',
    transform: [{ rotate: '-3deg' }],
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
  subtitle: {
    color: COLORS.accent,
    fontSize: 18,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 6,
  },
});
