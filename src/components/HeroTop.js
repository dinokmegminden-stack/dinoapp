// src/components/HeroTop.js
import React from 'react';
import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import Svg, { G, Path, Ellipse } from 'react-native-svg';
import {
  useFonts as useLuckiest,
  LuckiestGuy_400Regular,
} from '@expo-google-fonts/luckiest-guy';
import {
  useFonts as useFredoka,
  Fredoka_400Regular,
} from '@expo-google-fonts/fredoka';

function TRexSkull({ size = 140 }) {
  return (
    <Svg width={size} height={size * 0.85} viewBox="0 0 140 120">
      <G>
        {/* Upper jaw */}
        <Path
          d="M 40 70 L 100 60 L 110 65 L 100 75 L 40 85 Z"
          fill="rgba(220, 180, 120, 0.8)"
          stroke="#8B7355"
          strokeWidth="1.5"
        />
        {/* Lower jaw */}
        <Path
          d="M 45 85 L 100 75 L 110 80 L 100 95 L 45 100 Z"
          fill="rgba(200, 160, 100, 0.7)"
          stroke="#8B7355"
          strokeWidth="1.5"
        />
        {/* Eye socket */}
        <Ellipse cx="85" cy="65" rx="6" ry="8" fill="rgba(0,0,0,0.4)" />
        {/* Nostril */}
        <Ellipse cx="108" cy="67" rx="3" ry="4" fill="rgba(0,0,0,0.5)" />
        {/* Teeth upper */}
        <G stroke="#8B7355" strokeWidth="1">
          {[50, 60, 70, 80, 90].map((x) => (
            <Path key={`tooth-u-${x}`} d={`M ${x} 75 L ${x + 2} 88`} />
          ))}
        </G>
        {/* Teeth lower */}
        <G stroke="#8B7355" strokeWidth="1">
          {[50, 60, 70, 80, 90].map((x) => (
            <Path key={`tooth-l-${x}`} d={`M ${x + 3} 85 L ${x + 1} 72`} />
          ))}
        </G>
        {/* Snout ridge */}
        <Path
          d="M 40 70 Q 50 65 100 60"
          stroke="#8B7355"
          strokeWidth="1"
          fill="none"
        />
      </G>
    </Svg>
  );
}

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
          <View style={styles.skullContainer}>
            <TRexSkull size={140} />
          </View>
        )}
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
  heroCardWide: {
    maxWidth: 800,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  skullContainer: {
    marginRight: 20,
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
});