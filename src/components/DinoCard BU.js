import React from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { getScaledDimensions } from '../utils/scaleUtils';

const DESKTOP_BREAKPOINT = 1024;
const DESKTOP_MAX_WIDTH = 1280;
const HERO_ASPECT_RATIO = 16 / 9;

export default function DinoCard({ dino, imageSource, character, showTimeline = true }) {
  if (!dino) return null;

  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  const img = imageSource || null;

  const mobileImageHeight = width >= 700 ? 420 : 200;
  const desktopCardWidth = Math.min(width - 48, DESKTOP_MAX_WIDTH);
  const desktopImageHeight = desktopCardWidth / HERO_ASPECT_RATIO;

  const imageHeight = isDesktop ? desktopImageHeight : mobileImageHeight;

  const dims = character ? getScaledDimensions(character, dino, imageHeight) : null;
  const characterLeft = dims ? (dims.dino.width - dims.character.width) / 2 : 0;

  const metaItems = [
    dino.epoch && { label: 'Időszak', value: String(dino.epoch) },
    dino.hossz && { label: 'Hossz', value: `${String(dino.hossz)} m` },
    dino.felfedezo && { label: 'Felfedező', value: String(dino.felfedezo) },
    dino.rarity && { label: 'Ritkaság', value: String(dino.rarity) },
  ].filter(Boolean);

  const heroBlock = (
    img && (
      <View
        style={[
          styles.imageWrapper,
          { height: imageHeight },
          isDesktop && styles.imageWrapperDesktop,
        ]}
      >
        <Image
          source={img}
          style={[styles.image, { height: imageHeight }]}
          resizeMode={isDesktop ? 'contain' : 'cover'}
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
    )
  );

  // --- DESKTOP: egységes, széles codex-kártya ---------------------------------
  if (isDesktop) {
    return (
      <View style={[styles.desktopCard, { width: desktopCardWidth }]}>
        {/* Hero — teljes szélességű, uncropped 16:9 kép */}
        <View style={styles.heroSection}>
          {heroBlock}
          {!!dino.rarity && (
            <View style={[styles.rarityBadge, styles.rarityBadgeCommon]}>
              <Text style={[styles.rarityBadgeText, styles.rarityBadgeTextCommon]}>
                {String(dino.rarity)}
              </Text>
            </View>
          )}
        </View>

        {/* Title section */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.desktopName}>{String(dino.nev_koznapi)}</Text>
              <Text style={styles.desktopLatin}>{String(dino.nev_tudomanyos)}</Text>
            </View>
            {!!dino.taxonomy_group && (
              <Text style={styles.badge}>{String(dino.taxonomy_group)}</Text>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Description section */}
        {!!dino.description_hu && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionLabel}>Leírás</Text>
            <Text style={styles.descriptionDesktop}>{String(dino.description_hu)}</Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* Metadata section */}
        {metaItems.length > 0 && (
          <View style={styles.metaSection}>
            <Text style={styles.sectionLabel}>Adatlap</Text>
            <View style={styles.metaGrid}>
              {metaItems.map((item) => (
                <View key={item.label} style={styles.metaGridCell}>
                  <Text style={styles.metaGridLabel}>{item.label}</Text>
                  <Text style={styles.metaGridValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {showTimeline && !!dino.mya_min && (
          <View style={styles.timelineDesktop}>
            <Text style={styles.timelineText}>
              {String(dino.mya_min)}
              {dino.mya_max ? ` – ${String(dino.mya_max)}` : ''} millió éve
            </Text>
          </View>
        )}
      </View>
    );
  }

  // --- MOBIL / TABLET: eredeti, egy oszlopos elrendezés ----------------------
  return (
    <View style={styles.card}>
      {heroBlock}

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
          {metaItems.map((item) => (
            <Text key={item.label} style={styles.meta}>
              {item.label}: {item.value}
            </Text>
          ))}
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

  rarityBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  rarityBadgeCommon: {
    backgroundColor: 'rgba(154,160,140,0.22)',
    borderColor: 'rgba(154,160,140,0.65)',
  },
  rarityBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: FONTS.bold,
  },
  rarityBadgeTextCommon: {
    color: '#e4e7dc',
  },

  desktopCard: {
    alignSelf: 'center',
    marginVertical: 24,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(217,208,181,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 14,
  },

  heroSection: {
    width: '100%',
    backgroundColor: '#14140f',
  },
  imageWrapperDesktop: {
    marginBottom: 0,
    borderRadius: 0,
    backgroundColor: '#14140f',
  },

  titleSection: {
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  desktopName: {
    color: COLORS.textPrimary,
    fontSize: 34,
    fontWeight: '900',
    fontFamily: FONTS.heading,
    marginBottom: 4,
  },
  desktopLatin: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontStyle: 'italic',
    fontFamily: FONTS.body,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 40,
  },

  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    fontFamily: FONTS.bold,
  },

  descriptionSection: {
    paddingHorizontal: 40,
    paddingVertical: 24,
  },
  descriptionDesktop: {
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 26,
    maxWidth: 820,
    fontFamily: FONTS.body,
  },

  metaSection: {
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 8,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  metaGridCell: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    minWidth: 150,
  },
  metaGridLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
    fontFamily: FONTS.bold,
  },
  metaGridValue: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: FONTS.body,
  },

  timelineDesktop: {
    marginHorizontal: 40,
    marginTop: 20,
    marginBottom: 28,
    padding: 12,
    backgroundColor: COLORS.greenBg,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
});
