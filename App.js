import { useState } from 'react';
import { View, StatusBar } from 'react-native';
import { useFonts } from 'expo-font';

// --- KÉPERNYŐK ---
import LandingPage from './src/screens/LandingPage';
import RegionLevel from './src/screens/RegionLevel';

// --- FONTOK ---
import { Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';

export default function App() {
  // --- FONTOK BETÖLTÉSE ---
  const [fontsLoaded] = useFonts({
    Cinzel_700Bold,
    Roboto_400Regular,
    Roboto_700Bold,
  });

  // --- APP STATE ---
  const [view, setView] = useState('landing');   // 'landing' | 'region'
  const [eduLevel, setEduLevel] = useState(null); // 1–5

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#0a0a06' }} />;
  }

  // --- LANDING → REGION váltás ---
  const handleEnterRegion = (level) => {
    setEduLevel(level);   // mindig szám
    setView('region');
  };

  // --- VISSZA A FŐMENÜBE ---
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
          progress={{}}   // később ide jön a valódi progress
          onPassed={() => {}}
        />
      )}
    </View>
  );
}
