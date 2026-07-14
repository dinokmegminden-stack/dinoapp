import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FONTS } from '../constants/fonts';
import { logXPMilestone } from '../services/xpMilestonesService';

const XP_STORAGE_KEY = 'dino_xp_total';
const XP_MILESTONE_1000_LOGGED_KEY = 'dino_xp_milestone_1000_logged';
const XP_MILESTONE = 1000;

// Az XP jelenleg csak eszközön (AsyncStorage) él, nincs Supabase-ben tárolva —
// az "1000 XP elérésének ideje" ranglistához viszont játékos-azonosító kell
// a mérföldkő rögzítéséhez. Mivel az addXP()-t sok képernyő hívja anélkül,
// hogy playerId-t adna át, App.js egyszer beállítja ezt (nickname betöltésekor/
// regisztrációkor), és addXP() innen olvassa ki, amikor küszöbátlépést észlel.
let activePlayerId = null;

export function setActivePlayerId(playerId) {
  activePlayerId = playerId;
}

export async function getTotalXP() {
  try {
    const stored = await AsyncStorage.getItem(XP_STORAGE_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

async function checkXPMilestone(previousTotal, newTotal) {
  if (previousTotal >= XP_MILESTONE || newTotal < XP_MILESTONE || !activePlayerId) return;

  const alreadyLogged = await AsyncStorage.getItem(XP_MILESTONE_1000_LOGGED_KEY);
  if (alreadyLogged) return;

  await AsyncStorage.setItem(XP_MILESTONE_1000_LOGGED_KEY, '1');
  await logXPMilestone(activePlayerId, XP_MILESTONE);
}

export async function addXP(amount) {
  try {
    const current = await getTotalXP();
    const newTotal = current + amount;
    await AsyncStorage.setItem(XP_STORAGE_KEY, String(newTotal));
    checkXPMilestone(current, newTotal);
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
