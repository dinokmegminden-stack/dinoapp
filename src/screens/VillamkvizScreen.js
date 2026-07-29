import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import Shell from '../components/Shell';
import HeaderBar from '../components/HeaderBar';
import { IMAGE_MAP } from '../constants/imageMap';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { playQuizSfx } from '../audio/audioSystem';
import { generateLightningQuestion } from '../utils/lightningQuizGenerator';
import { addXP } from '../components/XPBar';
import { claimDailyChallengeBonus } from '../utils/dailyChallenge';
import { submitLeaderboardEntry, getCelebrationMessage } from '../services/leaderboardService';
import Fireworks from '../components/Fireworks';

// Ugyanaz a háttérkép, ami a landing hero-t is adja (Shell animálja web-
// asztali nézetben) — a játékmódok mögött is megmarad, hogy ne váltson
// éles kontrasztban sima sötét háttérre navigáláskor.
const landingBg = require('../../assets/images/new_bg.jpg');

const MAX_QUESTIONS = 10;
const QUESTION_TIME = 5;
const MAX_LIVES = 3;
const XP_PER_CORRECT = 5;
const BONUS_XP = 10;

export default function VillamkvizScreen({ regionDinos, allDinos, playerId, nickname, progress, onNavigate, onBack }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 700;
  const [isLoading, setIsLoading] = useState(!regionDinos.length || !allDinos.length);

  // Game state
  const [questionIndex, setQuestionIndex] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [correctCount, setCorrectCount] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [status, setStatus] = useState('playing'); // 'playing', 'answered', 'finished'
  const [question, setQuestion] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [usedIds, setUsedIds] = useState(new Set());
  const [celebration, setCelebration] = useState({ visible: false, message: '' });

  const startTimeRef = useRef(null);
  // A `perfect` paraméter itt csak azt jelenti, hogy a játékos elfogyás nélkül
  // eljutott az utolsó kérdésig (bónusz XP-hez) — nem azonos a "hibátlan" (0
  // rossz válasz) feltétellel, amit a ranglistához külön ref-ben követünk,
  // hogy a setTimeout-os finishRound closure ne lásson elavult correctCount-ot.
  const correctCountRef = useRef(0);

  // Generate first question on mount or when data is loaded
  useEffect(() => {
    if (!isLoading) {
      nextQuestion();
    }
  }, [isLoading]);

  // Watch for data changes
  useEffect(() => {
    if (regionDinos.length > 0 && allDinos.length > 0) {
      setIsLoading(false);
    }
  }, [regionDinos, allDinos]);

  // Handle retry logic
  useEffect(() => {
    if (
      !isLoading &&
      status === 'playing' &&
      questionIndex === 0 &&
      !question
    ) {
      nextQuestion();
    }
  }, [status, questionIndex, isLoading]);

  // Timer effect
  useEffect(() => {
    if (status !== 'playing' || !question) return;

    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, status, question]);

  const nextQuestion = () => {
    if (questionIndex === 0) {
      startTimeRef.current = Date.now();
      correctCountRef.current = 0;
    }

    if (questionIndex >= MAX_QUESTIONS) {
      finishRound();
      return;
    }

    const newUsedIds = new Set(usedIds);
    const q = generateLightningQuestion(regionDinos, allDinos, Array.from(newUsedIds));

    if (!q) {
      finishRound();
      return;
    }

    newUsedIds.add(q.correctDino.id);
    setUsedIds(newUsedIds);
    setQuestion(q);
    setSelectedIndex(null);
    setTimeLeft(QUESTION_TIME);
    setStatus('playing');
    setQuestionIndex((i) => i + 1);
  };

  const handleTimeout = () => {
    playQuizSfx('wrong');
    setStatus('answered');
    setSelectedIndex('timeout');
    // Life lost, show correct answer
    setTimeout(() => {
      const newLives = lives - 1;
      if (newLives <= 0) {
        finishRound();
      } else {
        setLives(newLives);
        nextQuestion();
      }
    }, 800);
  };

  const handleAnswer = (index) => {
    if (status !== 'playing' || !question) return;

    setSelectedIndex(index);
    setStatus('answered');

    if (index === question.correctIndex) {
      // Correct
      playQuizSfx('correct');
      const newXP = xpEarned + XP_PER_CORRECT;
      setXpEarned(newXP);
      correctCountRef.current += 1;
      setCorrectCount(correctCountRef.current);

      setTimeout(() => {
        if (questionIndex >= MAX_QUESTIONS) {
          finishRound(true); // Bonus flag
        } else {
          nextQuestion();
        }
      }, 600);
    } else {
      // Wrong
      playQuizSfx('wrong');
      const newLives = lives - 1;

      setTimeout(() => {
        if (newLives <= 0) {
          finishRound();
        } else {
          setLives(newLives);
          nextQuestion();
        }
      }, 800);
    }
  };

  const finishRound = async (perfect = false) => {
    setStatus('finished');

    const finalXP = perfect ? xpEarned + BONUS_XP : xpEarned;

    // Save to localStorage
    await addXP(finalXP);
    claimDailyChallengeBonus('lightning', finalXP);

    if (playerId && correctCountRef.current === MAX_QUESTIONS) {
      submitLeaderboardEntry({
        playerId,
        levelType: 'lightning',
        completionTimeMs: Date.now() - startTimeRef.current,
      }).then((result) => {
        const message = getCelebrationMessage(result);
        if (message) setCelebration({ visible: true, message });
      });
    }

    // Brief delay to show finishing
    setTimeout(() => {
      setXpEarned(finalXP);
    }, 100);
  };

  const handleExit = () => {
    if (status === 'finished') {
      onBack();
    } else {
      // Save current XP and exit
      addXP(xpEarned).then(() => {
        claimDailyChallengeBonus('lightning', xpEarned);
        onBack();
      });
    }
  };

  const handleRetry = () => {
    // Reset the game state
    setQuestionIndex(0);
    setLives(MAX_LIVES);
    setCorrectCount(0);
    correctCountRef.current = 0;
    startTimeRef.current = Date.now();
    setXpEarned(0);
    setCelebration({ visible: false, message: '' });
    setStatus('playing');
    setQuestion(null);
    setSelectedIndex(null);
    setTimeLeft(QUESTION_TIME);
    setUsedIds(new Set());
    // Trigger next question generation
    setTimeout(() => {
      nextQuestion();
    }, 100);
  };

  // Render finished screen
  if (status === 'finished') {
    const isPerfect = correctCount === MAX_QUESTIONS;
    return (
      <Shell backgroundImage={landingBg} header={<HeaderBar currentView="gaming" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.bg || '#283618'} />
          <Fireworks
            visible={celebration.visible}
            message={celebration.message}
            onDone={() => setCelebration((c) => ({ ...c, visible: false }))}
          />
          <View style={styles.finishedContent}>
            <Text style={styles.finishedTitle}>
              {isPerfect ? '🎉 TÖKÉLETES!' : '🏁 KÖR VÉGE'}
            </Text>

            <View style={styles.statsBox}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Helyes válaszok:</Text>
                <Text style={styles.statValue}>{correctCount}/{MAX_QUESTIONS}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Szerzett XP:</Text>
                <Text style={styles.statValue}>+{xpEarned}</Text>
              </View>
              {isPerfect && (
                <View style={styles.statRow}>
                  <Text style={styles.bonusLabel}>Bónusz:</Text>
                  <Text style={styles.bonusValue}>+{BONUS_XP} XP ⭐</Text>
                </View>
              )}
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                <Text style={styles.retryBtnText}>🔄 ÚJRA</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exitBtn} onPress={handleExit}>
                <Text style={styles.exitBtnText}>← KILÉPÉS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Shell>
    );
  }

  // Render loading screen
  if (isLoading) {
    return (
      <Shell backgroundImage={landingBg} header={<HeaderBar currentView="gaming" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
        <View style={styles.container}>
          <Text style={styles.loadingText}>Dínók betöltése...</Text>
        </View>
      </Shell>
    );
  }

  // Render playing screen
  if (!question) {
    return (
      <Shell backgroundImage={landingBg} header={<HeaderBar currentView="gaming" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
        <View style={styles.container}>
          <Text style={styles.loadingText}>Kérdés generálása...</Text>
        </View>
      </Shell>
    );
  }

  const imageSource = IMAGE_MAP[question.correctDino.name_hu] || null;
  const imageHeight = 281; // 16:9 aspect ratio: 500x281
  const imageWidth = 500;

  const isAnswered = status === 'answered';
  const timeColor = timeLeft <= 2 ? '#FF6B6B' : '#DDA15E';

  return (
    <Shell backgroundImage={landingBg} header={<HeaderBar currentView="gaming" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg || '#283618'} />

        {/* Lives indicator */}
        <View style={styles.livesBar}>
          <Text style={styles.lives}>
            {Array(lives)
              .fill('❤️')
              .join('')}
          </Text>
        </View>

        {/* Timer overlay on image */}
        <View style={styles.imageContainer}>
          {/* Image */}
          {imageSource ? (
            <View style={[styles.imageWrapper, { height: imageHeight, width: imageWidth, alignSelf: 'center' }]}>
              <Image
                source={imageSource}
                style={[styles.image, { height: imageHeight, width: imageWidth }]}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={[styles.imageWrapper, { height: imageHeight, width: imageWidth, alignSelf: 'center' }]}>
              <Text style={styles.noImageText}>Nincs kép</Text>
            </View>
          )}
          {/* Timer overlay centered above image */}
          <View style={styles.timerOverlay}>
            <Text style={[styles.timer, { color: timeColor }]}>{timeLeft}s</Text>
          </View>
        </View>

        {/* Answer options grid 2x2 */}
        <View style={styles.optionsGrid}>
          {question.options.slice(0, 2).map((option, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.optionBtn,
                selectedIndex === idx &&
                  (idx === question.correctIndex
                    ? styles.optionBtnCorrect
                    : styles.optionBtnWrong),
                selectedIndex === 'timeout' &&
                  idx === question.correctIndex &&
                  styles.optionBtnTimeout,
                isAnswered && styles.optionBtnDisabled,
              ]}
              onPress={() => handleAnswer(idx)}
              disabled={isAnswered}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
          {question.options.slice(2, 4).map((option, idx) => (
            <TouchableOpacity
              key={idx + 2}
              style={[
                styles.optionBtn,
                selectedIndex === idx + 2 &&
                  (idx + 2 === question.correctIndex
                    ? styles.optionBtnCorrect
                    : styles.optionBtnWrong),
                selectedIndex === 'timeout' &&
                  idx + 2 === question.correctIndex &&
                  styles.optionBtnTimeout,
                isAnswered && styles.optionBtnDisabled,
              ]}
              onPress={() => handleAnswer(idx + 2)}
              disabled={isAnswered}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Back button (bottom-left, always visible) */}
        <TouchableOpacity style={styles.backBtn} onPress={handleExit}>
          <Text style={styles.backBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20,
  },
  livesBar: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
  },
  lives: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 12,
    position: 'relative',
    marginTop: 30,
  },
  timerOverlay: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    fontSize: 36,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  imageWrapper: {
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
  },
  noImageText: {
    color: '#999',
    textAlign: 'center',
    fontSize: 15,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  optionBtn: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(221,161,94,0.15)',
    borderWidth: 2,
    borderColor: '#DDA15E',
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
  optionBtnTimeout: {
    borderColor: '#4CAF50',
    borderWidth: 3,
  },
  optionBtnDisabled: {
    opacity: 0.7,
  },
  optionText: {
    color: '#FEFAE0',
    fontFamily: FONTS.body,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  xpCounter: {
    alignItems: 'center',
    marginVertical: 12,
  },
  xpText: {
    color: '#DDA15E',
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
  finishedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  finishedTitle: {
    color: '#DDA15E',
    fontFamily: FONTS.bold,
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
  },
  statsBox: {
    backgroundColor: 'rgba(221,161,94,0.1)',
    borderWidth: 2,
    borderColor: '#DDA15E',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 32,
    minWidth: 250,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statLabel: {
    color: '#FEFAE0',
    fontFamily: FONTS.body,
    fontSize: 15,
    fontWeight: '600',
  },
  statValue: {
    color: '#DDA15E',
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '700',
  },
  bonusLabel: {
    color: '#4CAF50',
    fontFamily: FONTS.body,
    fontSize: 15,
    fontWeight: '600',
  },
  bonusValue: {
    color: '#4CAF50',
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonGroup: {
    gap: 12,
    width: '100%',
    maxWidth: 300,
  },
  retryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(76,175,80,0.15)',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 12,
    alignItems: 'center',
  },
  retryBtnText: {
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
  loadingText: {
    color: '#DDA15E',
    fontFamily: FONTS.bold,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
});
