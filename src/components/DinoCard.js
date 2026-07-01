import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { safeText } from '../../services/safeText';
import { resolveImage } from '../../services/imageResolver';

export default function DinoCard({ dino, imageSource, showTimeline = true }) {
  if (!dino) return null;

  const img = imageSource || resolveImage(dino);

  return (
    <View style={styles.card}>
      {img && (
        <Image
          source={img}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <View style={styles.info}>
        <Text style={styles.name}>{safeText(dino.nev_koznapi)}</Text>
        <Text style={styles.latin}>{safeText(dino.nev_tudomanyos)}</Text>

        <Text style={styles.meta}>
          Korszak: {safeText(dino.korszak)}
        </Text>

        <Text style={styles.meta}>
          Hossz: {safeText(dino.hossz)}
        </Text>

        <Text style={styles.meta}>
          Felfedező: {safeText(dino.felfedezo)}
        </Text>

        {showTimeline && (
          <View style={styles.timeline}>
            <Text style={styles.timelineText}>
              {safeText(dino.mya_min)} – {safeText(dino.mya_max)} millió év
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
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 12,
  },
  info: {
    gap: 4,
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
    marginBottom: 8,
  },
  meta: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  timeline: {
    marginTop: 10,
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
