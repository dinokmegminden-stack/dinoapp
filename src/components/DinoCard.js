import React from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { getScaledDimensions } from '../utils/scaleUtils';
import PeriodTimeline from './PeriodTimeline';

const DESKTOP_BREAKPOINT = 1024;
const DESKTOP_MAX_WIDTH = 860; // Maximum width for the desktop card layout
const HERO_ASPECT_RATIO = 16 / 9;

const DIET_ICON = {
  ragadozó: '🥩',
  növényevő: '🌿',
  halevő: '🐟',
  mindenevő: '🍽️',
  ismeretlen: '❓',
};

const RARITY_STYLES = {
  gyakori: { text: '#c8ccbe', border: 'rgba(154,160,140,0.6)', bg: 'rgba(154,160,140,0.18)' },
  ritka: { text: '#8ecbe6', border: 'rgba(96,165,204,0.55)', bg: 'rgba(96,165,204,0.16)' },
  epikus: { text: '#c9a6e6', border: 'rgba(160,110,204,0.55)', bg: 'rgba(160,110,204,0.16)' },
  legendás: { text: '#f0c674', border: 'rgba(221,161,94,0.7)', bg: 'rgba(221,161,94,0.18)' },
};

function formatRange(min, max, unit) {
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) return `${min}–${max} ${unit}`;
  return `${max ?? min} ${unit}`;
}

export default function DinoCard({ dino, imageSource, character, showTimeline = true, onPrevious, onNext, isFirstDino, isLastDino }) {
  if (!dino) return null;

  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  const img = imageSource || null;

  const mobileImageHeight = width >= 700 ? 420 : 200;
 const desktopCardWidth = Math.min(width - 48, DESKTOP_MAX_WIDTH);
const desktopImageHeight = Math.min(desktopCardWidth / HERO_ASPECT_RATIO, 500);
  const imageHeight = isDesktop ? desktopImageHeight : mobileImageHeight;

  const dims = character ? getScaledDimensions(character, dino, imageHeight) : null;
  const characterLeftMargin = isDesktop ? 32 : 16;
  const characterLeft = dims ? characterLeftMargin : 0;

  const rarityKey = String(dino.rarity || '').toLowerCase();
  const rarityStyle = RARITY_STYLES[rarityKey] || RARITY_STYLES.gyakori;
  const dietIcon = DIET_ICON[String(dino.diet_hu || '').toLowerCase()] || null;

  const mya = formatRange(dino.mya_min, dino.mya_max, 'millió éve');
  const myaRange = formatRange(dino.mya_min, dino.mya_max, '');
  const length = formatRange(dino.length_m_min, dino.length_m_max, 'm');
  const weight = formatRange(dino.weight_kg_min, dino.weight_kg_max, 'kg');

  const metaItems = [
    dino.epoch && { label: 'Epoch', value: `${dino.epoch}, ${myaRange}` },
    length && { label: 'Hossz', value: length },
    weight && { label: 'Tömeg', value: weight },
    dino.discoverer_name && {
      label: 'Felfedező',
      value: dino.discovery_year
        ? `${dino.discoverer_name} (${dino.discovery_year})`
        : String(dino.discoverer_name),
    },
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

        {/* Overlay badges — csak desktopon, a hero kép fölött lebegve */}
        {isDesktop && (
          <>
            {!!dino.diet_hu && (
              <View style={[styles.overlayBadge, styles.badgeTopLeft]}>
                {!!dietIcon && <Text style={styles.overlayIcon}>{dietIcon}</Text>}
                <Text style={styles.overlayText}>{String(dino.diet_hu)}</Text>
              </View>
            )}
            {!!dino.region && (
              <View style={[styles.overlayBadge, styles.badgeBottomLeft]}>
                <Text style={styles.overlayIcon}>🌍</Text>
                <Text style={styles.overlayText}>{String(dino.region)}</Text>
              </View>
            )}
            {!!dino.rarity && (
              <View
                style={[
                  styles.overlayBadge,
                  styles.badgeBottomRight,
                  { borderColor: rarityStyle.border, backgroundColor: rarityStyle.bg },
                ]}
              >
                <Text style={styles.overlayIcon}>💎</Text>
                <Text style={[styles.overlayText, { color: rarityStyle.text }]}>
                  {String(dino.rarity)}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Lapozó gombok - overlay */}
        {onPrevious && (
          <TouchableOpacity
            style={[styles.playButtonLeft, isFirstDino && styles.navButtonDisabled]}
            onPress={onPrevious}
            disabled={isFirstDino}
          >
            <View style={[styles.playTriangle, styles.playTriangleLeft]} />
          </TouchableOpacity>
        )}
        {onNext && (
          <TouchableOpacity
            style={[styles.playButtonRight, isLastDino && styles.navButtonDisabled]}
            onPress={onNext}
            disabled={isLastDino}
          >
            <View style={[styles.playTriangle, styles.playTriangleRight]} />
          </TouchableOpacity>
        )}
      </View>
    )
  );

  // --- DESKTOP: codex-kártya, 2/3 leírás + 1/3 metaadat --------------------
  if (isDesktop) {
    return (
      <View style={[styles.desktopCard, { width: desktopCardWidth }]}>
        <View style={styles.heroSection}>{heroBlock}</View>

        {showTimeline && !!mya && (
          <View style={styles.desktopTimelineContainer}>
            <PeriodTimeline mya_min={dino.mya_min} mya_max={dino.mya_max} />
          </View>
        )}

        <View style={styles.contentRow}>
          <View style={styles.descriptionCol}>
            <Text style={styles.desktopName}>{String(dino.name_hu)}</Text>
            {!!dino.name_latin && (
              <Text style={styles.desktopLatin}>{String(dino.name_latin)}</Text>
            )}
            {!!dino.taxonomy_hu && (
              <Text style={styles.badge}>{String(dino.taxonomy_hu)}</Text>
            )}
            {!!dino.description_hu && (
              <Text style={styles.descriptionDesktop}>{String(dino.description_hu)}</Text>
            )}
          </View>

          {metaItems.length > 0 && (
            <View style={styles.metaCol}>
              {metaItems.map((item) => (
                <View key={item.label} style={styles.metaGridCell}>
                  <Text style={styles.metaGridLabel}>{item.label}</Text>
                  <Text style={styles.metaGridValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }

  // --- MOBIL / TABLET: egy oszlopos elrendezés -------------------------------
  return (
    <View style={styles.card}>
      {heroBlock}

      {showTimeline && !!mya && (
        <View style={styles.timelineContainer}>
          <PeriodTimeline mya_min={dino.mya_min} mya_max={dino.mya_max} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name}>{String(dino.name_hu)}</Text>
        {!!dino.name_latin && <Text style={styles.latin}>{String(dino.name_latin)}</Text>}

        {!!dino.taxonomy_hu && (
          <Text style={styles.badge}>{String(dino.taxonomy_hu)}</Text>
        )}

        {!!dino.description_hu && (
          <Text style={styles.description}>{String(dino.description_hu)}</Text>
        )}

        <View style={styles.metaBlock}>
          {!!dino.diet_hu && (
            <Text style={styles.meta}>{dietIcon ? `${dietIcon} ` : ''}Étrend: {String(dino.diet_hu)}</Text>
          )}
          {!!dino.region && <Text style={styles.meta}>🌍 Régió: {String(dino.region)}</Text>}
          {metaItems.map((item) => (
            <Text key={item.label} style={styles.meta}>
              {item.label}: {item.value.replace('\n', ' · ')}
            </Text>
          ))}
          {!!dino.rarity && <Text style={styles.meta}>💎 Ritkaság: {String(dino.rarity)}</Text>}
        </View>
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
  playButtonLeft: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonRight: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
  },
  playTriangleLeft: {
    borderTopWidth: 16,
    borderBottomWidth: 16,
    borderRightWidth: 28,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#FEFAE0',
  },
  playTriangleRight: {
    borderTopWidth: 16,
    borderBottomWidth: 16,
    borderLeftWidth: 28,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FEFAE0',
  },
  navButtonDisabled: {
    opacity: 0.3,
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
  timelineContainer: {
    marginBottom: 12,
    paddingHorizontal: 0,
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

  // --- Overlay badges (csak desktop hero) ------------------------------------
  overlayBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(217,208,181,0.25)',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badgeTopLeft: { top: 16, left: 16 },
  badgeTopRight: { top: 16, right: 16 },
  badgeBottomLeft: { bottom: 16, left: 16 },
  badgeBottomRight: { bottom: 16, right: 16 },
  overlayIcon: { fontSize: 16 },
  overlayText: {
    color: '#e4e7dc',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },

  // --- DESKTOP: codex-kártya ---------------------------------------------------


  desktopCard: {
    alignSelf: 'center',
    marginVertical: 12,
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
  desktopTimelineContainer: {
    padding: 24,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217,208,181,0.1)',
  },
  imageWrapperDesktop: {
    marginBottom: 0,
    borderRadius: 0,
    backgroundColor: '#14140f',
  },

  contentRow: {
    flexDirection: 'row',
    gap: 24,
    padding: 24,
  },
  descriptionCol: {
    flex: 2,
    minWidth: 0,
  },
  desktopName: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: '900',
    fontFamily: FONTS.heading,
    marginBottom: 4,
  },
  desktopLatin: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontStyle: 'italic',
    marginBottom: 8,
    fontFamily: FONTS.body,
  },
  descriptionDesktop: {
    color: COLORS.textPrimary,
    fontSize: 15,
    lineHeight: 25,
    marginTop: 12,
    fontFamily: FONTS.body,
  },

  metaCol: {
    flex: 1,
    flexDirection: 'column',
    gap: 12,
  },
  metaGridCell: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  metaGridLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
    fontFamily: FONTS.bold,
  },
  metaGridValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONTS.body,
  },
});