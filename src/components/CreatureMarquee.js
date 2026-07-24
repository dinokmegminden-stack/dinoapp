// CreatureMarquee — a LandingPage alján futó, egy csíkban jobbról balra
// görgő szövegsáv: a lények common_name (name_hu) értékei véletlen sorrendben.
// Végtelenített: a sorozatot kétszer egymás mellé rendereljük, és a teljes
// blokkot egy sorozat-szélességnyit toljuk el, majd a loop újraindul —
// így nincs látható ugrás. A sebesség szélesség-arányos (egyenletes tempó).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Easing } from 'react-native';
import { COLORS } from '../constants/theme';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';
const SPEED_PX_PER_SEC = 45; // görgetési tempó

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function CreatureMarquee({ allDinos }) {
  const names = useMemo(() => {
    const list = (allDinos || [])
      .map((d) => d.name_hu || d.common_name)
      .filter(Boolean);
    return shuffle(list);
  }, [allDinos]);

  const x = useRef(new Animated.Value(0)).current;
  const [seqWidth, setSeqWidth] = useState(0);

  useEffect(() => {
    if (!seqWidth) return undefined;
    const duration = (seqWidth / SPEED_PX_PER_SEC) * 1000;
    x.setValue(0);
    const loop = Animated.loop(
      Animated.timing(x, {
        toValue: -seqWidth,
        duration,
        easing: Easing.linear,
        useNativeDriver: USE_NATIVE_DRIVER,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [seqWidth, x]);

  if (!names.length) return null;

  // Egy sorozat — ennek a szélességét mérjük (onLayout), a második ugyanez,
  // hogy a görgetés folytonos legyen.
  const Sequence = ({ onLayout }) => (
    <View style={styles.seq} onLayout={onLayout}>
      {names.map((name, i) => (
        <View key={i} style={styles.item}>
          <Text style={styles.dot}>◆</Text>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.strip} pointerEvents="none">
      <Animated.View style={[styles.track, { transform: [{ translateX: x }] }]}>
        <Sequence onLayout={(e) => setSeqWidth(e.nativeEvent.layout.width)} />
        <Sequence />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    width: '100%',
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(254,250,224,0.12)',
    paddingVertical: 10,
    marginTop: 24,
  },
  track: {
    flexDirection: 'row',
  },
  seq: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  dot: {
    color: COLORS.accent,
    fontSize: 8,
    marginHorizontal: 10,
    opacity: 0.8,
  },
  name: {
    color: COLORS.cream,
    fontSize: 13,
    letterSpacing: 0.5,
    opacity: 0.7,
  },
});
