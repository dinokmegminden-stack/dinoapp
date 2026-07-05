import React from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';

export default function Shell({ children, wide = false }) {
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= 700;

  return (
    <View style={s.outer}>
      <View style={[s.inner, (wide || isWideWeb) && s.innerWide]}>
        {children}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1, width: '100%', backgroundColor: '#283618', alignItems: 'center', justifyContent: 'center' },
  inner: { flex: 1, width: '100%', maxWidth: 480 },
  innerWide: { maxWidth: 1200, flexDirection: 'row', gap: 28, paddingHorizontal: 28, paddingVertical: 20 },
});