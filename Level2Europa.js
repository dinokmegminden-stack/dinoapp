import { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  StatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import dinosaurs from './data/europa.json';
import { REGION_PACKS, isPackUnlocked } from './regionProgress';

// ============================================================
// 2. SZINT — EURÓPA — CSOMAGOS RENDSZER
// ============================================================
// 20 dínó, 5 csomagban (4-4-4-4-4), a europa.json "csomag"
// mezője alapján csoportosítva. Ugyanaz a zárolási logika, mint az
// 1. szintnél: egy csomag csak az előző csomag hibátlan (5/5) tesztje
// után nyílik ki.

const europaDinoList = dinosaurs;

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

export const EUROPA_PACKAGES = groupByPackage(europaDinoList);
export const EUROPA_PACKAGE_COUNT = EUROPA_PACKAGES.length;

// Dínó képek (a meglévő képfájlokból azok, amik az új listában is szerepelnek;
// az újonnan felvett fajoknál — Compsognathus, Archaeopteryx, Hylaeosaurus,
// Scelidosaurus, Miragaia, Eustreptospondylus, Polacanthus — még nincs kép,
// ott emoji jelenik meg helyette, amíg nem kerül fel a megfelelő fájl).
const IMAGE_MAP = {
  'Megalosaurus bucklandii': require('./assets/images/megalosaurus.jpg'),
  'Iguanodon bernissartensis': require('./assets/images/Iguanodon2.jpg'),
  'Baryonyx walkeri': require('./assets/images/baryonyx.jpg'),
  'Plateosaurus engelhardti': require('./assets/images/plateosaurus.jpg'),
  'Hypsilophodon foxii': require('./assets/images/hypsilophodon.jpg'),
  'Europasaurus holgeri': require('./assets/images/europasaurus.jpg'),
  'Neovenator salerii': require('./assets/images/neovenator.jpg'),
  'Concavenator corcovatus': require('./assets/images/concavenator.jpg'),
  'Pelecanimimus polyodon': require('./assets/images/pelecanimimus.jpg'),
  'Scipionyx samniticus': require('./assets/images/scipionyx.jpg'),
  'Cetiosaurus oxoniensis': require('./assets/images/cetiosaurus.jpg'),
  'Lourinhanosaurus antunesi': require('./assets/images/lourinhanosaurus.jpg'),
  'Mantellisaurus atherfieldensis': require('./assets/images/mantellisaurus.jpg'),
};

// --- HALADÁS ---
// A haladás mentését/betöltését mostantól a régiófüggetlen regionProgress.js
// végzi (region id: 'europa'). Itt csak a csomag<->packId megfeleltetés maradt.

// Csomag (1,2,3...) -> regionProgress packId (eu_pack1, eu_pack2...)
// Az EUROPA_PACKAGES sorrendje és a REGION_PACKS.europa sorrendje egyezik.
export function csomagToPackId(csomag) {
  return REGION_PACKS.europa[csomag - 1];
}

export function isEuropaPackageUnlocked(progress, csomag) {
  const packId = csomagToPackId(csomag);
  return isPackUnlocked('europa', packId, progress);
}

export function isEuropaPackagePassed(progress, csomag) {
  const packId = csomagToPackId(csomag);
  return !!progress?.europa?.[packId]?.quizPassed;
}

// --- KÉRDÉSGENERÁTOR — ugyanaz a logika, mint az 1. szintnél ---
function shuffle(arr) {
  return [...arr]
    .map((v) => [Math.random(), v])
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v);
}

const FALLBACK_DISTRACTORS = {
  korszak: ['triász', 'kora kréta', 'késő kréta', 'perm'],
  megtalalas_helye: ['Magyarország', 'Görögország', 'Lengyelország'],
  hossz: ['1 m', '15 m', '0.5 m', '25 m'],
  felfedezo: ['ismeretlen kutató', 'Mary Anning', 'Georges Cuvier'],
  nev_tudomanyos: ['Tyrannosaurus rex', 'Triceratops horridus', 'Velociraptor mongoliensis'],
};

function pickDistractors(correctValue, pool, field, count = 3) {
  const values = [
    ...new Set(
      pool
        .map((d) => d[field])
        .filter((v) => v && v !== 'n/a' && v !== correctValue)
    ),
  ];
  let distractors = shuffle(values).slice(0, count);
  if (distractors.length < count && FALLBACK_DISTRACTORS[field]) {
    const extra = FALLBACK_DISTRACTORS[field].filter(
      (v) => v !== correctValue && !distractors.includes(v)
    );
    distractors = [...distractors, ...extra].slice(0, count);
  }
  return distractors;
}

const QUESTION_TEMPLATES = [
  { field: 'nev_tudomanyos', text: (d) => `Mi a "${d.nev_koznapi}" tudományos neve?` },
  { field: 'korszak', text: (d) => `Melyik korszakban élt a ${d.nev_koznapi}?` },
  { field: 'megtalalas_helye', text: (d) => `Hol találták meg a ${d.nev_koznapi} maradványait?` },
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

export function generateEuropaQuestions(packageDinos, fullPool = europaDinoList, count = 5) {
  let combos = [];
  packageDinos.forEach((d) => QUESTION_TEMPLATES.forEach((t) => combos.push({ d, t })));
  combos = shuffle(combos).slice(0, count);
  return combos.map(({ d, t }) => buildQuestion(d, t, fullPool));
}

// ============================================================
// UI — ugyanaz a sötét navy + arany stílus, mint az 1. szintnél
// ============================================================
// Föld-paletta (dino-szafari): mély erdőzöld alap, olívazöld felületek,
// borostyán kiemelés, fosszília-bézs szöveg, terrakotta akció/hiba szín.
const C = {
  bg: '#283618',        // dino-dark
  card: 'rgba(254,250,224,0.06)',
  border: 'rgba(254,250,224,0.16)',
  text: '#FEFAE0',       // dino-beige
  textMuted: 'rgba(254,250,224,0.55)',
  gold: '#DDA15E',       // dino-amber
  green: '#606C38',      // dino-olive (helyes válasz, teljesített csomag)
  red: '#BC6C25',        // dino-action / terrakotta (zárolt, helytelen válasz)
  action: '#BC6C25',     // dino-action (elsődleges gombok)
};

function L2Shell({ children }) {
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= 700;
  return (
    <View style={s.outer}>
      <View style={[s.inner, isWideWeb && s.innerWide]}>{children}</View>
    </View>
  );
}

// --- CSOMAGVÁLASZTÓ KÉPERNYŐ (2. SZINT) ---
export function EuropaPackagesScreen({ progress, onOpenPackage, onBack }) {
  return (
    <L2Shell>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={s.packagesScroll}>
        <TouchableOpacity onPress={onBack} style={s.backLink}>
          <Text style={s.backLinkText}>← FŐMENÜ</Text>
        </TouchableOpacity>

        <Text style={s.levelTitle}>2. SZINT</Text>
        <Text style={s.levelSubtitle}>Európa</Text>
        <Text style={s.levelDesc}>
          Fedezd fel Európa dinoszauruszait 5 csomagban! Minden csomag végén egy 5 kérdéses
          teszt vár — hibátlan eredmény kell a következő csomag kinyitásához.
        </Text>

        {EUROPA_PACKAGES.map(({ csomag, dinos }) => {
          const unlocked = isEuropaPackageUnlocked(progress, csomag);
          const passed = isEuropaPackagePassed(progress, csomag);
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
                    Nyitáshoz teljesítsd hibátlanra a {csomag - 1}. csomag tesztjét
                  </Text>
                )}
                {passed && <Text style={s.packagePassedHint}>Teszt teljesítve ✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </L2Shell>
  );
}

// --- DÍNÓ-BÖNGÉSZŐ EGY CSOMAGON BELÜL ---
export function EuropaPackageBrowseScreen({ csomag, onStartQuiz, onBack }) {
  const pack = EUROPA_PACKAGES.find((p) => p.csomag === csomag);
  const dinos = pack ? pack.dinos : [];
  const [index, setIndex] = useState(0);
  const dino = dinos[index];

  if (!dino) return null;

  return (
    <L2Shell>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={s.browseHeader}>
        <TouchableOpacity onPress={onBack}>
          <Text style={s.backLinkText}>← Csomagok</Text>
        </TouchableOpacity>
        <Text style={s.browseCounter}>{index + 1} / {dinos.length}</Text>
      </View>

      <ScrollView style={s.browseCard} showsVerticalScrollIndicator={false}>
        <View style={s.dinoImageArea}>
          {IMAGE_MAP[dino.nev_tudomanyos] ? (
            <Image source={IMAGE_MAP[dino.nev_tudomanyos]} style={s.dinoImage} resizeMode="contain" />
          ) : (
            <Text style={s.dinoImageFallback}>🦖</Text>
          )}
        </View>
        <Text style={s.dinoSci}>{dino.nev_tudomanyos}</Text>
        <Text style={s.dinoCommon}>{dino.nev_koznapi} · {dino.kor_millioev}</Text>
        <View style={s.dinoInfoRow}>
          <Text style={s.dinoInfoItem}>🕒 {dino.korszak}</Text>
          <Text style={s.dinoInfoItem}>📍 {dino.megtalalas_helye}</Text>
          <Text style={s.dinoInfoItem}>📏 {dino.hossz}</Text>
        </View>
        <Text style={s.sectionLabel}>Felfedező</Text>
        <Text style={s.bodyText}>{dino.felfedezo}</Text>
        <Text style={s.sectionLabel}>Leírás</Text>
        <Text style={[s.bodyText, { color: C.gold }]}>{dino.leiras}</Text>
        <View style={{ height: 16 }} />
      </ScrollView>

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

      <TouchableOpacity style={s.quizStartBtn} onPress={() => onStartQuiz(csomag)}>
        <Text style={s.quizStartBtnText}>📝 Csomagteszt indítása (5 kérdés)</Text>
      </TouchableOpacity>
    </L2Shell>
  );
}

// --- CSOMAGTESZT — 5 KÉRDÉS, HIBÁTLAN KELL A TOVÁBBJUTÁSHOZ ---
export function EuropaPackageQuizScreen({ csomag, onPassed, onRetry, onBack }) {
  const pack = EUROPA_PACKAGES.find((p) => p.csomag === csomag);
  const questions = useRef(generateEuropaQuestions(pack ? pack.dinos : [])).current;

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
    if (isCorrect) setCorrectCount((c) => c + 1);
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
      <L2Shell>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <View style={s.resultWrap}>
          <Text style={s.resultEmoji}>{passed ? '🏆' : '😕'}</Text>
          <Text style={s.resultTitle}>
            {correctCount} / {questions.length} helyes válasz
          </Text>
          <Text style={s.resultDesc}>
            {passed
              ? 'Hibátlan eredmény! A következő csomag kinyílt.'
              : 'A csomag kinyitásához hibátlan (5/5) eredmény szükséges. Próbáld újra!'}
          </Text>
          {passed ? (
            <TouchableOpacity
              style={s.primaryBtn}
              onPress={() => onPassed(csomag, csomagToPackId(csomag), correctCount / questions.length)}
            >
              <Text style={s.primaryBtnText}>Tovább a csomagokhoz →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.primaryBtn} onPress={() => onRetry(csomag)}>
              <Text style={s.primaryBtnText}>Újrapróbálom</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.backLink} onPress={onBack}>
            <Text style={s.backLinkText}>← Vissza a csomagokhoz</Text>
          </TouchableOpacity>
        </View>
      </L2Shell>
    );
  }

  return (
    <L2Shell>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
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
          let textStyle = [s.optionBtnText];
          if (revealed) {
            if (idx === question.correctIndex) optStyle.push(s.optionBtnCorrect);
            else if (idx === selected) optStyle.push(s.optionBtnIncorrect);
          } else if (selected === idx) {
            optStyle.push(s.optionBtnSelected);
          }
          return (
            <TouchableOpacity
              key={idx}
              style={optStyle}
              disabled={revealed}
              onPress={() => handleSelect(idx)}
            >
              <Text style={textStyle}>{['A', 'B', 'C', 'D'][idx]}: {opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </L2Shell>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1, width: '100%', minHeight: '100%', backgroundColor: C.bg, alignItems: 'center' },
  inner: { flex: 1, width: '100%', maxWidth: 480, minHeight: '100%', paddingHorizontal: 16, paddingTop: 50 },
  innerWide: { maxWidth: 720 },

  backLink: { paddingVertical: 8, marginBottom: 4 },
  backLinkText: { color: C.gold, fontSize: 13, fontWeight: '800' },

  primaryBtn: { backgroundColor: C.action, borderRadius: 24, paddingVertical: 14, paddingHorizontal: 28, alignItems: 'center', width: '100%' },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  packagesScroll: { paddingBottom: 60 },
  levelTitle: { color: C.gold, fontSize: 12, fontWeight: '900', letterSpacing: 2, marginTop: 8 },
  levelSubtitle: { color: C.text, fontSize: 24, fontWeight: '900', marginTop: 2 },
  levelDesc: { color: C.textMuted, fontSize: 12, lineHeight: 17, marginTop: 8, marginBottom: 18 },

  packageCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 12,
  },
  packageCardLocked: { opacity: 0.5 },
  packageIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  packageIcon: { fontSize: 22 },
  packageName: { color: C.text, fontSize: 15, fontWeight: '800' },
  packageMeta: { color: C.textMuted, fontSize: 11, marginTop: 2 },
  packageLockedHint: { color: C.red, fontSize: 10, marginTop: 4, fontWeight: '600' },
  packagePassedHint: { color: C.green, fontSize: 10, marginTop: 4, fontWeight: '700' },

  browseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  browseCounter: { color: C.textMuted, fontSize: 12, fontWeight: '700' },
  browseCard: { flex: 1, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16 },
  dinoImageArea: {
    width: '100%', aspectRatio: 16 / 9, borderRadius: 12, marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.04)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  dinoImage: { width: '100%', height: '100%' },
  dinoImageFallback: { fontSize: 56 },
  dinoSci: { color: C.text, fontSize: 16, fontWeight: '900', fontStyle: 'italic' },
  dinoCommon: { color: C.textMuted, fontSize: 13, marginTop: 2, fontWeight: '600' },
  dinoInfoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10, marginBottom: 6 },
  dinoInfoItem: { color: C.textMuted, fontSize: 12, fontWeight: '600' },
  sectionLabel: { color: C.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 10 },
  bodyText: { color: C.text, fontSize: 13, marginTop: 4, lineHeight: 18 },

  browseNavRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  navBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { color: C.text, fontSize: 13, fontWeight: '700' },

  quizStartBtn: { backgroundColor: 'rgba(221,161,94,0.16)', borderWidth: 1, borderColor: C.gold, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 14, marginBottom: 24 },
  quizStartBtnText: { color: C.gold, fontSize: 13, fontWeight: '800' },

  quizQuestionBox: { backgroundColor: 'rgba(255,255,255,0.03)', borderLeftWidth: 3, borderLeftColor: C.gold, padding: 16, borderRadius: 8, marginTop: 4 },
  quizQuestionText: { color: C.text, fontSize: 15, fontWeight: '700', lineHeight: 21 },
  optionBtn: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  optionBtnText: { color: C.text, fontSize: 13, fontWeight: '500' },
  optionBtnSelected: { backgroundColor: 'rgba(221,161,94,0.18)', borderColor: C.gold },
  optionBtnCorrect: { backgroundColor: '#606C38', borderColor: '#7d8d49' },
  optionBtnIncorrect: { backgroundColor: '#BC6C25', borderColor: '#9c5419' },

  resultWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  resultEmoji: { fontSize: 56, marginBottom: 12 },
  resultTitle: { color: C.text, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  resultDesc: { color: C.textMuted, fontSize: 13, textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 18, paddingHorizontal: 12 },
});
