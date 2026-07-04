import React from 'react';
import { View, Platform, useWindowDimensions } from 'react-native';
import { s } from './RegionLevel.styles';

export default function LevelShell({ children }) {
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= 700;
  return (
    <View style={s.outer}>
      <View style={[s.inner, isWideWeb && s.innerWide]}>{children}</View>
    </View>
  );
}