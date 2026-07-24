// PressableButton — a redesign "nyomott gomb" mintája: a gomb alatt 5px-es
// sötét "talp" (borderBottom), lenyomáskor a gomb 3px-et süllyed rá.
// Minden CTA-nak bg + hozzá tartozó sötétebb shadowColor párja van (theme.js).
// Weben hoverre egy finom fehér réteg világosítja a gombot — natívon
// (onHoverIn/onHoverOut ott sosem tüzel) ez a viselkedés egyszerűen nem
// aktiválódik, nincs platformágazás.
import React, { useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/theme';

// A web Animated modulja nem támogatja a native drivert, warningot dobna.
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

// containerStyle: a külső Pressable-re kerül — flex-elrendezési stílusok
// (flexBasis, width, stb.) ide valók, mert a style csak a belső nézetet formázza.
export default function PressableButton({
  onPress,
  style,
  containerStyle,
  shadowColor,
  disabled = false,
  children,
  ...pressableProps
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const pressIn = () =>
    Animated.timing(translateY, {
      toValue: 3,
      duration: 80,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();

  const pressOut = () =>
    Animated.timing(translateY, {
      toValue: 0,
      duration: 80,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();

  return (
    <Pressable
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      disabled={disabled}
      style={[
        containerStyle,
        // A böngésző alapértelmezett fókusz-gyűrűje a Pressable által renderelt
        // DOM-elemre kerülne (nem a belső Animated.View-ra, amin a saját
        // gyűrűnket állítjuk) — itt tiltjuk le, hogy ne dupláződjon.
        Platform.OS === 'web' && { outlineStyle: 'none' },
        Platform.OS === 'web' && focused && !disabled && styles.focusRing,
      ]}
      {...pressableProps}
    >
      <Animated.View
        style={[
          { transform: [{ translateY }] },
          { borderBottomWidth: 5, borderBottomColor: shadowColor },
          Platform.OS === 'web' && !disabled && { cursor: 'pointer' },
          disabled && { opacity: 0.5 },
          style,
        ]}
      >
        {children}
        {hovered && !disabled && <View style={styles.hoverOverlay} pointerEvents="none" />}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hoverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    opacity: 0.12,
  },
  // Billentyűzetes navigációhoz (Tab) látható fókusz-gyűrű webes nézetben —
  // natívon (mobil) sosem aktiválódik, ott nincs Tab-navigáció.
  focusRing: {
    outlineStyle: 'solid',
    outlineWidth: 2,
    outlineColor: COLORS.accent,
    outlineOffset: 2,
  },
});
