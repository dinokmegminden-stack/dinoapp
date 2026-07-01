import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  useWindowDimensions,
} from 'react-native';

import { Audio } from 'expo-av';
import { useFonts } from 'expo-font';
import { Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';

// --- ÚJ UNIVERZÁLIS COMPONENT IMPORTÁLÁSA ---
import RegionLevel from './RegionLevel'; 

// --- ALAPVETŐ SZOLGÁLTATÁSOK ---
import { NicknameScreen, loadNickname, saveNickname } from './Level1Karpat';
import { loadProgress, recordPackQuizResult, REGION_TO_EDU } from './regionProgress';
import DinoCard from './DinoCard';
import LandingPage from './LandingPage';
import AdSenseSlot, { AD_SLOT_LEFT, AD_SLOT_RIGHT } from './AdSenseSlot';

// --- AUDIO SYSTEM ---
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

const QUIZ_SOUND_FILES = {
  mainTheme: require('./assets/sounds/main_theme.mp3'),
};

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

// --- GLOBÁLIS INTERFÉSZ HÉJ ---
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

// --- NÉMÍTÁS MECHANIZMUS ---
let isSoundMuted = false;
function setSoundMuted(muted) {
  isSoundMuted = muted;
  if (bgMusicSound) {
    if (muted) bgMusicSound.pauseAsync().catch(() => {});
    else bgMusicSound.playAsync().catch(() => {});
  }
}

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

const COLORS = {
  bg: '#283618',
  border: 'rgba(254,250,224,0.14)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(254,250,224,0.62)',
  textMuted: 'rgba(254,250,224,0.38)',
  green: '#8DA34D',
  amber: '#DDA15E',
  quizBg: '#283618',
  quizGold: '#DDA15E',
};

// --- FŐ ALKALMAZÁS ---
export default function App() {
  const [fontsLoaded] = useFonts({
    Cinzel: Cinzel_700Bold,
    Roboto: Roboto_400Regular,
    Roboto_700Bold,
  });

  const [view, setView] = useState('landing');
  const [eduLevel, setEduLevel] = useState(1); // Eltároljuk az int típusú edu szintet (1-5)
  const [nickname, setNickname] = useState(null);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    (async () => {
      const stored = await loadNickname();
      if (stored) {
        setNickname(stored);
        setProgress(await loadProgress(stored));
      }
    })();
  }, []);

  // Elindítjuk a főtémát
  useEffect(() => {
    playQuizBgMusic('mainTheme', { loop: true, volume: 0.4 });
  }, []);

  // Amikor a LandingPage-en kiválasztanak egy régiót (1, 2, 3, 4 vagy 5 egész számmal érkezik)
  const handleEnterRegion = (selectedEduLevel) => {
    setEduLevel(selectedEduLevel);
    setView(nickname ? 'regionGame' : 'nickname');
  };

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      </View>
    );
  }

  // --- 1. LANDING MENÜ ---
  if (view === 'landing') {
    return (
      <LandingPage onEnterRegion={handleEnterRegion} />
    );
  }

  // --- 2. REGISZTRÁCIÓ / BECENÉV ---
  if (view === 'nickname') {
    return (
      <NicknameScreen
        onSubmit={async (name) => {
          await saveNickname(name);
          setNickname(name);
          setProgress(await loadProgress(name));
          setView('regionGame');
        }}
      />
    );
  }

  // --- 3. AZ ÚJ UNIVERZÁLIS JÁTÉKMENET (Ide fut be minden szint) ---
  if (view === 'regionGame') {
    // Visszafejtjük az eduLevel-hez tartozó string kulcsot a progress mentéshez
    const eduToRegionMapping = { 1: 'karpat', 2: 'europa', 3: 'afrika', 4: 'asia', 5: 'amerika' };
    const currentRegionString = eduToRegionMapping[eduLevel] || 'karpat';

    return (
      <RegionLevel
        eduLevel={eduLevel}
        progress={progress}
        onBack={() => setView('landing')}
        onPassed={async (csomag, packNumber, scoreRatio = 1) => {
          const next = await recordPackQuizResult(nickname, currentRegionString, packNumber, scoreRatio);
          setProgress(next);
        }}
      />
    );
  }

  return null;
}

// --- GLOBAL STYLES ---
const styles = StyleSheet.create({
  shellOuter: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
    backgroundColor: '#283618',
    alignItems: 'stretch',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  shellInner: { flex: 1, width: '100%', maxWidth: 480, minHeight: '100%' },
  shellInnerWide: { maxWidth: 720 },
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
  container: { flex: 1, backgroundColor: COLORS.bg },
  muteButton: { position: 'absolute', top: 44, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 999, borderWidth: 0.5, borderColor: 'rgba(254,250,224,0.2)' },
  muteButtonText: { fontSize: 16 },
});