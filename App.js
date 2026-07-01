// playersService.js
// Nickname-alapú Supabase player létrehozás/lekérdezés.
// Nincs valódi auth — a `players` tábla unique nickname constraint-je
// biztosítja, hogy minden becenév csak egyszer szerepelhet.
//
// A player_id-t lokálisan (AsyncStorage) is cache-eljük, hogy ne kelljen
// minden indításnál Supabase-hívást tenni — csak akkor kérünk újra, ha a
// cache-elt nickname nem egyezik az aktuális nicknévvel, vagy ha még
// nincs cache.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './services/supabaseClient';

const PLAYER_ID_KEY = 'dino_player_id';
const PLAYER_NICKNAME_KEY = 'dino_player_nickname';

async function getCachedPlayer() {
  try {
    const [id, nickname] = await Promise.all([
      AsyncStorage.getItem(PLAYER_ID_KEY),
      AsyncStorage.getItem(PLAYER_NICKNAME_KEY),
    ]);
    if (id && nickname) return { id, nickname };
    return null;
  } catch {
    return null;
  }
}

async function cachePlayer(id, nickname) {
  try {
    await AsyncStorage.setItem(PLAYER_ID_KEY, id);
    await AsyncStorage.setItem(PLAYER_NICKNAME_KEY, nickname);
  } catch (e) {
    console.warn('cachePlayer hiba:', e);
  }
}

/**
 * Visszaadja a player_id-t a megadott nicknévhez.
 * - Ha van érvényes lokális cache ugyanahhoz a nicknévhez, azt használja
 *   (nincs felesleges hálózati hívás).
 * - Ha nincs cache, vagy a nickname megváltozott, lekéri/létrehozza a
 *   Supabase-ben, és frissíti a cache-t.
 * - Hálózati hiba esetén `null`-lal tér vissza, és csendben hagyja, hogy
 *   az app offline módban, Supabase-szinkron nélkül tovább működjön.
 *
 * @param {string} nickname
 * @returns {Promise<string|null>} player_id (uuid) vagy null
 */
export async function getOrCreatePlayerId(nickname) {
  const trimmed = (nickname || '').trim();
  if (!trimmed) return null;

  const cached = await getCachedPlayer();
  if (cached && cached.nickname === trimmed) {
    return cached.id;
  }

  try {
    // 1) Megnézzük, létezik-e már ez a nickname
    const { data: existing, error: selectError } = await supabase
      .from('players')
      .select('id')
      .eq('nickname', trimmed)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existing) {
      await cachePlayer(existing.id, trimmed);
      return existing.id;
    }

    // 2) Nem létezik -> létrehozzuk
    const { data: created, error: insertError } = await supabase
      .from('players')
      .insert({ nickname: trimmed })
      .select('id')
      .single();

    if (insertError) {
      // Ha közben (race condition) más folyamat már létrehozta ugyanezt a
      // nicknevet, az unique constraint hibát dob -> próbáljuk újra lekérni.
      if (insertError.code === '23505') {
        const { data: retryExisting } = await supabase
          .from('players')
          .select('id')
          .eq('nickname', trimmed)
          .maybeSingle();
        if (retryExisting) {
          await cachePlayer(retryExisting.id, trimmed);
          return retryExisting.id;
        }
      }
      throw insertError;
    }

    await cachePlayer(created.id, trimmed);
    return created.id;
  } catch (e) {
    console.warn('getOrCreatePlayerId hiba (offline módban folytatjuk):', e);
    return null;
  }
}

/**
 * Hibakezelt nickname-foglaltság ellenőrzés UI-hoz.
 * Akkor hasznos, ha explicit "ez a név foglalt" üzenetet szeretnénk
 * megjeleníteni MÁS player_id-jával már regisztrált nicknévnél
 * (pl. ha a felhasználó egy korábban általa nem használt, de már
 * foglalt nevet próbál megadni egy másik eszközön).
 *
 * @param {string} nickname
 * @returns {Promise<boolean>} true, ha a nickname szabadon felvehető
 */
export async function isNicknameAvailable(nickname) {
  const trimmed = (nickname || '').trim();
  if (!trimmed) return false;

  try {
    const { data, error } = await supabase
      .from('players')
      .select('id')
      .eq('nickname', trimmed)
      .maybeSingle();
    if (error) throw error;
    return !data;
  } catch (e) {
    console.warn('isNicknameAvailable hiba:', e);
    // Hálózati hiba esetén nem blokkoljuk a felhasználót — engedjük tovább,
    // a getOrCreatePlayerId majd lekezeli a tényleges ütközést.
    return true;
  }
}


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

import { Audio } from 'expo-av';
//import dinosaurs from './data/dinosaurs.json';
//import karpatDinosaurs from './data/karpatok.json';
import { useFonts } from 'expo-font';
import { Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';
import {
  NicknameScreen,
  PackagesScreen,
  PackageBrowseScreen,
  PackageQuizScreen,
  loadNickname,
  saveNickname,
  useKarpatData,
} from './Level1Karpat';
import {
  loadProgress,
  saveProgress,
  recordPackQuizResult,
  isPackUnlocked,
  isRegionUnlocked,
  REGION_TO_EDU,
  EDU_LABELS,
} from './regionProgress';
import {
  EuropaPackagesScreen,
  EuropaPackageBrowseScreen,
  EuropaPackageQuizScreen,
  useEuropaData,
} from './Level2Europa';
import {
  AfrikaPackagesScreen,
  AfrikaPackageBrowseScreen,
  AfrikaPackageQuizScreen,
  useAfrikaData,
} from './Level3Afrika';
import {
  AsiaPackagesScreen,
  AsiaPackageBrowseScreen,
  AsiaPackageQuizScreen,
  useAsiaData,
} from './Level4Asia';
import DinoCard from './DinoCard';

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
  bg: '#283618',
  card: 'rgba(254,250,224,0.05)',
  cardSolid: '#606C38',
  border: 'rgba(254,250,224,0.14)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(254,250,224,0.62)',
  textMuted: 'rgba(254,250,224,0.38)',
  green: '#8DA34D',
  greenLight: 'rgba(141,163,77,0.45)',
  greenBg: 'rgba(141,163,77,0.14)',
  blue: '#9C8B6B',
  blueBg: 'rgba(156,139,107,0.14)',
  blueLight: 'rgba(156,139,107,0.45)',
  coral: '#BC6C25',
  coralBg: 'rgba(188,108,37,0.14)',
  coralLight: 'rgba(188,108,37,0.45)',
  amber: '#DDA15E',
  amberBg: 'rgba(221,161,94,0.14)',
  amberLight: 'rgba(221,161,94,0.45)',
  quizBg: '#283618',
  quizGold: '#DDA15E',
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

// Mivel a karpatok.json új struktúrája már eleve előre feldolgozott, 
// lapos tömbként érkezik, közvetlenül hozzárendelhetjük a listához.
//const karpatDinoList = karpatDinosaurs;

// // --- MODERN GENERÁLT DÍNÓTUDÓS LOGÓ ---
// function DinoTudosLogo() {
//   return (
//     <View style={styles.logoImageContainer}>
//       <Text style={styles.logoSubBadge}>PALEONTOLÓGIA</Text>
//       <View style={styles.logoTextWrapper}>
//         <Text style={styles.logoMainText3D}>DÍNÓTUDÓS</Text>
//         <Text style={styles.logoMainText}>DÍNÓTUDÓS</Text>
//       </View>
//       <Text style={styles.logoSubtitleText}>KÁRTYÁK & KVÍZJÁTÉK</Text>
//       <View style={styles.logoBottomLine} />
//     </View>
//   );
// }

// --- LANDING PAGE ---
// Átlátszó gomb, amelynek a kerete körül egy fénypont (lézer) fut körbe végtelenítve.
function LaserBorderButton({ style, onPress, color = '#7CFC9A', duration = 2800, children, borderRadius = 14 }) {
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
  const trackRadius = borderRadius;
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
      <View pointerEvents="none" style={[styles.laserBorderTrack, { borderColor: `${color}33`, borderRadius: trackRadius }]} />
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

// Az új landing háttér (landing_menu_bg.png) eredeti mérete - ehhez igazítjuk a "színpadot",
// hogy a sávok és a gombok mindig pontosan ugyanott legyenek, eszköztől függetlenül.
const LP_BG_RATIO = 768 / 1376; // szélesség / magasság

// Az 5 régió-sáv függőlegesen egyenletesen van elosztva a képen (mindegyik 20%-nyi magas),
// a nyílgomb mindegyik sáv jobb szélén, középen ül.
const LANDING_NAV_BUTTONS = [
  { key: 'karpat', label: 'Kárpátok', centerY: 10, color: '#c7d39a' },
  { key: 'europa', label: 'Európa', centerY: 30, color: '#9fd17a' },
  { key: 'afrika', label: 'Afrika', centerY: 50, color: '#3a3424' },
  { key: 'azsia', label: 'Ázsia', centerY: 70, color: '#fff1d6' },
  { key: 'amerika', label: 'Amerika', centerY: 90, color: '#ffe0b0' },
];

function LandingPage({ onNavigate, onSelectRegion, onEnterKarpat, onEnterRegion }) {
  const [containerWidth, setContainerWidth] = useState(0);
 
  // Csak a szélesség alapján méretezünk — a magasság a böngésző ablakánál
  // nagyobb is lehet, ilyenkor a ScrollView gondoskodik a függőleges
  // görgetésről. Így böngészőben (Shell.shellInnerWide -> max 720px) az
  // 5 régió-sáv szépen kitölti a teljes elérhető szélességet, telefonon
  // pedig a natív (szűkebb) konténer-szélességhez igazodik.
  const stageWidth = containerWidth;
  const stageHeight = containerWidth / LP_BG_RATIO;
 
  const handlePress = (key) => {
    playSound('click');
    if (key === 'europa') { onEnterRegion('europa'); }
    else if (key === 'karpat') { onEnterKarpat(); }
    else if (key === 'afrika') { onEnterRegion('afrika'); }
    else if (key === 'azsia') { onEnterRegion('asia'); }
    // amerika: hamarosan érkezik, jelenleg nincs célnézet
  };
 
  return (
    <Shell>
    <View style={styles.landingContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a06" />
 
      <ScrollView
  style={{ flex: 1, width: '100%' }}
  contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
  showsVerticalScrollIndicator={false}
>

        <View
          style={{ width: '100%' }}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
          {stageWidth > 0 && (
            <View style={[styles.landingStage, { width: stageWidth, height: stageHeight, alignSelf: 'center' }]}>
              <Image
                source={require('./assets/images/landing_menu_bg.png')}
                style={styles.absoluteBackground}
                resizeMode="stretch"
              />
 
              {/* 5 nyílgomb a sávok jobb szélén, függőlegesen középre a saját sávjukban */}
              {LANDING_NAV_BUTTONS.map((btn) => (
                <LaserBorderButton
                  key={btn.key}
                  style={{
                    position: 'absolute',
                    right: '4%',
                    top: `${btn.centerY}%`,
                    width: 56,
                    height: 56,
                    marginTop: -28,
                    borderRadius: 28,
                    backgroundColor: 'rgba(10,10,8,0.35)',
                  }}
                  color={btn.color}
                  borderRadius={28}
                  onPress={() => handlePress(btn.key)}
                >
                  <View style={styles.navArrowWrap} pointerEvents="none">
                    <Text style={styles.navArrowText}>›</Text>
                  </View>
                </LaserBorderButton>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
 
      <MuteButton />
    </View>
    </Shell>
  );
}

// --- FŐ ALKALMAZÁS ---
export default function App() {
  const [fontsLoaded] = useFonts({
    Cinzel: Cinzel_700Bold,
    Roboto: Roboto_400Regular,
    Roboto_700Bold,
  });

  const [view, setView] = useState('landing');
  const [region, setRegion] = useState('europa');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('Mind');

  // --- 1. SZINT (Kárpát-medence) csomagrendszer + becenév-mentés ---
  const [nickname, setNickname] = useState(null);
  const [progress, setProgress] = useState(null);
  const [activePackage, setActivePackage] = useState(null);
  const [quizKey, setQuizKey] = useState(0);

  // A 3 induló régió (Kárpát-medence, Európa, Afrika) saját Packages/Browse/Quiz
  // komponensekkel rendelkezik (más-más Supabase-régiókulcs, más-más képmappa),
  // de a 'view' state ugyanazt a 3 nevet használja mindháromnál — itt választjuk
  // ki a megfelelőt. A dínó-adatokat a *_useData hookok töltik be Supabase-ből
  // (region-specifikusan, cache-elve), csak akkor, ha az adott régió aktív.
  // FONTOS: ezeknek a hookoknak feltétel nélkül, minden render alkalmával,
  // a komponens legelején kell futniuk (React hooks-szabály) — ezért vannak
  // itt, minden korai `return` ELŐTT, nem pedig a routing-blokk közelében.
  const isRegionViewActive = ['packages', 'packageBrowse', 'packageQuiz'].includes(view);
  const karpatData = useKarpatData(isRegionViewActive && region === 'karpat');
  const europaData = useEuropaData(isRegionViewActive && region === 'europa');
  const afrikaData = useAfrikaData(isRegionViewActive && region === 'afrika');
  const asiaData = useAsiaData(isRegionViewActive && region === 'asia');

  const REGION_SCREENS = {
    karpat: {
      Packages: PackagesScreen,
      Browse: PackageBrowseScreen,
      Quiz: PackageQuizScreen,
      data: karpatData,
    },
    europa: {
      Packages: EuropaPackagesScreen,
      Browse: EuropaPackageBrowseScreen,
      Quiz: EuropaPackageQuizScreen,
      data: europaData,
    },
    afrika: {
      Packages: AfrikaPackagesScreen,
      Browse: AfrikaPackageBrowseScreen,
      Quiz: AfrikaPackageQuizScreen,
      data: afrikaData,
    },
    asia: {
      Packages: AsiaPackagesScreen,
      Browse: AsiaPackageBrowseScreen,
      Quiz: AsiaPackageQuizScreen,
      data: asiaData,
    },
  };
  const screens = REGION_SCREENS[region] || REGION_SCREENS.karpat;
  const {
    packages: regionPackages,
    creatures: regionCreatures,
    loading: regionLoading,
    error: regionError,
  } = screens.data;

  useEffect(() => {
    (async () => {
      const stored = await loadNickname();
      if (stored) {
        setNickname(stored);
        setProgress(await loadProgress(stored));
      }
    })();
  }, []);

  // Mindhárom induló régió (Kárpát-medence, Európa, Afrika) ugyanígy indítható:
  // a régió kiválasztása után egyenesen a csomagválasztóra ugrunk (vagy a
  // becenév-képernyőre, ha még nincs elmentve nickname). Az 1. csomag mindhárom
  // induló régiónál mindig nyitva van — lásd regionProgress.js STARTER_REGIONS.
  const handleEnterRegion = (regionId) => {
    setRegion(regionId);
    setView(nickname ? 'packages' : 'nickname');
  };

  // Visszafelé kompatibilis alias, ha a LandingPage még a régi nevet hívja.
  const handleEnterKarpat = () => handleEnterRegion('karpat');

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

  // Háttér főtéma: mindenhol szól hurkolva (a kvíz immár önálló appban él, nem itt).
  useEffect(() => {
    playQuizBgMusic('mainTheme', { loop: true, volume: 0.4 });
  }, []);

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

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      </View>
    );
  }

  if (view === 'landing') {
    return (
      <LandingPage
        onNavigate={setView}
        onSelectRegion={setRegion}
        onEnterKarpat={handleEnterKarpat}
        onEnterRegion={handleEnterRegion}
      />
    );
  }

  if (view === 'nickname') {
    return (
      <NicknameScreen
        onSubmit={async (name) => {
          await saveNickname(name);
          setNickname(name);
          setProgress(await loadProgress(name));
          setView('packages');
        }}
      />
    );
  }

  // Egyszerű betöltő/hiba képernyő, amíg a Supabase-fetch lefut (cache-ből
  // a következő alkalommal már azonnali lesz).
  if (isRegionViewActive && regionLoading) {
    return (
      <Shell>
        <View style={[styles.quizContainer, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#FEFAE0', fontSize: 16 }}>Dínók betöltése…</Text>
        </View>
      </Shell>
    );
  }

  if (isRegionViewActive && regionError) {
    return (
      <Shell>
        <View style={[styles.quizContainer, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
          <Text style={{ color: '#FEFAE0', fontSize: 16, marginBottom: 16, textAlign: 'center' }}>
            Nem sikerült betölteni az adatokat. Ellenőrizd az internetkapcsolatot.
          </Text>
          <TouchableOpacity onPress={() => setView('landing')} style={styles.quizBackLink}>
            <Text style={{ color: COLORS.quizGold, fontSize: 14, fontWeight: '600' }}>← Vissza</Text>
          </TouchableOpacity>
        </View>
      </Shell>
    );
  }

  if (view === 'packages') {
    const Packages = screens.Packages;
    return (
      <Packages
        progress={progress}
        packages={regionPackages}
        onOpenPackage={(csomag) => { setActivePackage(csomag); setView('packageBrowse'); }}
        onBack={() => setView('landing')}
      />
    );
  }

  if (view === 'packageBrowse') {
    const Browse = screens.Browse;
    return (
      <Browse
        csomag={activePackage}
        packages={regionPackages}
        onStartQuiz={(csomag) => { setActivePackage(csomag); setQuizKey((k) => k + 1); setView('packageQuiz'); }}
        onBack={() => setView('packages')}
      />
    );
  }

  if (view === 'packageQuiz') {
    const Quiz = screens.Quiz;
    return (
      <Quiz
        key={quizKey}
        csomag={activePackage}
        packages={regionPackages}
        creatures={regionCreatures}
       onPassed={async (csomag, packNumber, scoreRatio = 1) => {
     const next = await recordPackQuizResult(nickname, REGION_TO_EDU[region], packNumber, scoreRatio);
      setProgress(next);
     setView('packages');
    }}
        onRetry={() => setQuizKey((k) => k + 1)}
        onBack={() => setView('packages')}
      />
    );
  }

  // A "Legyen Ön is Milliomos" kvíz már önálló appként fut, ide nincs többé bekötve.
  if (view === 'leaderboard') {
    return (
      <Shell>
      <View style={[styles.quizContainer, { padding: 24, justifyContent: 'center', alignItems: 'center' }]}>
        <MuteButton />
        <Text style={{ fontSize: 32, marginBottom: 12 }}>🏆</Text>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 24 }}>Ranglista (Top 10)</Text>
        <Text style={{ color: 'rgba(254,250,224,0.5)', marginBottom: 40, textAlign: 'center' }}>Nincs még mentett helyi eredmény.</Text>
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
            <DinoCard dino={dino} imageSource={IMAGE_MAP[dino.nev_tudomanyos]} showTimeline={true} />
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
  // ... (a többi stílus változatlan marad)

  scientificName: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: COLORS.textPrimary, 
    fontStyle: 'italic',
    fontFamily: 'Cinzel', // ← A dínó tudományos neve Cinzel betűtípust kap
  },

  // Minden más általános szöveges elemhez add hozzá a Roboto betűtípust:
  bodyText: { 
    fontSize: 12, 
    color: COLORS.textPrimary, 
    marginTop: 2, 
    lineHeight: 16,
    fontFamily: 'Roboto', // ← Általános leírások
  },
  commonName: { 
    fontSize: 12, 
    color: COLORS.textSecondary, 
    marginTop: 2, 
    fontWeight: '500',
    fontFamily: 'Roboto', // ← Köznyelvi név
  },
  infoTextItem: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: COLORS.textSecondary,
    fontFamily: 'Roboto', // ← Kártya infós sáv szövegei
  },
  sectionLabel: { 
    fontSize: 10, 
    fontWeight: '700', 
    color: COLORS.textMuted, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5, 
    marginTop: 8,
    fontFamily: 'Roboto', // ← Szekciócímkék
  },
  shellOuter: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
    backgroundColor: '#283618',
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
    backgroundColor: 'rgba(254,250,224,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.06)',
    borderStyle: 'dashed',
    margin: 12,
    borderRadius: 8,
  },
  adSlotLabel: { color: 'rgba(254,250,224,0.25)', fontSize: 11, fontWeight: '700', textAlign: 'center', letterSpacing: 1 },
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
    backgroundColor: 'rgba(254,250,224,0.06)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  navButtonText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
  
  card: { flex: 1, width: '100%', backgroundColor: COLORS.cardSolid, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6 },
  cardImageArea: { width: '100%', aspectRatio: 16 / 9, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', backgroundColor: 'rgba(254,250,224,0.03)' },
  cardImageAreaWide: {},
  dinoImage: { width: '100%', height: '100%' },
  fallbackEmoji: { fontSize: 64 },
  cornerBadge: {
    position: 'absolute',
    backgroundColor: 'rgba(2,0,36,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.12)',
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
  infoTextItem: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, fontFamily: 'Roboto' },
  cardBody: { padding: 16 },
  divider: { height: 0.5, backgroundColor: COLORS.border, marginVertical: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timelineWrap: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4, backgroundColor: '#0d1127' },
  statBox: { width: '48%', backgroundColor: 'rgba(254,250,224,0.04)', borderRadius: 10, padding: 8, borderWidth: 0.5, borderColor: COLORS.border },
  statLabel: { fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },
  highlight: { color: COLORS.amber, fontWeight: '500' },

  searchInput: { backgroundColor: 'rgba(254,250,224,0.06)', borderWidth: 0.5, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, fontSize: 12, color: COLORS.textPrimary, marginBottom: 8 },
  filterRow: { flexDirection: 'row', gap: 6 },
  filterTab: { flex: 1, paddingVertical: 5, borderRadius: 6, borderWidth: 0.5, borderColor: COLORS.border, backgroundColor: 'rgba(254,250,224,0.05)', alignItems: 'center' },
  filterTabActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  filterTabText: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary },
  filterTabTextActive: { color: '#fff' },
  
  emptyCard: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(254,250,224,0.03)', borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 6 },
  emptyDesc: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },

  quizContainer: { flex: 1, backgroundColor: COLORS.quizBg, paddingHorizontal: 16, justifyContent: 'center' },
  quizGameOverEmoji: { fontSize: 64, textAlign: 'center', marginBottom: 16 },
  quizGameOverTitle: { fontSize: 24, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: 1 },
  quizGameOverDesc: { fontSize: 14, color: 'rgba(254,250,224,0.6)', textAlign: 'center', marginTop: 8, paddingHorizontal: 24, lineHeight: 20 },
  prizeBox: { backgroundColor: 'rgba(254,250,224,0.04)', borderRadius: 12, padding: 16, marginVertical: 24, alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(254,250,224,0.08)' },
  prizeLabel: { fontSize: 11, color: 'rgba(254,250,224,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  prizeValue: { fontSize: 28, fontWeight: '900', color: '#fff', marginTop: 4 },
  quizActionBtn: { height: 48, borderRadius: 24, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginHorizontal: 24 },
  quizActionBtnText: { fontSize: 14, fontWeight: 'bold' },
  quizBackLink: { marginTop: 24, alignItems: 'center' },
  quizHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quizLogoBanner: { width: '100%', height: 150, borderRadius: 10, marginBottom: 4 },
  quizBackBtn: { paddingVertical: 6 },
  quizTitle: { fontSize: 14, fontWeight: '900', color: COLORS.quizGold, letterSpacing: 1 },
  quizQuestionBadge: { backgroundColor: 'rgba(214,175,55,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 0.5, borderColor: COLORS.quizGold },
  quizBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.quizGold },
  quizStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 14, backgroundColor: 'rgba(254,250,224,0.02)', padding: 10, borderRadius: 12 },
  quizMoneyWonLabel: { fontSize: 10, color: 'rgba(254,250,224,0.4)' },
  quizMoneyWonValue: { fontSize: 18, fontWeight: '900', color: '#fff', marginTop: 2 },
  lifelinesContainer: { flexDirection: 'row', gap: 8 },
  adLifelineBtn: {
    backgroundColor: 'rgba(221,161,94,0.12)',
    borderWidth: 1,
    borderColor: '#DDA15E',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  adLifelineBtnDisabled: { opacity: 0.5 },
  adLifelineBtnText: { color: '#DDA15E', fontSize: 12, fontWeight: '700' },
  lifelineCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(254,250,224,0.07)', justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(254,250,224,0.2)' },
  lifelineCircleDisabled: { opacity: 0.3 },
  lifelineText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  lifelineResultBox: { backgroundColor: 'rgba(254,250,224,0.05)', padding: 12, borderRadius: 12, marginBottom: 14, borderWidth: 0.5, borderColor: 'rgba(254,250,224,0.1)' },
  phoneHintText: { color: '#fff', fontSize: 12, lineHeight: 16 },
  audienceHintTitle: { color: COLORS.quizGold, fontSize: 11, fontWeight: '700', marginBottom: 8 },
  audienceGraphRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 60, paddingTop: 10 },
  audienceGraphBarCol: { alignItems: 'center', width: 40 },
  audiencePctText: { color: '#fff', fontSize: 9, marginBottom: 4 },
  audienceBar: { width: 14, backgroundColor: COLORS.quizGold, borderRadius: 2 },
  audienceLabelText: { color: 'rgba(254,250,224,0.4)', fontSize: 10, marginTop: 4, fontWeight: 'bold' },
  quizQuestionBox: { backgroundColor: 'rgba(254,250,224,0.03)', borderLeftWidth: 3, borderLeftColor: COLORS.quizGold, padding: 16, borderRadius: 8, marginVertical: 10 },
  quizQuestionText: { color: '#fff', fontSize: 15, fontWeight: '600', lineHeight: 22 },
  optionsList: { gap: 9, marginVertical: 10 },
  optionBtn: { backgroundColor: 'rgba(254,250,224,0.04)', borderWidth: 1, borderColor: 'rgba(254,250,224,0.15)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  optionBtnText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  optionBtnEliminated: { opacity: 0.0, backgroundColor: 'transparent', borderColor: 'transparent' },
  optionBtnTextEliminated: { color: 'transparent' },
  optionBtnSelected: { backgroundColor: 'rgba(214,175,55,0.15)', borderColor: COLORS.quizGold },
  optionBtnTextSelected: { color: COLORS.quizGold, fontWeight: '700' },
  optionBtnCorrect: { backgroundColor: '#1e4611', borderColor: '#4ea824' },
  optionBtnIncorrect: { backgroundColor: '#5c1919', borderColor: '#bd2828' },
  optionBtnTextRevealed: { color: '#fff', fontWeight: '700' },
  quizFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  quizGuaranteedLabel: { fontSize: 10, color: 'rgba(254,250,224,0.4)' },
  quizGuaranteedValue: { fontSize: 13, fontWeight: '700', color: 'rgba(254,250,224,0.8)', marginTop: 2 },
  walkAwayBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8, backgroundColor: 'rgba(254,250,224,0.05)', borderWidth: 0.5, borderColor: 'rgba(254,250,224,0.15)' },
  walkAwayBtnDisabled: { opacity: 0.3 },
  walkAwayBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  logoImageContainer: { position: 'absolute', top: 40, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
  logoTextWrapper: { position: 'relative', width: '100%', alignItems: 'center', justifyContent: 'center', height: 60 },
  logoMainText: { fontSize: 38, fontWeight: '900', color: '#FFFFFF', letterSpacing: 3, textShadowColor: '#000000', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3, position: 'absolute' },
  logoMainText3D: { fontSize: 38, fontWeight: '900', color: '#639922', letterSpacing: 3, position: 'absolute', top: 3, left: 2, opacity: 0.9 },
  logoSubBadge: { backgroundColor: 'rgba(141,163,77,0.22)', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 20, fontSize: 10, fontWeight: '800', color: '#8DA34D', letterSpacing: 4, marginBottom: 2, borderWidth: 1, borderColor: 'rgba(141,163,77,0.3)' },
  logoSubtitleText: { fontSize: 12, fontWeight: '700', color: '#E4E4DB', letterSpacing: 5, marginTop: 4, textTransform: 'uppercase', opacity: 0.8 },
  logoBottomLine: { width: 50, height: 3, backgroundColor: '#639922', borderRadius: 2, marginTop: 10 },

  /* --- Új, teljes képernyős Landing Page stílusok --- */
  landingContainer: { flex: 1, backgroundColor: '#0a0a06', position: 'relative', justifyContent: 'center', alignItems: 'center' },
  landingStage: { position: 'relative', overflow: 'hidden' },
  absoluteBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  heroTint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,6,2,0.15)' },
  navArrowWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navArrowText: { fontSize: 30, fontWeight: '700', color: '#fff', marginTop: -3 },
  quizCornerBtn: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(10,10,8,0.45)',
  },
  quizCornerInner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 6 },
  quizCornerIcon: { width: '100%', height: '100%' },
  diagonalCut: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, backgroundColor: '#0a0a06', transform: [{ skewY: '-2.5deg' }], marginBottom: -15, opacity: 0.3 },
  
  bottomThirdContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '36%', paddingHorizontal: 16, paddingBottom: 24, justifyContent: 'flex-end' },
  /* -------------------------------------------------- */

  bigBtnEu: { backgroundColor: '#223d10', borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, position: 'relative', borderWidth: 1, borderColor: 'rgba(141,163,77,0.2)' },
  bigBtnKarpat: { backgroundColor: '#3a1212', borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, position: 'relative', borderWidth: 1, borderColor: 'rgba(205,42,62,0.25)' },
  btnShine: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(254,250,224,0.05)', borderRadius: 16 },
  btnEmoji: { fontSize: 28, width: 40, textAlign: 'center' },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', paddingHorizontal: 4 },
  btnIconImage: { width: 44, height: 44 },
  btnTextCol: { flex: 1, alignItems: 'flex-start' },
  btnName: { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: 0.3, textAlign: 'left' },
  btnSubGreen: { fontSize: 11, color: '#8DA34D', marginTop: 1, fontWeight: '600', textAlign: 'left' },
  btnSubRed: { fontSize: 11, color: '#BC6C25', marginTop: 1, fontWeight: '600', textAlign: 'left' },
  btnSubMuted: { fontSize: 11, color: 'rgba(254,250,224,0.35)', marginTop: 1, fontWeight: '500', textAlign: 'left' },
  btnBadge: { backgroundColor: '#639922', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  karpatBadge: { backgroundColor: '#cd2a3e', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  btnBadgeText: { fontSize: 8, color: '#fff', fontWeight: '800', letterSpacing: 0.5 },
  euStripe: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, backgroundColor: '#639922', borderRadius: 16 },
  karpatStripe: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, backgroundColor: '#cd2a3e', borderRadius: 16 },
  smallBtnRow: { flexDirection: 'row', gap: 12 },
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  gridBtn: { flex: 1, height: 75, borderRadius: 14, padding: 8, alignItems: 'center', justifyContent: 'center', gap: 2, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: 'rgba(254,250,224,0.04)' },
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
  smallRegionBtn: { flex: 1, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: 'rgba(254,250,224,0.04)' },
  quizSmallBtn: { backgroundColor: '#0f0b04', borderColor: '#DDA15E', borderWidth: 1 },
  extraDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 6, paddingHorizontal: 4 },
  extraLine: { flex: 1, height: 1, backgroundColor: '#1a1a15' },
  extraLabel: { fontSize: 9, color: '#44443c', letterSpacing: 3, fontWeight: '800' },

  muteButton: { position: 'absolute', top: 44, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 999, borderWidth: 0.5, borderColor: 'rgba(254,250,224,0.2)' },
  muteButtonText: { fontSize: 16 },
});