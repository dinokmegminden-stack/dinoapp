import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Shell from '../components/Shell';
import HeaderBar from '../components/HeaderBar';
import { IMAGE_MAP } from '../constants/imageMap';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { playQuizSfx, playSound } from '../audio/audioSystem';
import { addXP } from '../components/XPBar';
import { saveMemoryResult } from '../services/memoryResultsService';
import { submitLeaderboardEntry, getCelebrationMessage } from '../services/leaderboardService';
import Fireworks from '../components/Fireworks';

// Ugyanaz a háttérkép, ami a landing hero-t is adja (Shell animálja web-
// asztali nézetben) — a játékmódok mögött is megmarad, hogy ne váltson
// éles kontrasztban sima sötét háttérre navigáláskor.
const landingBg = require('../../assets/images/new_bg.jpg');

const MISMATCH_DELAY = 1000;
const BOARD_HORIZONTAL_PADDING = 10; // egyeznie kell a boardWrapper paddingHorizontal értékével

// level: 1/2/3 — ez kerül a memory_results táblába (lásd memoryResultsService.js).
const DIFFICULTIES = [
  { key: 'easy', label: '🐣 KEZDŐ', cols: 4, rows: 3, xp: 3, level: 1 },
  { key: 'medium', label: '🦕 HALADÓ', cols: 6, rows: 4, xp: 6, level: 2 },
  { key: 'hard', label: '🦖 PROFI', cols: 10, rows: 6, xp: 10, level: 3 },
];

const PAIR_EMOJIS = [
  '🦖', '🦕', '🦴', '🥚', '🌋', '☄️', '🌿', '🌲', '🦎', '🐊',
  '🐢', '🦅', '🦇', '🐍', '🕷️', '🦂', '🐌', '🐟', '🦈', '🐙',
  '🌊', '🏔️', '🪨', '🌙', '⭐', '🔥', '💧', '🍖', '🔍', '🐾',
];

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildDeck(pairCount) {
  const emojis = shuffle(PAIR_EMOJIS).slice(0, pairCount);
  const deck = emojis.flatMap((emoji, pairIndex) => [
    { key: `${pairIndex}a`, pairIndex, emoji, faceUp: false, matched: false },
    { key: `${pairIndex}b`, pairIndex, emoji, faceUp: false, matched: false },
  ]);
  return shuffle(deck);
}

function pickImageKey(excludeKey = null) {
  const keys = Object.keys(IMAGE_MAP).filter((k) => k !== excludeKey);
  return keys[Math.floor(Math.random() * keys.length)];
}

function MemoryCard({ card, width, height, left, top, onPress }) {
  const flip = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(flip, {
      toValue: card.faceUp || card.matched ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [card.faceUp, card.matched]);

  useEffect(() => {
    if (card.matched) {
      Animated.timing(fade, {
        toValue: 0,
        duration: 450,
        delay: 200,
        useNativeDriver: false,
      }).start();
    } else {
      // Új játéknál a komponens újrahasznosulhat ugyanazzal a kulccsal,
      // ezért a korábban lehalványított lapot vissza kell állítani.
      fade.setValue(1);
    }
  }, [card.matched]);

  const backRotate = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const frontRotate = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <Animated.View
      pointerEvents={card.matched ? 'none' : 'auto'}
      style={[styles.cardSlot, { width, height, left, top, opacity: fade }]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.cardTouch}
        onPress={onPress}
        disabled={card.faceUp || card.matched}
      >
        {/* Hátlap (lefordítva) */}
        <Animated.View
          style={[
            styles.cardFace,
            styles.cardBack,
            { transform: [{ perspective: 600 }, { rotateY: backRotate }] },
          ]}
        >
          <Text style={[styles.cardBackText, { fontSize: Math.min(Math.min(width, height) * 0.4, 44) }]}>?</Text>
        </Animated.View>
        {/* Előlap (emoji) */}
        <Animated.View
          style={[
            styles.cardFace,
            styles.cardFront,
            { transform: [{ perspective: 600 }, { rotateY: frontRotate }] },
          ]}
        >
          <Text style={{ fontSize: Math.min(Math.min(width, height) * 0.55, 64) }}>{card.emoji}</Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MemoryGameScreen({ nickname, playerId, progress, onNavigate, onBack }) {
  const { width: winWidth } = useWindowDimensions();
  const [imageKey, setImageKey] = useState(() => pickImageKey());
  const [difficulty, setDifficulty] = useState(null);
  const [cards, setCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [won, setWon] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalSeconds, setFinalSeconds] = useState(0);
  const [celebration, setCelebration] = useState({ visible: false, message: '' });

  const xpAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(null);
  // A köröglogika ref-ekben él, mert gyors egymás utáni kattintásoknál a
  // state-closure elavult lenne, és a lapok felfordítva ragadnának.
  const flippedRef = useRef([]);
  const lockedRef = useRef(false);
  const matchedSetRef = useRef(new Set());

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const pairCount = difficulty ? (difficulty.cols * difficulty.rows) / 2 : 0;

  // Élő időszámláló — csak akkor fut, amíg tart a kör (nincs kész, van kiválasztott nehézség).
  useEffect(() => {
    if (!difficulty || won) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.round((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [difficulty, won]);

  // Győzelem: XP jóváírása egyszer + "+XP" animáció + eredmény mentése (név, lépés, idő, szint)
  useEffect(() => {
    if (pairCount > 0 && matchedPairs === pairCount && !won) {
      const seconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      setFinalSeconds(seconds);
      setWon(true);
      playQuizSfx('winningTheme');
      addXP(difficulty.xp);
      xpAnim.setValue(0);
      Animated.spring(xpAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: false,
      }).start();
      if (nickname) {
        saveMemoryResult({ nickname, moves, seconds, level: difficulty.level });
      }
      // A Párok ranglistája — a többi játékmóddal ellentétben — hibás lépéssel is
      // felkerül, itt kizárólag az idő számít (felhasználói döntés).
      if (playerId) {
        submitLeaderboardEntry({
          playerId,
          levelType: `memory_${difficulty.level}`,
          completionTimeMs: seconds * 1000,
        }).then((result) => {
          const message = getCelebrationMessage(result);
          if (message) setCelebration({ visible: true, message });
        });
      }
    }
  }, [matchedPairs]);

  // RN Web-en a boardWrapper onLayout-ja megbízhatatlanul (soha nem) sül el —
  // ugyanaz a jelenség, amit a CollectionTimeline.js-nél is megtaláltunk és
  // kikerültünk: useWindowDimensions + a Shell.js ismert szélesség-szabályai
  // (isWideWeb töréspont, innerWide/inner max-width, padding) alapján
  // számoljuk ki a rendelkezésre álló szélességet, nem onLayout-tal mérve.
  // A container/boardWrapper egyik oldalon sem ad hozzá extra paddingHorizontal-t
  // a Shell tartalmi szélességéhez, csak a boardWrapper saját (10+10px) paddingje.
  const isWideWeb = Platform.OS === 'web' && winWidth >= 700;
  const shellContentWidth = isWideWeb ? Math.min(winWidth, 750) - 56 : Math.min(winWidth, 480);
  const availableWidth = Math.max(shellContentWidth - BOARD_HORIZONTAL_PADDING * 2, 0);
  const boardHeight = availableWidth * (9 / 16);
  const cardW = difficulty ? availableWidth / difficulty.cols : 0;
  const cardH = difficulty ? boardHeight / difficulty.rows : 0;
  const imageSource = IMAGE_MAP[imageKey];

  const resetRefs = () => {
    clearTimeout(timeoutRef.current);
    flippedRef.current = [];
    lockedRef.current = false;
    matchedSetRef.current = new Set();
    setCelebration({ visible: false, message: '' });
  };

  const handleSelectDifficulty = (d) => {
    playSound('click');
    resetRefs();
    startTimeRef.current = Date.now();
    setDifficulty(d);
    setCards(buildDeck((d.cols * d.rows) / 2));
    setMoves(0);
    setMatchedPairs(0);
    setElapsedSeconds(0);
    setWon(false);
  };

  const handleChangeDifficulty = () => {
    playSound('click');
    resetRefs();
    setDifficulty(null);
    setCards([]);
    setImageKey((prev) => pickImageKey(prev));
    setMoves(0);
    setMatchedPairs(0);
    setWon(false);
  };

  const handleCardPress = (card) => {
    if (lockedRef.current || won) return;
    if (matchedSetRef.current.has(card.pairIndex)) return;
    if (flippedRef.current.some((f) => f.key === card.key)) return;

    playQuizSfx('cardFlip');
    setCards((prev) =>
      prev.map((c) => (c.key === card.key ? { ...c, faceUp: true } : c))
    );
    flippedRef.current.push({ key: card.key, pairIndex: card.pairIndex });

    if (flippedRef.current.length < 2) return;

    // Második lap: lépésszámlálás és egyeztetés
    const [first, second] = flippedRef.current;
    flippedRef.current = [];
    setMoves((m) => m + 1);

    if (first.pairIndex === second.pairIndex) {
      playQuizSfx('cardMatch');
      matchedSetRef.current.add(first.pairIndex);
      setCards((prev) =>
        prev.map((c) =>
          c.pairIndex === first.pairIndex ? { ...c, faceUp: true, matched: true } : c
        )
      );
      setMatchedPairs((p) => p + 1);
    } else {
      lockedRef.current = true;
      timeoutRef.current = setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            c.key === first.key || c.key === second.key ? { ...c, faceUp: false } : c
          )
        );
        lockedRef.current = false;
      }, MISMATCH_DELAY);
    }
  };

  const startNewGame = () => {
    playSound('click');
    resetRefs();
    startTimeRef.current = Date.now();
    setImageKey((prev) => pickImageKey(prev));
    setCards(buildDeck(pairCount));
    setMoves(0);
    setMatchedPairs(0);
    setElapsedSeconds(0);
    setWon(false);
  };

  const xpTranslate = xpAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });

  // Nehézségválasztó a játék indítása előtt
  if (!difficulty) {
    return (
      <Shell backgroundImage={landingBg} header={<HeaderBar currentView="gaming" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.bg || '#283618'} />
          <View style={styles.selectContent}>
            <Text style={styles.selectTitle}>🧩 KÉPKIRAKÓ MEMÓRIA</Text>
            <Text style={styles.selectSubtitle}>Válassz nehézséget!</Text>
            <View style={styles.buttonGroup}>
              {DIFFICULTIES.map((d) => (
                <TouchableOpacity
                  key={d.key}
                  style={styles.diffBtn}
                  onPress={() => handleSelectDifficulty(d)}
                >
                  <Text style={styles.diffBtnText}>{d.label}</Text>
                  <Text style={styles.diffBtnSub}>
                    {d.cols} × {d.rows} — {(d.cols * d.rows) / 2} pár · +{d.xp} XP
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.exitBtn} onPress={onBack}>
                <Text style={styles.exitBtnText}>← VISSZA</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Shell>
    );
  }

  return (
    <Shell backgroundImage={landingBg} header={<HeaderBar currentView="gaming" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg || '#283618'} />

        {/* Fejléc: párok + lépések + idő */}
        <View style={styles.header}>
          <Text style={styles.headerText}>🧩 {matchedPairs}/{pairCount} pár</Text>
          <Text style={styles.headerText}>👣 {moves} lépés</Text>
          <Text style={styles.headerText}>⏱️ {won ? finalSeconds : elapsedSeconds}s</Text>
        </View>

        {/* 16:9 tábla — a kép alatta, a lapok rajta */}
        <View style={styles.boardWrapper}>
          {availableWidth > 0 && (
            <View style={[styles.board, { width: availableWidth, height: boardHeight }]}>
              <Image
                source={imageSource}
                style={[StyleSheet.absoluteFill, { width: availableWidth, height: boardHeight }]}
                resizeMode="cover"
              />
              {cards.map((card, index) => {
                const col = index % difficulty.cols;
                const row = Math.floor(index / difficulty.cols);
                return (
                  <MemoryCard
                    key={card.key}
                    card={card}
                    width={cardW}
                    height={cardH}
                    left={col * cardW}
                    top={row * cardH}
                    onPress={() => handleCardPress(card)}
                  />
                );
              })}
            </View>
          )}
        </View>

        <Fireworks
          visible={celebration.visible}
          message={celebration.message}
          onDone={() => setCelebration((c) => ({ ...c, visible: false }))}
        />

        {/* Győzelmi panel */}
        {won ? (
          <View style={styles.victoryBox}>
            <Text style={styles.victoryTitle}>🎉 KÉP FELFEDVE!</Text>
            <Text style={styles.victoryDino}>{imageKey}</Text>
            <Animated.Text
              style={[
                styles.victoryXP,
                { opacity: xpAnim, transform: [{ translateY: xpTranslate }] },
              ]}
            >
              +{difficulty.xp} XP ⭐
            </Animated.Text>
            <Text style={styles.victoryStats}>{moves} lépésből, {finalSeconds} másodperc alatt sikerült</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.nextBtn} onPress={startNewGame}>
                <Text style={styles.nextBtnText}>🔄 KÖVETKEZŐ KÉP</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.diffChangeBtn} onPress={handleChangeDifficulty}>
                <Text style={styles.diffChangeBtnText}>🎚️ MÁS NEHÉZSÉG</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exitBtn} onPress={onBack}>
                <Text style={styles.exitBtnText}>← KILÉPÉS</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              Találd meg a párokat, és fedezd fel, melyik őslény rejtőzik a lapok alatt!
            </Text>
            <TouchableOpacity style={styles.resetBtn} onPress={startNewGame}>
              <Text style={styles.resetBtnText}>🔄 ÚJ JÁTÉK</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Kilépés gomb (bal alul, mint a Villámkvíznél) */}
        {!won && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerText: {
    color: '#DDA15E',
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
  },
  boardWrapper: {
    width: '100%',
    paddingHorizontal: BOARD_HORIZONTAL_PADDING,
    alignItems: 'center',
  },
  board: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  cardSlot: {
    position: 'absolute',
  },
  cardTouch: {
    flex: 1,
  },
  cardFace: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    backgroundColor: '#606C38',
    borderWidth: 1,
    borderColor: '#283618',
  },
  cardBackText: {
    color: 'rgba(254,250,224,0.55)',
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  cardFront: {
    backgroundColor: '#FEFAE0',
    borderWidth: 1,
    borderColor: '#DDA15E',
  },
  hintBox: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
    gap: 14,
  },
  hintText: {
    color: '#FEFAE0',
    fontFamily: FONTS.body,
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.85,
  },
  resetBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(254,250,224,0.25)',
    backgroundColor: 'rgba(254,250,224,0.05)',
  },
  resetBtnText: {
    color: '#FEFAE0',
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  selectContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  selectTitle: {
    color: '#DDA15E',
    fontFamily: FONTS.bold,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  selectSubtitle: {
    color: '#FEFAE0',
    fontFamily: FONTS.body,
    fontSize: 15,
    opacity: 0.85,
    marginBottom: 28,
    textAlign: 'center',
  },
  diffBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(221,161,94,0.14)',
    borderWidth: 2,
    borderColor: '#DDA15E',
    borderRadius: 12,
    alignItems: 'center',
  },
  diffBtnText: {
    color: '#DDA15E',
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  diffBtnSub: {
    color: '#FEFAE0',
    fontFamily: FONTS.body,
    fontSize: 15,
    opacity: 0.8,
    marginTop: 4,
  },
  diffChangeBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(221,161,94,0.14)',
    borderWidth: 2,
    borderColor: '#DDA15E',
    borderRadius: 12,
    alignItems: 'center',
  },
  diffChangeBtnText: {
    color: '#DDA15E',
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '700',
  },
  victoryBox: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 24,
  },
  victoryTitle: {
    color: '#DDA15E',
    fontFamily: FONTS.bold,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
  },
  victoryDino: {
    color: '#FEFAE0',
    fontFamily: FONTS.heading,
    fontSize: 18,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  victoryXP: {
    color: '#4CAF50',
    fontFamily: FONTS.bold,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 4,
  },
  victoryStats: {
    color: '#FEFAE0',
    fontFamily: FONTS.body,
    fontSize: 15,
    opacity: 0.8,
    marginBottom: 16,
  },
  buttonGroup: {
    gap: 12,
    width: '100%',
    maxWidth: 300,
  },
  nextBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(76,175,80,0.15)',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 12,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#4CAF50',
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '700',
  },
  exitBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(244,67,54,0.15)',
    borderWidth: 2,
    borderColor: '#F44336',
    borderRadius: 12,
    alignItems: 'center',
  },
  exitBtnText: {
    color: '#F44336',
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '700',
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
