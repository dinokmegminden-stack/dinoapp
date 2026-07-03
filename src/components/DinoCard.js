import React from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { getScaledDimensions } from '../utils/scaleUtils';

export default function DinoCard({ dino, imageSource, character, showTimeline = true }) {
  if (!dino) return null;

  const { width } = useWindowDimensions();
  const imageHeight = width >= 700 ? 420 : 200;

  const img = imageSource || null;
  
  // Character overlay setup
  const dims = character ? getScaledDimensions(character, dino, imageHeight) : null;
  const characterLeft = dims ? (dims.dino.width - dims.character.width) / 2 : 0;

  return (
    <View style={styles.card}>
      {img && (
        <View style={[styles.imageWrapper, { height: imageHeight }]}>
          <Image
            source={img}
            style={[styles.image, { height: imageHeight }]}
            resizeMode="contain"
          />
          {character?.imageAsset && dims && (
            <Image
              source={character.imageAsset}
              resizeMode="contain"
              style={[
                styles.characterOverlay,
                {
                  width: dims.character.width,
                  height: dims.character.height,
                  left: characterLeft,
                  bottom: 0,
                },
              ]}
            />
          )}
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name}>{String(dino.nev_koznapi)}</Text>
        <Text style={styles.latin}>{String(dino.nev_tudomanyos)}</Text>

        {!!dino.taxonomy_group && (
          <Text style={styles.badge}>{String(dino.taxonomy_group)}</Text>
        )}

        {!!dino.description_hu && (
          <Text style={styles.description}>{String(dino.description_hu)}</Text>
        )}

        <View style={styles.metaBlock}>
          {!!dino.korszak && (
            <Text style={styles.meta}>🌍 Korszak: {String(dino.korszak)}</Text>
          )}
          {!!dino.period && (
            <Text style={styles.meta}>📅 Időszak: {String(dino.period)}</Text>
          )}
          {!!dino.hossz && (
            <Text style={styles.meta}>📏 Hossz: {String(dino.hossz)} m</Text>
          )}
          {!!dino.felfedezo && (
            <Text style={styles.meta}>🔍 Felfedező: {String(dino.felfedezo)}</Text>
          )}
          {!!dino.rarity && (
            <Text style={styles.meta}>⭐ Ritkaság: {String(dino.rarity)}</Text>
          )}
        </View>

        {showTimeline && !!dino.mya_min && (
          <View style={styles.timeline}>
            <Text style={styles.timelineText}>
              {String(dino.mya_min)}
              {dino.mya_max ? ` – ${String(dino.mya_max)}` : ''} millió éve
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'stretch',
  },
  imageWrapper: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  characterOverlay: {
    position: 'absolute',
  },
  info: {
    gap: 6,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    fontFamily: FONTS.heading,
  },
  latin: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 4,
    fontFamily: FONTS.body,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.greenBg,
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
    overflow: 'hidden',
    fontFamily: FONTS.bold,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
    fontFamily: FONTS.body,
  },
  metaBlock: {
    gap: 3,
    marginTop: 4,
  },
  meta: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: FONTS.body,
  },
  timeline: {
    marginTop: 8,
    padding: 8,
    backgroundColor: COLORS.greenBg,
    borderRadius: 8,
  },
  timelineText: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
});
