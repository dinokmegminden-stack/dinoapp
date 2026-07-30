// AsteroidImpactPanel — a hatlépéses aszteroida-becsapódás képsor
// (assets/6.png, egyetlen 1408x768-as, 6 egyenlő panelre osztott "sprite-csík":
// Közelítés → Légkörbe lépés → Becsapódás → Robbanás → Utóhatás → Kráter)
// EGYBEN, teljes egészében látszik — a `step` (=hibák száma, 0–5) helyét egy
// balról jobbra csúszó keret jelöli, nem panelváltás. Minden rossz betűnél a
// játékos egyet közelebb kerül a kihaláshoz — a 6. hibánál (Kráter) vége.
import React from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../constants/theme';

const stripImage = require('../../assets/6.png');

const PANEL_COUNT = 6;
const STRIP_W = 1408;
const STRIP_H = 768;
const STRIP_ASPECT = STRIP_W / STRIP_H;
const PANEL_WIDTH_PCT = 100 / PANEL_COUNT;

export default function AsteroidImpactPanel({ step = 0 }) {
  const clamped = Math.max(0, Math.min(PANEL_COUNT - 1, step));

  return (
    <View style={styles.wrap}>
      <Image source={stripImage} resizeMode="stretch" style={styles.strip} />
      <View style={[styles.frame, { left: `${clamped * PANEL_WIDTH_PCT}%`, width: `${PANEL_WIDTH_PCT}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: STRIP_ASPECT,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: `${COLORS.bgDark}A6`,
    borderWidth: 1,
    borderColor: 'rgba(221,161,94,0.25)',
    borderRadius: 16,
  },
  strip: {
    width: '100%',
    height: '100%',
  },
  frame: {
    position: 'absolute',
    top: 0,
    height: '100%',
    borderWidth: 3,
    borderColor: COLORS.gold,
    borderRadius: 4,
    ...Platform.select({
      web: {
        transitionProperty: 'left',
        transitionDuration: '400ms',
        transitionTimingFunction: 'ease-out',
      },
    }),
  },
});
