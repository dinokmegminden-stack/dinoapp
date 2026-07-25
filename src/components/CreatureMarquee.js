// CreatureMarquee — a LandingPage alján futó, egy csíkban jobbról balra
// görgő szövegsáv: a lények common_name (name_hu) értékei véletlen sorrendben.
// Végtelenített: a sorozatot kétszer egymás mellé rendereljük, és a teljes
// blokkot egy sorozat-szélességnyit toljuk el, majd a loop újraindul —
// így nincs látható ugrás. A sebesség szélesség-arányos (egyenletes tempó).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Pressable, Easing } from 'react-native';
import { COLORS, FONTS, TEXT_OPACITY } from '../constants/theme';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';
const IS_WEB = Platform.OS === 'web';
const SPEED_PX_PER_SEC = 45; // görgetési tempó

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Egyetlen lény-elem a sávban. Weben a névre húzva (hover) a taxonómiai
// család (csalad) egy tooltipben jelenik meg fölötte — abszolút pozícióban,
// hogy ne módosítsa a mért sorozat-szélességet (különben ugrana a görgetés).
function MarqueeItem({ name, csalad }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      style={styles.item}
      onHoverIn={IS_WEB ? () => setHovered(true) : undefined}
      onHoverOut={IS_WEB ? () => setHovered(false) : undefined}
    >
      <Text style={styles.dot}>◆</Text>
      <Text style={[styles.name, hovered && styles.nameHover]} numberOfLines={1}>{name}</Text>
      {IS_WEB && hovered && !!csalad && (
        <View style={styles.tooltip} pointerEvents="none">
          <Text style={styles.tooltipText} numberOfLines={1}>{csalad}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function CreatureMarquee({ allDinos }) {
  const items = useMemo(() => {
    const list = (allDinos || [])
      .filter((d) => d.name_hu || d.common_name)
      // csalad_hu a magyar családnév (creatures tábla oszlopa); ha üres, a nyers
      // latin csalad-ra esünk vissza.
      .map((d) => ({ name: d.name_hu || d.common_name, csalad: d.csalad_hu || d.csalad || '' }));
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

  if (!items.length) return null;

  // Egy sorozat — ennek a szélességét mérjük (onLayout), a második ugyanez,
  // hogy a görgetés folytonos legyen.
  const Sequence = ({ onLayout }) => (
    <View style={styles.seq} onLayout={onLayout}>
      {items.map((it, i) => (
        <MarqueeItem key={i} name={it.name} csalad={it.csalad} />
      ))}
    </View>
  );

  return (
    <View style={styles.strip} pointerEvents={IS_WEB ? 'auto' : 'none'}>
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
    // Weben felül fenntartott sáv a hover-tooltipnek — a strip overflow:hidden
    // különben levágná a sor fölé kilógó buborékot.
    ...Platform.select({ web: { paddingTop: 42 } }),
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
    position: 'relative',
    ...Platform.select({ web: { cursor: 'default' } }),
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
    fontFamily: FONTS.body,
    opacity: TEXT_OPACITY.meta,
    ...Platform.select({ web: { transitionProperty: 'color, opacity', transitionDuration: '120ms' } }),
  },
  nameHover: {
    color: COLORS.accent,
    opacity: TEXT_OPACITY.primary,
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    marginBottom: 8,
    backgroundColor: COLORS.cream,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
    zIndex: 30,
    ...Platform.select({ web: { transform: 'translateX(-50%)', whiteSpace: 'nowrap' } }),
  },
  tooltipText: {
    color: COLORS.bgDark,
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
    fontStyle: 'italic',
  },
});
