console.log("APP STARTED");

import { useState, useEffect, useCallback } from 'react';
import { View, StatusBar } from 'react-native';

import LandingPage from './src/screens/LandingPage';
import RegionLevel from './src/screens/RegionLevel';
import { loadProgress, recordPackQuizResult } from './src/utils/regionProgress';

// TODO: cseréld valós felhasználóazonosítóra, ha lesz profil/login rendszer
const NICKNAME = 'player';

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'region'
  const [eduLevel, setEduLevel] = useState(null);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    loadProgress(NICKNAME).then(setProgress);
  }, []);

  const handleEnterRegion = (level) => {
    setEduLevel(level);
    setView('region');
  };

  const handleBackToMenu = () => {
    setView('landing');
    setEduLevel(null);
  };

  const handlePassed = useCallback(async (packNumber, scoreRatio) => {
    const updated = await recordPackQuizResult(NICKNAME, eduLevel, packNumber, scoreRatio);
    setProgress(updated);
  }, [eduLevel]);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      {view === 'landing' && (
        <LandingPage onEnterRegion={handleEnterRegion} />
      )}

      {view === 'region' && eduLevel != null && (
        <RegionLevel
          eduLevel={eduLevel}
          onBack={handleBackToMenu}
          progress={progress}
          onPassed={handlePassed}
        />
      )}
    </View>
  );
}