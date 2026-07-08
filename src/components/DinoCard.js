// DinoCard — redesign spec 4. pont.
// Kritikus megkötés: a kép mindig 16:9, sosem torzul és nem vágódik
// (a forrásképek natívan 16:9-esek, a cover így pixelpontos).
// Mobil (<700): oszlop — kép, badge-ek a képen, név/latin, metadata kártyák, leírás.
// Desktop (>=700): a kép változatlanul felül, alatta row: 180px meta-oszlop + leírás.
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { getScaledDimensions } from '../utils/scaleUtils';
import PeriodTimeline from './PeriodTimeline';
import PressableButton from './PressableButton';

const DESKTOP_BREAKPOINT = 700;

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

function OverlayBadge({ position, icon, text, colorStyle }) {
  return (
    <View style={[styles.overlayBadge, styles[position], colorStyle && { borderColor: colorStyle.border }]}>
      {!!icon && <Text style={styles.overlayIcon}>{icon}</Text>}
      <Text style={[styles.overlayText, colorStyle && { color: colorStyle.text }]}>{text}</Text>
    </View>
  );
}

function MetaCard({ label, value }) {
  return (
    <View style={styles.metaCard}>
      <Text style={styles.metaCardLabel}>{label}</Text>
      <Text style={styles.metaCardValue}>{value}</Text>
    </View>
  );
}

export default function DinoCard({
  dino,
  imageSource,
  character,
  showTimeline = true,
  onPrevious,
  onNext,
  isFirstDino,
  isLastDino,
  characters,
  selectedCharacter,
  onCharacterSelect,
  onDetails,
}) {
  if (!dino) return null;

  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const [heroWidth, setHeroWidth] = useState(0);
  const heroHeight = heroWidth * (9 / 16);

  const img = imageSource || null;
  const rarityKey = String(dino.rarity || '').toLowerCase();
  const rarityStyle = RARITY_STYLES[rarityKey] || RARITY_STYLES.gyakori;
  const dietIcon = DIET_ICON[String(dino.diet_hu || '').toLowerCase()] || null;

  const mya = formatRange(dino.mya_min, dino.mya_max, 'millió éve');
  const length = formatRange(dino.length_m_min, dino.length_m_max, 'm');
  const weight = formatRange(dino.weight_kg_min, dino.weight_kg_max, 'kg');
  const latinFull = [dino.name_latin, dino.latin_name_ending].filter(Boolean).join(' ');

  const dims =
    character && heroHeight > 0 ? getScaledDimensions(character, dino, heroHeight) : null;

  const metaCards = [
    mya && { label: 'Kor', value: dino.epoch ? `${dino.epoch} · ${mya}` : mya },
    dino.discoverer_name && {
      label: 'Felfedező',
      value: dino.discovery_year
        ? `${dino.discoverer_name} (${dino.discovery_year})`
        : String(dino.discoverer_name),
    },
    dino.diet_hu && { label: 'Étrend', value: `${dietIcon ? `${dietIcon} ` : ''}${dino.diet_hu}` },
    dino.region && { label: 'Régió', value: `🌍 ${dino.region}` },
  ].filter(Boolean);

  const heroBlock = (
    <View
      style={styles.heroWrapper}
      onLayout={(e) => setHeroWidth(e.nativeEvent.layout.width)}
    >
      {img ? (
        <Image source={img} style={styles.heroImage} resizeMode="cover" />
      ) : (
        <View style={[styles.heroImage, styles.heroFallback]}>
          <Text style={styles.heroFallbackText}>🦴</Text>
        </View>
      )}

      {character?.imageAsset && dims && (
        <Image
          source={character.imageAsset}
          resizeMode="contain"
          style={[
            styles.characterOverlay,
            {
              width: dims.character.width,
              height: dims.character.height,
              left: 16,
              bottom: 0,
            },
          ]}
        />
      )}

      {/* 4 badge: bal-fent ritkaság, jobb-fent kor, bal-lent hossz, jobb-lent súly */}
      {!!dino.rarity && (
        <OverlayBadge position="badgeTopLeft" icon="💎" text={String(dino.rarity)} colorStyle={rarityStyle} />
      )}
      {!!dino.epoch && <OverlayBadge position="badgeTopRight" text={String(dino.epoch)} />}
      {!!length && <OverlayBadge position="badgeBottomLeft" icon="📏" text={length} />}
      {!!weight && <OverlayBadge position="badgeBottomRight" icon="⚖️" text={weight} />}

      {/* Lapozó gombok — overlay */}
      {onPrevious && (
        <TouchableOpacity
          style={[styles.navBtn, styles.navBtnLeft, isFirstDino && styles.navBtnDisabled]}
          onPress={onPrevious}
          disabled={isFirstDino}
        >
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableOpacity>
      )}
      {onNext && (
        <TouchableOpacity
          style={[styles.navBtn, styles.navBtnRight, isLastDino && styles.navBtnDisabled]}
          onPress={onNext}
          disabled={isLastDino}
        >
          <Text style={styles.navBtnText}>›</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const nameBlock = (
    <View>
      <Text style={styles.name}>{String(dino.name_hu)}</Text>
      {!!latinFull && <Text style={styles.latin}>{latinFull}</Text>}
    </View>
  );

  const descriptionBlock = (
    <View style={styles.descriptionCol}>
      {!!dino.description_hu && (
        <Text style={styles.description}>{String(dino.description_hu)}</Text>
      )}
      {onDetails && (
        <PressableButton
          onPress={onDetails}
          style={styles.detailsBtn}
          shadowColor={COLORS.accentDark}
          containerStyle={styles.detailsBtnContainer}
        >
          <Text style={styles.detailsBtnText}>Részletek</Text>
        </PressableButton>
      )}
    </View>
  );

  const characterSelector = isDesktop && characters && characters.length > 0 && (
    <View style={styles.charSelector}>
      {characters.map((c) => (
        <TouchableOpacity
          key={c.id}
          onPress={() => onCharacterSelect?.(c)}
          style={[styles.charThumb, selectedCharacter?.id === c.id && styles.charThumbActive]}
        >
          {c.imageAsset ? (
            <Image source={c.imageAsset} style={styles.charThumbImg} resizeMode="contain" />
          ) : (
            <View style={[styles.charThumbImg, styles.charThumbPlaceholder]}>
              <Text style={styles.charThumbInitial}>{c.name.charAt(0)}</Text>
            </View>
          )}
          <Text style={styles.charThumbName} numberOfLines={1}>{c.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.card}>
      {heroBlock}

      {showTimeline && !!mya && (
        <View style={styles.timelineContainer}>
          <PeriodTimeline mya_min={dino.mya_min} mya_max={dino.mya_max} />
        </View>
      )}

      {/* Mobil: oszlop. Desktop: bal oszlop (180px) = név + metadata; jobb = leírás + CTA */}
      <View style={[styles.content, { flexDirection: isDesktop ? 'row' : 'column', gap: 16 }]}>
        <View style={isDesktop ? styles.leftCol : null}>
          {nameBlock}
          <View style={styles.metaList}>
            {metaCards.map((item) => (
              <MetaCard key={item.label} label={item.label} value={item.value} />
            ))}
          </View>
          {characterSelector}
        </View>
        {descriptionBlock}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.cardLarge,
    overflow: 'hidden',
    alignSelf: 'stretch',
    marginVertical: 8,
  },
  heroWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.bgDark,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFallbackText: {
    fontSize: 44,
  },
  characterOverlay: {
    position: 'absolute',
  },

  overlayBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.25)',
    backgroundColor: 'rgba(40,54,24,0.72)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeTopLeft: { top: 10, left: 10 },
  badgeTopRight: { top: 10, right: 10 },
  badgeBottomLeft: { bottom: 10, left: 10 },
  badgeBottomRight: { bottom: 10, right: 10 },
  overlayIcon: { fontSize: 12 },
  overlayText: {
    color: COLORS.cream,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },

  navBtn: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -18 }],
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(40,54,24,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnLeft: { left: 10 },
  navBtnRight: { right: 10 },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: {
    color: COLORS.cream,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 26,
  },

  timelineContainer: {
    paddingHorizontal: 12,
    paddingTop: 10,
  },

  content: {
    padding: 16,
  },
  leftCol: {
    width: 180,
  },
  name: {
    color: COLORS.bgDark,
    fontSize: 20,
    fontWeight: '900',
    fontFamily: FONTS.bold,
  },
  latin: {
    color: COLORS.accentDark,
    fontSize: 14,
    fontStyle: 'italic',
    fontFamily: FONTS.heading,
    marginTop: 2,
  },
  metaList: {
    gap: 8,
    marginTop: 12,
  },
  metaCard: {
    backgroundColor: COLORS.cardMuted,
    borderRadius: RADIUS.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaCardLabel: {
    color: COLORS.accentDark,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
    fontFamily: FONTS.bold,
  },
  metaCardValue: {
    color: COLORS.bgDark,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONTS.body,
  },

  descriptionCol: {
    flex: 1,
    minWidth: 0,
  },
  description: {
    color: COLORS.bgDark,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FONTS.body,
  },
  detailsBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.button,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  detailsBtnContainer: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  detailsBtnText: {
    color: COLORS.bgDark,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  charSelector: {
    marginTop: 12,
    gap: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  charThumb: {
    width: '47%',
    backgroundColor: COLORS.cardMuted,
    borderWidth: 1,
    borderColor: 'rgba(40,54,24,0.12)',
    borderRadius: RADIUS.card,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 6,
  },
  charThumbActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(221,161,94,0.25)',
  },
  charThumbImg: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  charThumbPlaceholder: {
    backgroundColor: 'rgba(40,54,24,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  charThumbInitial: {
    color: COLORS.bgDark,
    fontWeight: '800',
  },
  charThumbName: {
    color: COLORS.bgDark,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
});
