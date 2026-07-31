console.log("APP STARTED");

import { useEffect, useRef, useState } from 'react';
import { View, StatusBar, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LandingPage from './src/screens/LandingPage';
import NicknamePickerScreen, { NICKNAME_STORAGE_KEY } from './src/screens/NicknamePickerScreen';
import RegionLevel from './src/screens/regionLevel/RegionLevel';
import VillamkvizScreen from './src/screens/VillamkvizScreen';
import MillionaireQuizScreen from './src/screens/MillionaireQuizScreen';
import WhoAmIScreen from './src/screens/WhoAmIScreen';
import MemoryGameScreen from './src/screens/MemoryGameScreen';
import RunnerGameScreen from './src/screens/RunnerGameScreen';
import HangmanScreen from './src/screens/HangmanScreen';
import CollectionScreen from './src/screens/CollectionScreen';
import GamingScreen from './src/screens/GamingScreen';
import PlayerDashboardScreen from './src/screens/PlayerDashboardScreen';
import XPBar, { setActivePlayerId } from './src/components/XPBar';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import NewsScreen from './src/screens/NewsScreen';
import KutatokScreen from './src/screens/KutatokScreen';
import { loadProgress, recordPackQuizResult, saveProgress, createEmptyProgress, applyPackQuizResult } from './src/utils/regionProgress';
import { setGuestMode } from './src/utils/guestMode';
import { fetchCreaturesByEdu } from './src/services/creaturesService';
import { getPlayerIdByNickname } from './src/services/playersService';
import { trackGameStart, trackGameComplete } from './src/services/gameEventsService';
import useAppFonts from './src/hooks/useAppFonts';

export default function App() {
  // Rokkitt + Inter központi betöltése — a család-nevek (theme FONTS) minden
  // képernyőn elérhetők, betöltésig a komponensek a rendszer-fontra esnek vissza.
  useAppFonts();
  const [view, setView] = useState('checking');
  const [nickname, setNickname] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [eduLevel, setEduLevel] = useState(null);
  const [progress, setProgress] = useState({});
  const [regionDinos, setRegionDinos] = useState([]);
  const [allDinos, setAllDinos] = useState([]);
  // A lény-előtöltés hálózati hibája korábban csak a konzolra ment, így a
  // felület örökre "betöltés" állapotban ragadt (üres allDinos, néma hiba).
  // Ezt az állapotot most felszínre hozzuk, és újrapróbálható.
  const [dinosError, setDinosError] = useState(false);
  const [dinosLoading, setDinosLoading] = useState(true);
  const [activeGameEventId, setActiveGameEventId] = useState(null);
  const [hideXPBar, setHideXPBar] = useState(false);

  // A navigáció (view/eduLevel) csak React state — nincs router, ezért a
  // böngésző Vissza gombja korábban nem az előző belső képernyőre vitt, hanem
  // rögtön elhagyta az oldalt (nem volt history-bejegyzés a nézetekhez). Ez a
  // két effect minden view/eduLevel váltásnál history.pushState-et hív (a
  // legelsőt replaceState-tel, hogy a "checking" kezdőállapot ne maradjon a
  // history-ban), a popstate-re pedig visszaállítja a korábbi nézetet —
  // csak weben van értelme, natívon nincs böngésző-history.
  const isRestoringHistoryRef = useRef(false);
  const historyInitRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (view === 'checking') return;
    if (isRestoringHistoryRef.current) {
      isRestoringHistoryRef.current = false;
      return;
    }
    const state = { view, eduLevel };
    if (!historyInitRef.current) {
      window.history.replaceState(state, '');
      historyInitRef.current = true;
    } else {
      window.history.pushState(state, '');
    }
  }, [view, eduLevel]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
    const onPopState = (e) => {
      isRestoringHistoryRef.current = true;
      setEduLevel(e.state?.eduLevel ?? null);
      setView(e.state?.view ?? 'landing');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Minden régió lényeit egyszer töltjük be (villámkvíz, napi dínó, régió-számok).
  const preloadCreatures = async () => {
    setDinosLoading(true);
    setDinosError(false);
    try {
      const all = [];
      for (let edu = 1; edu <= 6; edu++) {
        const dinos = await fetchCreaturesByEdu(edu);
        all.push(...dinos);
      }
      setAllDinos(all);
      return true;
    } catch (err) {
      console.warn('preloadCreatures failed:', err);
      setDinosError(true);
      return false;
    } finally {
      setDinosLoading(false);
    }
  };

  useEffect(() => {
    AsyncStorage.getItem(NICKNAME_STORAGE_KEY).then((saved) => {
      if (saved) {
        setNickname(saved);
        loadProgress(saved).then(setProgress);
        getPlayerIdByNickname(saved).then(setPlayerId);
        setView('landing');
      } else {
        // Első látogatáskor nem kérünk nevet — a NicknamePickerScreen csak
        // a header "Csatlakozz"/"Jelentkezz be" gombjára nyílik meg (view
        // 'join'/'login'). Addig vendégként nézi az oldalt.
        setIsGuest(true);
        setProgress(createEmptyProgress());
        setView('landing');
      }
    });

    preloadCreatures();
  }, []);

  // Az XPBar.js addXP()-je (sok képernyőről hívva) nem kap playerId-t
  // paraméterként — ez az egyetlen hely, ahol a modul-szintű aktív
  // játékos-azonosítót frissítjük, amint ismertté válik (lásd XPBar.js).
  useEffect(() => {
    setActivePlayerId(playerId);
  }, [playerId]);

  // A DinoCard-család (TradingCard/DailyDinoCard/CollectionScreen) modul-
  // szinten olvassa ezt, hogy ne kelljen minden képernyőn át propként vinni —
  // lásd guestMode.js.
  useEffect(() => {
    setGuestMode(isGuest);
  }, [isGuest]);

  const handleNicknameChosen = (chosenNickname, chosenPlayerId) => {
    setIsGuest(false);
    setNickname(chosenNickname);
    setPlayerId(chosenPlayerId);
    loadProgress(chosenNickname).then(setProgress);
    setView('landing');
  };

  // "Tovább regisztráció nélkül" — nincs nickname/playerId, a haladás csak a
  // React state-ben él (sosem kerül AsyncStorage-ba vagy Supabase-be), és a
  // DinoCard-család (guestMode.js) sosem mutat képet.
  const handleContinueAsGuest = () => {
    setIsGuest(true);
    setNickname(null);
    setPlayerId(null);
    setProgress(createEmptyProgress());
    setView('landing');
  };

  // Játékmód-indítás naplózása a game_events táblába — a visszaadott event id-t
  // eltároljuk, hogy a képernyőről kilépéskor (endActiveGame) le tudjuk zárni,
  // függetlenül attól, hogy a játékos végigjátszotta vagy félbehagyta.
  const startGame = (gameType, viewName) => {
    setView(viewName);
    trackGameStart({ playerId, gameType }).then(setActiveGameEventId);
  };

  const endActiveGame = () => {
    if (activeGameEventId) {
      trackGameComplete(activeGameEventId);
      setActiveGameEventId(null);
    }
  };

  const handleEnterRegion = (level) => {
    setEduLevel(level);
    setView('region');
  };

  const handleBackToMenu = () => {
    setView('landing');
    setEduLevel(null);
    setHideXPBar(false);
  };

  const handleNavigateFromRegion = (target) => {
    setEduLevel(null);
    setHideXPBar(false);
    setView(target);
  };

  const handleStartLightningQuiz = () => {
    // Use preloaded creatures
    if (allDinos.length > 0) {
      setRegionDinos(allDinos);
    }
    startGame('lightning', 'lightning');
  };

  const handleBackFromLightningQuiz = () => {
    endActiveGame();
    setView('landing');
    setEduLevel(null);
    setRegionDinos([]);
  };

  const handleOpenGallery = () => {
    setView('collection');
  };

  const handleOpenLeaderboard = () => {
    setView('leaderboard');
  };

  const handleOpenDashboard = () => {
    setView('dashboard');
  };

  const handleOpenGaming = () => {
    setView('gaming');
  };

  const handleOpenNews = () => {
    setView('news');
  };

  const handleOpenKutatok = () => {
    setView('kutatok');
  };

  const handleStartMillionaire = () => {
    startGame('millionaire', 'millionaire');
  };

  const handleStartMemory = () => {
    startGame('memory', 'memory');
  };

  const handleStartWhoAmI = () => {
    startGame('whoami', 'whoami');
  };

  const handleStartRunner = () => {
    startGame('runner', 'runner');
  };

  const handleStartHangman = () => {
    startGame('hangman', 'hangman');
  };

  const handleBackFromGame = () => {
    endActiveGame();
    setView('landing');
  };

  const handleNavigateFromGame = (target) => {
    endActiveGame();
    setView(target);
  };

  const handlePassed = async (csomag, packId, score) => {
    if (isGuest) {
      // Vendég módban nincs nickname, amihez menteni lehetne — a haladás csak
      // az aktuális munkamenetben, memóriában él, sosem íródik AsyncStorage-ba.
      setProgress((prev) => applyPackQuizResult({ ...prev }, eduLevel, csomag, score));
      return;
    }
    const updated = await recordPackQuizResult(nickname, eduLevel, csomag, score);
    setProgress(updated);
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      {/* A képernyő tetején nem jelenítünk meg XP-sávot (egy képernyőn/játéknál
          sem) — az XP-követés a háttérben (XPBar.js addXP/AsyncStorage) marad. */}

      {view === 'nicknamePicker' && (
        <NicknamePickerScreen allDinos={allDinos} onNicknameChosen={handleNicknameChosen} onGuestContinue={handleContinueAsGuest} />
      )}

      {view === 'join' && (
        <NicknamePickerScreen allDinos={allDinos} onNicknameChosen={handleNicknameChosen} onGuestContinue={handleContinueAsGuest} initialMode="new" />
      )}

      {view === 'login' && (
        <NicknamePickerScreen allDinos={allDinos} onNicknameChosen={handleNicknameChosen} onGuestContinue={handleContinueAsGuest} initialMode="resume" />
      )}

      {view === 'landing' && (
        <LandingPage
          nickname={nickname}
          playerId={playerId}
          progress={progress}
          allDinos={allDinos}
          dinosError={dinosError}
          dinosLoading={dinosLoading}
          onRetryLoadDinos={preloadCreatures}
          onEnterRegion={handleEnterRegion}
          onOpenGallery={handleOpenGallery}
          onOpenLeaderboard={handleOpenLeaderboard}
          onOpenDashboard={handleOpenDashboard}
          onOpenGaming={handleOpenGaming}
          onOpenNews={handleOpenNews}
          onOpenKutatok={handleOpenKutatok}
          onRequireRegister={() => setView('nicknamePicker')}
          onOpenJoin={() => setView('join')}
          onOpenLogin={() => setView('login')}
        />
      )}

      {view === 'gaming' && (
        <GamingScreen
          nickname={nickname}
          playerId={playerId}
          progress={progress}
          onNavigate={(target) => setView(target)}
          onLightningQuiz={handleStartLightningQuiz}
          onMillionaire={handleStartMillionaire}
          onMemory={handleStartMemory}
          onWhoAmI={handleStartWhoAmI}
          onRunner={handleStartRunner}
          onHangman={handleStartHangman}
          onBack={() => setView('landing')}
        />
      )}

      {view === 'region' && eduLevel != null && (
        <RegionLevel
          eduLevel={eduLevel}
          onBack={handleBackToMenu}
          progress={progress}
          onPassed={handlePassed}
          onStartLightningQuiz={handleStartLightningQuiz}
          onBrowsingChange={setHideXPBar}
          playerId={playerId}
          nickname={nickname}
          onNavigate={handleNavigateFromRegion}
        />
      )}

      {view === 'lightning' && (
        <VillamkvizScreen
          regionDinos={regionDinos}
          allDinos={allDinos}
          playerId={playerId}
          nickname={nickname}
          progress={progress}
          onNavigate={handleNavigateFromGame}
          onBack={handleBackFromLightningQuiz}
        />
      )}

      {view === 'millionaire' && (
        <MillionaireQuizScreen
          playerId={playerId}
          nickname={nickname}
          progress={progress}
          onNavigate={handleNavigateFromGame}
          onBack={handleBackFromGame}
        />
      )}

      {view === 'memory' && (
        <MemoryGameScreen
          nickname={nickname}
          playerId={playerId}
          progress={progress}
          onNavigate={handleNavigateFromGame}
          onBack={handleBackFromGame}
        />
      )}

      {view === 'whoami' && (
        <WhoAmIScreen
          allDinos={allDinos}
          playerId={playerId}
          nickname={nickname}
          progress={progress}
          onNavigate={handleNavigateFromGame}
          onBack={handleBackFromGame}
        />
      )}

      {view === 'runner' && (
        <RunnerGameScreen
          playerId={playerId}
          nickname={nickname}
          progress={progress}
          onNavigate={handleNavigateFromGame}
          onBack={handleBackFromGame}
        />
      )}

      {view === 'hangman' && (
        <HangmanScreen
          allDinos={allDinos}
          nickname={nickname}
          progress={progress}
          onNavigate={handleNavigateFromGame}
          onBack={handleBackFromGame}
        />
      )}

      {view === 'collection' && (
        <CollectionScreen
          nickname={nickname}
          allDinos={allDinos}
          progress={progress}
          onNavigate={(target) => setView(target)}
          onBack={() => setView('landing')}
        />
      )}

      {view === 'leaderboard' && (
        <LeaderboardScreen
          nickname={nickname}
          progress={progress}
          onNavigate={(target) => setView(target)}
          onBack={() => setView('landing')}
        />
      )}

      {view === 'news' && (
        <NewsScreen
          nickname={nickname}
          progress={progress}
          onNavigate={(target) => setView(target)}
          onBack={() => setView('landing')}
        />
      )}

      {view === 'kutatok' && (
        <KutatokScreen
          nickname={nickname}
          progress={progress}
          onNavigate={(target) => setView(target)}
          onBack={() => setView('landing')}
        />
      )}

      {view === 'dashboard' && (
        <PlayerDashboardScreen
          nickname={nickname}
          playerId={playerId}
          allDinos={allDinos}
          progress={progress}
          onNavigate={(target) => setView(target)}
          onBack={() => setView('landing')}
        />
      )}
    </View>
  );
}
