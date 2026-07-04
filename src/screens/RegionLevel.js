import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  Image,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- KÖZPONTI MODULOK IMPORTÁLÁSA (A korábbi darabolás eredménye) ---
import { COLORS } from '../constants/colors';
import { IMAGE_MAP } from '../constants/imageMap';
import { playQuizSfx } from '../audio/audioSystem';
import { fetchCreaturesByEdu } from '../services/creaturesService';
import DinoCard from '../components/DinoCard';
import { CHARACTERS } from '../constants/characters';
import { buildQuiz } from '../utils/quizGenerator';

import { REGION_PACKS, isPackUnlocked, PASS_THRESHOLD, EDU_LABELS } from '../utils/regionProgress';

// Segédfüggvény a dínók csomagokba rendezéséhez
function groupByPackage(list) {
  const map = {};
  list.forEach((d) => {
    const key = d.csomag || 1;
    if (!map[key]) map[key] = [];
    map[key].push(d);
  });
  return Object.keys(map)
    .map(Number)
    .sort((a, b) => a - b)
    .map((csomag) => ({ csomag, dinos: map[csomag] }));
}

// Csomagszám -> tényleges pack_number (REGION_PACKS-ból, edu-kulccsal)
function csomagToPackId(eduLevel, csomag) {
  return REGION_PACKS[eduLevel]?.[csomag - 1];
}

function resolveImage(dino) {
  if (dino.image_url) return { uri: dino.image_url };
  return IMAGE_MAP[dino.nev_tudomanyos] || null;
}

// --- DINAMIKUS ADATBEVIELI HOOK ---
export function useRegionData(eduLevel, enabled = true) {
  const [creatures, setCreatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || eduLevel == null) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      const data = await fetchCreaturesByEdu(eduLevel);
      if (!mounted) return;
      setCreatures(data || []);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [enabled, eduLevel]);

  const packages = useMemo(() => groupByPackage(creatures), [creatures]);

  return { creatures, packages, loading, error };
}

// --- UI SHELL ---
function LevelShell({ children }) {
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= 700;
  return (
    <View style={s.outer}>
      <View style={[s.inner, isWideWeb && s.innerWide]}>{children}</View>
    </View>
  );
}

// --- FŐ GENERIKUS REGIONLEVEL KOMPONENS ---
export default function RegionLevel({ eduLevel, progress, onPassed, onBack }) {
  const { packages, creatures, loading, error } = useRegionData(eduLevel);
  
  const [currentScreen, setCurrentScreen] = useState('packages'); // 'packages' | 'browse' | 'quiz'
  const [selectedCsomag, setSelectedCsomag] = useState(null);

  if (loading) {
    return (
      <LevelShell>
        <Text style={s.loadingText}>Dínók betöltése a(z) {eduLevel} régióból...</Text>
      </LevelShell>
    );
  }

  if (error) {
    return (
      <LevelShell>
        <Text style={s.errorText}>Hiba történt az adatok betöltésekor.</Text>
      </LevelShell>
    );
  }

  if (currentScreen === 'packages') {
    return (
      <PackagesScreen
        eduLevel={eduLevel}
        progress={progress}
        packages={packages}
        onOpenPackage={(csomag) => {
          setSelectedCsomag(csomag);
          setCurrentScreen('browse');
        }}
        onBack={onBack}
      />
    );
  }

  if (currentScreen === 'browse') {
    return (
      <BrowseScreen
        csomag={selectedCsomag}
        packages={packages}
        onStartQuiz={() => setCurrentScreen('quiz')}
        onBack={() => setCurrentScreen('packages')}
      />
    );
  }

  if (currentScreen === 'quiz') {
    return (
      <PackageQuizScreen
        eduLevel={eduLevel}
        csomag={selectedCsomag}
        packages={packages}
        creatures={creatures}
        onPassed={(csomag, packId, score) => {
          onPassed(csomag, packId, score);
          setCurrentScreen('packages');
        }}
        onRetry={() => setCurrentScreen('quiz')}
        onBack={() => setCurrentScreen('packages')}
      />
    );
  }

  return null;
}

// --- ALKÉPERNYŐ: CSOMAGVÁLASZTÓ ---
function PackagesScreen({ eduLevel, progress, packages, onOpenPackage, onBack }) {
  return (
    <LevelShell>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView contentContainerStyle={s.packagesScroll}>
        <TouchableOpacity onPress={onBack} style={s.backLink}>
          <Text style={s.backLinkText}>← FŐMENÜ</Text>
        </TouchableOpacity>

        <Text style={s.levelTitle}>FELFEDEZÉS</Text>
        <Text style={s.levelSubtitle}>{EDU_LABELS[eduLevel] || eduLevel}</Text>
        <Text style={s.levelDesc}>
          Minden csomag végén teszt vár — legalább {Math.round(PASS_THRESHOLD * 100)}%-os eredmény kell a következő csomag kinyitásához.
        </Text>

        {packages.map(({ csomag, dinos }) => {
          const packId = csomagToPackId(eduLevel, csomag);
          const unlocked = isPackUnlocked(eduLevel, packId, progress);
          const passed = !!progress?.[eduLevel]?.[packId]?.quizPassed;

          return (
            <TouchableOpacity
              key={csomag}
              disabled={!unlocked}
              onPress={() => onOpenPackage(csomag)}
              style={[s.packageCard, !unlocked && s.packageCardLocked]}
            >
              <View style={s.packageIconWrap}>
                <Text style={s.packageIcon}>{unlocked ? (passed ? '✅' : '🦴') : '🔒'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.packageName}>{csomag}. csomag</Text>
                <Text style={s.packageMeta}>
                  {dinos.length} dínó · {dinos.map((d) => d.nev_koznapi).join(', ')}
                </Text>
                {!unlocked && (
                  <Text style={s.packageLockedHint}>
                    Nyitáshoz teljesítsd az előző csomag tesztjét
                  </Text>
                )}
                {passed && <Text style={s.packagePassedHint}>Teszt teljesítve ✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </LevelShell>
  );
}

// --- ALKÉPERNYŐ: BÖNGÉSZŐ ---
function BrowseScreen({ csomag, packages, onStartQuiz, onBack }) {
  const pkg = packages.find((p) => p.csomag === csomag);
  const dinos = pkg?.dinos || [];
  const [index, setIndex] = useState(0);
  const [selectedCharacter, setSelectedCharacter] = useState(CHARACTERS[0]);

  const dino = dinos[index];

  return (
    <View style={s.screen}>
      <View style={s.browseHeader}>
        <TouchableOpacity onPress={onBack}>
          <Text style={s.backText}>← Csomagok</Text>
        </TouchableOpacity>
        <Text style={s.browseCounter}>{index + 1} / {dinos.length}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14 }}>
        {dino && (
          <>
            <DinoCard
              dino={dino}
              imageSource={IMAGE_MAP[dino.nev_tudomanyos] || null}
              character={selectedCharacter}
              showTimeline
            />
            <View style={s.characterSelectorGrid}>
              {CHARACTERS.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setSelectedCharacter(c)}
                  style={[s.charThumb, selectedCharacter?.id === c.id && s.charThumbActive]}
                >
                  {c.imageAsset ? (
                    <Image source={c.imageAsset} style={s.charThumbImg} resizeMode="contain" />
                  ) : (
                    <View style={[s.charThumbImg, s.charThumbPlaceholder]}>
                      <Text style={s.charThumbInitial}>{c.name.charAt(0)}</Text>
                    </View>
                  )}
                  <Text style={s.charThumbName} numberOfLines={1}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View style={s.navRow}>
        <TouchableOpacity
          style={s.navBtn}
          onPress={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          <Text style={[s.navBtnText, index === 0 && s.navBtnDisabled]}>
            ← Előző
          </Text>
        </TouchableOpacity>

        {index === dinos.length - 1 ? (
          <TouchableOpacity style={[s.navBtn, s.navBtnPrimary]} onPress={onStartQuiz}>
            <Text style={s.navBtnPrimaryText}>Kvíz indítása →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={s.navBtn}
            onPress={() => setIndex((i) => Math.min(dinos.length - 1, i + 1))}
          >
            <Text style={s.navBtnText}>Következő →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// --- ALKÉPERNYŐ: TESZT ---
function PackageQuizScreen({ eduLevel, csomag, packages, creatures, onPassed, onRetry, onBack }) {
  const pack = packages.find((p) => p.csomag === csomag);
  const questions = useRef(buildQuiz(pack ? pack.dinos : [], creatures)).current;

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = questions[qIndex];

  const handleSelect = (idx) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    
    const isCorrect = idx === question.correctIndex;
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
        setFinished(true);
      }
    }, 1200);
  };

  if (finished) {
    const passed = questions.length > 0 && correctCount / questions.length >= PASS_THRESHOLD;
    return (
      <LevelShell>
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
            <TouchableOpacity
              style={s.primaryBtn}
              onPress={() => onPassed(csomag, csomagToPackId(eduLevel, csomag), correctCount / questions.length)}
            >
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
    <LevelShell>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={s.browseHeader}>
        <TouchableOpacity onPress={onBack}>
          <Text style={s.backLinkText}>← Vissza</Text>
        </TouchableOpacity>
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
    </LevelShell>
  );
}

// --- STÍLUSOK (A központi COLORS-ra építve) ---
const s = StyleSheet.create({
  screen: { flex: 1, width: '100%', backgroundColor: COLORS.bg },
  backText: { color: COLORS.gold || '#DDA15E', fontSize: 13, fontWeight: '800' },
  navRow: { flexDirection: 'row', gap: 10, padding: 14 },
  navBtnPrimary: { backgroundColor: 'rgba(221,161,94,0.16)', borderColor: COLORS.gold || '#DDA15E' },
  navBtnPrimaryText: { color: COLORS.gold || '#DDA15E', fontSize: 13, fontWeight: '800' },
  outer: { flex: 1, width: '100%', minHeight: '100%', backgroundColor: COLORS.bg, alignItems: 'center' },
  inner: { flex: 1, width: '100%', maxWidth: 480, minHeight: '100%', paddingHorizontal: 16, paddingTop: 50 },
  innerWide: { maxWidth: 720 },
  loadingText: { color: '#FEFAE0', fontSize: 16, textAlign: 'center', marginTop: 40 },
  errorText: { color: '#BC6C25', fontSize: 16, textAlign: 'center', marginTop: 40 },

  backLink: { paddingVertical: 8, marginBottom: 4 },
  backLinkText: { color: COLORS.gold || '#DDA15E', ...Platform.select({ web: { cursor: 'pointer' } }), fontSize: 13, fontWeight: '800' },

  primaryBtn: { backgroundColor: COLORS.action || '#BC6C25', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 28, alignItems: 'center', width: '100%' },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  packagesScroll: { paddingBottom: 60 },
  levelTitle: { color: COLORS.gold || '#DDA15E', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginTop: 8 },
  levelSubtitle: { color: '#FEFAE0', fontSize: 24, fontWeight: '900', marginTop: 2 },
  levelDesc: { color: 'rgba(254,250,224,0.55)', fontSize: 12, lineHeight: 17, marginTop: 8, marginBottom: 18 },

  packageCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(254,250,224,0.06)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(254,250,224,0.16)', padding: 14, marginBottom: 12 },
  packageCardLocked: { opacity: 0.5 },
  packageIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  packageIcon: { fontSize: 22 },
  packageName: { color: '#FEFAE0', fontSize: 15, fontWeight: '800' },
  packageMeta: { color: 'rgba(254,250,224,0.55)', fontSize: 11, marginTop: 2 },
  packageLockedHint: { color: '#BC6C25', fontSize: 10, marginTop: 4, fontWeight: '600' },
  packagePassedHint: { color: '#606C38', fontSize: 10, marginTop: 4, fontWeight: '700' },

  browseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  browseCounter: { color: 'rgba(254,250,224,0.55)', fontSize: 12, fontWeight: '700' },

  characterSelectorGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, paddingVertical: 12 },
  charThumb: { width: 70, alignItems: 'center', padding: 6, borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
  charThumbActive: { borderColor: COLORS.green, backgroundColor: COLORS.greenBg },
  charThumbImg: { width: 50, height: 50 },
  charThumbPlaceholder: { backgroundColor: 'rgba(254,250,224,0.1)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  charThumbInitial: { color: '#FEFAE0', fontSize: 20, fontWeight: '800' },
  charThumbName: { color: COLORS.textMuted, fontSize: 9, marginTop: 4, textAlign: 'center' },

  browseNavRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  navBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(254,250,224,0.16)', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { color: '#FEFAE0', fontSize: 13, fontWeight: '700' },

  quizStartBtn: { backgroundColor: 'rgba(221,161,94,0.16)', borderWidth: 1, borderColor: COLORS.gold || '#DDA15E', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 14, marginBottom: 24 },
  quizStartBtnText: { color: COLORS.gold || '#DDA15E', fontSize: 13, fontWeight: '800' },

  quizQuestionBox: { backgroundColor: 'rgba(255,255,255,0.03)', borderLeftWidth: 3, borderLeftColor: COLORS.gold || '#DDA15E', padding: 16, borderRadius: 8, marginTop: 4 },
  quizQuestionText: { color: '#FEFAE0', fontSize: 15, fontWeight: '700', lineHeight: 21 },
  optionBtn: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  optionBtnText: { color: '#FEFAE0', fontSize: 13, fontWeight: '500' },
  optionBtnSelected: { backgroundColor: 'rgba(221,161,94,0.18)', borderColor: COLORS.gold || '#DDA15E' },
  optionBtnCorrect: { backgroundColor: '#606C38', borderColor: '#7d8d49' },
  optionBtnIncorrect: { backgroundColor: '#BC6C25', borderColor: '#9c5419' },

  resultWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  resultEmoji: { fontSize: 56, marginBottom: 12 },
  resultTitle: { color: '#FEFAE0', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  resultDesc: { color: 'rgba(254,250,224,0.55)', fontSize: 13, textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 18, paddingHorizontal: 12 },
});