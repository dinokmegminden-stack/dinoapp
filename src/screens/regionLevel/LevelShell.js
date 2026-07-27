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

// header: opcionális, teljes szélességű fejléc-sáv a korlátozott (maxWidth-es)
// tartalom fölött, azon kívül — ugyanaz a minta, mint a Shell.js header propja.
export default function LevelShell({ children, extraWide = false, header = null }) {
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= 700;

  const inner = (
    <View style={[s.inner, isWideWeb && (extraWide ? s.innerExtraWide : s.innerWide)]}>{children}</View>
  );

  const body = header != null
    ? (<View style={styles.stack}>{<View style={styles.headerBand}>{header}</View>}{inner}</View>)
    : inner;

  if (isWideWeb) {
    return (
      <View style={s.outer}>
        <AnimatedLandingBg source={landingBg} />
        <LinearGradient
          colors={['rgba(0,18,25,0.55)', 'rgba(0,18,25,0.25)', 'rgba(0,18,25,0.8)']}
          style={styles.bgOverlay}
        />
        {body}
      </View>
    );
  }

  return <View style={s.outer}>{body}</View>;
}

const styles = StyleSheet.create({
  bgOverlay: { ...StyleSheet.absoluteFillObject },
  stack: { flex: 1, width: '100%', alignItems: 'center' },
  headerBand: { width: '100%' },
});
