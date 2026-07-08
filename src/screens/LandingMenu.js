// LandingMenu — a landing menü blokkjai a redesign spec 3. pontja szerint:
// RÉGIÓK (2×3 grid, Gyűjteménnyel), JÁTÉKMÓDOK (Párok), fő CTA-k (Képkvíz, Milliomos).
// Ikonnevek MaterialCommunityIcons-ra ellenőrizve (a spec Tabler-nevei közül több
// nem létezik ebben a libben, pl. "mountain" → "image-filter-hdr", "sun" → "weather-sunny").
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PressableButton from '../components/PressableButton';
import { COLORS, RADIUS } from '../constants/theme';

const REGIONS = [
  { edu: 1, label: 'Kárpát-medence', icon: 'image-filter-hdr' },
  { edu: 2, label: 'Európa', icon: 'castle' },
  { edu: 3, label: 'Afrika', icon: 'weather-sunny' },
  { edu: 4, label: 'Ázsia', icon: 'yin-yang' },
  { edu: 5, label: 'Amerika', icon: 'paw' },
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
            <MaterialCommunityIcons name={region.icon} size={22} color={COLORS.cream} />
            <Text style={styles.gridBtnText}>{region.label}</Text>
          </PressableButton>
        ))}
        <PressableButton
          onPress={onOpenGallery}
          containerStyle={styles.gridCell}
          style={[styles.gridBtn, { backgroundColor: COLORS.bgMidLight }]}
          shadowColor={COLORS.bgMid}
        >
          <MaterialCommunityIcons name="image" size={22} color={COLORS.cream} />
          <Text style={styles.gridBtnText}>Gyűjtemény</Text>
        </PressableButton>
      </View>

      <SectionLabel>JÁTÉKMÓDOK</SectionLabel>
      <PressableButton
        onPress={onMemory}
        style={[styles.fullBtn, { backgroundColor: COLORS.parokBtn }]}
        shadowColor={COLORS.parokBtnShadow}
      >
        <MaterialCommunityIcons name="cards" size={22} color={COLORS.cream} />
        <Text style={styles.fullBtnText}>PÁROK</Text>
      </PressableButton>

      <View style={styles.ctaBlock}>
        <PressableButton
          onPress={onLightningQuiz}
          style={[styles.fullBtn, { backgroundColor: COLORS.accent }]}
          shadowColor={COLORS.accentDark}
        >
          <MaterialCommunityIcons name="flash" size={22} color={COLORS.bgDark} />
          <Text style={[styles.fullBtnText, { color: COLORS.bgDark }]}>5MP KÉPKVÍZ</Text>
        </PressableButton>
        <PressableButton
          onPress={onMillionaire}
          style={[styles.fullBtn, { backgroundColor: COLORS.accentDark }]}
          shadowColor={COLORS.parokBtnShadow}
        >
          <MaterialCommunityIcons name="trophy" size={22} color={COLORS.cream} />
          <Text style={styles.fullBtnText}>XP MILLIOMOS</Text>
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
    fontSize: 13,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  fullBtn: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: RADIUS.button,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
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
