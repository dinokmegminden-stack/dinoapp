// CollectionScreen (a spec DinoGallery.js-ének megfelelője) — redesign spec 5. pont.
// SectionList csomagonként (nem taxonomy_category szerint), mert nagy gyűjteménynél
// kevesebb re-render buggal jár, mint a FlatList + manuális header-injektálás.
// Zárolt (quiz még nem sikerült) csomagoknál placeholder slotok jelennek meg,
// hogy a felhasználó lássa mennyi van még hátra — nem tűnnek el a listából.
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SectionList,
  StatusBar,
} from 'react-native';
import Shell from '../components/Shell';
import HeaderBar from '../components/HeaderBar';
import CollectionTimeline from '../components/CollectionTimeline';
import { IMAGE_MAP, MISSING_IMAGE } from '../constants/imageMap';
import { isGuestMode } from '../utils/guestMode';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { REGION_ORDER, REGION_PACKS, EDU_LABELS, PASS_THRESHOLD } from '../utils/regionProgress';

const NUM_COLUMNS = 3;

const RARITY_COLOR = {
  gyakori: '#c8ccbe',
  ritka: '#8ecbe6',
  epikus: '#c9a6e6',
  legendás: COLORS.accent,
};

function chunk(list, size) {
  const rows = [];
  for (let i = 0; i < list.length; i += size) rows.push(list.slice(i, i + size));
  return rows;
}

function MiniDinoCard({ dino }) {
  const imageSource = isGuestMode() ? null : (IMAGE_MAP[dino.name_hu] || MISSING_IMAGE);
  const rarityColor = RARITY_COLOR[String(dino.rarity || '').toLowerCase()];

  return (
    <View style={styles.card}>
      <View style={styles.cardImageWrapper}>
        {imageSource ? (
          <Image source={imageSource} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, styles.cardImageFallback]}>
            <Text style={styles.cardImageFallbackText}>🦴</Text>
          </View>
        )}
        {!!rarityColor && (
          <View style={[styles.rarityBadge, { borderColor: rarityColor }]}>
            <Text style={styles.rarityBadgeIcon}>💎</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardName} numberOfLines={2}>{dino.name_hu}</Text>
    </View>
  );
}

function LockedSlot() {
  return (
    <View style={[styles.card, styles.lockedCard]}>
      <View style={[styles.cardImageWrapper, styles.lockedImageWrapper]}>
        <Text style={styles.lockedIcon}>🔒</Text>
      </View>
      <Text style={styles.lockedText}>Zárolva</Text>
    </View>
  );
}

export default function CollectionScreen({ nickname, allDinos, progress, onNavigate, onBack }) {
  const [viewMode, setViewMode] = useState('csomagok'); // 'csomagok' | 'idovonal'

  const { sections, collectedCount, totalCount } = useMemo(() => {
    let collected = 0;
    let total = 0;
    const built = [];

    REGION_ORDER.forEach((edu) => {
      REGION_PACKS[edu].forEach((packId) => {
        const packDinos = (allDinos || [])
          .filter((d) => d.edu === edu && d.csomag === packId)
          .sort((a, b) => a.name_hu.localeCompare(b.name_hu, 'hu'));
        if (packDinos.length === 0) return;

        const unlocked = progress?.[edu]?.[packId]?.quizPassed === true;
        total += packDinos.length;
        if (unlocked) collected += packDinos.length;

        built.push({
          key: `${edu}-${packId}`,
          title: `${packId}. CSOMAG · ${EDU_LABELS[edu] || edu}`,
          unlocked,
          data: chunk(packDinos, NUM_COLUMNS),
        });
      });
    });

    return { sections: built, collectedCount: collected, totalCount: total };
  }, [allDinos, progress]);

  return (
    <Shell header={<HeaderBar currentView="collection" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

        <View style={styles.header}>
          <Text style={styles.title}>🗂️ GYŰJTEMÉNY</Text>
          <View style={styles.headerRight}>
            <View style={styles.progressPill}>
              <Text style={styles.progressPillText}>{collectedCount} / {totalCount}</Text>
            </View>
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Text style={styles.backBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.headerHint}>
          Egy csomag kártyái akkor oldódnak fel, ha a záró kvízt legalább{' '}
          {Math.round(PASS_THRESHOLD * 100)}%-ra teljesíted.
        </Text>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'csomagok' && styles.viewToggleBtnActive]}
            onPress={() => setViewMode('csomagok')}
          >
            <Text style={[styles.viewToggleText, viewMode === 'csomagok' && styles.viewToggleTextActive]}>
              Csomagok
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'idovonal' && styles.viewToggleBtnActive]}
            onPress={() => setViewMode('idovonal')}
          >
            <Text style={[styles.viewToggleText, viewMode === 'idovonal' && styles.viewToggleTextActive]}>
              Idővonal
            </Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'csomagok' ? (
          <SectionList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            sections={sections}
            keyExtractor={(row) => row.map((d) => d.id).join('-')}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.unlocked ? (
                  <Text style={styles.sectionBadgeUnlocked}>✓</Text>
                ) : (
                  <Text style={styles.sectionBadgeLocked}>🔒</Text>
                )}
              </View>
            )}
            renderItem={({ item: row, section }) => (
              <View style={styles.row}>
                {row.map((dino) =>
                  section.unlocked ? (
                    <MiniDinoCard key={dino.id} dino={dino} />
                  ) : (
                    <LockedSlot key={dino.id} />
                  )
                )}
              </View>
            )}
            stickySectionHeadersEnabled={false}
          />
        ) : (
          <View style={styles.timelineWrapper}>
            <CollectionTimeline allDinos={allDinos} progress={progress} />
          </View>
        )}
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  title: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressPill: {
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.pill,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  progressPillText: {
    color: COLORS.bgDark,
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '800',
  },
  headerHint: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 15,
    opacity: 0.75,
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: 'rgba(254,250,224,0.06)',
    borderRadius: RADIUS.pill,
    padding: 3,
  },
  viewToggleBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
  },
  viewToggleBtnActive: {
    backgroundColor: COLORS.bgMid,
  },
  viewToggleText: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    opacity: 0.6,
  },
  viewToggleTextActive: {
    opacity: 1,
  },
  timelineWrapper: {
    flex: 1,
    minHeight: 0,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  list: {
    flex: 1,
    marginTop: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,18,25,0.5)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(221,161,94,0.35)',
    paddingBottom: 6,
    paddingTop: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sectionBadgeUnlocked: {
    color: '#8DA34D',
    fontSize: 15,
    fontWeight: '900',
  },
  sectionBadgeLocked: {
    fontSize: 15,
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  card: {
    width: '31%',
    backgroundColor: 'rgba(254,250,224,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(221,161,94,0.5)',
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    paddingBottom: 6,
  },
  cardImageWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageFallbackText: {
    fontSize: 20,
  },
  rarityBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rarityBadgeIcon: {
    fontSize: 8,
  },
  cardName: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingTop: 5,
    textAlign: 'center',
  },
  lockedCard: {
    borderStyle: 'dashed',
    borderColor: 'rgba(254,250,224,0.3)',
    backgroundColor: 'transparent',
  },
  lockedImageWrapper: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedIcon: {
    fontSize: 22,
    opacity: 0.6,
  },
  lockedText: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 15,
    opacity: 0.5,
    textAlign: 'center',
    paddingTop: 5,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(244,67,54,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
