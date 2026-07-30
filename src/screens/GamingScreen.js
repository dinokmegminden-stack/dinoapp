// src/screens/GamingScreen.js
// A fejléc "Játékok" gombjára kattintva nyíló képernyő — a 6 játékmód nagy,
// dínó-fotós kártyaként, reszponzív rácsban (grill-me session terve, lásd
// a redesign döntéseit: fix dínó-fotó módonként, egységes ⭐-szint jelvény
// nyers XP-szám nélkül, "A nap kihívása" banner, "Xszer játszva" jelvény).
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, ImageBackground, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Shell from '../components/Shell';
import HeaderBar from '../components/HeaderBar';
import { IMAGE_MAP } from '../constants/imageMap';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { getGamePlayCounts } from '../services/gameEventsService';
import { getDailyChallengeGameKey, isDailyChallengeClaimedToday } from '../utils/dailyChallenge';

// Nehézség/jutalom EGY közös jelvényként (grill-me döntés): nincs nyers
// XP-szám a kártyán, csak a szint — a tényleges XP a játékban derül ki.
const TIER = { KEZDO: 1, HALADO: 2, PROFI: 3 };
const TIER_LABEL = { [TIER.KEZDO]: 'Kezdő', [TIER.HALADO]: 'Haladó', [TIER.PROFI]: 'Profi' };

const GAMES = [
  { key: 'memory', label: 'PÁROK', icon: 'cards', dino: 'Ankylosaurus', tier: TIER.HALADO },
  { key: 'whoami', label: 'KI VAGYOK ÉN?', icon: 'help-circle', dino: 'Velociraptor', tier: TIER.HALADO },
  { key: 'lightning', label: '5MP KÉPKVÍZ', icon: 'flash', dino: 'Compsognathus', tier: TIER.HALADO },
  { key: 'millionaire', label: 'XP MILLIOMOS', icon: 'trophy', dino: 'Tyrannosaurus', tier: TIER.PROFI },
  { key: 'runner', label: 'DÍNÓFUTAM', icon: 'run-fast', dino: 'Gallimimus', tier: TIER.HALADO },
  { key: 'hangman', label: 'AKASZTÓFA', icon: 'bone', dino: 'Triceratops', tier: TIER.KEZDO },
];

const GAMES_BY_KEY = Object.fromEntries(GAMES.map((g) => [g.key, g]));

// 16:9-re előre kivágott (attention-crop) tile-képek — a nyers IMAGE_MAP
// forrás aspektusa változó (pl. Tyrannosaurus 1.5:1), a runtime `cover`
// crop emiatt esetlegesen vágta a témát; ez a kártya-méretre szabott előre
// vágott verzió a `card` aspectRatio 16/9-hez igazítva, lásd scripts/
// generate-dino-images.js origin-pipeline-jét — nem érinti a máshol
// (enciklopédia, trading card) használt eredeti IMAGE_MAP fájlokat.
const TILE_IMAGE_MAP = {
  Ankylosaurus: require('../../assets/images/tiles/ankylosaurus.jpg'),
  Velociraptor: require('../../assets/images/tiles/velociraptor.jpg'),
  Compsognathus: require('../../assets/images/tiles/compsognathus.jpg'),
  Tyrannosaurus: require('../../assets/images/tiles/tyrannosaurus.jpg'),
  Gallimimus: require('../../assets/images/tiles/gallimimus.jpg'),
  Triceratops: require('../../assets/images/tiles/triceratops.jpg'),
};

function TierBadge({ tier }) {
  return (
    <View style={styles.tierBadge}>
      <Text style={styles.tierBadgeText}>{'⭐'.repeat(tier)} {TIER_LABEL[tier]}</Text>
    </View>
  );
}

function GameCard({ game, onPress, isToday, playCount, cardWidth }) {
  const [hovered, setHovered] = useState(false);
  const imgSource = TILE_IMAGE_MAP[game.dino] || IMAGE_MAP[game.dino];

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={[styles.card, { width: cardWidth }, hovered && styles.cardHovered]}
    >
      <ImageBackground source={imgSource} style={styles.cardImage} imageStyle={styles.cardImageInner}>
        <View style={styles.cardOverlay} />

        {isToday && (
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>⚡ MA</Text>
          </View>
        )}

        <TierBadge tier={game.tier} />

        <View style={styles.cardBody}>
          <MaterialCommunityIcons name={game.icon} size={26} color={COLORS.cream} />
          <Text style={styles.cardLabel}>{game.label}</Text>
        </View>

        {playCount > 0 && (
          <View style={styles.playCountBadge}>
            <MaterialCommunityIcons name="repeat" size={12} color={COLORS.cream} />
            <Text style={styles.playCountText}>{playCount}× játszva</Text>
          </View>
        )}
      </ImageBackground>
    </TouchableOpacity>
  );
}

function DailyChallengeBanner({ game, claimed, onPress }) {
  const imgSource = IMAGE_MAP[game.dino];
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={claimed ? undefined : onPress} disabled={claimed} style={styles.banner}>
      <ImageBackground source={imgSource} style={styles.bannerImage} imageStyle={styles.bannerImageInner}>
        <View style={styles.bannerOverlay} />
        <View style={styles.bannerContent}>
          <Text style={styles.bannerEyebrow}>⚡ A NAP KIHÍVÁSA</Text>
          <Text style={styles.bannerTitle}>{game.label}</Text>
          <Text style={styles.bannerSub}>
            {claimed ? 'Teljesítve mára ✓' : 'Teljesítsd ma, és +50% bónusz XP jár érte!'}
          </Text>
        </View>
        {!claimed && (
          <View style={styles.bannerCta}>
            <Text style={styles.bannerCtaText}>Kezdés →</Text>
          </View>
        )}
      </ImageBackground>
    </TouchableOpacity>
  );
}

export default function GamingScreen({ nickname, playerId, progress, onNavigate, onMemory, onWhoAmI, onLightningQuiz, onMillionaire, onRunner, onHangman, onBack }) {
  const { width } = useWindowDimensions();
  const cols = width >= 1024 ? 3 : width >= 700 ? 2 : 1;
  const GAP = 16;
  const cardWidth = cols === 3 ? '31.8%' : cols === 2 ? '48.5%' : '100%';

  const gameHandlers = {
    memory: onMemory,
    whoami: onWhoAmI,
    lightning: onLightningQuiz,
    millionaire: onMillionaire,
    runner: onRunner,
    hangman: onHangman,
  };

  const [playCounts, setPlayCounts] = useState({});
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const dailyKey = getDailyChallengeGameKey();
  const dailyGame = GAMES_BY_KEY[dailyKey];

  useEffect(() => {
    if (playerId) getGamePlayCounts(playerId).then(setPlayCounts);
  }, [playerId]);

  useEffect(() => {
    isDailyChallengeClaimedToday().then(setDailyClaimed);
  }, []);

  return (
    <Shell header={<HeaderBar currentView="gaming" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

        <View style={styles.header}>
          <Text style={styles.title}>🎮 JÁTÉKMÓDOK</Text>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {dailyGame && (
            <DailyChallengeBanner
              game={dailyGame}
              claimed={dailyClaimed}
              onPress={gameHandlers[dailyKey]}
            />
          )}

          <View style={[styles.grid, { gap: GAP }]}>
            {GAMES.map((game) => (
              <GameCard
                key={game.key}
                game={game}
                onPress={gameHandlers[game.key]}
                isToday={game.key === dailyKey}
                playCount={playCounts[game.key] || 0}
                cardWidth={cardWidth}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0, width: '100%' },
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  // ── Napi kihívás banner ────────────────────────────────────────────────
  banner: {
    width: '100%',
    aspectRatio: 21 / 6,
    minHeight: 120,
    borderRadius: RADIUS.cardLarge,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(238,155,0,0.35)',
  },
  bannerImage: { flex: 1, width: '100%', height: '100%', justifyContent: 'center' },
  bannerImageInner: { resizeMode: 'cover' },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,10,14,0.55)',
  },
  bannerContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  bannerEyebrow: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
    fontSize: 13,
    letterSpacing: 2,
    marginBottom: 4,
  },
  bannerTitle: {
    color: COLORS.cream,
    fontFamily: FONTS.heading,
    fontSize: 26,
    marginBottom: 4,
  },
  bannerSub: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 14,
    opacity: 0.85,
  },
  bannerCta: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -18,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  bannerCtaText: {
    color: COLORS.bgDark,
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  // ── Rács ───────────────────────────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    aspectRatio: 16 / 9,
    borderRadius: RADIUS.cardLarge,
    overflow: 'hidden',
    marginBottom: 4,
  },
  cardHovered: {
    transform: [{ scale: 1.02 }],
  },
  cardImage: { flex: 1, width: '100%', height: '100%' },
  cardImageInner: { resizeMode: 'cover' },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,10,14,0.45)',
  },
  cardBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cardLabel: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tierBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,10,14,0.7)',
    borderRadius: RADIUS.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  tierBadgeText: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 11,
  },
  todayBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  todayBadgeText: {
    color: COLORS.bgDark,
    fontFamily: FONTS.bold,
    fontSize: 11,
  },
  playCountBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,10,14,0.7)',
    borderRadius: RADIUS.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  playCountText: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 11,
  },
});
