import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';

import { supabase } from '../services/supabaseClient';
import { adaptCreature } from '../services/creaturesService';
import { groupByPackage, csomagToPackId, getRegionKeyFromEdu } from '../services/packageUtils';
import { generateQuestions } from '../services/questionGenerator';
import { REGION_PACKS, isPackUnlocked } from './regionProgress';
import { COLORS } from '../constants/colors';
import { IMAGE_MAP } from '../constants/imageMap';
import { playQuizSfx } from '../audio/audioSystem';
import DinoCard from '../components/DinoCard';

const QUIZ_QUESTION_COUNT = 5;
const QUIZ_PASS_THRESHOLD = 4;

// ─── Fő komponens ────────────────────────────────────────────────────────────

export default function RegionLevel({ eduLevel, progress, onPassed, onBack }) {
  const [creatures, setCreatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState('packages');
  const [selectedCsomag, setSelectedCsomag] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('creatures')
        .select('*')
        .eq('edu', eduLevel)
        .lt('pack_number', 100); // NHM bulk import kizárása
      if (!mounted) return;
      setCreatures((data || []).map(adaptCreature));
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [eduLevel]);

  const packages = useMemo(() => groupByPackage(creatures), [creatures]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.green} />
        <Text style={styles.loadingText}>Betöltés…</Text>
      </View>
    );
  }

  if (screen === 'packages') {
    return (
      <PackagesScreen
        eduLevel={eduLevel}
        progress={progress}
        packages={packages}
        onOpen={(csomag) => { setSelectedCsomag(csomag); setScreen('browse'); }}
        onBack={onBack}
      />
    );
  }

  if (screen === 'browse') {
    return (
      <BrowseScreen
        csomag={selectedCsomag}
        packages={packages}
        onStartQuiz={() => setScreen('quiz')}
        onBack={() => setScreen('packages')}
      />
    );
  }

  if (screen === 'quiz') {
    return (
      <QuizScreen
        eduLevel={eduLevel}
        csomag={selectedCsomag}
        packages={packages}
        creatures={creatures}
        onPassed={(csomag, score) => {
          const packId = csomagToPackId(eduLevel, csomag, REGION_PACKS);
          onPassed(csomag, packId, score);
          setScreen('packages');
        }}
        onRetry={() => setScreen('quiz')}
        onBack={() => setScreen('packages')}
      />
    );
  }

  return null;
}

// ─── PackagesScreen ───────────────────────────────────────────────────────────

function PackagesScreen({ eduLevel, progress, packages, onOpen, onBack }) {
  const regionKey = getRegionKeyFromEdu(eduLevel);

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>← Főmenü</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.list}>
        {packages.map(({ csomag, dinos }) => {
          const packId = csomagToPackId(eduLevel, csomag, REGION_PACKS);
          const unlocked = isPackUnlocked(regionKey, packId, progress);
          const passed = progress?.[regionKey]?.[packId]?.quizPassed === true;

          return (
            <TouchableOpacity
              key={csomag}
              style={[styles.packCard, !unlocked && styles.packCardLocked]}
              onPress={() => unlocked && onOpen(csomag)}
              activeOpacity={unlocked ? 0.7 : 1}
            >
              <View style={styles.packRow}>
                <Text style={styles.packTitle}>
                  {unlocked ? '' : '🔒 '}{csomag}. csomag
                </Text>
                {passed && <Text style={styles.passedBadge}>✓ Teljesítve</Text>}
              </View>
              <Text style={styles.packSub}>{dinos.length} dínó</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── BrowseScreen ─────────────────────────────────────────────────────────────

function BrowseScreen({ csomag, packages, onStartQuiz, onBack }) {
  const pkg = packages.find((p) => p.csomag === csomag);
  const dinos = pkg?.dinos || [];
  const [index, setIndex] = useState(0);

  const dino = dinos[index];

  return (
    <View style={styles.screen}>
      <View style={styles.browseHeader}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← Csomagok</Text>
        </TouchableOpacity>
        <Text style={styles.browseCounter}>{index + 1} / {dinos.length}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14 }}>
        {dino && (
          <DinoCard
            dino={dino}
            imageSource={IMAGE_MAP[dino.nev_tudomanyos] || null}
            showTimeline
          />
        )}
      </ScrollView>

      <View style={styles.navRow}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          <Text style={[styles.navBtnText, index === 0 && styles.navBtnDisabled]}>
            ← Előző
          </Text>
        </TouchableOpacity>

        {index === dinos.length - 1 ? (
          <TouchableOpacity style={[styles.navBtn, styles.navBtnPrimary]} onPress={onStartQuiz}>
            <Text style={styles.navBtnPrimaryText}>Kvíz indítása →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => setIndex((i) => Math.min(dinos.length - 1, i + 1))}
          >
            <Text style={styles.navBtnText}>Következő →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── QuizScreen ───────────────────────────────────────────────────────────────

function QuizScreen({ eduLevel, csomag, packages, creatures, onPassed, onRetry, onBack }) {
  const pkg = packages.find((p) => p.csomag === csomag);
  const packageDinos = pkg?.dinos || [];

  const questions = useMemo(
    () => generateQuestions(packageDinos, creatures, QUIZ_QUESTION_COUNT),
    [packageDinos, creatures]
  );

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = questions[qIndex];

  const handleAnswer = (optionIndex) => {
    if (selected !== null) return;
    setSelected(optionIndex);
    const correct = optionIndex === question.correctIndex;
    if (correct) {
      playQuizSfx('correct');
      setScore((s) => s + 1);
    } else {
      playQuizSfx('wrong');
    }

    setTimeout(() => {
      if (qIndex + 1 < questions.length) {
        setQIndex((i) => i + 1);
        setSelected(null);
      } else {
        setFinished(true);
      }
    }, 900);
  };

  if (finished) {
    const passed = score >= QUIZ_PASS_THRESHOLD;
    return (
      <View style={styles.center}>
        <Text style={styles.resultEmoji}>{passed ? '🏆' : '😔'}</Text>
        <Text style={styles.resultTitle}>
          {passed ? 'Teljesítve!' : 'Nem sikerült'}
        </Text>
        <Text style={styles.resultScore}>
          {score} / {questions.length} helyes
        </Text>

        {passed ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => onPassed(csomag, score / questions.length)}
          >
            <Text style={styles.primaryBtnText}>Tovább</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.primaryBtn} onPress={onRetry}>
              <Text style={styles.primaryBtnText}>Újra</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onBack}>
              <Text style={styles.secondaryBtnText}>Vissza</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }

  if (!question) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Nincs elegendő adat a kvízhez.</Text>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onBack}>
          <Text style={styles.secondaryBtnText}>Vissza</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.quizHeader}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← Vissza</Text>
        </TouchableOpacity>
        <Text style={styles.quizProgress}>{qIndex + 1} / {questions.length}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.quizBody}>
        <Text style={styles.quizQuestion}>{question.question}</Text>

        {question.options.map((opt, i) => {
          let btnStyle = styles.optionBtn;
          let textStyle = styles.optionText;

          if (selected !== null) {
            if (i === question.correctIndex) {
              btnStyle = [styles.optionBtn, styles.optionCorrect];
            } else if (i === selected && selected !== question.correctIndex) {
              btnStyle = [styles.optionBtn, styles.optionWrong];
            }
          }

          return (
            <TouchableOpacity
              key={i}
              style={btnStyle}
              onPress={() => handleAnswer(i)}
              activeOpacity={selected !== null ? 1 : 0.7}
            >
              <Text style={textStyle}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Stílusok ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  backBtn: {
    padding: 16,
  },
  backText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  packCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  packCardLocked: {
    opacity: 0.45,
  },
  packRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  passedBadge: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: '700',
  },
  packSub: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  browseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  browseCounter: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  navBtn: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  navBtnPrimary: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  navBtnText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  navBtnPrimaryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  navBtnDisabled: {
    color: COLORS.textMuted,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  quizProgress: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  quizBody: {
    padding: 16,
    gap: 12,
  },
  quizQuestion: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 26,
  },
  optionBtn: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  optionCorrect: {
    backgroundColor: COLORS.greenBg,
    borderColor: COLORS.green,
  },
  optionWrong: {
    backgroundColor: COLORS.coralBg,
    borderColor: COLORS.coral,
  },
  optionText: {
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  resultEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  resultTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
  },
  resultScore: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 32,
  },
  primaryBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  secondaryBtnText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
