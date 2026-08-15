import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Pressable, StyleSheet, Platform } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { IMAGE_MAP, MISSING_IMAGE } from '../constants/imageMap';
import { isGuestMode } from '../utils/guestMode';

function formatMeasure(min, max, unit) {
  if (min == null && max == null) return '—';
  const v = max ?? min;
  return `${v}${unit}`;
}

const DIET_ICON = {
  növényevő: '🌿',
  húsevő: '🍖',
  mindenevő: '🍽️',
};

function getDietIcon(dietHu) {
  const first = String(dietHu || '').split(',')[0].trim();
  return DIET_ICON[first] || '❓';
}

export default function AlbumCard({ creature, onPress }) {
  const imageSource = IMAGE_MAP[creature.name_hu] || MISSING_IMAGE;
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
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
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

          {/* Description added directly below Család */}
          {hasDescription && (
            <View style={styles.fullWidthCell}>
              <Text style={styles.description}>{creature.description_hu}</Text>
            </View>
          )}

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
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
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
    fontSize: 12,
  },
  infoBlock: {
    padding: 10,
    justifyContent: 'space-between',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCell: {
    width: '47%',
  },
  fullWidthCell: {
    width: '100%',
    marginVertical: 4,
  },
  statLabel: {
    color: COLORS.gold,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 12,
  },
  description: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 12,
    opacity: 0.85,
    lineHeight: 18,
  },
});