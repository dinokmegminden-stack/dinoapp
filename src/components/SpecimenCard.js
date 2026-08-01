import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { IMAGE_MAP, MISSING_IMAGE } from '../constants/imageMap';
import { isGuestMode } from '../utils/guestMode';

export default function SpecimenCard({ dino, showDescription = true }) {
  const imageSource = IMAGE_MAP[dino.name_hu] || MISSING_IMAGE;
  const isGuest = isGuestMode();

  // Fact labels + values (6 boxes, 2 columns)
  const facts = [
    {
      label: 'KORSZAK',
      value: dino.period || dino.epoch || '—',
    },
    {
      label: 'CSALÁD',
      value: dino.csalad_hu || '—',
    },
    {
      label: 'FELFEDEZÉS ORSZÁGA',
      value: dino.discovered_country || '—',
    },
    {
      label: 'FELFEDEZŐ',
      value: dino.discoverer_name || '—',
    },
    {
      label: 'ÉTREND',
      value: dino.diet_hu || '—',
    },
    {
      label: 'HOSSZ',
      value: dino.length_m_max ?? dino.length_m_min ? `${dino.length_m_max ?? dino.length_m_min}m` : '—',
    },
  ];

  const factsCol1 = facts.slice(0, 3);
  const factsCol2 = facts.slice(3, 6);

  const hasDescription = showDescription && !isGuest && !!dino.description_hu;

  return (
    <View style={styles.card}>
      {/* Kép: fix 16:9, teljes szélesség — "contain", hogy semmi (főleg a
          teteje) ne vágódjon le, a klasszikus 33%-os oldalt-kép elrendezés
          helyett is inkább ez, mert rács-nézetben (2 kártya egy sorban)
          nincs elég vízszintes hely a régi 33/67 osztáshoz. */}
      <View style={styles.imageContainer}>
        {imageSource ? (
          <Image source={imageSource} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={styles.imageFallbackText}>🦴</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.commonName} numberOfLines={2}>
            {dino.name_hu}
          </Text>
          {dino.name_latin && (
            <Text style={styles.scientificName} numberOfLines={1}>
              {dino.name_latin}
            </Text>
          )}
        </View>

        <View style={styles.factsRow}>
          <View style={styles.factCol}>
            {factsCol1.map((fact, idx) => (
              <View key={idx} style={[styles.factRow, idx === factsCol1.length - 1 && styles.factRowLast]}>
                <Text style={styles.factLabel}>{fact.label}</Text>
                <Text style={styles.factValue} numberOfLines={1}>
                  {fact.value}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.factCol}>
            {factsCol2.map((fact, idx) => (
              <View key={idx} style={[styles.factRow, idx === factsCol2.length - 1 && styles.factRowLast]}>
                <Text style={styles.factLabel}>{fact.label}</Text>
                <Text style={styles.factValue} numberOfLines={1}>
                  {fact.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Description: registered players only, full card width, below image */}
      {hasDescription && (
        <Text style={styles.description}>{dino.description_hu}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(254,250,224,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(221,161,94,0.5)',
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1a1a1a',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFallbackText: {
    fontSize: 48,
  },
  content: {
    minHeight: 0,
    justifyContent: 'flex-start',
    padding: 12,
  },
  titleRow: {
    marginBottom: 8,
  },
  commonName: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  scientificName: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 13,
    opacity: 0.65,
    fontStyle: 'italic',
  },
  factsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  factCol: {
    flex: 1,
  },
  factRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(254,250,224,0.1)',
  },
  factRowLast: {
    borderBottomWidth: 0,
  },
  factLabel: {
    color: COLORS.gold,
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.75,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  factValue: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 12,
    fontWeight: '400',
  },
  description: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 12,
    opacity: 0.75,
    lineHeight: 18,
    paddingHorizontal: 12,
    paddingBottom: 12,
    marginTop: -4,
  },
});
