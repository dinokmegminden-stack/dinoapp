import React from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// gradientColors: opcionális színlista — ha meg van adva, a teljes oldal
// háttere ez a (függőleges) átmenet lesz az egyszínű #283618 helyett.
export default function Shell({ children, wide = false, gradientColors = null }) {
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= 700;

  const inner = (
    <View style={[s.inner, (wide || isWideWeb) && s.innerWide]}>
      {children}
    </View>
  );

  if (gradientColors) {
    return (
      <LinearGradient colors={gradientColors} style={s.outerGradient}>
        {inner}
      </LinearGradient>
    );
  }

  return <View style={s.outer}>{inner}</View>;
}

const s = StyleSheet.create({
  outer: { flex: 1, width: '100%', backgroundColor: '#283618', alignItems: 'center', justifyContent: 'center' },
  outerGradient: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  inner: { flex: 1, width: '100%', maxWidth: 480 },
  innerWide: { maxWidth: 750, flexDirection: 'column', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 20 },
});
