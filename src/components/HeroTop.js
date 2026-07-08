// src/components/HeroTop.js — redesign: egyetlen központi "érme" a cím fölött,
// halvány, ismétlődő csontmintával a háttérben (nem a korábbi két
// esetlegesen kiválasztott oldalikon). Kisebb, középre rendezett, egy méret
// minden töréspontnál — a látványt a minta+érme adja, nem a szélesség.
import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Image } from 'react-native';
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

const heroCoin = require('../../assets/icons/icon_karpat.png');

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

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <BonePattern />

        <View style={styles.coinWrapper}>
          <Image source={heroCoin} style={styles.coin} />
        </View>

        <View style={styles.titleBlock}>
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
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroCard: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    paddingVertical: 12,
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
  coinWrapper: {
    marginBottom: -18,
    zIndex: 1,
    transform: [{ rotate: '-6deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  coin: {
    width: 104,
    height: 104,
    resizeMode: 'contain',
  },
  titleBlock: {
    alignItems: 'center',
    transform: [{ rotate: '-3deg' }],
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
