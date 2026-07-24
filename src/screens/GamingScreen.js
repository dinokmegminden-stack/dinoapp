// src/screens/GamingScreen.js
// A fejléc "Játékok" gombjára kattintva nyíló képernyő — mind a 6 játékmód
// egy oszlopban felsorolva (a korábbi, landing oldali 2 oszlopos rács helyett).
// A gombok színe/ikonja megegyezik azzal, amit eddig a LandingMenu GAMES tömbje
// használt — csak az elrendezés (teljes szélességű sor a rács helyett) más.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Shell from '../components/Shell';
import PressableButton from '../components/PressableButton';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';

const INK = '#001219';
const GAME_BG_ALPHA = 'A6';

const GAMES = [
  { key: 'memory', label: 'PÁROK', icon: 'cards', bg: `${COLORS.parokBtn}${GAME_BG_ALPHA}`, shadow: COLORS.parokBtnShadow },
  { key: 'whoami', label: 'KI VAGYOK ÉN?', icon: 'help-circle', bg: `${COLORS.whoAmIBtn}${GAME_BG_ALPHA}`, shadow: COLORS.whoAmIBtnShadow },
  { key: 'lightning', label: '5MP KÉPKVÍZ', icon: 'flash', bg: `${COLORS.accent}${GAME_BG_ALPHA}`, shadow: COLORS.accentDark, textColor: INK },
  { key: 'millionaire', label: 'XP MILLIOMOS', icon: 'trophy', bg: `${COLORS.accentDark}${GAME_BG_ALPHA}`, shadow: COLORS.parokBtnShadow },
  { key: 'runner', label: 'DÍNÓFUTAM', icon: 'run-fast', bg: `${COLORS.runnerBtn}${GAME_BG_ALPHA}`, shadow: COLORS.runnerBtnShadow },
  { key: 'hangman', label: 'AKASZTÓFA', icon: 'bone', bg: `${COLORS.hangmanBtn}${GAME_BG_ALPHA}`, shadow: COLORS.hangmanBtnShadow },
];

export default function GamingScreen({ onMemory, onWhoAmI, onLightningQuiz, onMillionaire, onRunner, onHangman, onBack }) {
  const gameHandlers = {
    memory: onMemory,
    whoami: onWhoAmI,
    lightning: onLightningQuiz,
    millionaire: onMillionaire,
    runner: onRunner,
    hangman: onHangman,
  };

  return (
    <Shell>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

        <View style={styles.header}>
          <Text style={styles.title}>🎮 JÁTÉKMÓDOK</Text>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {GAMES.map((game) => (
            <PressableButton
              key={game.key}
              onPress={gameHandlers[game.key]}
              containerStyle={styles.rowCell}
              style={[styles.row, { backgroundColor: game.bg }]}
              shadowColor={game.shadow}
            >
              <MaterialCommunityIcons name={game.icon} size={24} color={game.textColor || COLORS.cream} />
              <Text style={[styles.rowText, game.textColor && { color: game.textColor }]}>{game.label}</Text>
            </PressableButton>
          ))}
        </ScrollView>
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0, width: '100%' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  title: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(244,67,54,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: 'bold',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 12,
  },
  rowCell: { width: '100%' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.button,
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 14,
  },
  rowText: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
