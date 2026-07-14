// src/screens/WhoAmIScreen.js
// "Ki vagyok én?" — a dínó elárul pár tényt magáról (felfedező, felfedezés éve,
// ország, étrend, család), és a játékosnak 4 név közül kell kiválasztania a helyes
// megfejtést egy 2x2-es gombrácsból. Minden helyes válasz +5 XP, 3 szív áll
// rendelkezésre — a harmadik hibás válasznál vége a körnek.
// A kérdéseket a whoAmIQuizGenerator állítja össze úgy, hogy a 3 rossz válasz
// mindig ugyanabba a családba (alrend) tartozzon, mint a helyes.

import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';
import Shell from '../components/Shell';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { playQuizSfx } from '../audio/audioSystem';
import { buildWhoAmIQuiz, buildWhoAmIClueSegments } from '../utils/whoAmIQuizGenerator';
import { addXP } from '../components/XPBar';
import { submitLeaderboardEntry, getCelebrationMessage } from '../services/leaderboardService';
import Fireworks from '../components/Fireworks';

const REVEAL_DELAY_MS = 1200;
const QUESTION_COUNT = 10;
const XP_PER_CORRECT = 5;
const MAX_LIVES = 3;

export default function WhoAmIScreen({ allDinos, playerId, onBack }) {
  const [gameStatus, setGameStatus] = useState('idle'); // 'idle' | 'playing' | 'finished'
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [celebration, setCelebration] = useState({ visible: false, message: '' });

  const startTimeRef = useRef(null);
  // A setTimeout-on át hívott finishRun closure-je elavult `correctCount`-ot
  // látna (a setCorrectCount még nem futott le, amikor finishRun ütemeződik) —
  // ezért ref-ben tartjuk szinkronban a lapfordítás-logikához hasonlóan
  // (lásd MemoryGameScreen.js hasonló kommentjét).
  const correctCountRef = useRef(0);

  const startGame = () => {
    const quiz = buildWhoAmIQuiz(allDinos, QUESTION_COUNT);
    if (quiz.length === 0) return; // betöltési hiba — a gomb eleve le van tiltva
    playQuizSfx('letsPlay');
    startTimeRef.current = Date.now();
    correctCountRef.current = 0;
    setQuestions(quiz);
    setCurrentQuestionIndex(0);
    setXpEarned(0);
    setCorrectCount(0);
    setLives(MAX_LIVES);
    setSelected(null);
    setRevealed(false);
    setCelebration({ visible: false, message: '' });
    setGameStatus('playing');
  };

  const finishRun = async (finalXP) => {
    setGameStatus('finished');
    if (finalXP > 0) {
      await addXP(finalXP);
    }
    if (playerId && correctCountRef.current === QUESTION_COUNT) {
      submitLeaderboardEntry({
        playerId,
        levelType: 'whoami',
        completionTimeMs: Date.now() - startTimeRef.current,
      }).then((result) => {
        const message = getCelebrationMessage(result);
        if (message) setCelebration({ visible: true, message });
      });
    }
  };

  const handleSelect = (idx) => {
    if (revealed || gameStatus !== 'playing') return;
    setSelected(idx);
    setRevealed(true);

    const question = questions[currentQuestionIndex];
    const isCorrect = idx === question.correctIndex;

    if (isCorrect) {
      playQuizSfx('correct');
      const newXP = xpEarned + XP_PER_CORRECT;
      setXpEarned(newXP);
      correctCountRef.current += 1;
      setCorrectCount(correctCountRef.current);

      setTimeout(() => {
        if (currentQuestionIndex + 1 < questions.length) {
          setCurrentQuestionIndex((i) => i + 1);
          setSelected(null);
          setRevealed(false);
        } else {
          finishRun(newXP);
        }
      }, REVEAL_DELAY_MS);
    } else {
      playQuizSfx('wrong');
      const newLives = lives - 1;
      setLives(newLives);

      setTimeout(() => {
        if (newLives <= 0) {
          finishRun(xpEarned);
        } else if (currentQuestionIndex + 1 < questions.length) {
          setCurrentQuestionIndex((i) => i + 1);
          setSelected(null);
          setRevealed(false);
        } else {
          finishRun(xpEarned);
        }
      }, REVEAL_DELAY_MS);
    }
  };

  const handleQuitMidGame = () => {
    if (xpEarned > 0) {
      addXP(xpEarned).then(() => onBack());
    } else {
      onBack();
    }
  };

  // --- Start képernyő -----------------------------------------------------
  if (gameStatus === 'idle') {
    const quizAvailable = buildWhoAmIQuiz(allDinos, QUESTION_COUNT).length > 0;
    return (
      <Shell>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
          <ScrollView contentContainerStyle={styles.centerContent}>
            <Text style={styles.title}>🔍 Ki vagyok én?</Text>

            <View style={styles.rulesBox}>
              <RuleRow text="A dínó elárul pár tényt magáról" />
              <RuleRow text="4 név közül kell kitalálnod, kiről van szó" />
              <RuleRow text="A 3 rossz válasz mindig ugyanabba a családba tartozik" />
              <RuleRow text={`Helyes válaszonként +${XP_PER_CORRECT} XP`} />
              <RuleRow text={`${MAX_LIVES} szív — ennyit hibázhatsz`} />
              <RuleRow text={`${QUESTION_COUNT} kérdés kör`} />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, !quizAvailable && styles.primaryBtnDisabled]}
              onPress={startGame}
              disabled={!quizAvailable}
            >
              <Text style={styles.primaryBtnText}>
                {quizAvailable ? '▶ KEZDÉS' : 'Kérdések betöltése sikertelen'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backLink} onPress={onBack}>
              <Text style={styles.backLinkText}>← Vissza a menübe</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Shell>
    );
  }

  // --- Eredmény képernyő ----------------------------------------------------
  if (gameStatus === 'finished') {
    return (
      <Shell>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
          <Fireworks
            visible={celebration.visible}
            message={celebration.message}
            onDone={() => setCelebration((c) => ({ ...c, visible: false }))}
          />
          <View style={styles.centerContent}>
            <Text style={styles.badgeEmoji}>{correctCount === questions.length ? '🏆' : lives <= 0 ? '💔' : '🦴'}</Text>
            <Text style={styles.title}>{lives <= 0 ? 'Elfogytak a szíveid!' : 'Vége a körnek!'}</Text>
            <Text style={styles.resultSubtitle}>
              {correctCount}/{questions.length} helyes megfejtés
            </Text>

            <View style={styles.statsBox}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Megszerzett XP:</Text>
                <Text style={styles.statValue}>{xpEarned} XP</Text>
              </View>
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

  // --- Kérdés képernyő --------------------------------------------------------
  const question = questions[currentQuestionIndex];

  return (
    <Shell>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

        <View style={styles.header}>
          <Text style={styles.headerCounter}>
            Kérdés {currentQuestionIndex + 1} / {questions.length}
          </Text>
          <Text style={styles.headerLives}>{'❤️'.repeat(lives)}{'🖤'.repeat(MAX_LIVES - lives)}</Text>
          <Text style={styles.headerXP}>⭐ {xpEarned} XP</Text>
        </View>

        <View style={styles.clueBox}>
          <Text style={styles.clueText}>
            {buildWhoAmIClueSegments(question.dino).map((segment, idx) => (
              <Text key={idx} style={segment.bold ? styles.clueBold : null}>
                {segment.text}
              </Text>
            ))}
          </Text>
        </View>

        <View style={styles.questionBox}>
          <Text style={styles.questionText}>Ki vagyok én?</Text>
        </View>

        <View style={styles.optionsGrid}>
          {question.options.map((opt, idx) => {
            const optStyle = [styles.optionBtn];
            if (revealed) {
              if (idx === question.correctIndex) optStyle.push(styles.optionBtnCorrect);
              else if (idx === selected) optStyle.push(styles.optionBtnWrong);
            }
            return (
              <TouchableOpacity
                key={idx}
                style={optStyle}
                disabled={revealed}
                onPress={() => handleSelect(idx)}
              >
                <Text style={styles.optionText}>{['A', 'B', 'C', 'D'][idx]}: {opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.backLink} onPress={handleQuitMidGame}>
          <Text style={styles.backLinkText}>✕ Feladom</Text>
        </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingBottom: 20,
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  title: {
    color: '#DDA15E',
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
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  ruleDot: {
    color: '#DDA15E',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ruleText: {
    color: '#FEFAE0',
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  headerCounter: {
    color: '#FEFAE0',
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
  },
  headerLives: {
    fontSize: 16,
    letterSpacing: 2,
  },
  headerXP: {
    color: '#DDA15E',
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
  },
  clueBox: {
    backgroundColor: 'rgba(254,250,224,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.14)',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  clueText: {
    color: '#FEFAE0',
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
  },
  clueBold: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: '#DDA15E',
  },
  questionBox: {
    backgroundColor: 'rgba(221,161,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(221,161,94,0.3)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  questionText: {
    color: '#FEFAE0',
    fontFamily: FONTS.bold,
    fontSize: 17,
    lineHeight: 23,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  optionBtn: {
    flexBasis: '47%',
    flexGrow: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(254,250,224,0.05)',
    borderWidth: 2,
    borderColor: '#606C38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBtnCorrect: {
    backgroundColor: 'rgba(76,175,80,0.3)',
    borderColor: '#4CAF50',
  },
  optionBtnWrong: {
    backgroundColor: 'rgba(244,67,54,0.3)',
    borderColor: '#F44336',
  },
  optionText: {
    color: '#FEFAE0',
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  badgeEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  resultSubtitle: {
    color: '#FEFAE0',
    fontFamily: FONTS.body,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  statsBox: {
    backgroundColor: 'rgba(221,161,94,0.1)',
    borderWidth: 2,
    borderColor: '#DDA15E',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 28,
    minWidth: 250,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  statLabel: {
    color: '#FEFAE0',
    fontFamily: FONTS.body,
    fontSize: 15,
  },
  statValue: {
    color: '#DDA15E',
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonGroup: {
    gap: 12,
    width: '100%',
    maxWidth: 300,
  },
  primaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: 'rgba(221,161,94,0.15)',
    borderWidth: 2,
    borderColor: '#DDA15E',
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: {
    color: '#DDA15E',
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  exitBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: 'rgba(254,250,224,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(254,250,224,0.25)',
    borderRadius: 12,
    alignItems: 'center',
  },
  exitBtnText: {
    color: '#FEFAE0',
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '700',
  },
  backLink: {
    alignSelf: 'center',
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backLinkText: {
    color: 'rgba(254,250,224,0.6)',
    fontFamily: FONTS.body,
    fontSize: 13,
  },
});
