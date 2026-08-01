import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { COLORS } from '../../constants/colors';
import { playQuizSfx } from '../../audio/audioSystem';
import { buildQuiz } from '../../utils/quizGenerator';
import { PASS_THRESHOLD } from '../../utils/regionProgress';
import { csomagToPackId } from '../../utils/regionHelpers';
import LevelShell from './LevelShell';
import HeaderBar from '../../components/HeaderBar';
import { s } from './RegionLevel.styles';

export default function PackageQuizScreen({ eduLevel, csomag, packages, creatures, onPassed, onRetry, onBack, nickname, progress, onNavigate }) {
  const pack = packages.find((p) => p.csomag === csomag);
  const questions = useRef(buildQuiz(pack ? pack.dinos : [], creatures)).current;

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = questions[qIndex];
  const passed = finished && questions.length > 0 && correctCount / questions.length >= PASS_THRESHOLD;

  // A sikeres eredményt azonnal mentjük, amint kiderül — nem várhatunk egy
  // konkrét gombra kattintásra, mert a "Vissza" link is kilépési útvonal
  // erről a képernyőről, és korábban csak a "Tovább" gomb mentette el a
  // próbálkozást, így a vissza-linkkel kilépve a sikeres eredmény is elveszett.
  useEffect(() => {
    if (passed) {
      onPassed(csomag, csomagToPackId(eduLevel, csomag), correctCount / questions.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passed]);

  const handleSelect = (idx) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);

    const isCorrect = idx === question.correctIndex;
    const finalCorrectCount = correctCount + (isCorrect ? 1 : 0);
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      playQuizSfx('correct');
    } else {
      playQuizSfx('wrong');
    }

    setTimeout(() => {
      if (qIndex + 1 < questions.length) {
        setQIndex((i) => i + 1);
        setSelected(null);
        setRevealed(false);
      } else {
        // Csomag-teljesítéskor a sima "correct" pötty helyett a diadalmasabb
        // winning_theme szól, ugyanaz a minta, mint MillionaireQuizScreen-nél.
        if (finalCorrectCount / questions.length >= PASS_THRESHOLD) {
          playQuizSfx('winningTheme');
        }
        setFinished(true);
      }
    }, 1200);
  };

  if (finished) {
    return (
      <LevelShell header={<HeaderBar currentView="region" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <View style={s.resultWrap}>
          <Text style={s.resultEmoji}>{passed ? '🏆' : '😕'}</Text>
          <Text style={s.resultTitle}>{correctCount} / {questions.length} helyes válasz</Text>
          <Text style={s.resultDesc}>
            {passed
              ? 'Szép munka! A következő csomag kinyílt.'
              : `A csomag kinyitásához legalább ${Math.round(PASS_THRESHOLD * 100)}% helyes válasz szükséges. Próbáld újra!`}
          </Text>
          {passed ? (
            <TouchableOpacity style={s.primaryBtn} onPress={onBack}>
              <Text style={s.primaryBtnText}>Tovább a csomagokhoz →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.primaryBtn} onPress={onRetry}>
              <Text style={s.primaryBtnText}>Újrapróbálom</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.backLink} onPress={onBack}>
            <Text style={s.backLinkText}>← Vissza a csomagokhoz</Text>
          </TouchableOpacity>
        </View>
      </LevelShell>
    );
  }

  return (
    <LevelShell header={<HeaderBar currentView="region" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={s.quizContentFlex}>
        <View style={s.browseCounterRow}>
          <Text style={s.browseCounter}>Kérdés {qIndex + 1} / {questions.length}</Text>
        </View>

        <View style={s.quizQuestionBox}>
          <Text style={s.quizQuestionText}>{question.question}</Text>
        </View>

        <View style={{ gap: 9, marginTop: 10 }}>
          {question.options.map((opt, idx) => {
            let optStyle = [s.optionBtn];
            if (revealed) {
              if (idx === question.correctIndex) optStyle.push(s.optionBtnCorrect);
              else if (idx === selected) optStyle.push(s.optionBtnIncorrect);
            } else if (selected === idx) {
              optStyle.push(s.optionBtnSelected);
            }
            return (
              <TouchableOpacity key={idx} style={optStyle} disabled={revealed} onPress={() => handleSelect(idx)}>
                <Text style={s.optionBtnText}>{['A', 'B', 'C', 'D'][idx]}: {opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity onPress={onBack} style={s.bottomBackLink}>
        <Text style={s.backLinkText}>← Vissza</Text>
      </TouchableOpacity>
    </LevelShell>
  );
}