import { useState } from 'react';
import { View, StatusBar } from 'react-native';

import CharacterSelectScreen from './src/screens/CharacterSelectScreen';
import LandingPage from './src/screens/LandingPage';
import RegionLevel from './src/screens/RegionLevel';

console.log("Character screen mounted");

export default function App() {
  const [view, setView] = useState('character'); // 'character' | 'landing' | 'region'
  const [eduLevel, setEduLevel] = useState(null);
  const [characterId, setCharacterId] = useState(null);

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
