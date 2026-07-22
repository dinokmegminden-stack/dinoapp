// AsteroidImpactPanel — a hatlépéses aszteroida-becsapódás képsor (assets/6.png,
// egyetlen 1408x768-as, 6 egyenlő panelre osztott "sprite-csík": Approach →
// Atmosphere Entry → Impact → Explosion → Aftermath → Crater) egy-egy kockáját
// mutatja a `step` (=hibák száma, 0–5) szerint. Minden rossz betűnél a
// játékos egyet közelebb kerül a kihaláshoz — a 6. hibánál (Crater) vége.
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

const stripImage = require('../../assets/6.png');

const PANEL_COUNT = 6;
const STRIP_W = 1408;
const STRIP_H = 768;
const PANEL_ASPECT = (STRIP_W / PANEL_COUNT) / STRIP_H;

export default function AsteroidImpactPanel({ step = 0 }) {
  const clamped = Math.max(0, Math.min(PANEL_COUNT - 1, step));

  return (
    <View style={styles.wrap}>
      <Image
        source={stripImage}
        resizeMode="stretch"
        style={[styles.strip, { left: `-${clamped * 100}%` }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: PANEL_ASPECT,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: `${COLORS.bgDark}A6`,
    borderWidth: 1,
    borderColor: 'rgba(221,161,94,0.25)',
    borderRadius: 16,
  },
  strip: {
    position: 'absolute',
    top: 0,
    width: `${PANEL_COUNT * 100}%`,
    height: '100%',
  },
});
