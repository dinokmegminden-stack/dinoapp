// TradingCard — önálló "gyűjtői kártya" design, a DinoCard.js "kvartett"
// stílusától eltérő, letisztultabb fejléc / táblázatos törzs / lábléc
// elrendezéssel (kártyagyűjtemény-generátor kérésre készült minta).
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';

const CARD_MAX_WIDTH = 420;

function formatRange(min, max, unit) {
  if (min == null && max == null) return '—';
  if (min != null && max != null && min !== max) return `${min}–${max} ${unit}`;
  return `${max ?? min} ${unit}`;
}

function MetaRow({ label, value, striped }) {
  return (
    <View style={[s.metaRow, striped && s.metaRowStriped]}>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={s.metaValue}>{value}</Text>
    </View>
  );
}

// dino: adaptCreature() alakú objektum (name_hu, name_latin, epoch, mya_min/max,
// length_m_min/max, weight_kg_min/max, region, description_hu).
export default function TradingCard({ dino, imageSource, cardNumber }) {
  const age = dino.epoch
    ? `${dino.epoch} · ${formatRange(dino.mya_min, dino.mya_max, 'millió éve')}`
    : formatRange(dino.mya_min, dino.mya_max, 'millió éve');
  const length = formatRange(dino.length_m_min, dino.length_m_max, 'm');
  const weight = formatRange(dino.weight_kg_min, dino.weight_kg_max, 'kg');

  return (
    <View style={s.card}>
      {/* Fejléc */}
      <View style={s.header}>
        <Text style={s.name} numberOfLines={1}>{dino.name_hu}</Text>
        {!!dino.name_latin && <Text style={s.latin}>{dino.name_latin}</Text>}
      </View>

      {/* Kép */}
      <View style={s.imageFrame}>
        {imageSource ? (
          <Image source={imageSource} style={s.image} resizeMode="cover" />
        ) : (
          <View style={[s.image, s.imageFallback]}>
            <Text style={s.imageFallbackText}>🦴</Text>
          </View>
        )}
      </View>

      {/* Törzs: táblázat + leírás */}
      <View style={s.body}>
        <View style={s.table}>
          <MetaRow label="Kor" value={age} striped />
          <MetaRow label="Hossz" value={length} />
          <MetaRow label="Súly" value={weight} striped />
          <MetaRow label="Ország" value={dino.region || '—'} />
        </View>

        {!!dino.description_hu && (
          <Text style={s.description}>{dino.description_hu}</Text>
        )}
      </View>

      {/* Lábléc */}
      <View style={s.footer}>
        <Text style={s.footerText}>© DMM Collection</Text>
        {!!cardNumber && <Text style={s.footerText}>{cardNumber}</Text>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
    alignSelf: 'center',
    backgroundColor: COLORS.bgDark,
    borderRadius: RADIUS.cardLarge,
    borderWidth: 2,
    borderColor: COLORS.accent,
    overflow: 'hidden',
    paddingBottom: 14,
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
  },
  image: { width: '100%', height: '100%' },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  imageFallbackText: { fontSize: 48 },

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
