// PrimaryCTA — a landing elsődleges akciógombja. A meglévő PressableButton
// "nyomott gomb" mintájára épül, köré egy lassan pulzáló glow réteggel.
// A glow useNativeDriver-t használ natíven; weben a driver kikapcsol
// (PressableButton mintája), redukált mozgásnál pedig egyáltalán nem indul.
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PressableButton from './PressableButton';
import { COLORS, RADIUS } from '../constants/theme';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export default function PrimaryCTA({ onPress, label = 'Kezdd a felfedezést!' }) {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop;
    let cancelled = false;

    const start = () => {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glow, {
            toValue: 1,
            duration: 1100,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(glow, {
            toValue: 0,
            duration: 1100,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ])
      );
      loop.start();
    };

    // Redukált mozgás esetén ne pulzáljon (akadálymentesség).
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!cancelled && !reduced) start();
    });

    return () => {
      cancelled = true;
      loop && loop.stop();
    };
  }, [glow]);

  const glowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.9],
  });
  const glowScale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  return (
    <Animated.View style={styles.wrap}>
      {/* Pulzáló glow réteg a gomb mögött */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          { opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
      />
      <PressableButton
        onPress={onPress}
        containerStyle={styles.container}
        style={styles.btn}
        shadowColor={COLORS.heroYellowDark}
      >
        <MaterialCommunityIcons name="play" size={26} color={COLORS.bgDark} />
        <Text style={styles.label}>{label}</Text>
      </PressableButton>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginTop: 6,
    marginBottom: 4,
    alignItems: 'stretch',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.button + 6,
    backgroundColor: COLORS.heroYellow,
    ...Platform.select({
      web: {
        filter: 'blur(18px)',
      },
      default: {
        shadowColor: COLORS.heroYellow,
        shadowOpacity: 0.9,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 0 },
      },
    }),
  },
  container: {
    width: '100%',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.heroYellow,
    borderRadius: RADIUS.button,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  label: {
    color: COLORS.bgDark,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
