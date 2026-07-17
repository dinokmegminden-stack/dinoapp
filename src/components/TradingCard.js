// TradingCard — "múzeumi tábla" stílusú gyűjtői kártya (DinoCard szerepét is
// átvéve: a névsor melletti nyilak lépegetnek a csomagon belül, BrowseScreen
// ezen keresztül hajtja végre a navigációt).
//
// Két elrendezés érhető el, a jobb felső sarokban lévő formátumválasztóval
// váltva köztük: "classic" (eredeti, függőleges) és "alt" (kép+névsáv balra,
// idővonal+statisztikák jobbra). A választás komponens-szintű state, ami a
// csomagon belüli lapozás (Next/Prev) alatt megmarad, mert a BrowseScreen
// ugyanazt a TradingCard-példányt tartja életben, csak a `dino` propot cseréli.
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { MAX_FAVORITES } from '../hooks/useFavorites';

const CARD_MAX_WIDTH_MOBILE = 480;
const CARD_MAX_WIDTH_DESKTOP = 600;
// A jobb oldali adatoszlop természetes (tartalom által diktált) szélessége
// nagy kártyánál — ebből számoljuk vissza a képoszlop szélességét úgy, hogy a
// kép a saját 16:9 arányában pontosan kitöltse a magasságát, "letterbox" sáv
// (üres olív csík a kép fölött/alatt) nélkül.
const ALT_DATA_COL_WIDTH_DESKTOP = Math.round(380 * 1.1);
const ALT_CARD_HEIGHT_DESKTOP = 563;
const ALT_NAME_BAND_HEIGHT_DESKTOP = 85;
const ALT_IMAGE_WIDTH_DESKTOP = Math.round((ALT_CARD_HEIGHT_DESKTOP - ALT_NAME_BAND_HEIGHT_DESKTOP) * (16 / 9));
const ALT_CARD_MAX_WIDTH_DESKTOP = ALT_IMAGE_WIDTH_DESKTOP + ALT_DATA_COL_WIDTH_DESKTOP;
const CARD_RADIUS = 14;

// A `creatures.rarity` oszlop angol értékeket tárol (common/rare/epic/legendary),
// a táblán viszont magyarul, egységesen arany színnel jelenik meg.
const RARITY_LABEL = {
  common: 'gyakori',
  rare: 'ritka',
  epic: 'epikus',
  legendary: 'legendás',
};

// Az idővonal-sáv fix, Mesozoikum-alapú skálája (250-66 millió év). A gyűjtemény
// néhány régiója (pl. Kárpát-medence jégkorszaki emlősei) ezen kívül eshet — ott a
// marker rejtve marad, de maga a sáv továbbra is megjelenik kontextusként.
const MYA_SCALE_START = 250;
const MYA_SCALE_END = 66;
const ERA_BOUNDS = { triassicEnd: 201, jurassicEnd: 145 };

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

function formatDiscovery(name, year) {
  if (name && year) return `${name} (${year})`;
  if (name) return name;
  if (year) return String(year);
  return '—';
}

function pctForMya(m) {
  return ((MYA_SCALE_START - m) / (MYA_SCALE_START - MYA_SCALE_END)) * 100;
}

function StatCell({ label, value, bodyFont, boldFont }) {
  return (
    <View style={s.statCell}>
      <Text style={[s.statLabel, { fontFamily: bodyFont }]}>{label}</Text>
      <Text style={[s.statValue, { fontFamily: boldFont }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function AltStatCell({ label, value, bodyFont, boldFont, large }) {
  return (
    <View style={[s.altStatCell, large && s.altStatCellLarge]}>
      <Text style={[s.altStatLabel, large && s.altStatLabelLarge, { fontFamily: bodyFont }]} numberOfLines={1}>{label}</Text>
      <Text style={[s.altStatValue, large && s.altStatValueLarge, { fontFamily: boldFont }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

// Vízszintes, skálázott idővonal a Mezozoikum korszakhatáraival és egy
// vastag csíkkal a dínó élt-idejére (nem egyetlen pötty, hanem a teljes
// mya_min–mya_max tartomány) — a pozíciókat százalékban számoljuk, hogy
// RN-ben (ahol nincs CSS calc/vw) egyszerűen abszolút pozicionálható legyen.
function MesoTimeline({ myaMin, myaMax, boldFont, large }) {
  const pctMin = myaMin != null ? pctForMya(myaMin) : null;
  const pctMax = myaMax != null ? pctForMya(myaMax) : null;
  const rangePcts = [pctMin, pctMax].filter((p) => p != null);

  const rawLeftPct = rangePcts.length ? Math.min(...rangePcts) : null;
  const rawRightPct = rangePcts.length ? Math.max(...rangePcts) : null;
  const rawMidPct = rangePcts.length ? (rawLeftPct + rawRightPct) / 2 : null;

  const showRange = rawMidPct != null && rawMidPct >= -3 && rawMidPct <= 103;
  const leftPct = showRange ? Math.max(0, Math.min(100, rawLeftPct)) : null;
  const rightPct = showRange ? Math.max(0, Math.min(100, rawRightPct)) : null;
  const midPct = showRange ? Math.max(0, Math.min(100, rawMidPct)) : null;

  const triassicPct = ((MYA_SCALE_START - ERA_BOUNDS.triassicEnd) / (MYA_SCALE_START - MYA_SCALE_END)) * 100;
  const jurassicPct = ((MYA_SCALE_START - ERA_BOUNDS.jurassicEnd) / (MYA_SCALE_START - MYA_SCALE_END)) * 100;

  return (
    <LinearGradient colors={[COLORS.action, COLORS.accentDark]} style={[s.timeline, large && s.timelineLarge]}>
      <View style={s.timelineLabelRow}>
        <Text style={[s.timelineLabelText, large && s.timelineLabelTextLarge, { fontFamily: boldFont }]}>250M</Text>
        <Text style={[s.timelineLabelText, large && s.timelineLabelTextLarge, { fontFamily: boldFont }]}>MEZOZOIKUM</Text>
        <Text style={[s.timelineLabelText, large && s.timelineLabelTextLarge, { fontFamily: boldFont }]}>66M</Text>
      </View>

      <View style={s.timelineEras}>
        <View style={[s.era, { flex: triassicPct, backgroundColor: '#8fb28a' }]} />
        <View style={[s.era, { flex: jurassicPct - triassicPct, backgroundColor: '#7fa9c9' }]} />
        <View style={[s.era, { flex: 100 - jurassicPct, backgroundColor: '#cf9a5c' }]} />
      </View>

      <View style={s.timelineTrack}>
        <View style={s.timelineBaseline} />
        <View style={[s.eraBoundaryTick, large && s.eraBoundaryTickLarge, { left: `${triassicPct}%` }]} />
        <View style={[s.eraBoundaryTick, large && s.eraBoundaryTickLarge, { left: `${jurassicPct}%` }]} />
        {showRange && (
          <View
            style={[
              s.rangeBar,
              large && s.rangeBarLarge,
              { left: `${leftPct}%`, width: `${rightPct - leftPct}%` },
            ]}
          />
        )}
        {showRange && (myaMin != null || myaMax != null) && (
          <View style={[s.marker, { left: `${midPct}%` }]}>
            <View style={[s.markerFlag, large && s.markerFlagLarge]}>
              <Text style={[s.markerFlagText, large && s.markerFlagTextLarge, { fontFamily: boldFont }]}>
                {formatAgeRange(myaMax, myaMin)}
              </Text>
            </View>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

// dino: adaptCreature() alakú objektum (name_hu, name_latin, latin_name_ending,
// mya_min/max, length_m_min/max, region, rarity, diet_hu, description_hu, csalad,
// discoverer_name, discovery_year).
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
  isFavorite = false,
  onToggleFavorite = null,
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 700;
  // Ha a kedvenc-keret (10) betelt, a szívecske megnyomása nem jelöl be újat —
  // ilyenkor egy pár másodperces figyelmeztető buborékot mutatunk helyette.
  const [showFavoriteLimitHint, setShowFavoriteLimitHint] = useState(false);
  const handleHeartPress = () => {
    if (!onToggleFavorite) return;
    const ok = onToggleFavorite();
    if (!ok) {
      setShowFavoriteLimitHint(true);
      setTimeout(() => setShowFavoriteLimitHint(false), 2200);
    }
  };
  const heartButton = onToggleFavorite ? (
    <View style={s.heartWrap}>
      <TouchableOpacity
        onPress={handleHeartPress}
        style={s.heartBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[s.heartIcon, isFavorite && s.heartIconActive]}>{isFavorite ? '♥' : '♡'}</Text>
      </TouchableOpacity>
      {showFavoriteLimitHint && (
        <View style={s.heartHintBubble}>
          <Text style={s.heartHintText}>Max {MAX_FAVORITES} kedvenc</Text>
        </View>
      )}
    </View>
  ) : null;
  // A fix méretű "nagy blokk" elrendezés csak elég széles ablaknál fér el
  // torzulás/levágás nélkül — ez alatt az "alt" nézet visszaesik a rugalmas,
  // százalékos oszlopszélességre (ugyanaz, mint desktopon kívül).
  const isBigCard = width >= 1300;
  const [layout, setLayout] = useState('classic');
  const cardMaxWidth = isDesktop
    ? (layout === 'alt' ? (isBigCard ? ALT_CARD_MAX_WIDTH_DESKTOP : CARD_MAX_WIDTH_DESKTOP) : CARD_MAX_WIDTH_DESKTOP)
    : CARD_MAX_WIDTH_MOBILE;

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
  const discovery = formatDiscovery(dino.discoverer_name, dino.discovery_year);

  // React Native fontSize csak számot fogad (nincs rem/vw/clamp()) — a
  // "viewport-alapú" nagyítást az isDesktop töréspont adja.
  const descriptionFontSize = isDesktop ? 16 : 15;
  const altDescriptionFontSize = isBigCard ? 17 : (isDesktop ? 13.5 : 12);

  const formatToggle = (
    <View style={s.formatToggle}>
      <TouchableOpacity
        style={[s.formatToggleBtn, layout === 'classic' && s.formatToggleBtnActive]}
        onPress={() => setLayout('classic')}
      >
        <Text style={s.formatToggleIcon}>▤</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[s.formatToggleBtn, layout === 'alt' && s.formatToggleBtnActive]}
        onPress={() => setLayout('alt')}
      >
        <Text style={s.formatToggleIcon}>▥</Text>
      </TouchableOpacity>
    </View>
  );

  if (layout === 'alt') {
    return (
      <View style={[s.card, { maxWidth: cardMaxWidth }, isBigCard && { height: ALT_CARD_HEIGHT_DESKTOP }]}>
        {formatToggle}

        <View style={[s.altBody, isBigCard && s.altBodyLarge]}>
          <View style={[s.altLeftCol, isBigCard && { flexBasis: ALT_IMAGE_WIDTH_DESKTOP }]}>
            <View style={s.altImageWrap}>
              {imageSource ? (
                <Image source={imageSource} style={s.image} resizeMode="contain" />
              ) : (
                <View style={[s.image, s.imageFallback]}>
                  <Text style={s.imageFallbackText}>🦴</Text>
                </View>
              )}
            </View>

            <View style={[s.altNameBand, isBigCard && s.altNameBandLarge]}>
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

              <View style={s.altNameBlock}>
                <View style={s.nameRow}>
                  <View style={s.nameTextCol}>
                    <Text style={[s.altName, isBigCard && s.altNameLarge, { fontFamily: titleFont }]} numberOfLines={1}>{dino.name_hu}</Text>
                    {!!latinFull && (
                      <Text style={[s.altLatin, isBigCard && s.altLatinLarge, { fontFamily: boldFont }]} numberOfLines={1}>{latinFull}</Text>
                    )}
                  </View>
                  {heartButton}
                </View>
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
          </View>

          <View style={s.altDataCol}>
            <MesoTimeline myaMin={dino.mya_min} myaMax={dino.mya_max} boldFont={boldFont} large={isBigCard} />

            {(() => {
              const dataBody = (
                <>
                  <View style={[s.altStatGrid, isBigCard && s.altStatGridLarge]}>
                    <AltStatCell label="Hossz" value={length} bodyFont={bodyFont} boldFont={boldFont} large={isBigCard} />
                    <AltStatCell label="Étrend" value={capitalize(dino.diet_hu) || '—'} bodyFont={bodyFont} boldFont={boldFont} large={isBigCard} />
                    <AltStatCell label="Dínócsalád" value={dino.csalad || '—'} bodyFont={bodyFont} boldFont={boldFont} large={isBigCard} />
                    <AltStatCell label="Felfedezés" value={discovery} bodyFont={bodyFont} boldFont={boldFont} large={isBigCard} />
                  </View>

                  {!!dino.description_hu && (
                    <Text
                      style={[
                        s.altDescription,
                        { fontFamily: bodyFont, fontSize: altDescriptionFontSize, lineHeight: altDescriptionFontSize * 1.5 },
                      ]}
                      // Nagy kártyánál a doboz görgethető, így a leírás sosem vágódik
                      // le — kisebb (nem fix magasságú) nézetben a numberOfLines vet
                      // véget neki, mert ott nincs scroll, ami a túlfolyást kezelné.
                      numberOfLines={isBigCard ? undefined : (isDesktop ? 8 : 6)}
                    >
                      {dino.description_hu}
                    </Text>
                  )}

                  <View style={s.altFindRow}>
                    {!!rarityLabel && (
                      <Text style={[s.altRarityText, isBigCard && s.altRarityTextLarge, { fontFamily: boldFont }]}>{rarityLabel.toUpperCase()}</Text>
                    )}
                    {currentIndex != null && totalCount != null && (
                      <Text style={[s.altCounterText, isBigCard && s.altCounterTextLarge, { fontFamily: bodyFont }]}>
                        No. {String(currentIndex).padStart(3, '0')}/{totalCount}
                      </Text>
                    )}
                  </View>
                </>
              );

              return isBigCard ? (
                <ScrollView
                  style={s.altDataColScroll}
                  contentContainerStyle={s.altDataColBodyLarge}
                  showsVerticalScrollIndicator
                >
                  {dataBody}
                </ScrollView>
              ) : (
                <View style={s.altDataColBody}>{dataBody}</View>
              );
            })()}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.card, { maxWidth: cardMaxWidth }]}>
      {formatToggle}

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
          <View style={s.nameRow}>
            <View style={s.nameTextCol}>
              <Text style={[s.name, { fontFamily: titleFont }]} numberOfLines={1}>{dino.name_hu}</Text>
              {!!latinFull && (
                <Text style={[s.latin, { fontFamily: boldFont }]} numberOfLines={1}>{latinFull}</Text>
              )}
            </View>
            {heartButton}
          </View>
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
          <Text
            style={[
              s.description,
              { fontFamily: bodyFont, fontSize: descriptionFontSize, lineHeight: descriptionFontSize * 1.6 },
            ]}
          >
            {dino.description_hu}
          </Text>
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  nameTextCol: {
    alignItems: 'center',
  },
  heartWrap: {
    position: 'relative',
  },
  heartBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    fontSize: 20,
    color: COLORS.cream,
    opacity: 0.7,
  },
  heartIconActive: {
    color: '#e5484d',
    opacity: 1,
  },
  heartHintBubble: {
    position: 'absolute',
    top: 26,
    left: '50%',
    transform: [{ translateX: -60 }],
    width: 120,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    zIndex: 20,
  },
  heartHintText: {
    color: COLORS.cream,
    fontSize: 11,
    textAlign: 'center',
  },
  name: {
    color: COLORS.cream,
    fontSize: 26,
    textAlign: 'center',
  },
  latin: {
    color: COLORS.darkGreen,
    fontStyle: 'italic',
    fontSize: 15,
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
    fontSize: 15,
    letterSpacing: 1,
  },
  counterText: {
    color: COLORS.cream,
    opacity: 0.6,
    fontSize: 15,
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
    fontSize: 15,
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
    marginTop: 16,
  },

  // ---- formátumválasztó (bal felső sarok, mindkét elrendezésen) — a jobb
  // felső sarok "alt" nézetben átfedésben volt az idővonal "66M" feliratával.
  formatToggle: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: RADIUS.pill,
    padding: 3,
    gap: 2,
  },
  formatToggleBtn: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatToggleBtnActive: {
    backgroundColor: COLORS.gold,
  },
  formatToggleIcon: {
    color: COLORS.cream,
    fontSize: 15,
  },

  // ---- "alt" elrendezés: kép+névsáv balra, idővonal+adatok jobbra ----
  altBody: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: COLORS.darkGreen,
  },
  altBodyLarge: {
    flex: 1,
  },
  altLeftCol: {
    flexBasis: '52%',
    flexGrow: 0,
    flexShrink: 0,
  },
  altImageWrap: {
    flex: 1,
    minHeight: 200,
    backgroundColor: COLORS.olive,
  },
  altNameBand: {
    backgroundColor: COLORS.action,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  altNameBandLarge: {
    height: ALT_NAME_BAND_HEIGHT_DESKTOP,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  altNameBlock: {
    flex: 1,
    alignItems: 'center',
  },
  altName: {
    color: COLORS.cream,
    fontSize: 15,
    textAlign: 'center',
  },
  altNameLarge: {
    fontSize: 24,
  },
  altLatin: {
    color: COLORS.darkGreen,
    fontStyle: 'italic',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  altLatinLarge: {
    fontSize: 15,
    marginTop: 4,
  },

  altDataCol: {
    flex: 1,
    flexShrink: 1,
  },
  altDataColBody: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
  },
  altDataColBodyLarge: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },
  altDataColScroll: {
    flex: 1,
  },

  timeline: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
  },
  timelineLarge: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
  },
  timelineLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timelineLabelText: {
    color: '#3c2c17',
    fontSize: 7.5,
    letterSpacing: 0.3,
  },
  timelineLabelTextLarge: {
    fontSize: 12,
  },
  timelineEras: {
    flexDirection: 'row',
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  era: { height: '100%' },
  timelineTrack: {
    height: 4,
    justifyContent: 'center',
  },
  timelineBaseline: {
    height: 1.5,
    backgroundColor: 'rgba(60,44,23,0.35)',
    borderRadius: 1,
  },
  rangeBar: {
    position: 'absolute',
    top: '50%',
    height: 6,
    minWidth: 6,
    marginTop: -3,
    borderRadius: 3,
    backgroundColor: '#9b2b20',
    borderWidth: 1,
    borderColor: 'rgba(253,243,231,0.7)',
  },
  rangeBarLarge: {
    height: 9,
    marginTop: -4.5,
    borderRadius: 4.5,
  },
  // Apró vonás a jura és a kréta kezdeténél (triassicPct/jurassicPct), hogy a
  // korszakhatár a csík alatt is jól látszódjon, ne csak az era-sáv színváltásán.
  eraBoundaryTick: {
    position: 'absolute',
    top: -4,
    width: 1,
    height: 10,
    backgroundColor: 'rgba(60,44,23,0.55)',
  },
  eraBoundaryTickLarge: {
    top: -6,
    height: 15,
  },
  marker: {
    position: 'absolute',
    top: -6,
    width: 1,
    marginLeft: 0,
    alignItems: 'center',
  },
  markerFlag: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: 'rgba(155,43,32,0.55)',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 4,
    minWidth: 54,
    alignItems: 'center',
  },
  markerFlagLarge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 76,
  },
  markerFlagText: {
    color: '#fdf3e7',
    fontSize: 7.5,
  },
  markerFlagTextLarge: {
    fontSize: 12,
  },

  altStatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 10,
  },
  altStatGridLarge: {
    gap: 10,
    marginBottom: 18,
  },
  altStatCell: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: COLORS.olive,
    borderRadius: RADIUS.card,
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  altStatCellLarge: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  altStatLabel: {
    color: COLORS.cream,
    opacity: 0.85,
    fontSize: 8.5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  altStatLabelLarge: {
    fontSize: 13,
  },
  altStatValue: {
    color: COLORS.gold,
    fontSize: 11,
    marginTop: 2,
  },
  altStatValueLarge: {
    fontSize: 18,
    marginTop: 4,
  },

  altDescription: {
    color: COLORS.cream,
    opacity: 0.9,
  },

  altFindRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(254,250,224,0.15)',
  },
  altRarityText: {
    color: COLORS.gold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  altRarityTextLarge: {
    fontSize: 13,
  },
  altCounterText: {
    color: COLORS.cream,
    opacity: 0.6,
    fontSize: 9,
  },
  altCounterTextLarge: {
    fontSize: 13,
  },
});
