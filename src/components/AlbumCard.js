// AlbumCard — kompakt galéria-kártya az Albumod rács-nézetéhez, "focis kártya"
// elrendezésben: 16:9 kép felül, alatta egysoros tudományos név, egy nagyobb
// infó-blokk, majd (regisztrált játékosnak) a leírás. Koppintásra a
// DinoCardModal nyílik meg a teljes részletekkel. A csomagszám nem kártya-
// mező többé, csak hoveren (webes egér fölé vitelkor) látszó infó, hogy a
// névsor egy sorban elférjen és a leírásnak ne kelljen csonkolódnia.
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Pressable, StyleSheet, Platform } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { IMAGE_MAP, MISSING_IMAGE } from '../constants/imageMap';
import { getRarityColor } from '../utils/rarity';
import { isGuestMode } from '../utils/guestMode';

function formatMeasure(min, max, unit) {
  if (min == null && max == null) return '—';
  const v = max ?? min;
  return `${v}${unit}`;
}

export default function AlbumCard({ creature, onPress }) {
  const imageSource = IMAGE_MAP[creature.name_hu] || MISSING_IMAGE;
  const rarityColor = getRarityColor(creature.rarity);
  const length = formatMeasure(creature.length_m_min, creature.length_m_max, 'm');
  const isGuest = isGuestMode();
  const hasDescription = !isGuest && !!creature.description_hu;
  const [packHovered, setPackHovered] = useState(false);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => onPress?.(creature.id)}
      accessibilityRole="button"
      accessibilityLabel={`Dínókártya: ${creature.name_hu}, ${Number(creature.csomag || 1)}. csomag`}
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

      <Pressable
        style={styles.nameBar}
        onPress={() => onPress?.(creature.id)}
        onHoverIn={() => setPackHovered(true)}
        onHoverOut={() => setPackHovered(false)}
      >
        <Text style={styles.scientificName} numberOfLines={1}>
          {creature.name_latin || creature.name_hu}
        </Text>
        {packHovered && (
          <View style={styles.packTooltip} pointerEvents="none">
            <Text style={styles.packTooltipText}>{Number(creature.csomag || 1)}. csomag</Text>
          </View>
        )}
      </Pressable>

      <View style={styles.infoBlock}>
        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>KORSZAK</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {creature.period || creature.epoch || '—'}
            </Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>CSALÁD</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {creature.csalad_hu || '—'}
            </Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>FELFEDEZŐ</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {creature.discoverer_name || '—'}
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
            <Text style={styles.statLabel}>HOSSZ</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {length}
            </Text>
          </View>
        </View>

        {!!rarityColor && (
          <View style={styles.footer}>
            <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
          </View>
        )}
      </View>

      {hasDescription && (
        <Text style={styles.description}>{creature.description_hu}</Text>
      )}
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
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(254,250,224,0.1)',
    position: 'relative',
  },
  scientificName: {
    color: COLORS.cream,
    fontFamily: FONTS.heading,
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  packTooltip: {
    position: 'absolute',
    top: '100%',
    left: 10,
    marginTop: 4,
    zIndex: 20,
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
    ...Platform.select({ web: { whiteSpace: 'nowrap' } }),
  },
  packTooltipText: {
    color: COLORS.bgDark,
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
  },
  infoBlock: {
    padding: 10,
    justifyContent: 'space-between',
    minHeight: 160,
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
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 15,
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
  description: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 15,
    opacity: 0.75,
    lineHeight: 21,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});
