import { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  Platform,
  useWindowDimensions,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import dinosaurs from './data/dinosaurs.json';
import karpatDinosaurs from './data/karpatmedence.json';
import quizQuestions from './data/quiz_questions.json';

// --- AUDIO SYSTEM ---
// Egyszerű UI kattanás hang (online forrás, marad ahogy volt)
const SOUNDS = {
  click: 'https://actions.google.com/sounds/v1/ui/click_on_furniture.ogg',
};

const loadedSounds = {};

async function playSound(soundKey) {
  if (isSoundMuted) return;
  try {
    if (loadedSounds[soundKey]) {
      await loadedSounds[soundKey].replayAsync();
      return;
    }
    const { sound } = await Audio.Sound.createAsync(
      { uri: SOUNDS[soundKey] },
      { shouldPlay: true }
    );
    loadedSounds[soundKey] = sound;
  } catch (error) {
    console.warn(`Nem sikerült a hang lejátszása: ${soundKey}`, error);
  }
}

// --- KVÍZ HANGOK (helyi mp3 fájlok az ./assets/sounds mappából) ---
const QUIZ_SOUND_FILES = {
  correct: require('./assets/sounds/correct_answer.mp3'),
  wrong: require('./assets/sounds/wrong_answer.mp3'),
  finalAnswer: require('./assets/sounds/final_answer.mp3'),
  next: require('./assets/sounds/next.mp3'),
  lifeline: require('./assets/sounds/lifelines.mp3'),
  resign: require('./assets/sounds/resign.mp3'),
  letsPlay: require('./assets/sounds/lets_play.mp3'),
  mainTheme: require('./assets/sounds/main_theme.mp3'),
  easy: require('./assets/sounds/easy.mp3'),
  medium: require('./assets/sounds/medium.mp3'),
  hard: require('./assets/sounds/hard.mp3'),
  hardMillion: require('./assets/sounds/hard_million.mp3'),
  winningTheme: require('./assets/sounds/winning_theme.mp3'),
};

// Rövid effektek (egyszer lejátszva)
const loadedQuizSfx = {};
async function playQuizSfx(key) {
  if (isSoundMuted) return;
  try {
    if (loadedQuizSfx[key]) {
      await loadedQuizSfx[key].setPositionAsync(0);
      await loadedQuizSfx[key].playAsync();
      return;
    }
    const { sound } = await Audio.Sound.createAsync(QUIZ_SOUND_FILES[key], { shouldPlay: true });
    loadedQuizSfx[key] = sound;
  } catch (error) {
    console.warn(`Nem sikerült a kvíz hang lejátszása: ${key}`, error);
  }
}

// Háttérzene kezelő - mindig csak egy szól, hurkolva
let bgMusicSound = null;
let bgMusicKey = null;
async function playQuizBgMusic(key, { loop = true, volume = 0.45 } = {}) {
  if (isSoundMuted) return;
  try {
    if (bgMusicKey === key && bgMusicSound) return;
    if (bgMusicSound) {
      await bgMusicSound.stopAsync().catch(() => {});
      await bgMusicSound.unloadAsync().catch(() => {});
      bgMusicSound = null;
      bgMusicKey = null;
    }
    const { sound } = await Audio.Sound.createAsync(
      QUIZ_SOUND_FILES[key],
      { shouldPlay: true, isLooping: loop, volume }
    );
    bgMusicSound = sound;
    bgMusicKey = key;
  } catch (error) {
    console.warn(`Nem sikerült a háttérzene lejátszása: ${key}`, error);
  }
}
async function stopQuizBgMusic() {
  try {
    if (bgMusicSound) {
      await bgMusicSound.stopAsync().catch(() => {});
      await bgMusicSound.unloadAsync().catch(() => {});
    }
  } catch (error) {
    // csendben elnyeljük
  } finally {
    bgMusicSound = null;
    bgMusicKey = null;
  }
}
// Szint alapján visszaadja melyik háttérzenét kell lejátszani
import AdSenseSlot, { AD_SLOT_LEFT, AD_SLOT_RIGHT } from './AdSenseSlot';

// Asztali/böngészős nézeten az app egy telefon-szélességű, középre igazított
// sávban fut, hogy a két oldalra később hely maradjon (pl. hirdetéseknek).
function Shell({ children }) {
  const { width } = useWindowDimensions();
  const showAdSlots = Platform.OS === 'web' && width >= 900;
  const isWideWeb = Platform.OS === 'web' && width >= 700;
  return (
    <View style={styles.shellOuter}>
      {showAdSlots && (
        <View style={styles.adSlot}>
          <AdSenseSlot slotId={AD_SLOT_LEFT} />
        </View>
      )}
      <View style={[styles.shellInner, isWideWeb && styles.shellInnerWide]}>{children}</View>
      {showAdSlots && (
        <View style={styles.adSlot}>
          <AdSenseSlot slotId={AD_SLOT_RIGHT} />
        </View>
      )}
    </View>
  );
}

function getTierMusicKey(level) {
  if (level <= 5) return 'easy';
  if (level <= 10) return 'medium';
  if (level <= 14) return 'hard';
  return 'hardMillion';
}

// --- NÉMÍTÁS (globális, minden hangra hat) ---
let isSoundMuted = false;
function setSoundMuted(muted) {
  isSoundMuted = muted;
  if (bgMusicSound) {
    if (muted) bgMusicSound.pauseAsync().catch(() => {});
    else bgMusicSound.playAsync().catch(() => {});
  }
}

// Lebegő némítás gomb - bármelyik képernyőre rakható
function MuteButton({ style }) {
  const [localMuted, setLocalMuted] = useState(isSoundMuted);
  const toggle = () => {
    const next = !isSoundMuted;
    setSoundMuted(next);
    setLocalMuted(next);
  };
  return (
    <TouchableOpacity onPress={toggle} style={[styles.muteButton, style]} activeOpacity={0.7}>
      <Text style={styles.muteButtonText}>{localMuted ? '🔇' : '🔊'}</Text>
    </TouchableOpacity>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

const COLORS = {
  bg: '#020024',
  card: 'rgba(255,255,255,0.05)',
  cardSolid: '#0A0A3C',
  border: 'rgba(255,255,255,0.14)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.62)',
  textMuted: 'rgba(255,255,255,0.38)',
  green: '#7ab832',
  greenLight: 'rgba(122,184,50,0.45)',
  greenBg: 'rgba(122,184,50,0.14)',
  blue: '#5CACEE',
  blueBg: 'rgba(92,172,238,0.14)',
  blueLight: 'rgba(92,172,238,0.45)',
  coral: '#e0807f',
  coralBg: 'rgba(224,128,127,0.14)',
  coralLight: 'rgba(224,128,127,0.45)',
  amber: '#D4AF37',
  amberBg: 'rgba(212,175,55,0.14)',
  amberLight: 'rgba(212,175,55,0.45)',
  quizBg: '#020024',
  quizGold: '#D4AF37',
};

const IMAGE_MAP = {
  "Iguanodon bernissartensis": require('./assets/images/Iguanodon2.jpg'),
  "Megalosaurus bucklandii": require('./assets/images/megalosaurus.jpg'),
  "Baryonyx walkeri": require('./assets/images/baryonyx.jpg'),
  "Hypsilophodon foxii": require('./assets/images/hypsilophodon.jpg'),
  "Europasaurus holgeri": require('./assets/images/europasaurus.jpg'),
  "Plateosaurus engelhardti": require('./assets/images/plateosaurus.jpg'),
  "Cetiosaurus oxoniensis": require('./assets/images/cetiosaurus.jpg'),
  "Camptosaurus prestwichii": require('./assets/images/camptosaurus.jpg'),
  "Valdosaurus canaliculatus": require('./assets/images/valdosaurus.jpg'),
  "Mantellisaurus atherfieldensis": require('./assets/images/mantellisaurus.jpg'),
  "Neovenator salerii": require('./assets/images/neovenator.jpg'),
  "Scipionyx samniticus": require('./assets/images/scipionyx.jpg'),
  "Draconyx loureiroi": require('./assets/images/draconyx.jpg'),
  "Torvosaurus gurneyi": require('./assets/images/torvosaurus.jpg'),
  "Lourinhanosaurus antunesi": require('./assets/images/lourinhanosaurus.jpg'),
  "Liliensternus liliensterni": require('./assets/images/liliensternus.jpg'),
  "Rhabdodon priscus": require('./assets/images/rhabdodon.jpg'),
  "Magyarosaurus dacus": require('./assets/images/magyarosaurusb.jpg'),
  "Zalmoxes robustus": require('./assets/images/zalmoxes.jpg'),
  "Lusotitan atalaiensis": require('./assets/images/lusotitan.jpg'),
  "Allosaurus europaeus": require('./assets/images/allosaurus_eu.jpg'),
  "Thecodontosaurus antiquus": require('./assets/images/thecodontosaurus.jpg'),
  "Concavenator corcovatus": require('./assets/images/concavenator.jpg'),
  "Pelecanimimus polyodon": require('./assets/images/pelecanimimus.jpg'),
  "Arcovenator escotae": require('./assets/images/arcovenator.jpg'),
  "Hungarosaurus tormai": require('./assets/images/hungarosaurus.jpg'),
  "Ajkaceratops kozmai": require('./assets/images/ajkaceratops.jpg'),
  "Pneumatoraptor fodori": require('./assets/images/pneumatoraptor_fodori.jpg'),
  "Mochlodon vorosi": require('./assets/images/mochlodon_vorosi.jpg'),
  "Telmatosaurus transsylvanicus": require('./assets/images/telmatosaurus.jpg'),
  "Struthiosaurus transylvanicus": require('./assets/images/struthiosaurus.jpg'),
  "Petrustitan hungaricus": require('./assets/images/petrustitan.jpg'),
  "Uriash kadici": require('./assets/images/uriash_kadici.jpg'),
  "Komlosaurus carbonis": require('./assets/images/komlosaurus.jpg'),
};

// Mivel a karpatmedence.json új struktúrája már eleve előre feldolgozott, 
// lapos tömbként érkezik, közvetlenül hozzárendelhetjük a listához.
const karpatDinoList = karpatDinosaurs;

function getCardColor(dino) {
  if (!dino) return { bg: COLORS.bg, accent: COLORS.border, text: COLORS.textPrimary };
  const csoport = dino.csoport?.toLowerCase() || '';
  const korszak = dino.korszak?.toLowerCase() || '';
  if (korszak.includes('triász')) return { bg: COLORS.amberBg, accent: COLORS.amberLight, text: COLORS.amber };
  if (csoport.includes('sauropoda') || csoport.includes('ornithopoda') || csoport.includes('plateosauria')) {
    return { bg: COLORS.greenBg, accent: COLORS.greenLight, text: COLORS.green };
  }
  if (csoport.includes('spinosauridae') || csoport.includes('allosauridae') || csoport.includes('megalosauridae') ||
      csoport.includes('abelisauridae') || csoport.includes('carcharodontosauridae') || csoport.includes('coelophysoidea')) {
    return { bg: COLORS.coralBg, accent: COLORS.coralLight, text: COLORS.coral };
  }
  return { bg: COLORS.blueBg, accent: COLORS.blueLight, text: COLORS.blue };
}

// --- MODERN GENERÁLT DÍNÓTUDÓS LOGÓ ---
function DinoTudosLogo() {
  return (
    <View style={styles.logoImageContainer}>
      <Text style={styles.logoSubBadge}>PALEONTOLÓGIA</Text>
      <View style={styles.logoTextWrapper}>
        <Text style={styles.logoMainText3D}>DÍNÓTUDÓS</Text>
        <Text style={styles.logoMainText}>DÍNÓTUDÓS</Text>
      </View>
      <Text style={styles.logoSubtitleText}>KÁRTYÁK & KVÍZJÁTÉK</Text>
      <View style={styles.logoBottomLine} />
    </View>
  );
}

// --- LANDING PAGE ---
// Átlátszó gomb, amelynek a kerete körül egy fénypont (lézer) fut körbe végtelenítve.
function LaserBorderButton({ style, onPress, color = '#7CFC9A', duration = 2800, children }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [duration]);

  const { width, height } = size;
  const perimeter = Math.max(1, 2 * (width + height));
  const p1 = width / perimeter; // a felső él végpontja
  const p2 = (width + height) / perimeter; // a jobb él végpontja
  const p3 = (2 * width + height) / perimeter; // az alsó él végpontja

  const dotX = progress.interpolate({
    inputRange: [0, p1, p2, p3, 1],
    outputRange: [0, width, width, 0, 0],
  });
  const dotY = progress.interpolate({
    inputRange: [0, p1, p2, p3, 1],
    outputRange: [0, 0, height, height, 0],
  });

  return (
    <TouchableOpacity
      style={style}
      activeOpacity={0.6}
      onPress={onPress}
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      {children}
      <View pointerEvents="none" style={[styles.laserBorderTrack, { borderColor: `${color}33` }]} />
      {width > 0 && height > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.laserDot,
            {
              backgroundColor: color,
              shadowColor: color,
              transform: [
                { translateX: Animated.add(dotX, -7) },
                { translateY: Animated.add(dotY, -7) },
              ],
            },
          ]}
        />
      )}
    </TouchableOpacity>
  );
}

// A 6 régió/akció gomb adatai - a tartalom most teljesen kódból épül fel valódi ikonképekkel,
// nem a háttérképbe sütött grafikára próbálunk illeszkedni.
const LANDING_BUTTONS = [
  { key: 'europa', title: 'Európa', subtitle: 'elérhető', icon: require('./assets/icons/icon_europa.png'), color: '#7CFC9A', bg: 'rgba(28, 58, 20, 0.6)' },
  { key: 'karpat', title: 'Kárpát-medence', subtitle: 'elérhető', icon: require('./assets/icons/icon_karpat.png'), color: '#e0807f', bg: '#3a1212' },
  { key: 'amerika', title: 'Amerika', subtitle: 'hamarosan', icon: require('./assets/icons/icon_amerika.png'), color: '#7CFC9A', bg: '#18130e' },
  { key: 'azsia', title: 'Ázsia', subtitle: 'hamarosan', icon: require('./assets/icons/icon_azsia.png'), color: '#7CFC9A', bg: '#0b131c' },
  { key: 'kviz', title: 'Dínó Kvíz', subtitle: '***', icon: require('./assets/icons/icon_kviz.png'), color: '#dca73a', bg: '#241a3a' },
  { key: 'afrika', title: 'Afrika', subtitle: 'hamarosan', icon: require('./assets/icons/icon_afrika.png'), color: '#7CFC9A', bg: '#1a1206' },
];

function LandingPage({ onNavigate, onSelectRegion }) {
  const handlePress = (key) => {
    playSound('click');
    if (key === 'europa') { onSelectRegion('europa'); onNavigate('cards'); }
    else if (key === 'karpat') { onSelectRegion('karpat'); onNavigate('cards'); }
    else if (key === 'kviz') { onNavigate('quiz'); }
    // amerika / azsia / afrika: hamarosan érkezik, jelenleg nincs célnézet
  };

  return (
    <Shell>
    <View style={styles.landingContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a06" />

      {/* A háttérkép (kapu + dínó jelenet) a teljes felületet kitölti, a régi, bele sütött gombok fölé pedig egy saját panel kerül */}
      <Image
        source={require('./assets/images/lp_bg.png')}
        style={styles.absoluteBackground}
        resizeMode="cover"
      />
      <View style={styles.heroTint} />
      <View style={styles.diagonalCut} />

      <MuteButton />

      <View style={styles.bottomThirdContainer}>
        {[0, 1, 2].map((rowIdx) => (
          <View style={styles.gridRow} key={rowIdx}>
            {LANDING_BUTTONS.slice(rowIdx * 2, rowIdx * 2 + 2).map((btn) => (
              <LaserBorderButton
                key={btn.key}
                style={[styles.gridBtn, { backgroundColor: btn.bg, borderColor: `${btn.color}33` }]}
                color={btn.color}
                onPress={() => handlePress(btn.key)}
              >
                <View style={styles.btnInner}>
                  {btn.icon ? (
                    <Image source={btn.icon} style={styles.btnIconImage} resizeMode="contain" />
                  ) : (
                    <Text style={styles.btnEmoji}>{btn.emoji}</Text>
                  )}
                  <View style={styles.btnTextCol}>
                    <Text style={styles.btnName} numberOfLines={1}>{btn.title}</Text>
                    <Text style={[styles.btnSubMuted, { color: `${btn.color}cc` }]}>{btn.subtitle}</Text>
                  </View>
                </View>
              </LaserBorderButton>
            ))}
          </View>
        ))}
      </View>
    </View>
    </Shell>
  );
}

// --- KVÍZ RENDSZER ---
const MONEY_LADDER = [
  0, 10000, 25000, 50000, 100000, 200000, 350000, 500000, 800000, 1500000,
  3000000, 5000000, 10000000, 15000000, 25000000, 40000000
];
const formatMoney = (val) => `${val.toLocaleString('hu-HU')} Ft`;

const getQuestionForLevel = (level, usedIds) => {
  let diff = 'easy';
  if (level > 5 && level <= 10) diff = 'medium';
  if (level > 10) diff = 'hard';
  let pool = quizQuestions.filter(q => q.difficulty === diff && !usedIds.includes(q.id));
  if (pool.length === 0) pool = quizQuestions.filter(q => q.difficulty === diff);
  return pool[Math.floor(Math.random() * pool.length)];
};

import { showRewardedAd } from './ads';

function QuizGame({ onBack }) {
  const [quizLevel, setQuizLevel] = useState(1);
  const [quizStatus, setQuizStatus] = useState('playing');
  const [currentQuestion, setCurrentQuestion] = useState(() => getQuestionForLevel(1, []));
  const [usedQuestionIds, setUsedQuestionIds] = useState(() => {
    const q = getQuestionForLevel(1, []);
    return q ? [q.id] : [];
  });
  const [selectedOption, setSelectedOption] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState([]);
  const [lifelines, setLifelines] = useState({ fiftyFifty: true, audience: true, phone: true });
  const [lifelineResult, setLifelineResult] = useState(null);
  const [moneyWon, setMoneyWon] = useState(0);
  // Hirdetésért kapható extra 50:50 — kérdésenként egyszer vehető igénybe.
  const [adFiftyFiftyUsedThisQuestion, setAdFiftyFiftyUsedThisQuestion] = useState(false);
  const [watchingAd, setWatchingAd] = useState(false);

  // Belépő hang a játék elején (a háttérzenét a szint-alapú effekt indítja, ami felülírja a főtémát)
  useEffect(() => {
    playQuizSfx('letsPlay');
  }, []);

  // Háttérzene a kérdés nehézségi szintje alapján, amíg játszunk
  useEffect(() => {
    if (quizStatus === 'playing') {
      playQuizBgMusic(getTierMusicKey(quizLevel), { loop: false });
    }
  }, [quizLevel, quizStatus]);

  // Győzelmi témazene a végén
  useEffect(() => {
    if (quizStatus === 'won') {
      playQuizBgMusic('winningTheme', { loop: false, volume: 0.6 });
    }
  }, [quizStatus]);

  const handleSelectOption = (optionIndex) => {
    if (revealed || selectedOption !== null) return;
    setSelectedOption(optionIndex);
    playQuizSfx('finalAnswer');
    setTimeout(() => {
      setRevealed(true);
      const isCorrect = optionIndex === currentQuestion.correctIndex;
      playQuizSfx(isCorrect ? 'correct' : 'wrong');
      // Helyes válasznál 3 másodpercig hagyjuk szólni a correct_answer.mp3-at,
      // mielőtt továbblépnénk és lejátsszuk a next.mp3-at.
      const delay = isCorrect ? 3000 : 1500;
      setTimeout(() => {
        if (isCorrect) {
          if (quizLevel === 15) {
            setMoneyWon(40000000);
            setQuizStatus('won');
            stopQuizBgMusic();
          } else {
            const nextLevel = quizLevel + 1;
            setQuizLevel(nextLevel);
            setSelectedOption(null);
            setRevealed(false);
            setEliminatedOptions([]);
            setLifelineResult(null);
            setAdFiftyFiftyUsedThisQuestion(false);
            const nextQ = getQuestionForLevel(nextLevel, [...usedQuestionIds, currentQuestion.id]);
            setCurrentQuestion(nextQ);
            setUsedQuestionIds(prev => [...prev, nextQ.id]);
          }
        } else {
          let won = 0;
          if (quizLevel > 5 && quizLevel <= 10) won = 200000;
          else if (quizLevel > 10) won = 3000000;
          setMoneyWon(won);
          setQuizStatus('game_over');
          stopQuizBgMusic();
        }
      }, delay);
    }, 1200);
  };

  const eliminateTwoWrongOptions = () => {
    if (!currentQuestion) return;
    const correctIdx = currentQuestion.correctIndex;
    const incorrectIndices = [0, 1, 2, 3].filter(idx => idx !== correctIdx);
    const toEliminate = [];
    while (toEliminate.length < 2) {
      const idx = incorrectIndices[Math.floor(Math.random() * incorrectIndices.length)];
      if (!toEliminate.includes(idx)) toEliminate.push(idx);
    }
    setEliminatedOptions(toEliminate);
  };

  const useFiftyFifty = () => {
    if (!lifelines.fiftyFifty || revealed || selectedOption !== null || !currentQuestion) return;
    playQuizSfx('lifeline');
    setLifelines(prev => ({ ...prev, fiftyFifty: false }));
    eliminateTwoWrongOptions();
  };

  // Hirdetés megnézéséért extra 50:50 — csak ha az eredeti 50:50-et már elhasználta,
  // és ebben a kérdésben még nem vette igénybe a hirdetéses verziót.
  const watchAdForFiftyFifty = () => {
    if (revealed || selectedOption !== null || !currentQuestion) return;
    if (lifelines.fiftyFifty || adFiftyFiftyUsedThisQuestion || watchingAd) return;
    setWatchingAd(true);
    showRewardedAd({
      onReward: () => {
        playQuizSfx('lifeline');
        setAdFiftyFiftyUsedThisQuestion(true);
        eliminateTwoWrongOptions();
      },
      onClose: () => setWatchingAd(false),
      onError: () => setWatchingAd(false),
    });
  };

  const useAudience = () => {
    if (!lifelines.audience || revealed || selectedOption !== null || !currentQuestion) return;
    playQuizSfx('lifeline');
    setLifelines(prev => ({ ...prev, audience: false }));
    const correctIdx = currentQuestion.correctIndex;
    const remainingIndices = [0, 1, 2, 3].filter(idx => !eliminatedOptions.includes(idx));
    let correctChance = 75;
    if (quizLevel > 5 && quizLevel <= 10) correctChance = 55;
    if (quizLevel > 10) correctChance = 42;
    const percentages = [0, 0, 0, 0];
    let sum = 0;
    remainingIndices.forEach(idx => {
      percentages[idx] = idx === correctIdx
        ? Math.floor(correctChance + Math.random() * 10)
        : Math.floor(Math.random() * 20 + 5);
      sum += percentages[idx];
    });
    remainingIndices.forEach(idx => { percentages[idx] = Math.round((percentages[idx] / sum) * 100); });
    const total = percentages.reduce((a, b) => a + b, 0);
    if (total !== 100 && remainingIndices.length > 0) percentages[remainingIndices[0]] += (100 - total);
    setLifelineResult({ type: 'audience', data: percentages });
  };

  const usePhone = () => {
    if (!lifelines.phone || revealed || selectedOption !== null || !currentQuestion) return;
    playQuizSfx('lifeline');
    setLifelines(prev => ({ ...prev, phone: false }));
    const correctIdx = currentQuestion.correctIndex;
    const correctText = currentQuestion.options[correctIdx];
    const remainingIndices = [0, 1, 2, 3].filter(idx => idx !== correctIdx && !eliminatedOptions.includes(idx));
    const incorrectText = remainingIndices.length > 0 ? currentQuestion.options[remainingIndices[0]] : "másik lehetőség";
    let text = "";
    if (quizLevel <= 5) text = `Szerintem biztosan a(z) "${correctText}" a jó válasz!\nEbben 95%-ig biztos vagyok.`;
    else if (quizLevel <= 10) text = `Nem vagyok teljesen biztos, de szerintem a(z) "${correctText}" lesz az.\nOlyan 70% esélyt adnék rá.`;
    else {
      const isCorrectAdvice = Math.random() < 0.65;
      text = isCorrectAdvice
        ? `Hú, ez nagyon nehéz... Talán a(z) "${correctText}", de nem vennék rá mérget.`
        : `Nem vagyok biztos benne, de talán a(z) "${incorrectText}" a jó válasz.`;
    }
    setLifelineResult({ type: 'phone', data: text });
  };

  const handleWalkAway = () => {
    if (revealed || selectedOption !== null) return;
    playQuizSfx('resign');
    stopQuizBgMusic();
    setMoneyWon(MONEY_LADDER[quizLevel - 1]);
    setQuizStatus('game_over');
  };

  const restartQuiz = () => {
    stopQuizBgMusic();
    playQuizSfx('letsPlay');
    const firstQ = getQuestionForLevel(1, []);
    setQuizLevel(1);
    setQuizStatus('playing');
    setCurrentQuestion(firstQ);
    setUsedQuestionIds([firstQ.id]);
    setSelectedOption(null);
    setRevealed(false);
    setEliminatedOptions([]);
    setLifelines({ fiftyFifty: true, audience: true, phone: true });
    setLifelineResult(null);
    setMoneyWon(0);
    setAdFiftyFiftyUsedThisQuestion(false);
  };

  if (quizStatus === 'game_over' || quizStatus === 'won') {
    return (
      <View style={styles.quizContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.quizBg} />
        <MuteButton />
        <Text style={styles.quizGameOverEmoji}>{quizStatus === 'won' ? '👑' : '💀'}</Text>
        <Text style={styles.quizGameOverTitle}>{quizStatus === 'won' ? 'GRATULÁLUNK!' : 'JÁTÉK VÉGE'}</Text>
        <Text style={styles.quizGameOverDesc}>
          {quizStatus === 'won'
            ? 'Megválaszoltad az összes kérdést és Dínó Milliomos lettél!'
            : moneyWon > 0 ? `Gratulálunk! Elérted a(z) ${quizLevel - 1}. szintet.` : 'Sajnos ez most nem sikerült.'}
        </Text>
        <View style={styles.prizeBox}>
          <Text style={styles.prizeLabel}>Nyereményed:</Text>
          <Text style={[styles.prizeValue, quizStatus === 'won' && { color: COLORS.quizGold }]}>{formatMoney(quizStatus === 'won' ? 40000000 : moneyWon)}</Text>
        </View>
        <TouchableOpacity onPress={restartQuiz} style={[styles.quizActionBtn, { borderColor: COLORS.quizGold, backgroundColor: 'rgba(212,175,55,0.1)' }]}>
          <Text style={[styles.quizActionBtnText, { color: COLORS.quizGold }]}>Új játék indítása</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBack} style={styles.quizBackLink}>
          <Text style={{ color: '#fff', opacity: 0.7 }}>← Főmenü</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentQuestion) return null;

  let guaranteedAmount = 0;
  if (quizLevel > 5 && quizLevel <= 10) guaranteedAmount = 200000;
  else if (quizLevel > 10) guaranteedAmount = 3000000;

  return (
    <Shell>
    <View style={[styles.quizContainer, { justifyContent: 'space-between', paddingTop: 50, paddingBottom: 36 }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.quizBg} />
      <MuteButton />
      <Image
        source={require('./assets/images/milliomos_logo.jpg')}
        style={styles.quizLogoBanner}
        resizeMode="cover"
      />
      <View style={[styles.quizHeaderRow, { marginTop: 6 }]}>
        <TouchableOpacity onPress={onBack} style={styles.quizBackBtn} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>← Kilépés</Text>
        </TouchableOpacity>
        <View style={styles.quizQuestionBadge}>
          <Text style={styles.quizBadgeText}>{quizLevel} / 15</Text>
        </View>
      </View>

      <View style={styles.quizStatusRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.quizMoneyWonLabel}>Kérdés értéke:</Text>
          <Text style={styles.quizMoneyWonValue}>{formatMoney(MONEY_LADDER[quizLevel])}</Text>
        </View>
        <View style={styles.lifelinesContainer}>
          <TouchableOpacity style={[styles.lifelineCircle, !lifelines.fiftyFifty && styles.lifelineCircleDisabled]} disabled={!lifelines.fiftyFifty || revealed || selectedOption !== null} onPress={useFiftyFifty}>
            <Text style={styles.lifelineText}>50:50</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.lifelineCircle, !lifelines.audience && styles.lifelineCircleDisabled]} disabled={!lifelines.audience || revealed || selectedOption !== null} onPress={useAudience}>
            <Text style={styles.lifelineText}>👥</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.lifelineCircle, !lifelines.phone && styles.lifelineCircleDisabled]} disabled={!lifelines.phone || revealed || selectedOption !== null} onPress={usePhone}>
            <Text style={styles.lifelineText}>📞</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!lifelines.fiftyFifty && !adFiftyFiftyUsedThisQuestion && !revealed && selectedOption === null && (
        <TouchableOpacity
          style={[styles.adLifelineBtn, watchingAd && styles.adLifelineBtnDisabled]}
          disabled={watchingAd}
          onPress={watchAdForFiftyFifty}
        >
          <Text style={styles.adLifelineBtnText}>
            {watchingAd ? '🎬 Hirdetés lejátszása...' : '🎬 Hirdetés nézése → extra 50:50'}
          </Text>
        </TouchableOpacity>
      )}

      {lifelineResult && (
        <View style={styles.lifelineResultBox}>
          {lifelineResult.type === 'phone' ? (
            <Text style={styles.phoneHintText}>📞 {lifelineResult.data}</Text>
          ) : (
            <View>
              <Text style={styles.audienceHintTitle}>👥 Közönség szavazása:</Text>
              <View style={styles.audienceGraphRow}>
                {['A', 'B', 'C', 'D'].map((label, idx) => {
                  const pct = lifelineResult.data[idx] || 0;
                  return (
                    <View key={label} style={styles.audienceGraphBarCol}>
                      <Text style={styles.audiencePctText}>{pct}%</Text>
                      <View style={[styles.audienceBar, { height: Math.max(10, pct * 0.8) }]} />
                      <Text style={styles.audienceLabelText}>{label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      )}

      <View style={styles.quizQuestionBox}>
        <Text style={styles.quizQuestionText}>{currentQuestion.question}</Text>
      </View>

      <View style={styles.optionsList}>
        {currentQuestion.options.map((opt, idx) => {
          const letter = ['A', 'B', 'C', 'D'][idx];
          const isEliminated = eliminatedOptions.includes(idx);
          let optStyle = styles.optionBtn;
          let textStyle = styles.optionBtnText;
          if (isEliminated) { 
            optStyle = [optStyle, styles.optionBtnEliminated]; 
            textStyle = [textStyle, styles.optionBtnTextEliminated]; 
          } else if (selectedOption === idx) {
            if (revealed) {
              const isCorrect = idx === currentQuestion.correctIndex;
              optStyle = [optStyle, isCorrect ? styles.optionBtnCorrect : styles.optionBtnIncorrect];
              textStyle = [textStyle, styles.optionBtnTextRevealed];
            } else { 
              optStyle = [optStyle, styles.optionBtnSelected];
              textStyle = [textStyle, styles.optionBtnTextSelected]; 
            }
          } else if (revealed && idx === currentQuestion.correctIndex) {
            optStyle = [optStyle, styles.optionBtnCorrect];
            textStyle = [textStyle, styles.optionBtnTextRevealed];
          }
          return (
            <TouchableOpacity key={idx} style={optStyle} disabled={isEliminated || selectedOption !== null} onPress={() => handleSelectOption(idx)}>
              <Text style={textStyle}>{isEliminated ? "" : `${letter}:  ${opt}`}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.quizFooterRow}>
        <View>
          <Text style={styles.quizGuaranteedLabel}>Garantált összeg:</Text>
          <Text style={styles.quizGuaranteedValue}>{formatMoney(guaranteedAmount)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.walkAwayBtn, (selectedOption !== null || revealed) && styles.walkAwayBtnDisabled]}
          disabled={selectedOption !== null || revealed}
          onPress={handleWalkAway}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.walkAwayBtnText}>Megállás</Text>
        </TouchableOpacity>
      </View>
    </View>
    </Shell>
  );
}

import PeriodTimeline from './PeriodTimeline';

// --- ADATBÁZIS KÁRTYA ELEMEK ---
function StatBox({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function fmtVal(val, suffix = '') {
  if (val === null || val === undefined || val === '' || val === 'n/a') return 'ismeretlen';
  return `${typeof val === 'number' ? val.toLocaleString() : val}${suffix}`;
}

function DinoCard({ dino, index, total }) {
  if (!dino) return null;
  const color = getCardColor(dino);
  const image = IMAGE_MAP[dino.nev_tudomanyos] || null;
  const { width: cardWidth } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && cardWidth >= 700;
  return (
    <View style={styles.card}>
      <View style={styles.timelineWrap}>
        <PeriodTimeline korMillioev={dino.kor_millioev} />
      </View>
      <View style={[styles.cardImageArea, isWideWeb && styles.cardImageAreaWide, { backgroundColor: color.bg }]}>
        {image ? (
          <Image source={image} style={styles.dinoImage} resizeMode="contain" />
        ) : (
          <Text style={[styles.fallbackEmoji, { color: color.accent }]}>
            {dino.csoport?.toLowerCase().includes('sauropoda') ? '🦕' : '🦖'}
          </Text>
        )}
      </View>
      <ScrollView style={styles.cardBody} showsVerticalScrollIndicator={false}>
        <Text style={styles.scientificName}>{dino.nev_tudomanyos}</Text>
        <Text style={styles.commonName}>{dino.nev_koznapi} · {dino.kor_millioev}</Text>
        <View style={styles.infoTextRow}>
          <Text style={styles.infoTextItem}>🕒 {fmtVal(dino.korszak)}</Text>
          <Text style={styles.infoTextItem}>📍 {fmtVal(dino.megtalalas_helye)}</Text>
          <Text style={styles.infoTextItem}>🌿 {fmtVal(dino.taplalek)}</Text>
          <Text style={styles.infoTextItem}>📏 {fmtVal(dino.hossz)}</Text>
        </View>
        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>Felfedező</Text>
        <Text style={styles.bodyText}>{fmtVal(dino.felfedezo)}</Text>
        <Text style={styles.sectionLabel}>Leírás</Text>
        <Text style={[styles.bodyText, styles.highlight]}>{fmtVal(dino.leiras)}</Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

// --- FŐ ALKALMAZÁS ---
export default function App() {
  const [view, setView] = useState('landing');
  const [region, setRegion] = useState('europa');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('Mind');

  const position = useRef(new Animated.ValueXY()).current;
  const { width: appWidth } = useWindowDimensions();

  const activeDinosaurs = region === 'karpat' ? karpatDinoList : dinosaurs;

  const filteredDinosaurs = activeDinosaurs.filter((dino) => {
    const matchesPeriod = selectedPeriod === 'Mind' || dino.korszak?.toLowerCase().includes(selectedPeriod.toLowerCase());
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      dino.nev_tudomanyos.toLowerCase().includes(q) ||
      dino.nev_koznapi.toLowerCase().includes(q) ||
      dino.csoport?.toLowerCase().includes(q) ||
      dino.megtalalas_helye?.toLowerCase().includes(q);
    return matchesPeriod && matchesSearch;
  });

  // Háttér főtéma: mindenhol szól hurkolva, KIVÉVE a kvíz közben (ott a QuizGame saját zenéje veszi át).
  useEffect(() => {
    if (view !== 'quiz') {
      playQuizBgMusic('mainTheme', { loop: true, volume: 0.4 });
    }
  }, [view]);

  const swipeRef = useRef((dir) => {
    const toValue = dir === 'next' ? -SCREEN_WIDTH * 1.5 : SCREEN_WIDTH * 1.5;
    Animated.timing(position, {
      toValue: { x: toValue, y: 0 },
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex((prev) => {
        const nextIdx = dir === 'next' ? prev + 1 : prev - 1;
        if (nextIdx >= filteredDinosaurs.length) return 0;
        if (nextIdx < 0) return filteredDinosaurs.length - 1;
        return nextIdx;
      });
    });
  });

  if (view === 'landing') return <LandingPage onNavigate={setView} onSelectRegion={setRegion} />;
  if (view === 'quiz') return <QuizGame onBack={() => setView('landing')} />;
  if (view === 'leaderboard') {
    return (
      <Shell>
      <View style={[styles.quizContainer, { padding: 24, justifyContent: 'center', alignItems: 'center' }]}>
        <MuteButton />
        <Text style={{ fontSize: 32, marginBottom: 12 }}>🏆</Text>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 24 }}>Ranglista (Top 10)</Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 40, textAlign: 'center' }}>Nincs még mentett helyi eredmény.</Text>
        <TouchableOpacity onPress={() => setView('landing')} style={styles.quizBackLink}>
          <Text style={{ color: COLORS.quizGold, fontSize: 14, fontWeight: '600' }}>← Vissza</Text>
        </TouchableOpacity>
      </View>
      </Shell>
    );
  }

  const dino = filteredDinosaurs[currentIndex];

  return (
    <Shell>
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <MuteButton style={{ backgroundColor: 'rgba(0,0,0,0.25)' }} />
      <SafeAreaView style={styles.header}>
        <Text style={styles.headerSub}>Lapozz a nyilakkal</Text>
        <View style={styles.menuRow}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => { setView('landing'); setSearchQuery(''); setSelectedPeriod('Mind'); setCurrentIndex(0); }}
          >
            <Text style={styles.headerTitle}>← FŐMENÜ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.cardContainer}>
        {filteredDinosaurs.length > 0 ? (
          <Animated.View style={[position.getTranslateTransform(), { flex: 1, width: '100%' }]}>
            <DinoCard dino={dino} index={currentIndex} total={filteredDinosaurs.length} />
          </Animated.View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>Nincs találat</Text>
            <Text style={styles.emptyDesc}>Próbálkozz más keresőszóval vagy szűrővel.</Text>
          </View>
        )}
      </View>

      {filteredDinosaurs.length > 0 && (
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navButton} onPress={() => swipeRef.current('prev')}>
            <Text style={styles.navButtonText}>←  Előző dínó</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={() => swipeRef.current('next')}>
            <Text style={styles.navButtonText}>Következő dínó  →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
    </Shell>
  );
}

// --- GLOBAL STYLES ---
const styles = StyleSheet.create({
  shellOuter: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
    backgroundColor: '#020024',
    alignItems: 'stretch',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  shellInner: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    minHeight: '100%',
  },
  shellInnerWide: {
    maxWidth: 720,
  },
  adSlot: {
    flex: 1,
    minWidth: 120,
    maxWidth: 300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderStyle: 'dashed',
    margin: 12,
    borderRadius: 8,
  },
  adSlotLabel: { color: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: '700', textAlign: 'center', letterSpacing: 1 },
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, backgroundColor: COLORS.bg, borderBottomWidth: 0.5, borderColor: COLORS.border },
  headerSub: { fontSize: 10, color: COLORS.textSecondary, marginBottom: 6 },
  menuRow: { marginBottom: 8 },
  menuButton: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 2 },
  headerTitle: { fontSize: 13, fontWeight: '800', color: COLORS.green, letterSpacing: 0.5 },
  cardContainer: { flex: 1, padding: 14, justifyContent: 'center', alignItems: 'center' },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 4,
    gap: 10,
  },
  navButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  navButtonText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
  
  card: { flex: 1, width: '100%', backgroundColor: COLORS.cardSolid, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6 },
  cardImageArea: { width: '100%', aspectRatio: 16 / 9, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)' },
  cardImageAreaWide: {},
  dinoImage: { width: '100%', height: '100%' },
  fallbackEmoji: { fontSize: 64 },
  cornerBadge: {
    position: 'absolute',
    backgroundColor: 'rgba(2,0,36,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '46%',
  },
  cornerTopLeft: { top: 10, left: 10 },
  cornerTopRight: { top: 10, right: 10 },
  cornerBottomLeft: { bottom: 10, left: 10 },
  cornerBottomRight: { bottom: 10, right: 10 },
  infoBadgeText: { fontSize: 11, fontWeight: '600', color: COLORS.textPrimary },
  infoTextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#0d1127',
    gap: 6,
  },
  infoTextItem: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  cardBody: { padding: 16 },
  scientificName: { fontSize: 14, fontWeight: 'bold', color: COLORS.textPrimary, fontStyle: 'italic' },
  commonName: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, fontWeight: '500' },
  divider: { height: 0.5, backgroundColor: COLORS.border, marginVertical: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timelineWrap: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4, backgroundColor: '#0d1127' },
  statBox: { width: '48%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 8, borderWidth: 0.5, borderColor: COLORS.border },
  statLabel: { fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  bodyText: { fontSize: 12, color: COLORS.textPrimary, marginTop: 2, lineHeight: 16 },
  highlight: { color: COLORS.amber, fontWeight: '500' },

  searchInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 0.5, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, fontSize: 12, color: COLORS.textPrimary, marginBottom: 8 },
  filterRow: { flexDirection: 'row', gap: 6 },
  filterTab: { flex: 1, paddingVertical: 5, borderRadius: 6, borderWidth: 0.5, borderColor: COLORS.border, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  filterTabActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  filterTabText: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary },
  filterTabTextActive: { color: '#fff' },
  
  emptyCard: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 6 },
  emptyDesc: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },

  quizContainer: { flex: 1, backgroundColor: COLORS.quizBg, paddingHorizontal: 16, justifyContent: 'center' },
  quizGameOverEmoji: { fontSize: 64, textAlign: 'center', marginBottom: 16 },
  quizGameOverTitle: { fontSize: 24, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: 1 },
  quizGameOverDesc: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 8, paddingHorizontal: 24, lineHeight: 20 },
  prizeBox: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, marginVertical: 24, alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)' },
  prizeLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  prizeValue: { fontSize: 28, fontWeight: '900', color: '#fff', marginTop: 4 },
  quizActionBtn: { height: 48, borderRadius: 24, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginHorizontal: 24 },
  quizActionBtnText: { fontSize: 14, fontWeight: 'bold' },
  quizBackLink: { marginTop: 24, alignItems: 'center' },
  quizHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quizLogoBanner: { width: '100%', height: 90, borderRadius: 10, marginBottom: 4 },
  quizBackBtn: { paddingVertical: 6 },
  quizTitle: { fontSize: 14, fontWeight: '900', color: COLORS.quizGold, letterSpacing: 1 },
  quizQuestionBadge: { backgroundColor: 'rgba(214,175,55,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 0.5, borderColor: COLORS.quizGold },
  quizBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.quizGold },
  quizStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 14, backgroundColor: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 12 },
  quizMoneyWonLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  quizMoneyWonValue: { fontSize: 18, fontWeight: '900', color: '#fff', marginTop: 2 },
  lifelinesContainer: { flexDirection: 'row', gap: 8 },
  adLifelineBtn: {
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  adLifelineBtnDisabled: { opacity: 0.5 },
  adLifelineBtnText: { color: '#D4AF37', fontSize: 12, fontWeight: '700' },
  lifelineCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.07)', justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)' },
  lifelineCircleDisabled: { opacity: 0.3 },
  lifelineText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  lifelineResultBox: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12, marginBottom: 14, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  phoneHintText: { color: '#fff', fontSize: 12, lineHeight: 16 },
  audienceHintTitle: { color: COLORS.quizGold, fontSize: 11, fontWeight: '700', marginBottom: 8 },
  audienceGraphRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 60, paddingTop: 10 },
  audienceGraphBarCol: { alignItems: 'center', width: 40 },
  audiencePctText: { color: '#fff', fontSize: 9, marginBottom: 4 },
  audienceBar: { width: 14, backgroundColor: COLORS.quizGold, borderRadius: 2 },
  audienceLabelText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4, fontWeight: 'bold' },
  quizQuestionBox: { backgroundColor: 'rgba(255,255,255,0.03)', borderLeftWidth: 3, borderLeftColor: COLORS.quizGold, padding: 16, borderRadius: 8, marginVertical: 10 },
  quizQuestionText: { color: '#fff', fontSize: 15, fontWeight: '600', lineHeight: 22 },
  optionsList: { gap: 9, marginVertical: 10 },
  optionBtn: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  optionBtnText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  optionBtnEliminated: { opacity: 0.0, backgroundColor: 'transparent', borderColor: 'transparent' },
  optionBtnTextEliminated: { color: 'transparent' },
  optionBtnSelected: { backgroundColor: 'rgba(214,175,55,0.15)', borderColor: COLORS.quizGold },
  optionBtnTextSelected: { color: COLORS.quizGold, fontWeight: '700' },
  optionBtnCorrect: { backgroundColor: '#1e4611', borderColor: '#4ea824' },
  optionBtnIncorrect: { backgroundColor: '#5c1919', borderColor: '#bd2828' },
  optionBtnTextRevealed: { color: '#fff', fontWeight: '700' },
  quizFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  quizGuaranteedLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  quizGuaranteedValue: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  walkAwayBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)' },
  walkAwayBtnDisabled: { opacity: 0.3 },
  walkAwayBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  logoImageContainer: { position: 'absolute', top: 40, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
  logoTextWrapper: { position: 'relative', width: '100%', alignItems: 'center', justifyContent: 'center', height: 60 },
  logoMainText: { fontSize: 38, fontWeight: '900', color: '#FFFFFF', letterSpacing: 3, textShadowColor: '#000000', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3, position: 'absolute' },
  logoMainText3D: { fontSize: 38, fontWeight: '900', color: '#639922', letterSpacing: 3, position: 'absolute', top: 3, left: 2, opacity: 0.9 },
  logoSubBadge: { backgroundColor: 'rgba(99,153,34,0.22)', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 20, fontSize: 10, fontWeight: '800', color: '#7ab832', letterSpacing: 4, marginBottom: 2, borderWidth: 1, borderColor: 'rgba(122,184,50,0.3)' },
  logoSubtitleText: { fontSize: 12, fontWeight: '700', color: '#E4E4DB', letterSpacing: 5, marginTop: 4, textTransform: 'uppercase', opacity: 0.8 },
  logoBottomLine: { width: 50, height: 3, backgroundColor: '#639922', borderRadius: 2, marginTop: 10 },

  /* --- Új, teljes képernyős Landing Page stílusok --- */
  landingContainer: { flex: 1, backgroundColor: '#0a0a06', position: 'relative', justifyContent: 'center', alignItems: 'center' },
  landingStage: { position: 'relative', overflow: 'hidden' },
  absoluteBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  heroTint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,6,2,0.15)' },
  diagonalCut: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, backgroundColor: '#0a0a06', transform: [{ skewY: '-2.5deg' }], marginBottom: -15, opacity: 0.3 },
  
  bottomThirdContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '36%', paddingHorizontal: 16, paddingBottom: 24, justifyContent: 'flex-end' },
  /* -------------------------------------------------- */

  bigBtnEu: { backgroundColor: '#223d10', borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, position: 'relative', borderWidth: 1, borderColor: 'rgba(99,153,34,0.2)' },
  bigBtnKarpat: { backgroundColor: '#3a1212', borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, position: 'relative', borderWidth: 1, borderColor: 'rgba(205,42,62,0.25)' },
  btnShine: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16 },
  btnEmoji: { fontSize: 28, width: 40, textAlign: 'center' },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', paddingHorizontal: 4 },
  btnIconImage: { width: 44, height: 44 },
  btnTextCol: { flex: 1, alignItems: 'flex-start' },
  btnName: { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: 0.3, textAlign: 'left' },
  btnSubGreen: { fontSize: 11, color: '#7ab832', marginTop: 1, fontWeight: '600', textAlign: 'left' },
  btnSubRed: { fontSize: 11, color: '#e0807f', marginTop: 1, fontWeight: '600', textAlign: 'left' },
  btnSubMuted: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1, fontWeight: '500', textAlign: 'left' },
  btnBadge: { backgroundColor: '#639922', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  karpatBadge: { backgroundColor: '#cd2a3e', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  btnBadgeText: { fontSize: 8, color: '#fff', fontWeight: '800', letterSpacing: 0.5 },
  euStripe: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, backgroundColor: '#639922', borderRadius: 16 },
  karpatStripe: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, backgroundColor: '#cd2a3e', borderRadius: 16 },
  smallBtnRow: { flexDirection: 'row', gap: 12 },
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  gridBtn: { flex: 1, height: 75, borderRadius: 14, padding: 8, alignItems: 'center', justifyContent: 'center', gap: 2, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  gridBtnTransparent: { flex: 1, height: 75, borderRadius: 14, position: 'relative', overflow: 'visible' },
  laserBorderTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    borderWidth: 1,
  },
  laserDot: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  smallRegionBtn: { flex: 1, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  quizSmallBtn: { backgroundColor: '#0f0b04', borderColor: '#D4AF37', borderWidth: 1 },
  extraDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 6, paddingHorizontal: 4 },
  extraLine: { flex: 1, height: 1, backgroundColor: '#1a1a15' },
  extraLabel: { fontSize: 9, color: '#44443c', letterSpacing: 3, fontWeight: '800' },

  muteButton: { position: 'absolute', top: 44, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 999, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)' },
  muteButtonText: { fontSize: 16 },
});