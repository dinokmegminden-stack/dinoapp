// DinoCardModal — teljes képernyős részletnézet az Albumod kártyáihoz.
// Natív Modal slide animációval (nincs szükség kézi Animated.timing-re, a
// beépített animationType="slide" ugyanezt adja RN-en és weben is).
import React from 'react';
import { Modal, View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { IMAGE_MAP, MISSING_IMAGE } from '../constants/imageMap';
import { getRarityColor, normalizeRarity } from '../utils/rarity';
import { EDU_LABELS } from '../utils/regionProgress';

function formatMeasure(min, max, unit) {
  if (min == null && max == null) return '—';
  if (min != null && max != null && min !== max) {
    return `${Math.min(min, max)}–${Math.max(min, max)}${unit}`;
  }
  return `${max ?? min}${unit}`;
}

function formatAge(min, max) {
  if (min == null && max == null) return '—';
  if (min != null && max != null && min !== max) {
    return `${Math.max(min, max)}–${Math.min(min, max)} millió éve`;
  }
  return `${max ?? min} millió éve`;
}

export default function DinoCardModal({ visible, creature, onClose }) {
  if (!creature) return null;

  const imageSource = IMAGE_MAP[creature.name_hu] || MISSING_IMAGE;
  const rarityColor = getRarityColor(creature.rarity);
  const rarityLabel = normalizeRarity(creature.rarity) || 'Lelet';

  const stats = [
    { label: 'HOSSZ', value: formatMeasure(creature.length_m_min, creature.length_m_max, 'm') },
    { label: 'TÖMEG', value: formatMeasure(creature.weight_kg_min, creature.weight_kg_max, ' kg') },
    { label: 'ÉTREND', value: creature.diet_hu || '—' },
    { label: 'CSALÁD', value: creature.csalad_hu || '—' },
    { label: 'KORSZAK', value: formatAge(creature.mya_min, creature.mya_max) },
    { label: 'RÉGIÓ', value: EDU_LABELS[creature.edu] || '—' },
    { label: 'FELFEDEZÉS ORSZÁGA', value: creature.discovered_country || '—' },
    { label: 'FELFEDEZŐ', value: creature.discoverer_name || '—' },
    { label: 'FELFEDEZÉS ÉVE', value: creature.discovery_year != null ? String(creature.discovery_year) : '—' },
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View
        style={styles.sheet}
        accessibilityRole="none"
        accessibilityLabel={`${creature.name_hu} részletei`}
      >
        <View style={styles.imageWrapper}>
          {imageSource ? (
            <Image source={imageSource} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <Text style={styles.imageFallbackText}>🦴</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Bezárás"
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <LinearGradient colors={['transparent', 'rgba(40,54,24,0.92)']} style={styles.titleOverlay}>
            <Text style={styles.titleName} numberOfLines={1}>
              {creature.name_hu}
            </Text>
            <Text style={styles.titleEpoch} numberOfLines={1}>
              {creature.epoch || creature.period || 'Ismeretlen kor'}
            </Text>
          </LinearGradient>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {!!creature.description_hu && (
            <View style={styles.descBlock}>
              <Text style={styles.sectionLabel}>LEÍRÁS</Text>
              <Text style={styles.description}>{creature.description_hu.slice(0, 300)}</Text>
            </View>
          )}

          <View style={styles.statsGrid}>
            {stats.map((s, idx) => (
              <View key={idx} style={styles.statBox}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={styles.statValue} numberOfLines={1}>
                  {s.value}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.rarityBadge}>
            {!!rarityColor && <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />}
            <Text style={styles.rarityLabelText}>{rarityLabel}</Text>
          </View>
          <Text style={styles.packLabel}>{Number(creature.csomag || 1)}. csomag</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: COLORS.darkGreen,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFallbackText: {
    fontSize: 48,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  titleOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 14,
  },
  titleName: {
    color: COLORS.cream,
    fontFamily: FONTS.heading,
    fontSize: 22,
    fontWeight: '700',
  },
  titleEpoch: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.85,
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  descBlock: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(96,108,56,0.3)',
  },
  sectionLabel: {
    color: COLORS.gold,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  description: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: '#faf5eb',
    borderRadius: RADIUS.button,
    padding: 12,
  },
  statLabel: {
    color: COLORS.action,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    color: '#2d2d2d',
    fontFamily: FONTS.body,
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.bgDark,
    borderTopWidth: 1,
    borderTopColor: 'rgba(254,250,224,0.1)',
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rarityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.4)',
  },
  rarityLabelText: {
    color: COLORS.cream,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    fontWeight: '700',
  },
  packLabel: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 13,
    opacity: 0.6,
  },
});
