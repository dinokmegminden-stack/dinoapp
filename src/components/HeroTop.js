// src/components/HeroTop.js
import React from 'react';
import { View, Text, StyleSheet, Platform, useWindowDimensions, Image } from 'react-native';
import {
  useFonts as useLuckiest,
  LuckiestGuy_400Regular,
} from '@expo-google-fonts/luckiest-guy';
import {
  useFonts as useFredoka,
  Fredoka_400Regular,
} from '@expo-google-fonts/fredoka';

const afrikaIcon = require('../../assets/icons/icon_afrika.png');
const amerikaIcon = require('../../assets/icons/icon_amerika.png');

export default function HeroTop() {
  const { width } = useWindowDimensions();

  const [luckiestLoaded] = useLuckiest({ LuckiestGuy_400Regular });
  const [fredokaLoaded] = useFredoka({ Fredoka_400Regular });

  const fontsLoaded = luckiestLoaded && fredokaLoaded;
  const titleSize = width < 768 ? 42 : 58;
  const isDesktop = width >= 768;

  return (
    <View style={styles.container}>
      <View style={[styles.heroCard, isDesktop && styles.heroCardWide]}>
        {isDesktop && (
          <View style={styles.iconContainer}>
            <Image source={afrikaIcon} style={styles.heroIcon} />
          </View>
        )}
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
        {isDesktop && (
          <View style={styles.iconContainerRight}>
            <Image source={amerikaIcon} style={styles.heroIcon} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroCard: {
    width: '100%',
    maxWidth: 640,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  heroCardWide: {
    maxWidth: 800,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginRight: 20,
  },
  iconContainerRight: {
    marginLeft: 20,
  },
  heroIcon: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  titleBlock: {
    alignItems: 'center',
  },
  mainTitle: {
    color: '#dca962',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 0,
    textShadowColor: '#0a0a06',
    textShadowOffset: { width: 3, height: 5 },
    textShadowRadius: 1,
  },
  subtitle: {
    color: '#FEFAE0',
    fontSize: 18,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 6,
  },
});