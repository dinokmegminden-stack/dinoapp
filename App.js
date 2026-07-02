import { useState } from 'react';
import { View, StatusBar } from 'react-native';
import { useFonts } from 'expo-font';

import CharacterSelectScreen from './src/screens/CharacterSelectScreen';
import LandingPage from './src/screens/LandingPage';
import RegionLevel from './src/screens/RegionLevel';

import { Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';

export default function App() {
  const [fontsLoaded] = useFonts({
    Cinzel_700Bold,
    Roboto_400Regular,
    Roboto_700Bold,
  });

  const [view, setView] = useState('character'); // 'character' | 'landing' | 'region'
  const [eduLevel, setEduLevel] = useState(null);
  const [characterId, setCharacterId] = useState(null);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#0a0a06' }} />;
  }

  const handleSelectCharacter = (charId) => {
    setCharacterId(charId);
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

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      {view === 'character' && (
        <CharacterSelectScreen onSelectCharacter={handleSelectCharacter} />
      )}

      {view === 'landing' && (
        <LandingPage onEnterRegion={handleEnterRegion} />
      )}

      {view === 'region' && eduLevel != null && (
        <RegionLevel
          eduLevel={eduLevel}
          characterId={characterId}
          onBack={handleBackToMenu}
          progress={{}}
          onPassed={() => {}}
        />
      )}
    </View>
  );
}