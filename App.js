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
import XPBar from './src/components/XPBar';
import { loadProgress, recordPackQuizResult } from './src/utils/regionProgress';
import { fetchCreaturesByEdu } from './src/services/creaturesService';

export default function App() {
  const [view, setView] = useState('checking');
  const [nickname, setNickname] = useState(null);
  const [eduLevel, setEduLevel] = useState(null);
  const [progress, setProgress] = useState({});
  const [regionDinos, setRegionDinos] = useState([]);
  const [allDinos, setAllDinos] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(NICKNAME_STORAGE_KEY).then((saved) => {
      if (saved) {
        setNickname(saved);
        loadProgress(saved).then(setProgress);
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

  const handleNicknameChosen = (chosenNickname) => {
    setNickname(chosenNickname);
    loadProgress(chosenNickname).then(setProgress);
    setView('landing');
  };

  const handleEnterRegion = (level) => {
    setEduLevel(level);
    setView('region');
  };

  const handleBackToMenu = () => {
    setView('landing');
    setEduLevel(null);
  };

  const handleStartLightningQuiz = () => {
    // Use preloaded creatures
    if (allDinos.length > 0) {
      setRegionDinos(allDinos);
    }
    setView('lightning');
  };

  const handleBackFromLightningQuiz = () => {
    setView('landing');
    setEduLevel(null);
    setRegionDinos([]);
  };

  const handleOpenGallery = () => {
    setView('collection');
  };

  const handleStartMillionaire = () => {
    setView('millionaire');
  };

  const handleStartMemory = () => {
    setView('memory');
  };

  const handleStartWhoAmI = () => {
    setView('whoami');
  };

  const handlePassed = async (csomag, packId, score) => {
    const updated = await recordPackQuizResult(nickname, eduLevel, csomag, score);
    setProgress(updated);
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      {view !== 'landing' && view !== 'checking' && view !== 'nicknamePicker' && <XPBar />}

      {view === 'nicknamePicker' && (
        <NicknamePickerScreen allDinos={allDinos} onNicknameChosen={handleNicknameChosen} />
      )}

      {view === 'landing' && (
        <LandingPage
          onEnterRegion={handleEnterRegion}
          onOpenGallery={handleOpenGallery}
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
        />
      )}

      {view === 'lightning' && (
        <VillamkvizScreen
          regionDinos={regionDinos}
          allDinos={allDinos}
          onBack={handleBackFromLightningQuiz}
        />
      )}

      {view === 'millionaire' && (
        <MillionaireQuizScreen onBack={() => setView('landing')} />
      )}

      {view === 'memory' && (
        <MemoryGameScreen nickname={nickname} onBack={() => setView('landing')} />
      )}

      {view === 'whoami' && (
        <WhoAmIScreen allDinos={allDinos} onBack={() => setView('landing')} />
      )}

      {view === 'collection' && (
        <CollectionScreen
          allDinos={allDinos}
          progress={progress}
          onBack={() => setView('landing')}
        />
      )}
    </View>
  );
}
