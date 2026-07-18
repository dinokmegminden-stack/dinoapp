// LandingMenu — a landing menü blokkjai a redesign spec 3. pontja szerint:
// RÉGIÓK (2×3 grid, Gyűjteménnyel), JÁTÉKMÓDOK (2 oszlopos grid, ugyanaz az elrendezés,
// mint a régióknál: Párok, Ki vagyok én?, Képkvíz, Milliomos).
// Ikonnevek MaterialCommunityIcons-ra ellenőrizve (a spec Tabler-nevei közül több
// nem létezik ebben a libben, pl. "mountain" → "image-filter-hdr", "sun" → "weather-sunny").
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PressableButton from '../components/PressableButton';
import { COLORS, RADIUS } from '../constants/theme';

// A régiógombok egységes bgMid színt kapnak (nem régiónként eltérőt) —
// a korábbi, soronként más színű változat túl zsúfoltnak hatott.
const INK = '#001219';

// Dedikált régió-ikonok a MaterialCommunityIcons helyett — a korábbi
// Dél-/Észak-Amerika 'arrow-down-bold'/'arrow-up-bold' irányított nyilak
// félrevezetőek voltak, nem régió-jelentésűek. Dél- és Észak-Amerikának
// egyelőre nincs külön ikonfájlja, ezért ideiglenesen közösen az
// icon_amerika.png-t használják (jobb, mint a nyíl).
const REGION_ICONS = {
  1: require('../../assets/icons/icon_karpat.png'),
  2: require('../../assets/icons/icon_europa.png'),
  3: require('../../assets/icons/icon_afrika.png'),
  4: require('../../assets/icons/icon_azsia.png'),
  5: require('../../assets/icons/icon_amerika.png'),
  6: require('../../assets/icons/icon_amerika.png'),
};

const REGIONS = [
  { edu: 1, label: 'Kárpát-medence' },
  { edu: 2, label: 'Európa' },
  { edu: 3, label: 'Afrika' },
  { edu: 4, label: 'Ázsia' },
  { edu: 5, label: 'Dél-Amerika' },
  { edu: 6, label: 'Észak-Amerika' },
];

const GAMES = [
  { key: 'memory', label: 'PÁROK', icon: 'cards', bg: COLORS.parokBtn, shadow: COLORS.parokBtnShadow },
  { key: 'whoami', label: 'KI VAGYOK ÉN?', icon: 'help-circle', bg: COLORS.whoAmIBtn, shadow: COLORS.whoAmIBtnShadow },
  { key: 'lightning', label: '5MP KÉPKVÍZ', icon: 'flash', bg: COLORS.accent, shadow: COLORS.accentDark, textColor: INK },
  { key: 'millionaire', label: 'XP MILLIOMOS', icon: 'trophy', bg: COLORS.accentDark, shadow: COLORS.parokBtnShadow },
];

function SectionLabel({ children }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export default function LandingMenu({
  onSelectRegion,
  onOpenGallery,
  onLightningQuiz,
  onMillionaire,
  onMemory,
  onWhoAmI,
  collectionRatio = 0,
}) {
  const gameHandlers = {
    memory: onMemory,
    whoami: onWhoAmI,
    lightning: onLightningQuiz,
    millionaire: onMillionaire,
  };

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
            <Image source={REGION_ICONS[region.edu]} style={styles.regionIcon} resizeMode="contain" />
            <Text style={styles.gridBtnText}>{region.label}</Text>
          </PressableButton>
        ))}
      </View>

      <PressableButton
        onPress={onOpenGallery}
        containerStyle={styles.collectionCell}
        style={[styles.gridBtn, styles.collectionBtn, { backgroundColor: COLORS.bgMidLight }]}
        shadowColor={COLORS.bgMid}
      >
        <View style={styles.collectionRow}>
          <MaterialCommunityIcons name="image-multiple" size={22} color={COLORS.cream} />
          <Text style={styles.gridBtnText}>Gyűjtemény</Text>
        </View>
        <Text style={styles.collectionCount}>{Math.round(collectionRatio * 100)}% kész</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(collectionRatio * 100)}%` }]} />
        </View>
      </PressableButton>

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
    marginBottom: 10,
    marginTop: 20,
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
    paddingVertical: 16,
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
  regionIcon: {
    width: 22,
    height: 22,
  },
  collectionCell: {
    width: '100%',
    marginTop: 10,
  },
  collectionBtn: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
    paddingVertical: 14,
  },
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  collectionCount: {
    color: COLORS.cream,
    opacity: 0.85,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  progressTrack: {
    height: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(0,18,25,0.35)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.accent,
  },
});
