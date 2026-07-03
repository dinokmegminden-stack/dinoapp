console.log("APP STARTED");

import { useState } from 'react';
import { View, StatusBar } from 'react-native';

import LandingPage from './src/screens/LandingPage';
import RegionLevel from './src/screens/RegionLevel';

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'region'
  const [eduLevel, setEduLevel] = useState(null);

  const handleEnterRegion = (level) => {
    setEduLevel(level);
    setView('region');
  };

  const handleBackToMenu = () => {
    setView('landing');
    setEduLevel(null);
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
          progress={{}}
          onPassed={() => {}}
        />
      )}
    </View>
  );
}
