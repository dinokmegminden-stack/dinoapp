console.log("APP STARTED");

import { useEffect, useState } from 'react';
import { View, StatusBar } from 'react-native';

import LandingPage from './src/screens/LandingPage';
import RegionLevel from './src/screens/regionLevel/RegionLevel';
import VillamkvizScreen from './src/screens/VillamkvizScreen';
import MillionaireQuizScreen from './src/screens/MillionaireQuizScreen';
import MemoryGameScreen from './src/screens/MemoryGameScreen';
import CollectionScreen from './src/screens/CollectionScreen';
import XPBar from './src/components/XPBar';
import { loadProgress, recordPackQuizResult } from './src/utils/regionProgress';
import { fetchCreaturesByEdu } from './src/services/creaturesService';

const PLAYER_NICKNAME = 'player_default';

export default function App() {
  const [view, setView] = useState('landing');
  const [eduLevel, setEduLevel] = useState(null);
  const [progress, setProgress] = useState({});
  const [regionDinos, setRegionDinos] = useState([]);
  const [allDinos, setAllDinos] = useState([]);

  useEffect(() => {
    loadProgress(PLAYER_NICKNAME).then(setProgress);
    // Preload all creatures for lightning quiz
    const preloadCreatures = async () => {
      const all = [];
      for (let edu = 1; edu <= 5; edu++) {
        const dinos = await fetchCreaturesByEdu(edu);
        all.push(...dinos);
      }
      setAllDinos(all);
    };
    preloadCreatures().catch(console.warn);
  }, []);

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

  const handlePassed = async (csomag, packId, score) => {
    const updated = await recordPackQuizResult(PLAYER_NICKNAME, eduLevel, csomag, score);
    setProgress(updated);
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      {view !== 'landing' && <XPBar />}

      {view === 'landing' && (
        <LandingPage
          onEnterRegion={handleEnterRegion}
          onOpenGallery={handleOpenGallery}
          onStartLightningQuiz={handleStartLightningQuiz}
          onStartMillionaire={handleStartMillionaire}
          onStartMemory={handleStartMemory}
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
        <MemoryGameScreen onBack={() => setView('landing')} />
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
