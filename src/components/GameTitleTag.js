// src/components/GameTitleTag.js
// Kiírja, melyik játékmódot játssza éppen a felhasználó. Asztali böngészőben
// (wide web) a bal oldalra igazítva jelenik meg, saját sorában a játék tartalma
// fölött; mobilon (vagy szűk web-nézetben) középre igazítva a játék fölé kerül.
// Normál flow-ban renderel (nem absolute), hogy sose fedje a képernyő többi elemét.
import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { FONTS } from '../constants/fonts';

export default function GameTitleTag({ title }) {
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= 700;

  return (
    <View style={isWideWeb ? styles.wideWrap : styles.mobileWrap}>
      <Text style={isWideWeb ? styles.wideText : styles.mobileText}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wideWrap: {
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  wideText: {
    color: '#DDA15E',
    fontFamily: FONTS.headingXBold || FONTS.bold,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  mobileWrap: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  mobileText: {
    color: '#DDA15E',
    fontFamily: FONTS.headingXBold || FONTS.bold,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
  },
});
