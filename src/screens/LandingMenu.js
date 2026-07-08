// LandingMenu — a landing menü blokkjai a redesign spec 3. pontja szerint:
// RÉGIÓK (2×3 grid, Gyűjteménnyel), JÁTÉKMÓDOK (Párok), fő CTA-k (Képkvíz, Milliomos).
// Ikonok egyelőre emojik — a spec 5. lépése cseréli őket icon libre.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PressableButton from '../components/PressableButton';
import { COLORS, RADIUS } from '../constants/theme';

const REGIONS = [
  { edu: 1, label: '🦴 Kárpát-medence' },
  { edu: 2, label: '🦕 Európa' },
  { edu: 3, label: '🌍 Afrika' },
  { edu: 4, label: '🪶 Ázsia' },
  { edu: 5, label: '🦖 Amerika' },
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
}) {
  return (
    <View style={styles.menuContainer}>
      <SectionLabel>RÉGIÓK</SectionLabel>
      <View style={styles.grid}>
        {REGIONS.map((region) => (
          <PressableButton
            key={region.edu}
            onPress={() => onSelectRegion(region.edu)}
            containerStyle={styles.gridCell}
            style={[styles.gridBtn, { backgroundColor: COLORS.bgMid }]}
            shadowColor={COLORS.bgDark}
          >
            <Text style={styles.gridBtnText}>{region.label}</Text>
          </PressableButton>
        ))}
        <PressableButton
          onPress={onOpenGallery}
          containerStyle={styles.gridCell}
          style={[styles.gridBtn, { backgroundColor: COLORS.bgMidLight }]}
          shadowColor={COLORS.bgMid}
        >
          <Text style={styles.gridBtnText}>🗂️ Gyűjtemény</Text>
        </PressableButton>
      </View>

      <SectionLabel>JÁTÉKMÓDOK</SectionLabel>
      <PressableButton
        onPress={onMemory}
        style={[styles.fullBtn, { backgroundColor: COLORS.parokBtn }]}
        shadowColor={COLORS.parokBtnShadow}
      >
        <Text style={styles.fullBtnText}>🧩 PÁROK</Text>
      </PressableButton>

      <View style={styles.ctaBlock}>
        <PressableButton
          onPress={onLightningQuiz}
          style={[styles.fullBtn, { backgroundColor: COLORS.accent }]}
          shadowColor={COLORS.accentDark}
        >
          <Text style={[styles.fullBtnText, { color: COLORS.bgDark }]}>⚡ 5MP KÉPKVÍZ</Text>
        </PressableButton>
        <PressableButton
          onPress={onMillionaire}
          style={[styles.fullBtn, { backgroundColor: COLORS.accentDark }]}
          shadowColor={COLORS.parokBtnShadow}
        >
          <Text style={styles.fullBtnText}>💰 XP MILLIOMOS</Text>
        </PressableButton>
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
    fontSize: 12,
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
    borderRadius: RADIUS.button,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridBtnText: {
    color: COLORS.cream,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  fullBtn: {
    width: '100%',
    borderRadius: RADIUS.button,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullBtnText: {
    color: COLORS.cream,
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  ctaBlock: {
    marginTop: 20,
    gap: 12,
  },
});
