// src/components/HeroTop.js
import React from 'react';
import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import {
  useFonts as useLuckiest,
  LuckiestGuy_400Regular,
} from '@expo-google-fonts/luckiest-guy';
import {
  useFonts as useFredoka,
  Fredoka_400Regular,
} from '@expo-google-fonts/fredoka';

export default function HeroTop() {
  const { width } = useWindowDimensions();

  const [luckiestLoaded] = useLuckiest({ LuckiestGuy_400Regular });
  const [fredokaLoaded] = useFredoka({ Fredoka_400Regular });

  const fontsLoaded = luckiestLoaded && fredokaLoaded;
  const titleSize = width < 768 ? 42 : 58;
  const subtitleSize = width < 768 ? 13 : 15;

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
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
            {
              fontSize: subtitleSize,
              fontFamily: fontsLoaded ? 'Fredoka_400Regular' : 'System',
            },
          ]}
        >
          Gyűjtsd össze a kártyákat, oldd meg a kvízeket, és válj paleontológus szakértővé!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#1b3318',
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroCard: {
    width: '100%',
    maxWidth: 640,
    backgroundColor: 'rgba(10, 26, 10, 0.55)',
    borderWidth: 2,
    borderColor: '#dca962',
    borderRadius: 18,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
      },
    }),
  },
  mainTitle: {
    color: '#dca962',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: '#0a0a06',
    textShadowOffset: { width: 3, height: 5 },
    textShadowRadius: 1,
  },
  subtitle: {
    color: '#e2ebd5',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 500,
    opacity: 0.9,
  },
});