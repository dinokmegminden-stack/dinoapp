// DinoCard — "kvartett" kártyajáték-lap (Quartett/Top Trumps minta):
// fejlécben két jelvény (ritkaság + étrend) a nagybetűs név köré, középen
// nagy kép (kb. a kártya fele). Alul 2 oszlop: bal a teljes leírás (nem
// vágva), jobb az infokártya-pillék (Kor, Felfedező, Hossz, Súly, Régió).
// Max 480px széles kártya — a magassága szándékosan NEM fix arányú, hanem
// a tartalomhoz igazodik. Egy korábbi 9:14 arányú + fix képmagasságú verzió
// valós telefonon garantáltan levágta a leírást és a statisztikákat
// (overflow:hidden mögé), ezért a kép mostantól a kártya szélességéhez
// arányosan (16:9) skálázódik, nem fix pixelben.
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import PressableButton from './PressableButton';

const CARD_MAX_WIDTH_MOBILE = 480;
const CARD_MAX_WIDTH_DESKTOP = 600;

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

function HeaderBadge({ icon, colorStyle }) {
  return (
    <View
      style={[
        styles.headerBadge,
        colorStyle && { borderColor: colorStyle.border, backgroundColor: colorStyle.bg },
      ]}
    >
      <Text style={styles.headerBadgeIcon}>{icon}</Text>
    </View>
  );
}

function InfoPill({ label, value }) {
  return (
    <View style={styles.infoPill}>
      <Text style={styles.infoPillLabel}>{label}</Text>
      <Text style={styles.infoPillValue}>{value}</Text>
    </View>
  );
}

function ProgressDots({ current, total }) {
  if (!total || total <= 0) return null;
  return (
    <View style={styles.progressDots}>
      {Array.from({ length: total }).map((_, i) => (
        <Text key={i} style={[styles.progressDot, i < current && styles.progressDotActive]}>
          ●
        </Text>
      ))}
    </View>
  );
}

export default function DinoCard({
  dino,
  imageSource,
  onPrevious,
  onNext,
  isFirstDino,
  isLastDino,
  nextIcon = '›',
  onDetails,
  currentIndex = null,
  totalCount = null,
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 700;
  const cardMaxWidth = isDesktop ? CARD_MAX_WIDTH_DESKTOP : CARD_MAX_WIDTH_MOBILE;

  if (!dino) return null;

  const img = imageSource || null;
  const rarityKey = String(dino.rarity || '').toLowerCase();
  const rarityStyle = RARITY_STYLES[rarityKey] || RARITY_STYLES.gyakori;
  const dietIcon = DIET_ICON[String(dino.diet_hu || '').toLowerCase()] || '❓';

  const mya = formatRange(dino.mya_max, dino.mya_min, 'millió éve');
  const length = formatRange(dino.length_m_min, dino.length_m_max, 'm');
  const weight = formatRange(dino.weight_kg_min, dino.weight_kg_max, 'kg');
  const nameLatin = dino.name_latin || '';
  const latinEnding = dino.latin_name_ending || '';
  const latinFull = latinEnding && !nameLatin.toLowerCase().endsWith(latinEnding.toLowerCase())
    ? [nameLatin, latinEnding].filter(Boolean).join(' ')
    : nameLatin;

  const statRows = [
    mya && { label: 'Kor', value: dino.epoch ? `${dino.epoch} · ${mya}` : mya },
    length && { label: 'Hossz', value: length },
    weight && { label: 'Súly', value: weight },
    dino.discovered_country && { label: 'Ország', value: String(dino.discovered_country) },
    dino.discoverer_name && {
      label: 'Felfedező',
      value: dino.discovery_year
        ? `${dino.discoverer_name} (${dino.discovery_year})`
        : String(dino.discoverer_name),
    },
  ].filter(Boolean);

  return (
    <View style={[styles.card, { maxWidth: cardMaxWidth }]}>
      {currentIndex != null && totalCount != null && (
        <ProgressDots current={currentIndex} total={totalCount} />
      )}
      {/* Fejléc: jelvény — név — jelvény, mint egy kvartett-lapon */}
      <View style={styles.header}>
        {!!dino.rarity ? <HeaderBadge icon="💎" colorStyle={rarityStyle} /> : <View style={styles.headerBadgeSpacer} />}
        <View style={styles.nameBlock}>
          <Text style={styles.name} numberOfLines={2}>{String(dino.name_hu)}</Text>
          {!!latinFull && <Text style={styles.latin} numberOfLines={1}>{latinFull}</Text>}
        </View>
        {!!dino.diet_hu ? <HeaderBadge icon={dietIcon} /> : <View style={styles.headerBadgeSpacer} />}
      </View>

      {/* Kép — matricaszerűen középen, kb. a kártya fele */}
      <View style={styles.imageFrame}>
        {img ? (
          <Image source={img} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={styles.imageFallbackText}>🦴</Text>
          </View>
        )}

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
            <Text style={styles.navBtnText}>{nextIcon}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2 oszlop: bal a teljes leírás, jobb az infokártyák — mint egy Top Trumps lapon */}
      <View style={styles.lowerRow}>
        <View style={styles.textCol}>
          {!!dino.description_hu && (
            <Text style={styles.description}>{String(dino.description_hu)}</Text>
          )}
        </View>
        <View style={styles.statCol}>
          {statRows.map((item) => (
            <InfoPill key={item.label} label={item.label} value={item.value} />
          ))}
        </View>
      </View>

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
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.cardLarge,
    borderWidth: 1,
    borderColor: 'rgba(40,54,24,0.15)',
    alignSelf: 'center',
    marginVertical: 8,
  },

  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  progressDot: {
    fontSize: 8,
    color: 'rgba(40,54,24,0.3)',
  },
  progressDotActive: {
    color: COLORS.accent,
    fontSize: 10,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 14,
    paddingHorizontal: 14,
  },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.accentDark,
    backgroundColor: COLORS.cardMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeSpacer: {
    width: 40,
    height: 40,
  },
  headerBadgeIcon: {
    fontSize: 18,
  },
  nameBlock: {
    flex: 1,
    alignItems: 'center',
  },
  name: {
    color: COLORS.bgDark,
    fontSize: 22,
    fontWeight: '900',
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  latin: {
    color: COLORS.accentDark,
    fontSize: 11,
    fontStyle: 'italic',
    fontFamily: FONTS.heading,
    textAlign: 'center',
    marginTop: 2,
  },

  imageFrame: {
    marginTop: 10,
    marginLeft: 0,
    marginRight: 0,
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: COLORS.bgDark,
    position: 'relative',
    overflow: 'hidden',
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
    fontSize: 44,
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

  lowerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginHorizontal: 14,
    marginBottom: 14,
  },
  textCol: {
    flex: 1,
  },
  description: {
    color: COLORS.bgDark,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: FONTS.body,
    fontWeight: '700',
  },
  statCol: {
    flex: 1,
    gap: 6,
  },
  infoPill: {
    backgroundColor: COLORS.bgMid,
    borderRadius: RADIUS.card,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  infoPillLabel: {
    color: COLORS.cream,
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    opacity: 0.8,
    fontFamily: FONTS.bold,
  },
  infoPillValue: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 1,
    fontFamily: FONTS.bold,
  },

  detailsBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.button,
    paddingVertical: 10,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  detailsBtnContainer: {
    marginTop: 10,
    marginBottom: 14,
    alignSelf: 'center',
  },
  detailsBtnText: {
    color: COLORS.bgDark,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
