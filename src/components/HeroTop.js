// src/components/HeroTop.js — redesign: nincs külön ikon/érme a cím fölött,
// dínó emoji keretezi a "DÍNÓ TUDÓS" feliratot magában a címsorban, halvány
// csontmintával a háttérben. Az érme eltávolítása szándékosan csökkenti a
// blokk teljes magasságát, mert az emoji nem foglal külön sort.
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const PATTERN_ROWS = [
  { offset: 0, rotations: [-12, 8, -6, 14, -10, 6, -14] },
  { offset: 26, rotations: [10, -8, 12, -6, 8, -12, 10] },
  { offset: 0, rotations: [-8, 14, -10, 6, -14, 10, -6] },
];

function BonePattern() {
  return (
    <View style={styles.pattern} pointerEvents="none">
      {PATTERN_ROWS.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.patternRow, { marginLeft: row.offset }]}>
          {row.rotations.map((deg, i) => (
            <MaterialCommunityIcons
              key={i}
              name="bone"
              size={22}
              color={COLORS.cream}
              style={[styles.patternIcon, { transform: [{ rotate: `${deg}deg` }] }]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function HeroTop() {
  const { width } = useWindowDimensions();

  const [luckiestLoaded] = useLuckiest({ LuckiestGuy_400Regular });
  const [fredokaLoaded] = useFredoka({ Fredoka_400Regular });

  const fontsLoaded = luckiestLoaded && fredokaLoaded;
  const titleSize = width < 768 ? 38 : 50;
  const emojiSize = width < 768 ? 26 : 34;

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <BonePattern />

        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <Text style={[styles.titleEmoji, { fontSize: emojiSize }]}>🦖</Text>
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
            <Text style={[styles.titleEmoji, { fontSize: emojiSize }]}>🦕</Text>
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
  pattern: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-evenly',
    opacity: 0.1,
  },
  patternRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  patternIcon: {
    opacity: 0.9,
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
  titleEmoji: {
    textAlign: 'center',
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
