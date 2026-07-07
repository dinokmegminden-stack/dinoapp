import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FONTS } from '../constants/fonts';

const XP_STORAGE_KEY = 'dino_xp_total';

export async function getTotalXP() {
  try {
    const stored = await AsyncStorage.getItem(XP_STORAGE_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

export async function addXP(amount) {
  try {
    const current = await getTotalXP();
    const newTotal = current + amount;
    await AsyncStorage.setItem(XP_STORAGE_KEY, String(newTotal));
    return newTotal;
  } catch {
    return 0;
  }
}

export default function XPBar() {
  const [xp, setXP] = useState(0);

  useEffect(() => {
    getTotalXP().then(setXP);
    // Listener for XP changes (can be triggered from anywhere in the app)
    const interval = setInterval(() => {
      getTotalXP().then(setXP);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>⭐ XP: {xp}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(221,161,94,0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(221,161,94,0.3)',
    alignItems: 'center',
  },
  text: {
    color: '#DDA15E',
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
