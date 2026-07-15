// TradingCard — a gyűjtői kártya design, immár a DinoCard szerepét is
// átvéve: navigáció a képre helyezett nyilakkal + lebegő progress pontok
// (BrowseScreen ezen keresztül lépteti a csomag lényeit).
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';

const CARD_MAX_WIDTH_MOBILE = 480;
const CARD_MAX_WIDTH_DESKTOP = 600;

// A `creatures.rarity` oszlop angol értékeket tárol (common/rare/epic/legendary),
// a kártyán viszont magyarul jelenítjük meg — lásd CollectionScreen RARITY_COLOR,
// ami ugyanezt a színskálát használja (ott csak jelvényszínként, szöveg nélkül).
const RARITY_INFO = {
  common: { label: 'gyakori', color: '#c8ccbe' },
  rare: { label: 'ritka', color: '#8ecbe6' },
  epic: { label: 'epikus', color: '#c9a6e6' },
  legendary: { label: 'legendás', color: '#f0c674' },
};

function formatRange(min, max, unit) {
  if (min == null && max == null) return '—';
  if (min != null && max != null && min !== max) return `${min}–${max} ${unit}`;
  return `${max ?? min} ${unit}`;
}

function MetaRow({ label, value, valueColor, striped }) {
  return (
    <View style={[s.metaRow, striped && s.metaRowStriped]}>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={[s.metaValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

function ProgressDots({ current, total }) {
  if (!total || total <= 0) return null;
  return (
    <View style={s.progressDots}>
      {Array.from({ length: total }).map((_, i) => (
        <Text key={i} style={[s.progressDot, i < current && s.progressDotActive]}>
          ●
        </Text>
      ))}
    </View>
  );
}

// dino: adaptCreature() alakú objektum (name_hu, name_latin, epoch, mya_min/max,
// length_m_min/max, weight_kg_min/max, region, description_hu, rarity, diet_hu).
export default function TradingCard({
  dino,
  imageSource,
  onPrevious,
  onNext,
  isFirstDino,
  isLastDino,
  nextIcon = '›',
  currentIndex = null,
  totalCount = null,
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 700;
  const cardMaxWidth = isDesktop ? CARD_MAX_WIDTH_DESKTOP : CARD_MAX_WIDTH_MOBILE;

  if (!dino) return null;

  const rarityKey = String(dino.rarity || '').toLowerCase();
  const rarityInfo = RARITY_INFO[rarityKey];

  const age = dino.epoch
    ? `${dino.epoch} · ${formatRange(dino.mya_min, dino.mya_max, 'millió éve')}`
    : formatRange(dino.mya_min, dino.mya_max, 'millió éve');
  const length = formatRange(dino.length_m_min, dino.length_m_max, 'm');
  const weight = formatRange(dino.weight_kg_min, dino.weight_kg_max, 'kg');

  return (
    <View style={[s.card, { maxWidth: cardMaxWidth }]}>
      {/* Fejléc */}
      <View style={s.header}>
        <Text style={s.name} numberOfLines={1}>{dino.name_hu}</Text>
        {!!dino.name_latin && <Text style={s.latin}>{dino.name_latin}</Text>}
      </View>

      {/* Kép — a csomagon belüli léptetés a rá helyezett nyilakkal történik */}
      <View style={s.imageFrame}>
        {imageSource ? (
          <Image source={imageSource} style={s.image} resizeMode="cover" />
        ) : (
          <View style={[s.image, s.imageFallback]}>
            <Text style={s.imageFallbackText}>🦴</Text>
          </View>
        )}

        {onPrevious && (
          <TouchableOpacity
            style={[s.navBtn, s.navBtnLeft, isFirstDino && s.navBtnDisabled]}
            onPress={onPrevious}
            disabled={isFirstDino}
          >
            <Text style={s.navBtnText}>‹</Text>
          </TouchableOpacity>
        )}
        {onNext && (
          <TouchableOpacity
            style={[s.navBtn, s.navBtnRight, isLastDino && s.navBtnDisabled]}
            onPress={onNext}
            disabled={isLastDino}
          >
            <Text style={s.navBtnText}>{nextIcon}</Text>
          </TouchableOpacity>
        )}
      </View>

      {currentIndex != null && totalCount != null && (
        <ProgressDots current={currentIndex} total={totalCount} />
      )}

      {/* Törzs: táblázat + leírás */}
      <View style={s.body}>
        <View style={s.table}>
          <MetaRow label="Kor" value={age} striped />
          <MetaRow label="Hossz" value={length} />
          <MetaRow label="Súly" value={weight} striped />
          <MetaRow label="Ország" value={dino.region || '—'} />
          {!!dino.rarity && (
            <MetaRow
              label="Ritkaság"
              value={rarityInfo ? rarityInfo.label : dino.rarity}
              valueColor={rarityInfo?.color}
              striped
            />
          )}
          {!!dino.diet_hu && <MetaRow label="Étrend" value={dino.diet_hu} />}
        </View>

        {!!dino.description_hu && (
          <Text style={s.description}>{dino.description_hu}</Text>
        )}
      </View>

      {/* Lábléc */}
      <View style={s.footer}>
        <Text style={s.footerText}>© DMM Collection</Text>
        {currentIndex != null && totalCount != null && (
          <Text style={s.footerText}>No. {String(currentIndex).padStart(3, '0')}/{totalCount}</Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: COLORS.bgDark,
    borderRadius: RADIUS.cardLarge,
    borderWidth: 2,
    borderColor: COLORS.accent,
    overflow: 'hidden',
    paddingBottom: 14,
    marginVertical: 8,
  },
  header: {
    paddingTop: 18,
    paddingBottom: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  name: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontWeight: '900',
    fontSize: 24,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  latin: {
    color: COLORS.accent,
    fontFamily: FONTS.heading,
    fontStyle: 'italic',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },

  imageFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  imageFallbackText: { fontSize: 48 },

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
    color: 'rgba(255,255,255,0.3)',
  },
  progressDotActive: {
    color: COLORS.accent,
    fontSize: 10,
  },

  // A régiógombokhoz hasonló, sötét-áttetsző csíkozás — nincs önálló, világos
  // hátterű "body" blokk, minden szöveg a kártya közös sötét alapján ül.
  body: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  table: {
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  metaRowStriped: {
    backgroundColor: 'rgba(0,95,115,0.45)',
  },
  metaLabel: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontWeight: '800',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  metaValue: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    fontSize: 13,
  },
  description: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.9,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  footerText: {
    color: COLORS.accent,
    fontFamily: FONTS.body,
    fontSize: 10,
    letterSpacing: 0.5,
    opacity: 0.85,
  },
});
