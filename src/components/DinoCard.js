// DinoCard — kompakt galéria-kártya az Albumod rács-nézetéhez, "focis kártya"
// elrendezésben: 16:9 kép felül, alatta név/latin név sáv, majd egy nagyobb
// infó-blokk. Koppintásra a DinoCardModal nyílik meg a teljes részletekkel.
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { IMAGE_MAP, MISSING_IMAGE } from '../constants/imageMap';
import { getRarityColor } from '../utils/rarity';

function formatMeasure(min, max, unit) {
  if (min == null && max == null) return '—';
  const v = max ?? min;
  return `${v}${unit}`;
}

export default function DinoCard({ creature, onPress }) {
  const imageSource = IMAGE_MAP[creature.name_hu] || MISSING_IMAGE;
  const rarityColor = getRarityColor(creature.rarity);
  const length = formatMeasure(creature.length_m_min, creature.length_m_max, 'm');

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => onPress?.(creature.id)}
      accessibilityRole="button"
      accessibilityLabel={`Dínókártya: ${creature.name_hu}`}
    >
      <View style={styles.imageWrapper}>
        {imageSource ? (
          <Image source={imageSource} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={styles.imageFallbackText}>🦴</Text>
          </View>
        )}
      </View>

      <View style={styles.nameBar}>
        <Text style={styles.commonName} numberOfLines={1}>
          {creature.name_hu}
        </Text>
      </View>
      <View style={styles.latinBar}>
        <Text style={styles.epochText} numberOfLines={1}>
          {creature.epoch || creature.period || 'Ismeretlen kor'}
        </Text>
      </View>

      <View style={styles.infoBlock}>
        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>HOSSZ</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {length}
            </Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>ORSZÁG</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {creature.discovered_country || '—'}
            </Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>ÉTREND</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {creature.diet_hu || '—'}
            </Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>CSALÁD</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {creature.csalad_hu || '—'}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          {!!rarityColor && <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />}
          <Text style={styles.packBadge}>{Number(creature.csomag || 1)}. csomag</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
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
    fontSize: 32,
  },
  nameBar: {
    backgroundColor: '#1c2912',
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 3,
  },
  commonName: {
    color: COLORS.cream,
    fontFamily: FONTS.heading,
    fontSize: 15,
    fontWeight: '700',
  },
  latinBar: {
    backgroundColor: '#1c2912',
    paddingHorizontal: 10,
    paddingBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(254,250,224,0.1)',
  },
  epochText: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 11,
    fontStyle: 'italic',
    opacity: 0.65,
  },
  infoBlock: {
    padding: 10,
    justifyContent: 'space-between',
    minHeight: 110,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCell: {
    width: '47%',
  },
  statLabel: {
    color: COLORS.gold,
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.4)',
  },
  packBadge: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 11,
    opacity: 0.6,
  },
});
