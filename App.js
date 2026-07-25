console.log("APP STARTED");

import { useEffect, useState } from 'react';
import { View, StatusBar } from 'react-native';
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
import { loadProgress, recordPackQuizResult, unlockAllProgress, saveProgress } from './src/utils/regionProgress';
import { fetchCreaturesByEdu } from './src/services/creaturesService';
import { getPlayerIdByNickname } from './src/services/playersService';
import { hasFullUnlock } from './src/services/unlockCodesService';
import { trackGameStart, trackGameComplete } from './src/services/gameEventsService';
import useAppFonts from './src/hooks/useAppFonts';

export default function App() {
  // Rokkitt + Inter központi betöltése — a család-nevek (theme FONTS) minden
  // képernyőn elérhetők, betöltésig a komponensek a rendszer-fontra esnek vissza.
  useAppFonts();
  const [view, setView] = useState('checking');
  const [nickname, setNickname] = useState(null);
  const [playerId, setPlayerId] = useState(null);
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
        setView('nicknamePicker');
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

  // Ha a játékos korábban beváltott egy "minden kártya nyitva" kódot, ez a
  // Supabase-oldali tény (unlock_codes.used_by_player_id) minden eszközön/
  // újratelepítés után is helyreállítja az állapotot — nem csak azon a
  // készüléken marad meg, ahol a beváltás történt.
  useEffect(() => {
    if (!playerId || !nickname) return;
    hasFullUnlock(playerId).then((unlocked) => {
      if (!unlocked) return;
      const full = unlockAllProgress();
      setProgress(full);
      saveProgress(nickname, full);
    });
  }, [playerId, nickname]);

  const handleNicknameChosen = (chosenNickname, chosenPlayerId) => {
    setNickname(chosenNickname);
    setPlayerId(chosenPlayerId);
    loadProgress(chosenNickname).then(setProgress);
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

  const handlePassed = async (csomag, packId, score) => {
    const updated = await recordPackQuizResult(nickname, eduLevel, csomag, score);
    setProgress(updated);
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      {/* A képernyő tetején nem jelenítünk meg XP-sávot (egy képernyőn/játéknál
          sem) — az XP-követés a háttérben (XPBar.js addXP/AsyncStorage) marad. */}

      {view === 'nicknamePicker' && (
        <NicknamePickerScreen allDinos={allDinos} onNicknameChosen={handleNicknameChosen} />
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
        />
      )}

      {view === 'gaming' && (
        <GamingScreen
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
        />
      )}

      {view === 'lightning' && (
        <VillamkvizScreen
          regionDinos={regionDinos}
          allDinos={allDinos}
          playerId={playerId}
          onBack={handleBackFromLightningQuiz}
        />
      )}

      {view === 'millionaire' && (
        <MillionaireQuizScreen playerId={playerId} onBack={handleBackFromGame} />
      )}

      {view === 'memory' && (
        <MemoryGameScreen nickname={nickname} playerId={playerId} onBack={handleBackFromGame} />
      )}

      {view === 'whoami' && (
        <WhoAmIScreen allDinos={allDinos} playerId={playerId} onBack={handleBackFromGame} />
      )}

      {view === 'runner' && (
        <RunnerGameScreen playerId={playerId} onBack={handleBackFromGame} />
      )}

      {view === 'hangman' && (
        <HangmanScreen allDinos={allDinos} onBack={handleBackFromGame} />
      )}

      {view === 'collection' && (
        <CollectionScreen
          allDinos={allDinos}
          progress={progress}
          onBack={() => setView('landing')}
        />
      )}

      {view === 'leaderboard' && (
        <LeaderboardScreen onBack={() => setView('landing')} />
      )}

      {view === 'news' && (
        <NewsScreen onBack={() => setView('landing')} />
      )}

      {view === 'dashboard' && (
        <PlayerDashboardScreen
          nickname={nickname}
          playerId={playerId}
          allDinos={allDinos}
          progress={progress}
          onUnlocked={setProgress}
          onBack={() => setView('landing')}
        />
      )}
    </View>
  );
}
