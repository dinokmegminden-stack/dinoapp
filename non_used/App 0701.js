import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, Animated,
  Dimensions, StatusBar, TouchableOpacity,
  SafeAreaView, useWindowDimensions,
} from 'react-native';
import { useFonts } from 'expo-font';
import { Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';

// Saját modulok
import { playQuizBgMusic } from './src/audio/audioSystem';
import Shell from './src/components/Shell';
import MuteButton from './src/components/MuteButton';
import LandingPage from './src/screens/LandingPage';
import { COLORS } from './src/constants/colors';
import { IMAGE_MAP } from './src/constants/imageMap';

// Régió modulok
import {
  NicknameScreen, PackagesScreen, PackageBrowseScreen,
  PackageQuizScreen, loadNickname, saveNickname, useKarpatData,
} from './Level1Karpat';
import {
  EuropaPackagesScreen, EuropaPackageBrowseScreen,
  EuropaPackageQuizScreen, useEuropaData,
} from './Level2Europa';
import {
  AfrikaPackagesScreen, AfrikaPackageBrowseScreen,
  AfrikaPackageQuizScreen, useAfrikaData,
} from './Level3Afrika';
import {
  AsiaPackagesScreen, AsiaPackageBrowseScreen,
  AsiaPackageQuizScreen, useAsiaData,
} from './Level4Asia';

import {
  loadProgress, recordPackQuizResult, REGION_TO_EDU,
} from './regionProgress';
import { getCreaturesByEdu } from './services/creaturesService';
import DinoCard from './DinoCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const [nickname, setNickname] = useState(null);
  const [progress, setProgress] = useState(null);
  const [activePackage, setActivePackage] = useState(null);
  const [quizKey, setQuizKey] = useState(0);
  const [encyclopediaDinos, setEncyclopediaDinos] = useState([]);

  // Hooks – feltétel nélkül, mindig
  const isRegionViewActive = ['packages', 'packageBrowse', 'packageQuiz'].includes(view);
  const karpatData = useKarpatData(isRegionViewActive && region === 'karpat');
  const europaData = useEuropaData(isRegionViewActive && region === 'europa');
  const afrikaData = useAfrikaData(isRegionViewActive && region === 'afrika');
  const asiaData   = useAsiaData(isRegionViewActive && region === 'asia');

  const REGION_SCREENS = {
    karpat: { Packages: PackagesScreen,       Browse: PackageBrowseScreen,       Quiz: PackageQuizScreen,       data: karpatData },
    europa: { Packages: EuropaPackagesScreen,  Browse: EuropaPackageBrowseScreen,  Quiz: EuropaPackageQuizScreen,  data: europaData },
    afrika: { Packages: AfrikaPackagesScreen,  Browse: AfrikaPackageBrowseScreen,  Quiz: AfrikaPackageQuizScreen,  data: afrikaData },
    asia:   { Packages: AsiaPackagesScreen,    Browse: AsiaPackageBrowseScreen,    Quiz: AsiaPackageQuizScreen,    data: asiaData   },
  };
  const screens = REGION_SCREENS[region] || REGION_SCREENS.karpat;
  const { packages: regionPackages, creatures: regionCreatures, loading: regionLoading, error: regionError } = screens.data;

  useEffect(() => {
    (async () => {
      const stored = await loadNickname();
      if (stored) {
        setNickname(stored);
        setProgress(await loadProgress(stored));
      }
    })();
  }, []);

  useEffect(() => {
    playQuizBgMusic('mainTheme', { loop: true, volume: 0.4 });
  }, []);

  useEffect(() => {
    const eduLevel = REGION_TO_EDU[region];
    if (!eduLevel) return;
    getCreaturesByEdu(eduLevel)
      .then(({ data }) => setEncyclopediaDinos(data ?? []))
      .catch((e) => console.warn('Enciklopédia betöltési hiba:', e));
  }, [region]);

  const handleEnterRegion = (regionId) => {
    setRegion(regionId);
    setView(nickname ? 'packages' : 'nickname');
  };

  const position = useRef(new Animated.ValueXY()).current;

  const filteredDinosaurs = encyclopediaDinos.filter((dino) => {
    const matchesPeriod = selectedPeriod === 'Mind' || dino.korszak?.toLowerCase().includes(selectedPeriod.toLowerCase());
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || dino.nev_tudomanyos?.toLowerCase().includes(q) || dino.nev_koznapi?.toLowerCase().includes(q);
    return matchesPeriod && matchesSearch;
  });

  const swipeRef = useRef((dir) => {
    const toValue = dir === 'next' ? -SCREEN_WIDTH * 1.5 : SCREEN_WIDTH * 1.5;
    Animated.timing(position, { toValue: { x: toValue, y: 0 }, duration: 250, useNativeDriver: true }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex((prev) => {
        const nextIdx = dir === 'next' ? prev + 1 : prev - 1;
        if (nextIdx >= filteredDinosaurs.length) return 0;
        if (nextIdx < 0) return filteredDinosaurs.length - 1;
        return nextIdx;
      });
    });
  });

  // --- Renderelés ---

  if (!fontsLoaded) {
    return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><StatusBar barStyle="light-content" /></View>;
  }

  if (view === 'landing') {
    return (
      <LandingPage
        onEnterKarpat={() => handleEnterRegion('karpat')}
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

  // --- Enciklopédia / kártyalapozó ---
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, backgroundColor: COLORS.bg, borderBottomWidth: 0.5, borderColor: COLORS.border },
  headerSub: { fontSize: 10, color: COLORS.textSecondary, marginBottom: 6 },
  menuRow: { marginBottom: 8 },
  menuButton: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 2 },
  headerTitle: { fontSize: 13, fontWeight: '800', color: COLORS.green, letterSpacing: 0.5 },
  cardContainer: { flex: 1, padding: 14, justifyContent: 'center', alignItems: 'center' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 18, paddingTop: 4, gap: 10 },
  navButton: { flex: 1, backgroundColor: 'rgba(254,250,224,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  navButtonText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
  emptyCard: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(254,250,224,0.03)', borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 6 },
  emptyDesc: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
  quizContainer: { flex: 1, backgroundColor: COLORS.quizBg, paddingHorizontal: 16, justifyContent: 'center' },
  quizBackLink: { marginTop: 24, alignItems: 'center' },
});
