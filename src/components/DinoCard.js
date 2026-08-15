// DinoCard — a DínóTudós újratervezett, portré (9:16) gyűjtőkártyája múzeumi
// tábla-esztétikával. Újrafelhasználható: bárhol renderelhető egy `dino`
// objektummal (Supabase creatures sor / adaptCreature kimenet) + onPress-szel.
//
// Használat:
//   import DinoCard from '../components/DinoCard';
//   <DinoCard dino={creature} onPress={(d) => openDetail(d)} />
//
// Mezőleképezés (a briefből): name_latin, epoch + mya_min/mya_max, étrend,
// length_m_min/length_m_max, imageUrl || IMAGE_MAP[name_hu], description_hu,
// család, rarity (1–5). A közös nevet (name_hu), a súlyt és a felfedező-
// mezőket SZÁNDÉKOSAN nem jeleníti meg.
//
// Megjegyzés a betűkről: a projekt jelenleg NEM tölt be Fredoka-t (lásd
// constants/fonts.js), a brief pedig „Fredoka vagy Inter"-t enged — így Inter
// fut (FONTS.body / FONTS.bold), hogy tényleg rendereljen, ne néma fallbackre
// essen. Ha később betöltöd a Fredoka-t az App.js useAppFonts-ában, csak a lenti
// FONT_HEADER konstanst kell átírni.
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FONTS } from '../constants/theme';
import { IMAGE_MAP, MISSING_IMAGE } from '../constants/imageMap';

// ── Paletta (a brief szerint, explicit hexek — nem a globális COLORS) ──────────
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

// ── Kor (epoch) → angol időszaknév + MYA-utótag ──────────────────────────────
// A valós Supabase `epoch_hu` granulált magyar értékeket ad (késő-kréta,
// kora-jura, …) — ezeket a brief „Late Cretaceous" formátumára fordítjuk. A
// durva trias/jura/kréta kulcsok fallbackként maradnak.
const EPOCH_MAP = {
  'késő-kréta': 'Late Cretaceous',
  'kora-kréta': 'Early Cretaceous',
  'késő-jura': 'Late Jurassic',
  'közép-jura': 'Middle Jurassic',
  'középső-jura': 'Middle Jurassic',
  'kora-jura': 'Early Jurassic',
  'késő-triász': 'Late Triassic',
  'közép-triász': 'Middle Triassic',
  'középső-triász': 'Middle Triassic',
  'kora-triász': 'Early Triassic',
  trias: 'Triassic',
  triász: 'Triassic',
  jura: 'Jurassic',
  krétakori: 'Cretaceous',
  kreta: 'Cretaceous',
  kréta: 'Cretaceous',
};

function formatTimePeriod(dino) {
  const key = String(dino.epoch || '').trim().toLowerCase();
  const base = EPOCH_MAP[key] || dino.epoch || '';
  const min = dino.mya_min;
  const max = dino.mya_max;
  const suffix = min != null && max != null ? ` (${min}–${max} MYA)` : '';
  return `${base}${suffix}`.trim();
}

// ── Étrend → diet-ikon (a briefből) ──────────────────────────────────────────
// A brief `dino.étrend`-et mond; a valós adaptCreature `diet_hu`/`diet_eng`-et ad
// (nincs `étrend` oszlop). Mindkettőt elfogadjuk, magyar ÉS angol kulcsszóra.
function dietValue(dino) {
  return dino.étrend ?? dino.diet_hu ?? dino.diet_eng ?? '';
}

function dietIconName(dino) {
  const v = String(dietValue(dino)).trim().toLowerCase();
  if (v.includes('húsevő') || v.includes('hus') || v.includes('carn')) return 'tooth';       // carnivore
  if (v.includes('növényevő') || v.includes('noveny') || v.includes('növény') || v.includes('herb')) return 'leaf'; // herbivore
  return 'dna'; // omnivore / ismeretlen
}

// ── Ritkaság (1–5) → szín + magyar címke ─────────────────────────────────────
const RARITY = {
  1: { label: 'Gyakori', color: C.sage },
  2: { label: 'Ritka', color: C.terracotta },
  3: { label: 'Nagyon Ritka', color: C.darkOrange },
  4: { label: 'Epikus', color: '#8a5a3c' },      // mély terrakotta-barna (palettából levezetve)
  5: { label: 'Legendás', color: '#c9a227' },    // múzeumi arany (palettából levezetve)
};

function rarityInfo(rarity) {
  return RARITY[Number(rarity)] || RARITY[1];
}

function imageSource(dino) {
  // Brief: dino.imageUrl; valós adapter: dino.image_url. Mindkettőt elfogadjuk,
  // különben a lokális IMAGE_MAP (name_hu kulccsal), végül a MISSING placeholder.
  const url = dino.imageUrl || dino.image_url;
  if (url) return { uri: url };
  return IMAGE_MAP[dino.name_hu] || MISSING_IMAGE;
}

function familyValue(dino) {
  // Brief: dino.család; valós adapter: csalad_hu / csalad.
  return dino.család || dino.csalad_hu || dino.csalad || '';
}

function lengthLabel(dino) {
  const min = dino.length_m_min;
  const max = dino.length_m_max;
  if (min != null && max != null) return `${min}–${max} m`;
  if (min != null) return `${min} m`;
  if (max != null) return `${max} m`;
  return null;
}

// showDescription:
//   false (alap) → DinoCard: NINCS leírás, fix 9:16 arány.
//   true → AlbumCard-mód: a TELJES leírás megjelenik (nincs sorlimit), a kártya
//          magassága automatikus (a szöveg hosszához nő), a képzóna fix magas.
export default function DinoCard({ dino, onPress, showDescription = false }) {
  if (!dino) return null;

  const period = formatTimePeriod(dino);
  const diet = dietIconName(dino);
  const length = lengthLabel(dino);
  const rarity = rarityInfo(dino.rarity);
  const family = familyValue(dino);

  return (
    <Pressable
      onPress={() => onPress?.(dino)}
      accessibilityRole="button"
      accessibilityLabel={`${dino.name_latin || ''}${period ? `, ${period}` : ''}`}
      style={({ pressed }) => [
        styles.card,
        showDescription ? styles.cardAuto : styles.cardRatio,
        pressed && styles.cardPressed,
      ]}
    >
      {/* Fejléc — csak tudományos név (dőlt) + időszak */}
      <View style={styles.header}>
        <Text style={styles.sciName} numberOfLines={1}>{dino.name_latin}</Text>
        {!!period && <Text style={styles.period} numberOfLines={1}>{period}</Text>}
      </View>

      {/* Képzóna — diet-badge (jobb-fent), hossz-badge (bal-lent) */}
      <View style={[styles.imageZone, showDescription ? styles.imageZoneFixed : styles.imageZoneRatio]}>
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

      {/* Infó — (AlbumCard-módban) teljes leírás, majd kompakt metaadat (család) */}
      <View style={styles.info}>
        {showDescription && !!dino.description_hu && (
          <Text style={styles.desc}>{dino.description_hu}</Text>
        )}
        {!!family && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>CSALÁD</Text>
            <Text style={styles.metaValue} numberOfLines={1}>{family}</Text>
          </View>
        )}
      </View>

      {/* Ritkaság-lábléc — színes sáv + címke */}
      <View style={[styles.rarityFooter, { backgroundColor: rarity.color }]}>
        <Text style={styles.rarityText}>{rarity.label}</Text>
      </View>
    </Pressable>
  );
}

const CARD_W = 280;

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    aspectRatio: 9 / 16,
    borderRadius: 12,
    backgroundColor: C.cardBg,
    overflow: 'hidden',
    // Finom, tónusba illő árnyék (nem tiszta fekete).
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

  // ── Képzóna ─────────────────────────────────────────────────────────────────
  imageZone: {
    height: '45%',
    width: '100%',
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
    left: 10,
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

  // ── Infó ─────────────────────────────────────────────────────────────────
  info: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  desc: {
    color: C.onLightMuted,
    fontFamily: FONT_BODY,
    fontSize: 11,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(96,108,56,0.22)',
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
});
