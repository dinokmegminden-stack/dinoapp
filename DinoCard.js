import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import PeriodTimeline from './PeriodTimeline';

export const COLORS = {
  bg: '#283618',
  card: 'rgba(254,250,224,0.05)',
  cardSolid: '#606C38',
  border: 'rgba(254,250,224,0.14)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(254,250,224,0.62)',
  textMuted: 'rgba(254,250,224,0.38)',
  green: '#8DA34D',
  greenLight: 'rgba(141,163,77,0.45)',
  greenBg: 'rgba(141,163,77,0.14)',
  blue: '#9C8B6B',
  blueBg: 'rgba(156,139,107,0.14)',
  blueLight: 'rgba(156,139,107,0.45)',
  coral: '#BC6C25',
  coralBg: 'rgba(188,108,37,0.14)',
  coralLight: 'rgba(188,108,37,0.45)',
  amber: '#DDA15E',
  amberBg: 'rgba(221,161,94,0.14)',
  amberLight: 'rgba(221,161,94,0.45)',
  quizBg: '#283618',
  quizGold: '#DDA15E',
};

export function getCardColor(dino) {
  if (!dino) return { bg: COLORS.bg, accent: COLORS.border, text: COLORS.textPrimary };
  const csoport = dino.csoport?.toLowerCase() || '';
  const korszak = dino.korszak?.toLowerCase() || '';
  if (korszak.includes('triász')) return { bg: COLORS.amberBg, accent: COLORS.amberLight, text: COLORS.amber };
  if (csoport.includes('sauropoda') || csoport.includes('ornithopoda') || csoport.includes('plateosauria')) {
    return { bg: COLORS.greenBg, accent: COLORS.greenLight, text: COLORS.green };
  }
  if (csoport.includes('spinosauridae') || csoport.includes('allosauridae') || csoport.includes('megalosauridae') ||
      csoport.includes('abelisauridae') || csoport.includes('carcharodontosauridae') || csoport.includes('coelophysoidea')) {
    return { bg: COLORS.coralBg, accent: COLORS.coralLight, text: COLORS.coral };
  }
  return { bg: COLORS.blueBg, accent: COLORS.blueLight, text: COLORS.blue };
}

function fmtVal(val, suffix = '') {
  if (val === null || val === undefined || val === '' || val === 'n/a') return 'ismeretlen';
  return `${typeof val === 'number' ? val.toLocaleString() : val}${suffix}`;
}

export default function DinoCard({ dino, imageSource, showTimeline = true }) {
  if (!dino) return null;

  const color = getCardColor(dino);
  const image = dino.image_url ? { uri: dino.image_url } : imageSource;
  const { width: cardWidth } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && cardWidth >= 700;

  return (
    <View style={styles.card}>
      {showTimeline && dino.kor_millioev && (
        <View style={styles.timelineWrap}>
          <PeriodTimeline korMillioev={dino.kor_millioev} />
        </View>
      )}

      <View style={[styles.cardImageArea, isWideWeb && styles.cardImageAreaWide, { backgroundColor: color.bg }]}>
        {image ? (
          <Image source={image} style={styles.dinoImage} resizeMode="contain" />
        ) : (
          <Text style={[styles.fallbackEmoji, { color: color.accent }]}>
            {dino.csoport?.toLowerCase().includes('sauropoda') ? '🦕' : '🦖'}
          </Text>
        )}
      </View>

      <ScrollView style={styles.cardBody} showsVerticalScrollIndicator={false}>
        <Text style={styles.commonName}>{dino.nev_koznapi}</Text>
        <Text style={styles.scientificName}>{dino.nev_tudomanyos}</Text>

        <View style={styles.divider} />

        {/* Információs rács */}
        <View style={styles.infoGrid}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>🕒 KORSZAK</Text>
            <Text style={styles.gridValue}>{fmtVal(dino.korszak)}</Text>
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>📏 HOSSZ</Text>
            <Text style={styles.gridValue}>{fmtVal(dino.hossz)}</Text>
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>🔍 FELFEDEZŐ</Text>
            <Text style={styles.gridValue}>{fmtVal(dino.felfedezo)}</Text>
          </View>

          {dino.kor_millioev && (
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>📅 KOR</Text>
              <Text style={styles.gridValue}>{fmtVal(dino.kor_millioev)}</Text>
            </View>
          )}

          {dino.megtalalas_helye && dino.megtalalas_helye !== 'n/a' && (
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>📍 LELŐHELY</Text>
              <Text style={styles.gridValue}>{fmtVal(dino.megtalalas_helye)}</Text>
            </View>
          )}

          {dino.taplalek && dino.taplalek !== 'n/a' && (
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>🌿 TÁPLÁLÉK</Text>
              <Text style={styles.gridValue}>{fmtVal(dino.taplalek)}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Leírás</Text>
        <Text style={[styles.bodyText, { color: color.text }]}>{fmtVal(dino.leiras)}</Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(254,250,224,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.14)',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  timelineWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: '#0d1127',
  },
  cardImageArea: {
    width: '100%',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cardImageAreaWide: {},
  dinoImage: {
    width: '100%',
    height: '100%',
  },
  fallbackEmoji: {
    fontSize: 64,
  },
  cardBody: {
    padding: 16,
  },
  commonName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FEFAE0',
    fontFamily: 'Roboto',
  },
  scientificName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'rgba(254,250,224,0.62)',
    fontStyle: 'italic',
    fontFamily: 'Cinzel',
    marginTop: 2,
  },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(254,250,224,0.14)',
    marginVertical: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    backgroundColor: 'rgba(254,250,224,0.04)',
    borderRadius: 10,
    padding: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(254,250,224,0.14)',
  },
  gridLabel: {
    fontSize: 9,
    color: 'rgba(254,250,224,0.38)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '800',
    fontFamily: 'Roboto',
  },
  gridValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FEFAE0',
    marginTop: 2,
    fontFamily: 'Roboto',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(254,250,224,0.38)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    fontFamily: 'Roboto',
  },
  bodyText: {
    fontSize: 13,
    color: '#FEFAE0',
    marginTop: 4,
    lineHeight: 18,
    fontFamily: 'Roboto',
  },
});
