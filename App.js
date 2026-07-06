console.log("APP STARTED");

import { useEffect, useState } from 'react';
import { View, StatusBar } from 'react-native';

import LandingPage from './src/screens/LandingPage';
import RegionLevel from './src/screens/regionLevel/RegionLevel';
import { loadProgress, recordPackQuizResult } from './src/utils/regionProgress';

const PLAYER_NICKNAME = 'player_default';

export default function App() {
  const [view, setView] = useState('landing');
  const [eduLevel, setEduLevel] = useState(null);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    loadProgress(PLAYER_NICKNAME).then(setProgress);
  }, []);

  const handleEnterRegion = (level) => {
    setEduLevel(level);
    setView('region');
  };

  const handleBackToMenu = () => {
    setView('landing');
    setEduLevel(null);
  };

  const handlePassed = async (csomag, packId, score) => {
    const updated = await recordPackQuizResult(PLAYER_NICKNAME, eduLevel, csomag, score);
    setProgress(updated);
  };

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
