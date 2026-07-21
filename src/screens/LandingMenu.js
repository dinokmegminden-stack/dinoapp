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
import { COLORS, RADIUS } from '../constants/theme';

// A régiógombok egységes bgMid színt kapnak (nem régiónként eltérőt) —
// a korábbi, soronként más színű változat túl zsúfoltnak hatott.
const INK = '#001219';

// A dedikált PNG régió-ikonok (icon_karpat.png stb.) sötét/átlátszó rajzok,
// a sötét teal gombháttéren gyakorlatilag láthatatlanok voltak — cream színű
// MaterialCommunityIcons-ra váltva, ami garantáltan kontrasztos. Minden
// névnek megvan a megfelelője a bundle-ben (ellenőrizve a glyphmap ellen);
// Észak-Amerikának nincs "bison", a "terrain" a legközelebbi régió-semleges.
const REGIONS = [
  { edu: 1, label: 'Kárpát-medence', icon: 'image-filter-hdr' },
  { edu: 2, label: 'Európa', icon: 'castle' },
  { edu: 3, label: 'Afrika', icon: 'elephant' },
  { edu: 4, label: 'Ázsia', icon: 'noodles' },
  { edu: 5, label: 'Dél-Amerika', icon: 'pine-tree' },
  { edu: 6, label: 'Észak-Amerika', icon: 'cactus' },
];

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
  regionCounts,
}) {
  const gameHandlers = {
    memory: onMemory,
    whoami: onWhoAmI,
    lightning: onLightningQuiz,
    millionaire: onMillionaire,
    runner: onRunner,
  };

  // Amíg az allDinos (App.js) még nem töltött be, regionCounts üres objektum —
  // ilyenkor "…"-t írunk 0 helyett, hogy ne tűnjön úgy, mintha egy régióban
  // nem lenne dínó.
  const countsLoading = !regionCounts || Object.keys(regionCounts).length === 0;

  return (
    <View style={styles.menuContainer}>
      <SectionLabel>RÉGIÓK</SectionLabel>
      <View style={styles.grid}>
        {REGIONS.map((region) => (
          <PressableButton
            key={region.edu}
            onPress={() => onSelectRegion(region.edu)}
            containerStyle={styles.gridCell}
            style={[styles.gridBtn, { backgroundColor: 'rgba(0,95,115,0.45)' }]}
            shadowColor={COLORS.bgDark}
          >
            <MaterialCommunityIcons name={region.icon} size={22} color={COLORS.cream} />
            <View style={styles.gridBtnTextCol}>
              <Text style={styles.gridBtnText}>{region.label}</Text>
              <Text style={styles.gridBtnSubtext}>
                {countsLoading ? '…' : `${regionCounts[region.edu] || 0} faj`}
              </Text>
            </View>
          </PressableButton>
        ))}
      </View>

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
  gridBtnTextCol: {
    alignItems: 'center',
  },
  gridBtnSubtext: {
    color: COLORS.cream,
    opacity: 0.7,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
});
