import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { loadProgress, EDU_LABELS } from '../utils/regionProgress';
import { groupByPackage, resolveImage } from '../utils/regionHelpers';

const RARITY_RING = {
  gyakori: 'rgba(154,160,140,0.6)',
  ritka: 'rgba(96,165,204,0.6)',
  epikus: 'rgba(160,110,204,0.6)',
  legendás: 'rgba(221,161,94,0.7)',
};

const CARD_GAP = 10;
const NUM_COLUMNS = 3;

/**
 * @param {object} props
 * @param {string} props.nickname - AsyncStorage progress partition key
 * @param {number} props.eduLevel - régió (1..5), csak ezt a régiót jeleníti meg
 * @param {Array} props.dinos - adaptCreature() kimenetek ehhez a régióhoz (kell: csomag/pack_number, name_hu, name_latin, rarity, nev_tudomanyos vagy image_url)
 * @param {(dino: object) => void} [props.onSelect]
 */
export default function DinoGallery({ nickname, eduLevel, dinos, onSelect }) {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadProgress(nickname).then((p) => {
      if (!cancelled) setProgress(p);
    });
    return () => {
      cancelled = true;
    };
  }, [nickname]);

  const unlockedDinos = useMemo(() => {
    if (!progress) return [];
    return dinos.filter((d) => {
      const pack = d.csomag ?? d.pack_number;
      return progress[eduLevel]?.[pack]?.quizPassed === true;
    });
  }, [dinos, progress, eduLevel]);

  const sections = useMemo(() => {
    const grouped = groupByPackage(unlockedDinos);
    return grouped.map(({ csomag, dinos: packDinos }) => ({
      title: `${csomag}. csomag`,
      data: chunk(packDinos, NUM_COLUMNS),
    }));
  }, [unlockedDinos]);

  const renderRow = useCallback(
    ({ item: row }) => (
      <View style={styles.row}>
        {row.map((dino) => (
          <DinoCard key={dino.id ?? dino.nev_tudomanyos} dino={dino} onPress={() => onSelect?.(dino)} />
        ))}
        {row.length < NUM_COLUMNS &&
          Array.from({ length: NUM_COLUMNS - row.length }).map((_, i) => (
            <View key={`spacer-${i}`} style={styles.cardSpacer} />
          ))}
      </View>
    ),
    [onSelect]
  );

  if (!progress) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={COLORS.green} />
      </View>
    );
  }

  if (unlockedDinos.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>
          Még nincs feloldott dínó ebben a régióban ({EDU_LABELS[eduLevel]}). Teljesíts egy pakkot a
          galéria feltöltéséhez!
        </Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(row, idx) => `row-${idx}`}
      renderItem={renderRow}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title}</Text>
      )}
      contentContainerStyle={styles.listContent}
      stickySectionHeadersEnabled={false}
    />
  );
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function DinoCard({ dino, onPress }) {
  const image = resolveImage(dino);
  const rarityKey = String(dino.rarity || '').toLowerCase();
  const ringColor = RARITY_RING[rarityKey] || RARITY_RING.gyakori;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.card, { borderColor: ringColor }]}>
      <View style={styles.imageWrap}>
        {image ? (
          <Image source={image} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.imageFallbackText}>?</Text>
          </View>
        )}
        <View style={styles.nameBanner}>
          <Text style={styles.nameText} numberOfLines={1}>
            {dino.name_hu}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  sectionHeader: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    fontFamily: FONTS.bold,
    marginTop: 18,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
  },
  cardSpacer: {
    flex: 1,
  },
  imageWrap: {
    aspectRatio: 1,
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFallbackText: {
    color: COLORS.textMuted,
    fontSize: 28,
    fontWeight: '900',
  },
  nameBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20,20,15,0.78)',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  nameText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyWrap: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: FONTS.body,
  },
});
