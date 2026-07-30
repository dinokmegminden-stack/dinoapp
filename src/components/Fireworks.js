// src/components/Fireworks.js
// Könnyűsúlyú, függőség nélküli "tűzijáték" — Animated.Value-alapú
// részecske-kitörés + üzenetsáv, ami leaderboard.js-ben leírt két esetnél jelenik
// meg: saját legjobb idő megjavítása, vagy Top 10-be kerülés. Automatikusan
// eltűnik ~1.9s után (lásd onDone hívás). Emellett a winner.png kabalafigura
// felülről beesik/pattan a képernyőre ugyanennél a két esetnél.
import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, Image, Animated, StyleSheet, Easing } from 'react-native';

const PARTICLE_COUNT = 28;
const PARTICLE_COLORS = ['#ee9b00', '#ca6702', '#ae2012', '#0a9396', '#94a187', '#0077b6', '#FEFAE0', '#9c8fb0'];
const VISIBLE_DURATION_MS = 1900;
const WINNER_IMG = require('../../assets/images/winner.png');
const WINNER_SIZE = 180;

function Particle({ angle, distance, color }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 850 + Math.random() * 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * distance] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * distance] });
  const opacity = progress.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1, 0] });
  const scale = progress.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.3, 1, 0.4] });

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: color, opacity, transform: [{ translateX }, { translateY }, { scale }] },
      ]}
    />
  );
}

export default function Fireworks({ visible, message, onDone }) {
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const winnerDrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    bannerAnim.setValue(0);
    winnerDrop.setValue(0);
    Animated.spring(bannerAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    Animated.spring(winnerDrop, {
      toValue: 1,
      friction: 4.5,
      tension: 45,
      useNativeDriver: true,
    }).start();
    const timeout = setTimeout(() => onDone?.(), VISIBLE_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [visible]);

  // Új részecske-készlet minden alkalommal, amikor a komponens láthatóvá válik
  // (false -> true váltás), hogy egymás után több ünneplésnél is más mintázat jöjjön ki.
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      key: i,
      angle: (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4,
      distance: 90 + Math.random() * 90,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    }));
  }, [visible]);

  if (!visible) return null;

  const winnerTranslateY = winnerDrop.interpolate({
    inputRange: [0, 1],
    outputRange: [-500, 0],
  });
  const winnerRotate = winnerDrop.interpolate({
    inputRange: [0, 0.6, 0.8, 1],
    outputRange: ['-8deg', '6deg', '-3deg', '0deg'],
  });

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.Image
        source={WINNER_IMG}
        resizeMode="contain"
        style={[
          styles.winnerImage,
          { transform: [{ translateY: winnerTranslateY }, { rotate: winnerRotate }] },
        ]}
      />
      <View style={styles.burstCenter}>
        {particles.map((p) => (
          <Particle key={p.key} angle={p.angle} distance={p.distance} color={p.color} />
        ))}
      </View>
      {!!message && (
        <Animated.View
          style={[
            styles.banner,
            {
              opacity: bannerAnim,
              transform: [{ scale: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
            },
          ]}
        >
          <Text style={styles.bannerText}>{message}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  winnerImage: {
    position: 'absolute',
    top: 24,
    left: '50%',
    marginLeft: -WINNER_SIZE / 2,
    width: WINNER_SIZE,
    height: WINNER_SIZE,
  },
  burstCenter: {
    position: 'absolute',
    top: '32%',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  banner: {
    marginTop: 150,
    backgroundColor: 'rgba(0,18,25,0.88)',
    borderWidth: 2,
    borderColor: '#ee9b00',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  bannerText: {
    color: '#FEFAE0',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
});
