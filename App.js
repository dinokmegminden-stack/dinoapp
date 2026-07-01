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
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- KÖZPONTI MODULOK IMPORTÁLÁSA (A korábbi darabolás eredménye) ---
import { COLORS } from '../constants/colors';
import { IMAGE_MAP } from '../constants/imageMap';
import { playQuizSfx } from '../audio/audioSystem';
import { getCreaturesByRegion, adaptCreature } from '../services/creaturesService';
import { REGION_PACKS, isPackUnlocked } from './regionProgress'; // Haladási logika elérése
import DinoCard from './DinoCard';

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

// Csomagszám -> regionProgress packId konverzió (pl. 'karpat', 1 -> 'km_pack1')
function csomagToPackId(regionKey, csomag) {
  return REGION_PACKS[regionKey]?.[csomag - 1];
}

function resolveImage(dino) {
  if (dino.image_url) return { uri: dino.image_url };
  return IMAGE_MAP[dino.nev_tudomanyos] || null;
}

// --- DINAMIKUS ADATBEVIELI HOOK ---
export function useRegionData(regionKey, enabled = true) {
  const [creatures, setCreatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !regionKey) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await getCreaturesByRegion(regionKey);
      if (!mounted) return;
      if (error) {
        setError(error);
      } else {
        setCreatures((data || []).map(adaptCreature));
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [enabled, regionKey]);

  const packages = useMemo(() => groupByPackage(creatures), [creatures]);

  return { creatures, packages, loading, error };
}

// --- TESZT KÉRDÉSEK GENERÁLÁSA ---
function shuffle(arr) {
  return [...arr].map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}

const FALLBACK_DISTRACTORS = {
  korszak: ['triász', 'kora kréta', 'jura', 'perm'],
  hossz: ['1 m', '15 m', '0.5 m', '20 m'],
  felfedezo: ['ismeretlen kutató', 'Charles Darwin', 'Richard Owen'],
  nev_tudomanyos: ['Tyrannosaurus rex', 'Triceratops horridus', 'Velociraptor mongoliensis'],
};

function pickDistractors(correctValue, pool, field, count = 3) {
  const values = [
    ...new Set(
      pool
        .map((d) => d[field])
        .filter((v) => v && v !== 'ismeretlen' && v !== correctValue)
    ),
  ];
  let distractors = shuffle(values).slice(0, count);
  if (distractors.length < count && FALLBACK_DISTRACTORS[field]) {
    const extra = FALLBACK_DISTRACTORS[field].filter((v) => v !== correctValue && !distractors.includes(v));
    distractors = [...distractors, ...extra].slice(0, count);
  }
  return distractors;
}

const QUESTION_TEMPLATES = [
  { field: 'nev_tudomanyos', text: (d) => `Mi a "${d.nev_koznapi}" tudományos neve?` },
  { field: 'korszak', text: (d) => `Melyik korszakban élt a ${d.nev_koznapi}?` },
  { field: 'hossz', text: (d) => `Mekkora volt körülbelül a ${d.nev_koznapi} testhossza?` },
  { field: 'felfedezo', text: (d) => `Ki fedezte fel a ${d.nev_koznapi}-t?` },
];

function buildQuestion(dino, template, pool) {
  const correct = dino[template.field];
  const distractors = pickDistractors(correct, pool, template.field, 3);
  const options = shuffle([correct, ...distractors]);
  return {
    question: template.text(dino),
    options,
    correctIndex: options.indexOf(correct),
  };
}

function generatePackageQuestions(packageDinos, fullPool, count = 5) {
  let combos = [];
  packageDinos.forEach((d) => QUESTION_TEMPLATES.forEach((t) => combos.push({ d, t })));
  combos = shuffle(combos).slice(0, count);
  return combos.map(({ d, t }) => buildQuestion(d, t, fullPool));
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

  // Útvonalválasztás a belső képernyők között
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
      <PackageBrowseScreen
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
  // Régiónevek szépítése a felületen
  const regionNames = { karpat: 'Kárpát-medence', europa: 'Európa', america: 'Észak-Amerika' };

  return (
    <LevelShell>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView contentContainerStyle={s.packagesScroll}>
        <TouchableOpacity onPress={onBack} style={s.backLink}>
          <Text style={s.backLinkText}>← FŐMENÜ</Text>
        </TouchableOpacity>

        <Text style={s.levelTitle}>FELFEDEZÉS</Text>
        <Text style={s.levelSubtitle}>{regionNames[eduLevel] || eduLevel}</Text>
        <Text style={s.levelDesc}>
          Minden csomag végén egy 5 kérdéses teszt vár — hibátlan eredmény kell a következő csomag kinyitásához.
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
                    Nyitáshoz teljesítsd hibátlanra az előző csomag tesztjét
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
function PackageBrowseScreen({ csomag, packages, onStartQuiz, onBack }) {
  const pack = packages.find((p) => p.csomag === csomag);
  const dinos = pack ? pack.dinos : [];
  const [index, setIndex] = useState(0);
  const dino = dinos[index];

  if (!dino) return null;

  return (
    <LevelShell>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={s.browseHeader}>
        <TouchableOpacity onPress={onBack}>
          <Text style={s.backLinkText}>← Csomagok</Text>
        </TouchableOpacity>
        <Text style={s.browseCounter}>{index + 1} / {dinos.length}</Text>
      </View>

      <DinoCard dino={dino} imageSource={resolveImage(dino)} showTimeline={false} />

      <View style={s.browseNavRow}>
        <TouchableOpacity
          style={[s.navBtn, index === 0 && s.navBtnDisabled]}
          disabled={index === 0}
          onPress={() => setIndex((i) => Math.max(0, i - 1))}
        >
          <Text style={s.navBtnText}>← Előző</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.navBtn, index === dinos.length - 1 && s.navBtnDisabled]}
          disabled={index === dinos.length - 1}
          onPress={() => setIndex((i) => Math.min(dinos.length - 1, i + 1))}
        >
          <Text style={s.navBtnText}>Következő →</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.quizStartBtn} onPress={onStartQuiz}>
        <Text style={s.quizStartBtnText}>📝 Csomagteszt indítása (5 kérdés)</Text>
      </TouchableOpacity>
    </LevelShell>
  );
}

// --- ALKÉPERNYŐ: TESZT ---
function PackageQuizScreen({ eduLevel, csomag, packages, creatures, onPassed, onRetry, onBack }) {
  const pack = packages.find((p) => p.csomag === csomag);
  const questions = useRef(generatePackageQuestions(pack ? pack.dinos : [], creatures)).current;

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
      playQuizSfx('correct'); // Központi audio-sfx hívás
    } else {
      playQuizSfx('wrong'); // Központi audio-sfx hívás
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
    const passed = correctCount === questions.length;
    return (
      <LevelShell>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <View style={s.resultWrap}>
          <Text style={s.resultEmoji}>{passed ? '🏆' : '😕'}</Text>
          <Text style={s.resultTitle}>{correctCount} / {questions.length} helyes válasz</Text>
          <Text style={s.resultDesc}>
            {passed
              ? 'Hibátlan eredmény! A következő csomag kinyílt.'
              : 'A csomag kinyitásához hibátlan (5/5) eredmény szükséges. Próbáld újra!'}
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