import React from 'react';
import { View, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedLandingBg from '../../components/AnimatedLandingBg';
import { s } from './RegionLevel.styles';

// Ugyanaz a háttérkép, amit a Shell.js is alapértelmezettként ad a többi
// képernyőnek — korábban a region-szintű képernyők (csomaglista, böngésző,
// kvíz) saját LevelShell-t használtak Shell helyett, ezért nem kapták meg ezt
// a hátteret. Csak asztali weben jelenik meg (lásd Shell.js azonos logikáját).
const landingBg = require('../../../assets/images/new_bg.jpg');

export default function LevelShell({ children, extraWide = false }) {
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= 700;

  const inner = (
    <View style={[s.inner, isWideWeb && (extraWide ? s.innerExtraWide : s.innerWide)]}>{children}</View>
  );

  if (isWideWeb) {
    return (
      <View style={s.outer}>
        <AnimatedLandingBg source={landingBg} />
        <LinearGradient
          colors={['rgba(0,18,25,0.55)', 'rgba(0,18,25,0.25)', 'rgba(0,18,25,0.8)']}
          style={styles.bgOverlay}
        />
        {inner}
      </View>
    );
  }

  return <View style={s.outer}>{inner}</View>;
}

const styles = StyleSheet.create({
  bgOverlay: { ...StyleSheet.absoluteFillObject },
});
