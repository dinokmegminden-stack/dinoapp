// DailyDinoCard — megfordítható "Napi Dínó" kártya a landing HeroTop és a
// PrimaryCTA alatt. Elöl kép + magyar/latin név, hátul egy meglepő tény a
// leírásból. A lény kiválasztása determinisztikus (dailyDino.js).
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, StyleSheet, Pressable, Animated, Platform,
} from 'react-native';
import {
  useFonts as useCinzel, Cinzel_700Bold,
} from '@expo-google-fonts/cinzel';
import { COLORS, RADIUS, FONTS } from '../constants/theme';
import { pickDailyDino } from '../utils/dailyDino';
import { IMAGE_MAP, MISSING_IMAGE } from '../constants/imageMap';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

function firstSentence(text) {
  if (!text) return '';
  const m = String(text).match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : text).trim();
}

export default function DailyDinoCard({ allDinos, onPress, isWide = false }) {
  const [flipped, setFlipped] = useState(false);
  const rot = useRef(new Animated.Value(0)).current;

  const [cinzelLoaded] = useCinzel({ Cinzel_700Bold });
  const titleFont = FONTS.heading;   // magyar név címként — Rokkitt
  const bodyFont = FONTS.body;       // Inter
  const boldFont = FONTS.bodyBold;   // Inter Bold
  // Tudományos (latin) név — kizárólag Cinzel (lásd CLAUDE.md betűtípus-szabály).
  const latinFont = cinzelLoaded ? 'Cinzel_700Bold' : 'serif';

  const dino = pickDailyDino(allDinos);

  const flip = () => {
    const to = flipped ? 0 : 1;
    setFlipped(!flipped);
    Animated.timing(rot, { toValue: to, duration: 450, useNativeDriver: USE_NATIVE_DRIVER }).start();
  };

  const frontRotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  if (!dino) {
    return (
      <View style={[styles.wrapBase, isWide && styles.wrapWide]}>
        <View style={styles.loading}>
          <Text style={[styles.loadingText, { fontFamily: bodyFont }]}>Napi dínó betöltése…</Text>
        </View>
      </View>
    );
  }

  const imgSource = IMAGE_MAP[dino.name_hu] || MISSING_IMAGE;
  const latinFull = dino.latin_name_ending &&
    !String(dino.name_latin || '').toLowerCase().endsWith(String(dino.latin_name_ending).toLowerCase())
      ? [dino.name_latin, dino.latin_name_ending].filter(Boolean).join(' ')
      : dino.name_latin;
  const fact = firstSentence(dino.description_hu) || 'Kattints a felfedezéshez!';

  return (
    <View style={[styles.wrapBase, isWide && styles.wrapWide]}>
      <Text style={[styles.eyebrow, { fontFamily: boldFont }]}>🦕 NAPI DÍNÓ</Text>
      <Pressable onPress={flip} style={styles.stageBase}>
        {/* ELŐLAP */}
        <Animated.View style={[styles.card, styles.front, { transform: [{ perspective: 1000 }, { rotateY: frontRotate }] }]}>
          <View style={styles.imgWrap}>
            <Image source={imgSource} style={styles.img} resizeMode="cover" />
          </View>
          <View style={styles.nameBand}>
            <Text style={[styles.name, { fontFamily: titleFont }]} numberOfLines={1}>{dino.name_hu}</Text>
            {!!latinFull && <Text style={[styles.latin, { fontFamily: latinFont }]} numberOfLines={1}>{latinFull}</Text>}
          </View>
          <Text style={[styles.tapHint, { fontFamily: bodyFont }]}>Koppints a tényért ↻</Text>
        </Animated.View>

        {/* HÁTLAP */}
        <Animated.View style={[styles.card, styles.back, { transform: [{ perspective: 1000 }, { rotateY: backRotate }] }]}>
          <Text style={[styles.factLabel, { fontFamily: boldFont }]}>TUDTAD?</Text>
          <Text style={[styles.fact, { fontFamily: bodyFont }]}>{fact}</Text>
          {onPress && (
            <Pressable onPress={() => onPress(dino)} style={styles.moreBtn}>
              <Text style={[styles.moreBtnText, { fontFamily: boldFont }]}>Tudj meg többet →</Text>
            </Pressable>
          )}
          <Text style={[styles.tapHint, { fontFamily: bodyFont }]}>Koppints vissza ↻</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapBase: { width: '100%', marginTop: 2, marginBottom: 4 },
  wrapWide: { flex: 1 },
  eyebrow: { color: COLORS.accent, fontSize: 12, letterSpacing: 2, marginBottom: 4, opacity: 0.9 },
  // A Napi Dínó kártya mindig 16:9 arányú — szélesség szerint méreteződik,
  // mobilon és desktopon egyaránt (nem nyúlik le a jobb oszlop aljáig).
  stageBase: { width: '100%', aspectRatio: 16 / 9 },
  card: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.cardLarge,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.accentDark,
  },
  front: { backgroundColor: COLORS.darkGreen },
  back: {
    backgroundColor: COLORS.bgMid,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  imgWrap: { flex: 1, backgroundColor: COLORS.darkGreen },
  img: { width: '100%', height: '100%' },
  nameBand: { backgroundColor: COLORS.action, paddingVertical: 6, paddingHorizontal: 12 },
  name: { color: COLORS.cream, fontSize: 20, letterSpacing: 1 },
  latin: { color: COLORS.darkGreen, fontStyle: 'italic', fontSize: 12, marginTop: 2 },
  tapHint: { position: 'absolute', bottom: 6, right: 10, color: COLORS.cream, opacity: 0.6, fontSize: 11 },
  factLabel: { color: COLORS.accent, fontSize: 13, letterSpacing: 2, marginBottom: 6 },
  fact: { color: COLORS.cream, fontSize: 14, lineHeight: 18, textAlign: 'center' },
  moreBtn: { marginTop: 8, backgroundColor: COLORS.accent, borderRadius: RADIUS.pill, paddingVertical: 6, paddingHorizontal: 16 },
  moreBtnText: { color: COLORS.bgDark, fontSize: 13 },
  loading: { width: '100%', aspectRatio: 16 / 9, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.darkGreen, borderRadius: RADIUS.cardLarge },
  loadingText: { color: COLORS.cream, opacity: 0.7 },
});
