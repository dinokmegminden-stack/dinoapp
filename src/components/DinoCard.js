import React from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { COLORS } from '../constants/colors';

import { resolveImage } from '../services/imageResolver';
import { safeText } from '../services/safeText';

export default function DinoCard({ dino, imageSource, showTimeline = true }) {
  if (!dino) return null;

  const { width } = useWindowDimensions();
  const imageHeight = width >= 700 ? 420 : 200;

  const img = imageSource || resolveImage(dino);

  return (
    <View style={styles.card}>
      {img && (
        <Image
          source={img}
          style={[styles.image, { height: imageHeight }]}
          resizeMode="contain"
        />
      )}

      <View style={styles.info}>
        <Text style={styles.name}>{safeText(dino.nev_koznapi)}</Text>
        <Text style={styles.latin}>{safeText(dino.nev_tudomanyos)}</Text>

        {!!dino.taxonomy_group && (
          <Text style={styles.badge}>{safeText(dino.taxonomy_group)}</Text>
        )}

        {!!dino.description_hu && (
          <Text style={styles.description}>{safeText(dino.description_hu)}</Text>
        )}

        <View style={styles.metaBlock}>
          {!!dino.korszak && (
            <Text style={styles.meta}>🌍 Korszak: {safeText(dino.korszak)}</Text>
          )}
          {!!dino.period && (
            <Text style={styles.meta}>📅 Időszak: {safeText(dino.period)}</Text>
          )}
          {!!dino.hossz && (
            <Text style={styles.meta}>📏 Hossz: {safeText(dino.hossz)} m</Text>
          )}
          {!!dino.felfedezo && (
            <Text style={styles.meta}>🔍 Felfedező: {safeText(dino.felfedezo)}</Text>
          )}
          {!!dino.rarity && (
            <Text style={styles.meta}>⭐ Ritkaság: {safeText(dino.rarity)}</Text>
          )}
        </View>

        {showTimeline && !!dino.mya_min && (
          <View style={styles.timeline}>
            <Text style={styles.timelineText}>
              {safeText(dino.mya_min)}
              {dino.mya_max ? ` – ${safeText(dino.mya_max)}` : ''} millió éve
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
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  info: {
    gap: 6,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
  },
  latin: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 4,
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
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  metaBlock: {
    gap: 3,
    marginTop: 4,
  },
  meta: {
    color: COLORS.textMuted,
    fontSize: 13,
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
  },
});
