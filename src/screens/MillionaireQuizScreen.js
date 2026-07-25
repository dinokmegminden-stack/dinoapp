// src/screens/MillionaireQuizScreen.js
// "Legyen Ön is XP Milliomos" — Millionaire-stílusú XP kvíz.
// 15 kérdés (5 easy, 5 medium, 5 hard), nincs segítség/joker,
// egy rossz válasz azonnal lezárja a játékot. Max 200 XP.
//
// XP jóváírás szabályai (design doc 9. pont):
// - vesztes futás (rossz válasz): addigi XP jóváírva
// - győztes futás (15/15): 200 XP jóváírva
// - megszakított futás (Kilépés játék közben): NINCS jóváírás

import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';
import Shell from '../components/Shell';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { playQuizSfx } from '../audio/audioSystem';
import { buildMillionaireQuiz } from '../utils/millionaireQuizGenerator';
import {
  MILLIONAIRE_XP_TABLE,
  MILLIONAIRE_MAX_XP,
  DIFFICULTY_LABELS,
} from '../constants/millionaireXP';
import { addXP } from '../components/XPBar';
import { submitLeaderboardEntry, getCelebrationMessage } from '../services/leaderboardService';
import Fireworks from '../components/Fireworks';

// Ugyanaz a háttérkép, ami a landing hero-t is adja (Shell animálja web-
// asztali nézetben) — a játékmódok mögött is megmarad, hogy ne váltson
// éles kontrasztban sima sötét háttérre navigáláskor.
const landingBg = require('../../assets/images/new_bg.jpg');

const REVEAL_DELAY_MS = 1500;

const DIFFICULTY_COLORS = {
  easy: '#606C38',
  medium: '#DDA15E',
  hard: '#BC6C25',
};

export default function MillionaireQuizScreen({ playerId, onBack }) {
  const [gameStatus, setGameStatus] = useState('idle'); // 'idle' | 'playing' | 'won' | 'lost'
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [earnedXP, setEarnedXP] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [celebration, setCelebration] = useState({ visible: false, message: '' });

  const startTimeRef = useRef(null);

  const startGame = () => {
    const quiz = buildMillionaireQuiz();
    if (quiz.length === 0) return; // betöltési hiba — a gomb eleve le van tiltva
    playQuizSfx('letsPlay');
    startTimeRef.current = Date.now();
    setQuestions(quiz);
    setCurrentQuestionIndex(0);
    setEarnedXP(0);
    setSelected(null);
    setRevealed(false);
    setCelebration({ visible: false, message: '' });
    setGameStatus('playing');
  };

  const finishRun = async (finalXP, status) => {
    setGameStatus(status);
    if (finalXP > 0) {
      await addXP(finalXP); // vesztes és győztes futásnál is jár az addigi XP
    }
    // "won" itt eleve csak hibátlanul érhető el (egy rossz válasz azonnal
    // lezárja a játékot, lásd a fájl tetején lévő design doc kommentet).
    if (playerId && status === 'won') {
      submitLeaderboardEntry({
        playerId,
        levelType: 'millionaire',
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
    const rowXP = MILLIONAIRE_XP_TABLE[currentQuestionIndex].xp;

    if (isCorrect) {
      playQuizSfx('correct');
      const newXP = earnedXP + rowXP;
      setEarnedXP(newXP);

      setTimeout(() => {
        if (currentQuestionIndex + 1 < questions.length) {
          setCurrentQuestionIndex((i) => i + 1);
          setSelected(null);
          setRevealed(false);
        } else {
          playQuizSfx('winningTheme');
          finishRun(newXP, 'won');
        }
      }, REVEAL_DELAY_MS);
    } else {
      playQuizSfx('wrong');
      setTimeout(() => {
        finishRun(earnedXP, 'lost');
      }, REVEAL_DELAY_MS);
    }
  };

  // Megszakítás játék közben: nincs XP jóváírás (design doc 9. pont)
  const handleQuitMidGame = () => {
    onBack();
  };

  // --- Start képernyő -----------------------------------------------------
  if (gameStatus === 'idle') {
    const quizAvailable = buildMillionaireQuiz().length > 0;
    return (
      <Shell backgroundImage={landingBg}>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.bg || '#283618'} />
          <ScrollView contentContainerStyle={styles.centerContent}>
            <Text style={styles.title}>💰 Legyen Ön is XP Milliomos!</Text>

            <View style={styles.rulesBox}>
              <RuleRow text={`${MILLIONAIRE_XP_TABLE.length} kérdés, egyre nehezebbek`} />
              <RuleRow text="Nincs segítség, nincs joker" />
              <RuleRow text="Egy rossz válasz — vége a játéknak" />
              <RuleRow text="A megszerzett XP hibánál is megmarad" />
              <RuleRow text={`Mind a ${MILLIONAIRE_XP_TABLE.length} helyes: ${MILLIONAIRE_MAX_XP} XP + XP Milliomos cím`} />
            </View>

            <View style={styles.ladderBox}>
              {[...MILLIONAIRE_XP_TABLE].reverse().map((row) => (
                <View key={row.question} style={styles.ladderRow}>
                  <Text style={styles.ladderQuestion}>{row.question}.</Text>
                  <Text style={[styles.ladderDifficulty, { color: DIFFICULTY_COLORS[row.difficulty] }]}>
                    {DIFFICULTY_LABELS[row.difficulty]}
                  </Text>
                  <Text style={styles.ladderXP}>+{row.xp} XP</Text>
                </View>
              ))}
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
  if (gameStatus === 'won' || gameStatus === 'lost') {
    const isMillionaire = gameStatus === 'won';
    const reachedQuestion = isMillionaire ? MILLIONAIRE_XP_TABLE.length : currentQuestionIndex + 1;
    return (
      <Shell backgroundImage={landingBg}>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.bg || '#283618'} />
          <Fireworks
            visible={celebration.visible}
            message={celebration.message}
            onDone={() => setCelebration((c) => ({ ...c, visible: false }))}
          />
          <View style={styles.centerContent}>
            {isMillionaire ? (
              <>
                <Text style={styles.badgeEmoji}>🏆</Text>
                <Text style={styles.title}>XP MILLIOMOS!</Text>
                <Text style={styles.resultSubtitle}>Mind a {MILLIONAIRE_XP_TABLE.length} kérdésre helyesen válaszoltál!</Text>
              </>
            ) : (
              <>
                <Text style={styles.badgeEmoji}>😕</Text>
                <Text style={styles.title}>Vége a játéknak</Text>
                <Text style={styles.resultSubtitle}>{reachedQuestion}/{MILLIONAIRE_XP_TABLE.length} kérdésig jutottál.</Text>
              </>
            )}

            <View style={styles.statsBox}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Megszerzett XP:</Text>
                <Text style={styles.statValue}>{earnedXP} / {MILLIONAIRE_MAX_XP}</Text>
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
  const tableRow = MILLIONAIRE_XP_TABLE[currentQuestionIndex];
  const difficultyColor = DIFFICULTY_COLORS[tableRow.difficulty];

  return (
    <Shell backgroundImage={landingBg}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg || '#283618'} />

        <View style={styles.header}>
          <Text style={styles.headerCounter}>Kérdés {currentQuestionIndex + 1} / {questions.length}</Text>
          <Text style={[styles.headerDifficulty, { color: difficultyColor }]}>
            {DIFFICULTY_LABELS[tableRow.difficulty]} · +{tableRow.xp} XP
          </Text>
        </View>

        <View style={styles.questionBox}>
          <Text style={styles.questionText}>{question.question}</Text>
        </View>

        <View style={styles.optionsList}>
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
          <Text style={styles.backLinkText}>✕ Feladom (XP nem kerül jóváírásra)</Text>
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
    marginBottom: 20,
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
    fontSize: 15,
    lineHeight: 21,
    flex: 1,
  },
  ladderBox: {
    backgroundColor: 'rgba(254,250,224,0.05)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    gap: 4,
    marginBottom: 24,
    width: '100%',
    maxWidth: 420,
  },
  ladderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  ladderQuestion: {
    color: '#FEFAE0',
    fontFamily: FONTS.bold,
    fontSize: 15,
    width: 32,
  },
  ladderDifficulty: {
    fontFamily: FONTS.body,
    fontSize: 15,
    flex: 1,
  },
  ladderXP: {
    color: '#DDA15E',
    fontFamily: FONTS.bold,
    fontSize: 15,
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
    fontSize: 15,
    fontWeight: '700',
  },
  headerDifficulty: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
  },
  headerXP: {
    color: '#DDA15E',
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
  },
  questionBox: {
    backgroundColor: 'rgba(221,161,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(221,161,94,0.3)',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    minHeight: 90,
    justifyContent: 'center',
  },
  questionText: {
    color: '#FEFAE0',
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
  },
  optionsList: {
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  optionBtn: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(254,250,224,0.05)',
    borderWidth: 2,
    borderColor: '#606C38',
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
    fontSize: 15,
    lineHeight: 21,
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
    fontSize: 15,
  },
});
