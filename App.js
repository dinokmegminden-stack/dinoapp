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
import CollectionScreen from './src/screens/CollectionScreen';
import XPBar, { setActivePlayerId } from './src/components/XPBar';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import { loadProgress, recordPackQuizResult } from './src/utils/regionProgress';
import { fetchCreaturesByEdu } from './src/services/creaturesService';
import { getPlayerIdByNickname } from './src/services/playersService';
import { trackGameStart, trackGameComplete } from './src/services/gameEventsService';

export default function App() {
  const [view, setView] = useState('checking');
  const [nickname, setNickname] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [eduLevel, setEduLevel] = useState(null);
  const [progress, setProgress] = useState({});
  const [regionDinos, setRegionDinos] = useState([]);
  const [allDinos, setAllDinos] = useState([]);
  const [activeGameEventId, setActiveGameEventId] = useState(null);
  const [hideXPBar, setHideXPBar] = useState(false);

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

    // Preload all creatures for lightning quiz
    const preloadCreatures = async () => {
      const all = [];
      for (let edu = 1; edu <= 6; edu++) {
        const dinos = await fetchCreaturesByEdu(edu);
        all.push(...dinos);
      }
      setAllDinos(all);
    };
    preloadCreatures().catch(console.warn);
  }, []);

  // Az XPBar.js addXP()-je (sok képernyőről hívva) nem kap playerId-t
  // paraméterként — ez az egyetlen hely, ahol a modul-szintű aktív
  // játékos-azonosítót frissítjük, amint ismertté válik (lásd XPBar.js).
  useEffect(() => {
    setActivePlayerId(playerId);
  }, [playerId]);

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

  const handleStartMillionaire = () => {
    startGame('millionaire', 'millionaire');
  };

  const handleStartMemory = () => {
    startGame('memory', 'memory');
  };

  const handleStartWhoAmI = () => {
    startGame('whoami', 'whoami');
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
      {view !== 'landing' && view !== 'checking' && view !== 'nicknamePicker' && !hideXPBar && <XPBar />}

      {view === 'nicknamePicker' && (
        <NicknamePickerScreen allDinos={allDinos} onNicknameChosen={handleNicknameChosen} />
      )}

      {view === 'landing' && (
        <LandingPage
          nickname={nickname}
          progress={progress}
          allDinos={allDinos}
          onEnterRegion={handleEnterRegion}
          onOpenGallery={handleOpenGallery}
          onOpenLeaderboard={handleOpenLeaderboard}
          onStartLightningQuiz={handleStartLightningQuiz}
          onStartMillionaire={handleStartMillionaire}
          onStartMemory={handleStartMemory}
          onStartWhoAmI={handleStartWhoAmI}
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
    </View>
  );
}
