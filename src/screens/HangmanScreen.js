// src/screens/HangmanScreen.js
// "Akasztófa" — a feladvány mindig egy véletlenszerű dínó tudományos neve
// (Genus + faj, pl. "Tyrannosaurus rex"). A játékosnak 6 hibalehetősége van;
// minden hibás betűnél egy lépéssel közelebb kerül a becsapódás az aszteroida-
// képsoron (lásd AsteroidImpactPanel.js — Approach → ... → Crater a 6. hibánál).
// Ha mind a 6 lépés megtörténik, a játékos veszít; ha kitalálja a nevet,
// mielőtt ez megtörténne, +10 XP jár.
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, Platform } from 'react-native';
import {
  useFonts as useCinzel,
  Cinzel_700Bold,
} from '@expo-google-fonts/cinzel';
import Shell from '../components/Shell';
import HeaderBar from '../components/HeaderBar';
import AsteroidImpactPanel from '../components/AsteroidImpactPanel';
import { COLORS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { playSound, playQuizSfx } from '../audio/audioSystem';
import { addXP } from '../components/XPBar';
import { claimDailyChallengeBonus } from '../utils/dailyChallenge';
import GameTitleTag from '../components/GameTitleTag';
import { useT } from '../i18n';

const landingBg = require('../../assets/images/new_bg.jpg');

const MAX_MISTAKES = 6;
const XP_REWARD = 10;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// A kártyák/napi dínó ugyanígy építi fel a teljes tudományos nevet (genus +
// a latin_name_ending mező, ha a name_latin még nem tartalmazza) — lásd
// TradingCard.js / DailyDinoCard.js "latinFull" logikáját, ugyanaz kell ide is.
function getLatinFull(dino) {
  const base = String(dino?.name_latin || '').trim();
  if (!base) return '';
  const ending = String(dino?.latin_name_ending || '').trim();
  if (ending && !base.toLowerCase().endsWith(ending.toLowerCase())) {
    return `${base} ${ending}`;
  }
  return base;
}

function pickPuzzleCreature(allDinos) {
  const pool = (allDinos || []).filter(
    (d) => getLatinFull(d).replace(/[^A-Za-z]/g, '').length >= 4
  );
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function HangmanScreen({ allDinos, nickname, progress, onNavigate, onBack }) {
  const { t } = useT();
  const [cinzelLoaded] = useCinzel({ Cinzel_700Bold });
  const letterFont = cinzelLoaded ? 'Cinzel_700Bold' : 'System';

  const [gameStatus, setGameStatus] = useState('idle'); // 'idle' | 'playing' | 'won' | 'lost'
  const [creature, setCreature] = useState(null);
  const [word, setWord] = useState(''); // a teljes tudományos név, nagybetűvel
  const [guessed, setGuessed] = useState(new Set());
  const [wrongCount, setWrongCount] = useState(0);

  const wordLetters = new Set(word.replace(/[^A-Z]/g, '').split(''));

  const startGame = () => {
    const picked = pickPuzzleCreature(allDinos);
    if (!picked) return; // a gomb eleve le van tiltva, ha nincs elérhető dínó
    setCreature(picked);
    setWord(getLatinFull(picked).toUpperCase());
    setGuessed(new Set());
    setWrongCount(0);
    setGameStatus('playing');
    playQuizSfx('letsPlay');
  };

  const handleLetterPress = useCallback(
    (letter) => {
      if (gameStatus !== 'playing' || guessed.has(letter)) return;

      const newGuessed = new Set(guessed);
      newGuessed.add(letter);
      setGuessed(newGuessed);

      if (wordLetters.has(letter)) {
        playQuizSfx('correct');
        const solved = [...wordLetters].every((l) => newGuessed.has(l));
        if (solved) {
          setGameStatus('won');
          addXP(XP_REWARD);
          claimDailyChallengeBonus('hangman', XP_REWARD);
          playQuizSfx('winningTheme');
        }
      } else {
        playQuizSfx('wrong');
        const newWrongCount = wrongCount + 1;
        setWrongCount(newWrongCount);
        if (newWrongCount >= MAX_MISTAKES) {
          setGameStatus('lost');
        }
      }
    },
    [gameStatus, guessed, wordLetters, wrongCount]
  );

  // --- Fizikai billentyűzet (web) — A-Z lenyomása ugyanaz, mint a koppintás ---
  useEffect(() => {
    if (Platform.OS !== 'web' || gameStatus !== 'playing') return undefined;
    const handleKey = (e) => {
      const letter = e.key.toUpperCase();
      if (ALPHABET.includes(letter)) handleLetterPress(letter);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameStatus, handleLetterPress]);

  const handleQuit = () => {
    playSound('click');
    onBack();
  };

  // --- Kezdő képernyő -------------------------------------------------------
  if (gameStatus === 'idle') {
    const puzzleAvailable = pickPuzzleCreature(allDinos) != null;
    return (
      <Shell backgroundImage={landingBg} header={<HeaderBar currentView="gaming" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
          <ScrollView contentContainerStyle={styles.centerContent}>
            <Text style={styles.title}>{t('games.hangman.title')}</Text>
            <View style={styles.rulesBox}>
              <RuleRow text={t('games.hangman.rule_sciname')} />
              <RuleRow text={t('games.hangman.rule_letters')} />
              <RuleRow text={t('games.hangman.rule_mistakes', { max: MAX_MISTAKES })} />
              <RuleRow text={t('games.hangman.rule_impact')} />
              <RuleRow text={t('games.hangman.rule_xp', { xp: XP_REWARD })} />
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, !puzzleAvailable && styles.primaryBtnDisabled]}
              onPress={startGame}
              disabled={!puzzleAvailable}
            >
              <Text style={styles.primaryBtnText}>
                {puzzleAvailable ? t('games.hangman.start') : t('games.hangman.load_fail')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backLink} onPress={onBack}>
              <Text style={styles.backLinkText}>{t('games.hangman.back_menu')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Shell>
    );
  }

  // --- Eredmény képernyők ---------------------------------------------------
  if (gameStatus === 'won' || gameStatus === 'lost') {
    const won = gameStatus === 'won';
    return (
      <Shell backgroundImage={landingBg} header={<HeaderBar currentView="gaming" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
          <ScrollView contentContainerStyle={styles.centerContent}>
            <Text style={styles.badgeEmoji}>{won ? '🏆' : '💀'}</Text>
            <Text style={styles.title}>{won ? t('games.hangman.won') : t('games.hangman.lost')}</Text>
            <Text style={[styles.answerLatin, { fontFamily: letterFont }]}>{word}</Text>
            {!!creature?.name_hu && <Text style={styles.answerHu}>{creature.name_hu}</Text>}
            {won && (
              <View style={styles.statsBox}>
                <Text style={styles.statLabel}>{t('games.hangman.earned_xp')}</Text>
                <Text style={styles.statValue}>{XP_REWARD} XP</Text>
              </View>
            )}
            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.primaryBtn} onPress={startGame}>
                <Text style={styles.primaryBtnText}>{t('games.hangman.again')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exitBtn} onPress={onBack}>
                <Text style={styles.exitBtnText}>{t('games.hangman.exit')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Shell>
    );
  }

  // --- Játék képernyő --------------------------------------------------------
  return (
    <Shell backgroundImage={landingBg} header={<HeaderBar currentView="gaming" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
        <GameTitleTag title={t('games.mode_hangman')} />

        <View style={styles.header}>
          <Text style={styles.headerMistakes}>{t('games.hangman.mistakes', { count: wrongCount, max: MAX_MISTAKES })}</Text>
          <TouchableOpacity onPress={handleQuit}>
            <Text style={styles.backLinkText}>{t('games.hangman.quit')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.playScroll} contentContainerStyle={styles.playContent}>
          <View style={styles.playRow}>
            <View style={styles.impactBanner}>
              <AsteroidImpactPanel step={wrongCount} />
            </View>

            <View style={styles.playLeftCol}>
              <View style={styles.wordRow}>
                {word.split(' ').map((segment, wi) => (
                  <View key={wi} style={styles.wordSegment}>
                    {segment.split('').map((ch, ci) => (
                      <View key={ci} style={styles.letterBox}>
                        <Text style={[styles.letterText, { fontFamily: letterFont }]}>
                          {guessed.has(ch) ? ch : ' '}
                        </Text>
                        <View style={styles.letterUnderline} />
                      </View>
                    ))}
                  </View>
                ))}
              </View>

              <View style={styles.keyboard}>
                {ALPHABET.map((letter) => {
                  const isGuessed = guessed.has(letter);
                  const isCorrect = isGuessed && wordLetters.has(letter);
                  const isWrong = isGuessed && !wordLetters.has(letter);
                  return (
                    <TouchableOpacity
                      key={letter}
                      style={[
                        styles.keyBtn,
                        isCorrect && styles.keyBtnCorrect,
                        isWrong && styles.keyBtnWrong,
                      ]}
                      disabled={isGuessed}
                      onPress={() => handleLetterPress(letter)}
                    >
                      <Text style={styles.keyBtnText}>{letter}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
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
    flexGrow: 1,
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
  headerMistakes: { color: COLORS.gold, fontFamily: FONTS.bold, fontSize: 15, fontWeight: '700' },
  playScroll: {
    flex: 1,
  },
  playContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  playRow: {
    width: '100%',
    maxWidth: 700,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
  },
  impactBanner: {
    width: '100%',
  },
  playLeftCol: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  wordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
  },
  wordSegment: {
    flexDirection: 'row',
    gap: 10,
  },
  letterBox: {
    width: 32,
    alignItems: 'center',
  },
  letterText: {
    color: COLORS.gold,
    fontSize: 30,
    fontWeight: '700',
    minHeight: 36,
  },
  letterUnderline: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(221,161,94,0.5)',
    borderRadius: 2,
    marginTop: 2,
  },
  keyboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    maxWidth: 500,
  },
  keyBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(254,250,224,0.05)',
    borderWidth: 2,
    borderColor: COLORS.olive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBtnCorrect: {
    backgroundColor: 'rgba(76,175,80,0.3)',
    borderColor: '#4CAF50',
  },
  keyBtnWrong: {
    backgroundColor: 'rgba(244,67,54,0.3)',
    borderColor: '#F44336',
    opacity: 0.6,
  },
  keyBtnText: {
    color: '#FEFAE0',
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
  },
  badgeEmoji: { fontSize: 64, marginBottom: 12 },
  answerLatin: {
    color: COLORS.gold,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 4,
  },
  answerHu: {
    color: '#FEFAE0',
    fontFamily: FONTS.body,
    fontSize: 15,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 20,
  },
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
  primaryBtnDisabled: { opacity: 0.4 },
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
