// DinoCard — kompakt galéria-kártya az Albumod rács-nézetéhez. Koppintásra a
// DinoCardModal nyílik meg a teljes részletekkel (lásd AlbumScreen.js).
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { IMAGE_MAP, MISSING_IMAGE } from '../constants/imageMap';
import { getRarityColor } from '../utils/rarity';

export default function DinoCard({ creature, onPress }) {
  const imageSource = IMAGE_MAP[creature.name_hu] || MISSING_IMAGE;
  const rarityColor = getRarityColor(creature.rarity);

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
        {!!rarityColor && <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />}
        <LinearGradient colors={['transparent', 'rgba(40,54,24,0.92)']} style={styles.overlay}>
          <Text style={styles.title} numberOfLines={1}>
            {creature.name_hu}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {creature.epoch || creature.period || 'Ismeretlen kor'}
          </Text>
        </LinearGradient>
        <Text style={styles.chevron}>›</Text>
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
    fontSize: 32,
  },
  rarityDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.4)',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    color: COLORS.cream,
    fontFamily: FONTS.heading,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.8,
    marginTop: 2,
  },
  chevron: {
    position: 'absolute',
    right: 8,
    bottom: 6,
    color: COLORS.cream,
    fontSize: 14,
    opacity: 0.6,
    fontWeight: '700',
  },
});
