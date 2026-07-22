// LandingMenu — a landing menü blokkjai a redesign spec 3. pontja szerint:
// RÉGIÓK (2×3 grid), JÁTÉKMÓDOK (2 oszlopos grid, ugyanaz az elrendezés,
// mint a régióknál: Párok, Ki vagyok én?, Képkvíz, Milliomos). A Gyűjtemény
// a fejlécben, a ranglista-ikon mellett él (lásd LandingPage.js CollectionIconButton).
// Ikonnevek MaterialCommunityIcons-ra ellenőrizve (a spec Tabler-nevei közül több
// nem létezik ebben a libben, pl. "mountain" → "image-filter-hdr", "sun" → "weather-sunny").
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PressableButton from '../components/PressableButton';
import RegionWorldMap from '../components/RegionWorldMap';
import { COLORS, RADIUS } from '../constants/theme';

// A régiógombok egységes bgMid színt kapnak (nem régiónként eltérőt) —
// a korábbi, soronként más színű változat túl zsúfoltnak hatott.
const INK = '#001219';

// A régiók (RÉGIÓK) mostantól interaktív világtérképként jelennek meg
// (RegionWorldMap), a korábbi 2×3 gombrács helyett — lásd terv.png.

// Az átlátszóság mértéke (2 jegyű hex-alfa a szín végén, lásd pl.
// CollectionTimeline.js "${color}33" mintáját) — magasabb, mint a régiógombok
// rgba(...,0.45)-je, hogy a játékmódok jobban kiüssenek a régiók mellett.
const GAME_BG_ALPHA = 'A6'; // ~65%

const GAMES = [
  { key: 'memory', label: 'PÁROK', icon: 'cards', bg: `${COLORS.parokBtn}${GAME_BG_ALPHA}`, shadow: COLORS.parokBtnShadow },
  { key: 'whoami', label: 'KI VAGYOK ÉN?', icon: 'help-circle', bg: `${COLORS.whoAmIBtn}${GAME_BG_ALPHA}`, shadow: COLORS.whoAmIBtnShadow },
  { key: 'lightning', label: '5MP KÉPKVÍZ', icon: 'flash', bg: `${COLORS.accent}${GAME_BG_ALPHA}`, shadow: COLORS.accentDark, textColor: INK },
  { key: 'millionaire', label: 'XP MILLIOMOS', icon: 'trophy', bg: `${COLORS.accentDark}${GAME_BG_ALPHA}`, shadow: COLORS.parokBtnShadow },
  { key: 'runner', label: 'DÍNÓFUTAM', icon: 'run-fast', bg: `${COLORS.runnerBtn}${GAME_BG_ALPHA}`, shadow: COLORS.runnerBtnShadow },
  { key: 'hangman', label: 'AKASZTÓFA', icon: 'bone', bg: `${COLORS.hangmanBtn}${GAME_BG_ALPHA}`, shadow: COLORS.hangmanBtnShadow },
];

function SectionLabel({ children }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export default function LandingMenu({
  onSelectRegion,
  onLightningQuiz,
  onMillionaire,
  onMemory,
  onWhoAmI,
  onRunner,
  onHangman,
  regionCounts,
}) {
  const gameHandlers = {
    memory: onMemory,
    whoami: onWhoAmI,
    lightning: onLightningQuiz,
    millionaire: onMillionaire,
    runner: onRunner,
    hangman: onHangman,
  };

  return (
    <View style={styles.menuContainer}>
      <SectionLabel>RÉGIÓK</SectionLabel>
      <RegionWorldMap onSelectRegion={onSelectRegion} regionCounts={regionCounts} />

      <SectionLabel>JÁTÉKMÓDOK</SectionLabel>
      <View style={styles.grid}>
        {GAMES.map((game) => (
          <PressableButton
            key={game.key}
            onPress={gameHandlers[game.key]}
            containerStyle={styles.gridCell}
            style={[styles.gridBtn, { backgroundColor: game.bg }]}
            shadowColor={game.shadow}
          >
            <MaterialCommunityIcons name={game.icon} size={22} color={game.textColor || COLORS.cream} />
            <Text style={[styles.gridBtnText, game.textColor && { color: game.textColor }]}>{game.label}</Text>
          </PressableButton>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    width: '100%',
  },
  sectionLabel: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 12,
    opacity: 0.9,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCell: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  gridBtn: {
    flexDirection: 'row',
    borderRadius: RADIUS.button,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  gridBtnText: {
    color: COLORS.cream,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
