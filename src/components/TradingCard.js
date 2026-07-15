// TradingCard — "múzeumi tábla" stílusú gyűjtői kártya (DinoCard szerepét is
// átvéve: a névsor melletti nyilak lépegetnek a csomagon belül, BrowseScreen
// ezen keresztül hajtja végre a navigációt).
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import {
  useFonts as useLuckiestGuy,
  LuckiestGuy_400Regular,
} from '@expo-google-fonts/luckiest-guy';
import {
  useFonts as useFredoka,
  Fredoka_400Regular,
  Fredoka_600SemiBold,
} from '@expo-google-fonts/fredoka';
import { COLORS, RADIUS } from '../constants/theme';

const CARD_MAX_WIDTH_MOBILE = 480;
const CARD_MAX_WIDTH_DESKTOP = 600;
const CARD_RADIUS = 14;

// A `creatures.rarity` oszlop angol értékeket tárol (common/rare/epic/legendary),
// a táblán viszont magyarul, egységesen arany színnel jelenik meg.
const RARITY_LABEL = {
  common: 'gyakori',
  rare: 'ritka',
  epic: 'epikus',
  legendary: 'legendás',
};

function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// A Kor mindig a nagyobb (régebbi) számmal kezdődik: "X–YM", X > Y.
function formatAgeRange(a, b) {
  if (a == null && b == null) return '—';
  if (a != null && b != null && a !== b) {
    return `${Math.max(a, b)}–${Math.min(a, b)}M`;
  }
  return `${a ?? b}M`;
}

function formatLengthRange(min, max) {
  if (min == null && max == null) return '—';
  if (min != null && max != null && min !== max) return `${min}–${max}m`;
  return `${max ?? min}m`;
}

function StatCell({ label, value, bodyFont, boldFont }) {
  return (
    <View style={s.statCell}>
      <Text style={[s.statLabel, { fontFamily: bodyFont }]}>{label}</Text>
      <Text style={[s.statValue, { fontFamily: boldFont }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

// dino: adaptCreature() alakú objektum (name_hu, name_latin, latin_name_ending,
// mya_min/max, length_m_min/max, region, rarity, diet_hu, description_hu).
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

  const [luckiestLoaded] = useLuckiestGuy({ LuckiestGuy_400Regular });
  const [fredokaLoaded] = useFredoka({ Fredoka_400Regular, Fredoka_600SemiBold });
  const titleFont = luckiestLoaded ? 'LuckiestGuy_400Regular' : 'System';
  const bodyFont = fredokaLoaded ? 'Fredoka_400Regular' : 'System';
  const boldFont = fredokaLoaded ? 'Fredoka_600SemiBold' : 'System';

  if (!dino) return null;

  const rarityKey = String(dino.rarity || '').toLowerCase();
  const rarityLabel = RARITY_LABEL[rarityKey] || dino.rarity;

  const latinFull = dino.latin_name_ending && !String(dino.name_latin || '').toLowerCase().endsWith(String(dino.latin_name_ending).toLowerCase())
    ? [dino.name_latin, dino.latin_name_ending].filter(Boolean).join(' ')
    : dino.name_latin;

  const age = formatAgeRange(dino.mya_min, dino.mya_max);
  const length = formatLengthRange(dino.length_m_min, dino.length_m_max);

  return (
    <View style={[s.card, { maxWidth: cardMaxWidth }]}>
      {/* Hero kép */}
      <View style={s.imageFrame}>
        {imageSource ? (
          <Image source={imageSource} style={s.image} resizeMode="cover" />
        ) : (
          <View style={[s.image, s.imageFallback]}>
            <Text style={s.imageFallbackText}>🦴</Text>
          </View>
        )}
      </View>

      {/* Cím sáv — a lapozó nyilak a név mellett */}
      <View style={s.titleBar}>
        {onPrevious ? (
          <TouchableOpacity
            style={[s.navBtn, isFirstDino && s.navBtnDisabled]}
            onPress={onPrevious}
            disabled={isFirstDino}
          >
            <Text style={[s.navBtnText, { fontFamily: bodyFont }]}>‹</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.navBtnSpacer} />
        )}

        <View style={s.nameBlock}>
          <Text style={[s.name, { fontFamily: titleFont }]} numberOfLines={1}>{dino.name_hu}</Text>
          {!!latinFull && (
            <Text style={[s.latin, { fontFamily: boldFont }]} numberOfLines={1}>{latinFull}</Text>
          )}
        </View>

        {onNext ? (
          <TouchableOpacity
            style={[s.navBtn, isLastDino && s.navBtnDisabled]}
            onPress={onNext}
            disabled={isLastDino}
          >
            <Text style={[s.navBtnText, { fontFamily: bodyFont }]}>{nextIcon}</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.navBtnSpacer} />
        )}
      </View>

      {/* Törzs */}
      <View style={s.body}>
        <View style={s.statRow}>
          <StatCell label="Kor" value={age} bodyFont={bodyFont} boldFont={boldFont} />
          <StatCell label="Hossz" value={length} bodyFont={bodyFont} boldFont={boldFont} />
          <StatCell label="Ország" value={dino.region || '—'} bodyFont={bodyFont} boldFont={boldFont} />
          <StatCell label="Étrend" value={capitalize(dino.diet_hu) || '—'} bodyFont={bodyFont} boldFont={boldFont} />
        </View>

        {!!dino.description_hu && (
          <Text style={[s.description, { fontFamily: bodyFont }]}>{dino.description_hu}</Text>
        )}

        <View style={s.divider} />

        <View style={s.rarityLine}>
          {!!rarityLabel && (
            <Text style={[s.rarityText, { fontFamily: boldFont }]}>{rarityLabel.toUpperCase()}</Text>
          )}
          {currentIndex != null && totalCount != null && (
            <Text style={[s.counterText, { fontFamily: bodyFont }]}>
              No. {String(currentIndex).padStart(3, '0')}/{totalCount}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    width: '100%',
    alignSelf: 'center',
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    marginVertical: 8,
  },

  imageFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.olive,
  },
  image: { width: '100%', height: '100%' },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  imageFallbackText: { fontSize: 48 },

  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.action,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  nameBlock: {
    flex: 1,
    alignItems: 'center',
  },
  name: {
    color: COLORS.cream,
    fontSize: 26,
    textAlign: 'center',
  },
  latin: {
    color: COLORS.darkGreen,
    fontStyle: 'italic',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },

  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnSpacer: {
    width: 32,
    height: 32,
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: {
    color: COLORS.cream,
    fontSize: 22,
    lineHeight: 24,
  },

  body: {
    backgroundColor: COLORS.darkGreen,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
  },
  rarityLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rarityText: {
    color: COLORS.gold,
    fontSize: 14,
    letterSpacing: 1,
  },
  counterText: {
    color: COLORS.cream,
    opacity: 0.6,
    fontSize: 13,
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(254,250,224,0.15)',
    marginVertical: 14,
  },

  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statCell: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: COLORS.olive,
    borderRadius: RADIUS.card,
    paddingVertical: 7,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.cream,
    opacity: 0.85,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: {
    color: COLORS.gold,
    fontSize: 15,
    marginTop: 4,
  },

  description: {
    color: COLORS.cream,
    opacity: 0.9,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 16,
  },
});
