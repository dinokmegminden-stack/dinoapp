// src/screens/RunnerGameScreen.js
// "Dínófutam" — vízszintes (side-scroller), 3 egymás alatti sávos, egyre
// gyorsuló ügyességi játék. Fel/le váltva kell kerülgetni a sziklákat és
// skorpiókat, be kell kapni a húsdarabokat XP-ért.
// Pixel-art sprite-ok (assets/sub.png-ből kivágva, lásd assets/images/runner/).
//
// A vízszintes mozgást %-os pozícióval szimuláljuk (nem px-ben), hogy ne
// kelljen a pálya tényleges pixel-szélességét kitalálni/mérni — ugyanaz a
// hiba történt korábban a függőleges verzióban egy becsült szélesség miatt,
// ez a megoldás mérettől függetlenül mindig helyes.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform, PanResponder, Image } from 'react-native';
import Shell from '../components/Shell';
import { COLORS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { playSound, playQuizSfx } from '../audio/audioSystem';
import { addXP } from '../components/XPBar';

const landingBg = require('../../assets/images/new_bg.jpg');

const RUN_FRAMES = [
  require('../../assets/images/runner/run1.png'),
  require('../../assets/images/runner/run2.png'),
  require('../../assets/images/runner/run3.png'),
  require('../../assets/images/runner/run4.png'),
];
const RUN_FRAME_MS = 130;

const LANES = 3; // játszható sáv (fent / közép / lent) — a dínó csak ezek közt válthat
const ROW_HEIGHT = 78;
const DECOR_ROW_HEIGHT = 44; // a pálya tetején/alján lévő, nem játszható díszsáv magassága
const TRACK_HEIGHT = ROW_HEIGHT * LANES + DECOR_ROW_HEIGHT * 2;
const TICK_MS = 40;
const ITEM_SIZE = 46;
const PLAYER_SIZE = 60;
const PLAYER_X_PCT = 14; // a játékos vízszintes helye a pálya bal szélétől, %-ban
const HIT_TOLERANCE_PCT = 6; // +- ennyi %-on belül számít találatnak

// A sebesség nem folyamatosan, hanem szintenként ugrik — minden szint
// LEVEL_DURATION_MS ideig tart, utána a következő (gyorsabb) szintre vált,
// és ezt a jobb felső sarokban egy "X. szint" felirat is jelzi.
const LEVEL_SPEEDS_PCT = [26, 36, 46, 56, 66, 78]; // %/s szintenként
const LEVEL_DURATION_MS = 6000;

const START_SPAWN_MS = 1250;
const MIN_SPAWN_MS = 480;
const SPAWN_SHRINK_PER_SEC = 18;

const XP_PER_MEAT = 5;

const ITEM_TYPES = [
  { type: 'meat', weight: 0.42, img: require('../../assets/images/runner/meat.png'), bg: 'rgba(221,161,94,0.55)', border: COLORS.gold },
  { type: 'rock', weight: 0.34, img: require('../../assets/images/runner/rock.png'), bg: 'rgba(96,108,56,0.55)', border: '#3d4a1f' },
  { type: 'scorpion', weight: 0.24, img: require('../../assets/images/runner/scorpion.png'), bg: 'rgba(174,32,18,0.55)', border: '#7a160c' },
];

function pickItemType() {
  const r = Math.random();
  let acc = 0;
  for (const item of ITEM_TYPES) {
    acc += item.weight;
    if (r <= acc) return item;
  }
  return ITEM_TYPES[0];
}

// A pálya tetején és alján futó két díszsáv tartalma — tisztán vizuális,
// nincs ütközés velük, a dínó sosem mehet ide, csak a 3 középső sávon.
const TERRAIN_EMOJIS = ['🌵', '🐢', '🐍', '⛰️', '☁️'];
const TERRAIN_SPAWN_MS = 2200;
const TERRAIN_SPEED_FACTOR = 0.55; // lassabb, mint a játéktér — parallax-érzet

let nextItemId = 1;
let nextTerrainId = 1;

export default function RunnerGameScreen({ playerId, onBack }) {
  const [gameStatus, setGameStatus] = useState('idle'); // 'idle' | 'playing' | 'over'
  const [lane, setLane] = useState(1);
  const [renderTick, setRenderTick] = useState(0);
  const [score, setScore] = useState(0);
  const [runFrame, setRunFrame] = useState(0);
  const [level, setLevel] = useState(1);

  const laneRef = useRef(1);
  const itemsRef = useRef([]);
  const terrainRef = useRef([]);
  const elapsedRef = useRef(0);
  const timeSinceSpawnRef = useRef(0);
  const timeSinceTerrainRef = useRef(0);
  const levelRef = useRef(1);
  const gameOverRef = useRef(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    laneRef.current = lane;
  }, [lane]);

  const stopLoop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const endRun = useCallback((finalScore) => {
    gameOverRef.current = true;
    stopLoop();
    setGameStatus('over');
    playQuizSfx('wrong');
    if (finalScore > 0) addXP(finalScore);
  }, [stopLoop]);

  const changeLane = useCallback((delta) => {
    if (gameStatus !== 'playing') return;
    setLane((current) => {
      const next = Math.min(LANES - 1, Math.max(0, current + delta));
      if (next !== current) playSound('click');
      return next;
    });
  }, [gameStatus]);

  // --- Játékmenet indítása ------------------------------------------------
  const startGame = () => {
    itemsRef.current = [];
    terrainRef.current = [];
    elapsedRef.current = 0;
    timeSinceSpawnRef.current = 0;
    timeSinceTerrainRef.current = 0;
    gameOverRef.current = false;
    laneRef.current = 1;
    setLane(1);
    setScore(0);
    levelRef.current = 1;
    setLevel(1);
    setRenderTick((t) => t + 1);
    setGameStatus('playing');
    playSound('click');
  };

  useEffect(() => {
    if (gameStatus !== 'playing') return undefined;

    intervalRef.current = setInterval(() => {
      if (gameOverRef.current) return;
      const dt = TICK_MS / 1000;
      elapsedRef.current += dt;
      timeSinceSpawnRef.current += TICK_MS;

      const newLevel = Math.min(
        LEVEL_SPEEDS_PCT.length,
        Math.floor((elapsedRef.current * 1000) / LEVEL_DURATION_MS) + 1
      );
      if (newLevel !== levelRef.current) {
        levelRef.current = newLevel;
        setLevel(newLevel);
        playQuizSfx('next');
      }
      const speed = LEVEL_SPEEDS_PCT[levelRef.current - 1];
      const spawnInterval = Math.max(MIN_SPAWN_MS, START_SPAWN_MS - elapsedRef.current * SPAWN_SHRINK_PER_SEC);

      if (timeSinceSpawnRef.current >= spawnInterval) {
        timeSinceSpawnRef.current = 0;
        const itemDef = pickItemType();
        itemsRef.current.push({
          id: nextItemId++,
          lane: Math.floor(Math.random() * LANES),
          pct: 100,
          def: itemDef,
        });
      }

      // Díszsáv (terrain) léptetése — csak vizuális, nincs ütközés
      timeSinceTerrainRef.current += TICK_MS;
      if (timeSinceTerrainRef.current >= TERRAIN_SPAWN_MS) {
        timeSinceTerrainRef.current = 0;
        terrainRef.current.push({
          id: nextTerrainId++,
          row: Math.random() < 0.5 ? 'top' : 'bottom',
          pct: 100,
          emoji: TERRAIN_EMOJIS[Math.floor(Math.random() * TERRAIN_EMOJIS.length)],
        });
      }
      terrainRef.current = terrainRef.current
        .map((t) => ({ ...t, pct: t.pct - speed * TERRAIN_SPEED_FACTOR * dt }))
        .filter((t) => t.pct >= -15);

      const survivors = [];
      let scoreGain = 0;

      for (const item of itemsRef.current) {
        item.pct -= speed * dt;
        if (item.pct < -12) continue; // lekerült a pályáról

        const inHitBand = Math.abs(item.pct - PLAYER_X_PCT) <= HIT_TOLERANCE_PCT;
        if (inHitBand && item.lane === laneRef.current) {
          if (item.def.type === 'meat') {
            scoreGain += XP_PER_MEAT;
            playQuizSfx('correct');
            continue; // bekapva, eltűnik
          }
          // szikla vagy skorpió — vége a játéknak
          survivors.push(item);
          itemsRef.current = survivors;
          endRun(score + scoreGain);
          return;
        }
        survivors.push(item);
      }

      itemsRef.current = survivors;
      if (scoreGain > 0) setScore((s) => s + scoreGain);
      setRenderTick((t) => t + 1);
    }, TICK_MS);

    return stopLoop;
  }, [gameStatus, endRun, score, stopLoop]);

  useEffect(() => stopLoop, [stopLoop]);

  // --- Futás-animáció kerete ---------------------------------------------------
  useEffect(() => {
    if (gameStatus !== 'playing') return undefined;
    const frameInterval = setInterval(() => {
      setRunFrame((f) => (f + 1) % RUN_FRAMES.length);
    }, RUN_FRAME_MS);
    return () => clearInterval(frameInterval);
  }, [gameStatus]);

  // --- Billentyűzet (web) — fel/le váltja a sávot ----------------------------
  useEffect(() => {
    if (Platform.OS !== 'web' || gameStatus !== 'playing') return undefined;
    const handleKey = (e) => {
      if (e.key === 'ArrowUp') changeLane(-1);
      else if (e.key === 'ArrowDown') changeLane(1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameStatus, changeLane]);

  // --- Csúsztatás (mobil) — fel/le ------------------------------------------
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 18,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 18) changeLane(1);
        else if (gesture.dy < -18) changeLane(-1);
      },
    })
  ).current;

  const handleQuit = () => {
    stopLoop();
    onBack();
  };

  // --- Kezdő képernyő -------------------------------------------------------
  if (gameStatus === 'idle') {
    return (
      <Shell backgroundImage={landingBg}>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
          <View style={styles.centerContent}>
            <Text style={styles.title}>🦕 Dínófutam</Text>
            <View style={styles.rulesBox}>
              <RuleRow text="A 3 középső sávon futsz, válts fel/le, kerüld ki a sziklákat és a skorpiókat" />
              <RuleRow text="Kapd be a húsdarabokat — mindegyik +5 XP" />
              <RuleRow text="A pálya egyre gyorsul, minél tovább bírod, annál több XP" />
              <RuleRow text="Egy ütközés — vége a futamnak, az addigi XP megmarad" />
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={startGame}>
              <Text style={styles.primaryBtnText}>▶ KEZDÉS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backLink} onPress={onBack}>
              <Text style={styles.backLinkText}>← Vissza a menübe</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Shell>
    );
  }

  // --- Eredmény képernyő ------------------------------------------------------
  if (gameStatus === 'over') {
    return (
      <Shell backgroundImage={landingBg}>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
          <View style={styles.centerContent}>
            <Text style={styles.badgeEmoji}>💥</Text>
            <Text style={styles.title}>Ütköztél!</Text>
            <View style={styles.statsBox}>
              <Text style={styles.statLabel}>Megszerzett XP:</Text>
              <Text style={styles.statValue}>{score} XP</Text>
            </View>
            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.primaryBtn} onPress={startGame}>
                <Text style={styles.primaryBtnText}>🔄 ÚJRA</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exitBtn} onPress={onBack}>
                <Text style={styles.exitBtnText}>← KILÉPÉS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Shell>
    );
  }

  // --- Játéktér (vízszintes) ---------------------------------------------------
  return (
    <Shell backgroundImage={landingBg}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

        <View style={styles.header}>
          <Text style={styles.headerXP}>⭐ {score} XP</Text>
          <View style={styles.headerRight}>
            <Text style={styles.levelText}>{level}. szint</Text>
            <TouchableOpacity onPress={handleQuit}>
              <Text style={styles.backLinkText}>✕ Kilépés</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.playArea}>
          <View style={styles.trackWrap}>
            <View style={[styles.track, { height: TRACK_HEIGHT }]} {...panResponder.panHandlers}>
              <View style={[styles.decorRow, styles.laneDivider]}>
                {terrainRef.current
                  .filter((t) => t.row === 'top')
                  .map((t) => (
                    <Text key={t.id} style={[styles.terrainEmoji, { left: `${t.pct}%` }]}>
                      {t.emoji}
                    </Text>
                  ))}
              </View>

              {[0, 1, 2].map((laneIdx) => (
                <View key={laneIdx} style={[styles.lane, styles.laneDivider]}>
                  {itemsRef.current
                    .filter((item) => item.lane === laneIdx)
                    .map((item) => (
                      <View
                        key={item.id}
                        style={[
                          styles.item,
                          {
                            backgroundColor: item.def.bg,
                            borderColor: item.def.border,
                            left: `${item.pct}%`,
                          },
                        ]}
                      >
                        <Image source={item.def.img} style={styles.itemImage} resizeMode="contain" />
                      </View>
                    ))}

                  {lane === laneIdx && (
                    <View style={[styles.player, { left: `${PLAYER_X_PCT}%` }]}>
                      <Image source={RUN_FRAMES[runFrame]} style={styles.playerImage} resizeMode="contain" />
                    </View>
                  )}
                </View>
              ))}

              <View style={[styles.decorRow, styles.laneDivider]}>
                {terrainRef.current
                  .filter((t) => t.row === 'bottom')
                  .map((t) => (
                    <Text key={t.id} style={[styles.terrainEmoji, { left: `${t.pct}%` }]}>
                      {t.emoji}
                    </Text>
                  ))}
              </View>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.laneBtn} onPress={() => changeLane(-1)}>
              <Text style={styles.laneBtnText}>▲</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.laneBtn} onPress={() => changeLane(1)}>
              <Text style={styles.laneBtnText}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Shell>
  );
}

function RuleRow({ text }) {
  return (
    <View style={styles.ruleRow}>
      <Text style={styles.ruleDot}>•</Text>
      <Text style={styles.ruleText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', paddingBottom: 20 },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  title: {
    color: COLORS.gold,
    fontFamily: FONTS.bold,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  rulesBox: {
    backgroundColor: 'rgba(221,161,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(221,161,94,0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 8,
    marginBottom: 24,
    width: '100%',
    maxWidth: 420,
  },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ruleDot: { color: COLORS.gold, fontSize: 16, fontWeight: 'bold' },
  ruleText: { color: '#FEFAE0', fontFamily: FONTS.body, fontSize: 15, lineHeight: 21, flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  headerXP: { color: COLORS.gold, fontFamily: FONTS.bold, fontSize: 16, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  levelText: { color: '#90e0ef', fontFamily: FONTS.bold, fontSize: 15, fontWeight: '700' },
  playArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 18,
  },
  trackWrap: {
    width: '100%',
    position: 'relative',
  },
  track: {
    flexDirection: 'column',
    borderRadius: 16,
    backgroundColor: 'rgba(0,18,25,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(221,161,94,0.25)',
    overflow: 'hidden',
  },
  lane: {
    flex: 1,
    position: 'relative',
  },
  decorRow: {
    height: DECOR_ROW_HEIGHT,
    position: 'relative',
    backgroundColor: 'rgba(96,108,56,0.12)',
    overflow: 'hidden',
  },
  laneDivider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(254,250,224,0.12)',
  },
  terrainEmoji: {
    position: 'absolute',
    top: '50%',
    marginTop: -14,
    marginLeft: -14,
    fontSize: 26,
    opacity: 0.75,
  },
  item: {
    position: 'absolute',
    top: '50%',
    marginTop: -ITEM_SIZE / 2,
    marginLeft: -ITEM_SIZE / 2,
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImage: { width: ITEM_SIZE * 0.78, height: ITEM_SIZE * 0.78 },
  player: {
    position: 'absolute',
    top: '50%',
    marginTop: -PLAYER_SIZE / 2,
    marginLeft: -PLAYER_SIZE / 2,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerImage: { width: PLAYER_SIZE, height: PLAYER_SIZE },
  controls: {
    flexDirection: 'row',
    gap: 20,
  },
  laneBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(221,161,94,0.15)',
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laneBtnText: { color: COLORS.gold, fontSize: 24, fontWeight: '700' },
  badgeEmoji: { fontSize: 64, marginBottom: 12 },
  statsBox: {
    backgroundColor: 'rgba(221,161,94,0.1)',
    borderWidth: 2,
    borderColor: COLORS.gold,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 28,
    alignItems: 'center',
    gap: 6,
  },
  statLabel: { color: '#FEFAE0', fontFamily: FONTS.body, fontSize: 15 },
  statValue: { color: COLORS.gold, fontFamily: FONTS.bold, fontSize: 22, fontWeight: '700' },
  buttonGroup: { gap: 12, width: '100%', maxWidth: 300 },
  primaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: 'rgba(221,161,94,0.15)',
    borderWidth: 2,
    borderColor: COLORS.gold,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: COLORS.gold, fontFamily: FONTS.bold, fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  exitBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: 'rgba(254,250,224,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(254,250,224,0.25)',
    borderRadius: 12,
    alignItems: 'center',
  },
  exitBtnText: { color: '#FEFAE0', fontFamily: FONTS.bold, fontSize: 16, fontWeight: '700' },
  backLink: { alignSelf: 'center', marginTop: 20, paddingVertical: 8, paddingHorizontal: 12 },
  backLinkText: { color: 'rgba(254,250,224,0.6)', fontFamily: FONTS.body, fontSize: 15 },
});
