import React from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { getScaledDimensions } from '../utils/scaleUtils';

const DESKTOP_BREAKPOINT = 1024;
const CARD_ASPECT_RATIO = 2 / 3; // szélesség / magasság a bal oldali "trading card"-hoz

export default function DinoCard({ dino, imageSource, character, showTimeline = true }) {
  if (!dino) return null;

  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  const img = imageSource || null;

  // Mobil nézetben a régi, teljes szélességű kép magassága; desktopon a bal
  // oszlop szélessége határozza meg a kép/kártya méretét az aspect ratio-n keresztül.
  const mobileImageHeight = width >= 700 ? 420 : 200;
  const desktopCardWidth = 340;
  const desktopImageHeight = desktopCardWidth / CARD_ASPECT_RATIO * 0.58; // a kártya felső 58%-a a kép

  const imageHeight = isDesktop ? desktopImageHeight : mobileImageHeight;

  const dims = character ? getScaledDimensions(character, dino, imageHeight) : null;
  const characterLeft = dims ? (dims.dino.width - dims.character.width) / 2 : 0;

  const metaItems = [
    dino.epoch && { label: 'Időszak', value: String(dino.epoch) },
    dino.hossz && { label: 'Hossz', value: `${String(dino.hossz)} m` },
    dino.felfedezo && { label: 'Felfedező', value: String(dino.felfedezo) },
    dino.rarity && { label: 'Ritkaság', value: String(dino.rarity) },
  ].filter(Boolean);

  const imageBlock = (
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
          resizeMode="cover"
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
        {/* Rarity badge — jelenleg "common" tónus, később dinamikusan színezhető rarity szerint */}
        {!!dino.rarity && (
          <View style={[styles.rarityBadge, styles.rarityBadgeCommon]}>
            <Text style={[styles.rarityBadgeText, styles.rarityBadgeTextCommon]}>
              {String(dino.rarity)}
            </Text>
          </View>
        )}
      </View>
    )
  );

  // --- DESKTOP: két oszlopos elrendezés -------------------------------------
  if (isDesktop) {
    return (
      <View style={styles.desktopRow}>
        {/* Bal oszlop: fix arányú "trading card" */}
        <View style={[styles.tradingCard, { width: desktopCardWidth }]}>
          {imageBlock}
          <View style={styles.tradingCardPlate}>
            <Text style={styles.tradingCardName} numberOfLines={2}>
              {String(dino.nev_koznapi)}
            </Text>
            <Text style={styles.tradingCardLatin} numberOfLines={1}>
              {String(dino.nev_tudomanyos)}
            </Text>
            <View style={styles.rarityDots}>
              <View style={[styles.rarityDot, styles.rarityDotActive]} />
              <View style={styles.rarityDot} />
              <View style={styles.rarityDot} />
            </View>
          </View>
        </View>

        {/* Jobb oszlop: lore + metaadatok */}
        <View style={styles.infoColumn}>
          <Text style={styles.infoName}>{String(dino.nev_koznapi)}</Text>
          <Text style={styles.infoLatin}>{String(dino.nev_tudomanyos)}</Text>

          {!!dino.taxonomy_group && (
            <Text style={styles.badge}>{String(dino.taxonomy_group)}</Text>
          )}

          {!!dino.description_hu && (
            <Text style={styles.descriptionDesktop}>{String(dino.description_hu)}</Text>
          )}

          {metaItems.length > 0 && (
            <View style={styles.metaGrid}>
              {metaItems.map((item) => (
                <View key={item.label} style={styles.metaGridCell}>
                  <Text style={styles.metaGridLabel}>{item.label}</Text>
                  <Text style={styles.metaGridValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          )}

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

  // --- MOBIL / TABLET: eredeti, egy oszlopos elrendezés ----------------------
  return (
    <View style={styles.card}>
      {imageBlock}

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
  // --- Közös / mobil ---------------------------------------------------------
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

  // --- Rarity badge a képen (mindkét nézetben használt) ----------------------
  rarityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  rarityBadgeCommon: {
    backgroundColor: 'rgba(154,160,140,0.18)',
    borderColor: 'rgba(154,160,140,0.6)',
  },
  rarityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: FONTS.bold,
  },
  rarityBadgeTextCommon: {
    color: '#c8ccbe',
  },

  // --- DESKTOP: split view ----------------------------------------------------
  desktopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 40,
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
    marginVertical: 20,
  },

  // Bal oszlop: fix arányú "trading card" konténer
  tradingCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: 'rgba(217,208,181,0.6)',
    // box-shadow megfelelője RN-ben:
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  imageWrapperDesktop: {
    marginBottom: 0,
    borderRadius: 0,
  },
  tradingCardPlate: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 4,
  },
  tradingCardName: {
    color: '#2b2b20',
    fontSize: 20,
    fontWeight: '900',
    fontFamily: FONTS.heading,
  },
  tradingCardLatin: {
    color: '#6b6650',
    fontSize: 13,
    fontStyle: 'italic',
    fontFamily: FONTS.body,
  },
  rarityDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d9d0b5',
  },
  rarityDotActive: {
    backgroundColor: '#9aa08c',
  },

  // Jobb oszlop: lore + meta
  infoColumn: {
    flex: 1,
    minWidth: 0,
    paddingTop: 4,
  },
  infoName: {
    color: COLORS.textPrimary,
    fontSize: 30,
    fontWeight: '900',
    fontFamily: FONTS.heading,
    marginBottom: 2,
  },
  infoLatin: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontStyle: 'italic',
    marginBottom: 16,
    fontFamily: FONTS.body,
  },
  descriptionDesktop: {
    color: COLORS.textPrimary,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 20,
    maxWidth: 560, // rövid sorhossz olvashatósághoz
    fontFamily: FONTS.body,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    maxWidth: 480,
  },
  metaGridCell: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 140,
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
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.body,
  },
});
