import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import Shell from '../components/Shell';
import { IMAGE_MAP } from '../constants/imageMap';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { PASS_THRESHOLD } from '../utils/regionProgress';

const DEFAULT_CATEGORY = 'Egyéb őslények';
const CARD_WIDTH = 150;
const CARD_IMAGE_HEIGHT = CARD_WIDTH * (9 / 16);

function MiniDinoCard({ dino }) {
  const imageSource = IMAGE_MAP[dino.name_hu] || null;
  return (
    <View style={styles.card}>
      {imageSource ? (
        <Image source={imageSource} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.cardImageFallback]}>
          <Text style={styles.cardImageFallbackText}>🦴</Text>
        </View>
      )}
      <Text style={styles.cardName} numberOfLines={1}>{dino.name_hu}</Text>
      <Text style={styles.cardLatin} numberOfLines={1}>{dino.name_latin}</Text>
    </View>
  );
}

export default function CollectionScreen({ allDinos, progress, onBack }) {
  // Csak azok a dínók, amelyeknek a csomagkvíze sikerült (>= 80%)
  const { sections, collectedCount, totalCount } = useMemo(() => {
    const collected = (allDinos || []).filter(
      (d) => progress?.[d.edu]?.[d.csomag]?.quizPassed === true
    );

    const byCategory = {};
    collected.forEach((d) => {
      const category = d.taxonomy_category || DEFAULT_CATEGORY;
      if (!byCategory[category]) byCategory[category] = [];
      byCategory[category].push(d);
    });

    const built = Object.keys(byCategory)
      .sort((a, b) => a.localeCompare(b, 'hu'))
      .map((category) => ({
        category,
        dinos: byCategory[category].sort((a, b) =>
          a.name_hu.localeCompare(b.name_hu, 'hu')
        ),
      }));

    return {
      sections: built,
      collectedCount: collected.length,
      totalCount: (allDinos || []).length,
    };
  }, [allDinos, progress]);

  return (
    <Shell>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg || '#283618'} />

        <View style={styles.header}>
          <Text style={styles.title}>🗂️ GYŰJTEMÉNY</Text>
          <Text style={styles.counter}>{collectedCount}/{totalCount} kártya</Text>
        </View>

        {sections.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🥚</Text>
            <Text style={styles.emptyTitle}>Még üres a gyűjteményed</Text>
            <Text style={styles.emptyText}>
              Nézd végig egy csomag dínóit, és zárd a kvízt legalább{' '}
              {Math.round(PASS_THRESHOLD * 100)}%-ra — a csomag kártyái ide kerülnek be!
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {sections.map((section) => (
              <View key={section.category} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{section.category}</Text>
                  <Text style={styles.sectionCount}>{section.dinos.length}</Text>
                </View>
                <View style={styles.grid}>
                  {section.dinos.map((dino) => (
                    <MiniDinoCard key={dino.id} dino={dino} />
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg || '#283618',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: {
    color: '#DDA15E',
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
  counter: {
    color: '#FEFAE0',
    fontFamily: FONTS.body,
    fontSize: 14,
    opacity: 0.85,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(221,161,94,0.35)',
    paddingBottom: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#DDA15E',
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCount: {
    color: '#283618',
    backgroundColor: '#DDA15E',
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '700',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: 'rgba(254,250,224,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(221,161,94,0.5)',
    borderRadius: 10,
    overflow: 'hidden',
    paddingBottom: 8,
  },
  cardImage: {
    width: '100%',
    height: CARD_IMAGE_HEIGHT,
    backgroundColor: '#1a1a1a',
  },
  cardImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageFallbackText: {
    fontSize: 28,
  },
  cardName: {
    color: '#FEFAE0',
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  cardLatin: {
    color: '#DDA15E',
    fontFamily: FONTS.heading,
    fontSize: 11,
    fontStyle: 'italic',
    paddingHorizontal: 8,
    paddingTop: 2,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#DDA15E',
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#FEFAE0',
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    opacity: 0.85,
  },
  backBtn: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(244,67,54,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  backBtnText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
