// DinoCard — a DínóTudós újratervezett gyűjtőkártyája múzeumi tábla-esztétikával.
// Két mód egyetlen forrásból:
//   showDescription=false → DinoCard: NINCS leírás (kompakt rács-kártya).
//   showDescription=true  → AlbumCard: a TELJES leírás megjelenik (lásd AlbumCard.js).
// Mindkét módban 16:9 a kép. Kattintásra a kártya egy képernyő-magasságú
// modálban nyílik ki (teljes leírással, görgethetően).
//
// Használat:
//   <DinoCard dino={creature} onPress={(d) => ...} />                // leírás nélkül
//   <DinoCard dino={creature} showDescription />                    // = AlbumCard
//
// Mezőleképezés: name_latin, epoch(_hu) + mya_min/mya_max, diet(_hu),
// length_m_min/max, image_url || IMAGE_MAP[name_hu], description_hu, csalad(_hu),
// rarity (1–5). A közös nevet (name_hu), súlyt, felfedezőt NEM jeleníti meg.
//
// Betűk: a projekt nem tölt Fredoka-t (lásd constants/fonts.js), a brief „Fredoka
// vagy Inter"-t enged → Inter fut (FONTS.body/bold). Ha betöltöd a Fredoka-t,
// csak a FONT_HEADER konstanst kell átírni.
import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Platform, Modal, ScrollView, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FONTS } from '../constants/theme';
import { IMAGE_MAP, MISSING_IMAGE } from '../constants/imageMap';
import { useT, pickLocalized } from '../i18n';

// ── Paletta (a brief explicit hexei) ─────────────────────────────────────────
const C = {
  headerBg: '#283618',   // sötétzöld fejléc
  cardBg: '#FEFAE0',     // krém kártyaháttér
  terracotta: '#DDA15E',
  sage: '#606C38',
  darkOrange: '#BC6C25',
  onDark: '#FEFAE0',
  onDarkAccent: '#DDA15E',
  onLight: '#283618',
  onLightMuted: '#606C38',
};

const FONT_HEADER = FONTS.bold; // Inter 700 (Fredoka helyett, míg az nincs betöltve)
const FONT_BODY = FONTS.body;   // Inter 400

// ── Kor (epoch) → MAGYAR időszaknév + „Ma" utótag ────────────────────────────
// A valós `epoch_hu` már magyar (pl. „késő-kréta") — csak szépen formázzuk:
// kötőjel → szóköz, szavak nagybetűvel („Késő Kréta"), a MYA magyarul „MÉE"
// (Millió Évvel Ezelőtt).
function formatTimePeriod(dino, myaLabel = 'MÉE') {
  const raw = String(dino.epoch || dino.epoch_hu || '').trim();
  const base = raw
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  // A nagyobb (korábbi) évszám előre: pl. (68–66 MÉE), nem (66–68).
  const lo = dino.mya_min;
  const hi = dino.mya_max;
  const suffix = lo != null && hi != null ? ` (${Math.max(lo, hi)}–${Math.min(lo, hi)} ${myaLabel})` : '';
  return `${base}${suffix}`.trim();
}

// ── Étrend → diet-ikon ───────────────────────────────────────────────────────
function dietValue(dino) {
  return dino.étrend ?? dino.diet_hu ?? dino.diet_eng ?? '';
}

function dietIconName(dino) {
  const v = String(dietValue(dino)).trim().toLowerCase();
  if (v.includes('húsevő') || v.includes('hus') || v.includes('carn')) return 'tooth';       // carnivore
  if (v.includes('növényevő') || v.includes('noveny') || v.includes('növény') || v.includes('herb')) return 'leaf'; // herbivore
  return 'dna'; // omnivore / ismeretlen
}

// ── Ritkaság (1–5) → szín (a címke i18n-ből: card.rarity_N) ──────────────────
const RARITY_COLOR = {
  1: C.sage,
  2: C.terracotta,
  3: C.darkOrange,
  4: '#8a5a3c',
  5: '#c9a227',
};

function rarityLevel(rarity) {
  const n = Number(rarity);
  return RARITY_COLOR[n] ? n : 1;
}

function imageSource(dino) {
  const url = dino.imageUrl || dino.image_url;
  if (url) return { uri: url };
  return IMAGE_MAP[dino.name_hu] || MISSING_IMAGE;
}

function familyValue(dino) {
  return dino.család || dino.csalad_hu || dino.csalad || '';
}

function countryValue(dino) {
  return dino.discovered_country || dino.country || '';
}

// Kinyitott kártya mérete: a legnagyobb ~0.7 (szélesség/magasság) arányú doboz,
// ami befér a viewportba (padinggel). A 16:9 kép így a nagyobb kártyaszélességen
// automatikusan nagyobb lesz.
const EXPANDED_RATIO = 0.7; // width / height
function expandedSize(winW, winH) {
  const availW = winW - 32;
  const availH = winH - 48;
  let h = availH;
  let w = h * EXPANDED_RATIO;
  if (w > availW) {
    w = availW;
    h = w / EXPANDED_RATIO;
  }
  return { width: Math.round(w), height: Math.round(h) };
}

function lengthLabel(dino) {
  const min = dino.length_m_min;
  const max = dino.length_m_max;
  if (min != null && max != null) return `${min}–${max} m`;
  if (min != null) return `${min} m`;
  if (max != null) return `${max} m`;
  return null;
}

export default function DinoCard({ dino, onPress, showDescription = false }) {
  const { t, lang } = useT();
  const [expanded, setExpanded] = useState(false);
  const { width: winW, height: winH } = useWindowDimensions();
  if (!dino) return null;

  const period = formatTimePeriod(dino, t('card.mya'));
  const diet = dietIconName(dino);
  const length = lengthLabel(dino);
  const rarityLvl = rarityLevel(dino.rarity);
  const rarityColor = RARITY_COLOR[rarityLvl];
  const family = familyValue(dino);
  const country = countryValue(dino);
  const desc = pickLocalized(dino, 'description', lang);
  const expSize = expandedSize(winW, winH);

  const handlePress = () => {
    onPress?.(dino);
    setExpanded(true);
  };

  // ── Megosztott darabok (rács-kártya ÉS kinyitott modál is ezeket használja) ──
  const Header = (
    <View style={styles.header}>
      <Text style={styles.sciName} numberOfLines={1}>{dino.name_latin}</Text>
      {!!period && <Text style={styles.period} numberOfLines={1}>{period}</Text>}
    </View>
  );

  const ImageZone = (
    <View style={styles.imageZone}>
      <Image source={imageSource(dino)} style={styles.image} resizeMode="cover" />
      <View style={styles.dietBadge} pointerEvents="none">
        <MaterialCommunityIcons name={diet} size={18} color={C.onDark} />
      </View>
      {!!length && (
        <View style={styles.lengthBadge} pointerEvents="none">
          <MaterialCommunityIcons name="ruler" size={12} color={C.onDark} />
          <Text style={styles.lengthText}>{length}</Text>
        </View>
      )}
    </View>
  );

  const Meta = (!!family || !!country) && (
    <View style={styles.metaBlock}>
      {!!family && (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{t('card.meta_family')}</Text>
          <Text style={styles.metaValue} numberOfLines={1}>{family}</Text>
        </View>
      )}
      {!!country && (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{t('card.meta_country')}</Text>
          <Text style={styles.metaValue} numberOfLines={1}>{country}</Text>
        </View>
      )}
    </View>
  );

  const Footer = (
    <View style={[styles.rarityFooter, { backgroundColor: rarityColor }]}>
      <Text style={styles.rarityText}>{t(`card.rarity_${rarityLvl}`)}</Text>
    </View>
  );

  return (
    <>
      {/* Rács-kártya */}
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${dino.name_latin || ''}${period ? `, ${period}` : ''}`}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        {Header}
        {ImageZone}
        <View style={styles.info}>
          {showDescription && !!desc && <Text style={styles.desc}>{desc}</Text>}
          {Meta}
        </View>
        {Footer}
      </Pressable>

      {/* Kinyitva: képernyő-magasságú kártya, teljes leírással (görgethető) */}
      <Modal visible={expanded} transparent animationType="fade" onRequestClose={() => setExpanded(false)}>
        <Pressable style={styles.backdrop} onPress={() => setExpanded(false)}>
          {/* belső Pressable: elnyeli a kattintást, hogy a kártyán belül ne záruljon.
              Fix ~0.7 (szélesség/magasság) arány, a viewportba illesztve. */}
          <Pressable style={[styles.expandedCard, { width: expSize.width, height: expSize.height }]} onPress={() => {}}>
            {Header}
            {ImageZone}
            <ScrollView style={styles.expandedScroll} contentContainerStyle={styles.expandedScrollContent}>
              {!!desc && <Text style={styles.descExpanded}>{desc}</Text>}
              {Meta}
            </ScrollView>
            {Footer}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const CARD_W = 280;

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    borderRadius: 12,
    backgroundColor: C.cardBg,
    overflow: 'hidden',
    shadowColor: '#283618',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },

  // ── Fejléc ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: C.headerBg,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  sciName: {
    color: C.onDark,
    fontFamily: FONT_HEADER,
    fontStyle: 'italic',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  period: {
    color: C.onDarkAccent,
    fontFamily: FONT_BODY,
    fontSize: 10.5,
    letterSpacing: 0.3,
    marginTop: 3,
  },

  // ── Képzóna (16:9 mindkét kártyatípuson) ────────────────────────────────────
  imageZone: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: C.headerBg,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dietBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(40,54,24,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.25)',
    ...Platform.select({ web: { backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' } }),
  },
  lengthBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(20,18,16,0.62)',
    ...Platform.select({ web: { backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' } }),
  },
  lengthText: {
    color: C.onDark,
    fontFamily: FONT_HEADER,
    fontSize: 11.5,
    letterSpacing: 0.2,
  },

  // ── Infó (rács-kártya) ──────────────────────────────────────────────────────
  // flex:1 → a kártya (sorban egyenlő magasra nyúlva) alján marad a ritkaság-
  // lábléc: a leírás+meta felül, az üres hely alul, a footer a kártya alján.
  info: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  desc: {
    color: C.onLightMuted,
    fontFamily: FONT_BODY,
    fontSize: 11,
    lineHeight: 16,
  },
  metaBlock: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(96,108,56,0.22)',
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    color: C.sage,
    fontFamily: FONT_HEADER,
    fontSize: 9,
    letterSpacing: 1,
  },
  metaValue: {
    flex: 1,
    color: C.onLight,
    fontFamily: FONT_BODY,
    fontSize: 11.5,
  },

  // ── Ritkaság-lábléc ──────────────────────────────────────────────────────
  rarityFooter: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rarityText: {
    color: C.onDark,
    fontFamily: FONT_HEADER,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // ── Kinyitott (képernyő-magasságú) modál ────────────────────────────────────
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  expandedCard: {
    // A méret (fix ~0.7 arány) inline jön (expandedSize) — itt csak a többi.
    borderRadius: 16,
    backgroundColor: C.cardBg,
    overflow: 'hidden',
    ...Platform.select({ web: { cursor: 'auto' } }),
  },
  expandedScroll: {
    flex: 1,             // a leírás tölti ki a maradék magasságot, görgethetően
  },
  expandedScrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
  },
  descExpanded: {
    color: C.onLightMuted,
    fontFamily: FONT_BODY,
    fontSize: 14,
    lineHeight: 21,
  },
});
