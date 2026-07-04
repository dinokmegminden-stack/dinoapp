import React, { useState } from 'react';
import { Text } from 'react-native';
import { useRegionData } from '../../hooks/useRegionData';
import LevelShell from './LevelShell';
import PackagesScreen from './PackagesScreen';
import BrowseScreen from './BrowseScreen';
import PackageQuizScreen from './PackageQuizScreen';
import { s } from './RegionLevel.styles';

export default function RegionLevel({ eduLevel, progress, onPassed, onBack }) {
  const { packages, creatures, loading, error } = useRegionData(eduLevel);

  const [currentScreen, setCurrentScreen] = useState('packages'); // 'packages' | 'browse' | 'quiz'
  const [selectedCsomag, setSelectedCsomag] = useState(null);

  if (loading) {
    return (
      <LevelShell>
        <Text style={s.loadingText}>Dínók betöltése a(z) {eduLevel} régióból...</Text>
      </LevelShell>
    );
  }

  if (error) {
    return (
      <LevelShell>
        <Text style={s.errorText}>Hiba történt az adatok betöltésekor.</Text>
      </LevelShell>
    );
  }

  if (currentScreen === 'packages') {
    return (
      <PackagesScreen
        eduLevel={eduLevel}
        progress={progress}
        packages={packages}
        onOpenPackage={(csomag) => {
          setSelectedCsomag(csomag);
          setCurrentScreen('browse');
        }}
        onBack={onBack}
      />
    );
  }

  if (currentScreen === 'browse') {
    return (
      <BrowseScreen
        csomag={selectedCsomag}
        packages={packages}
        onStartQuiz={() => setCurrentScreen('quiz')}
        onBack={() => setCurrentScreen('packages')}
      />
    );
  }

  if (currentScreen === 'quiz') {
    return (
      <PackageQuizScreen
        eduLevel={eduLevel}
        csomag={selectedCsomag}
        packages={packages}
        creatures={creatures}
        onPassed={(csomag, packId, score) => {
          onPassed(csomag, packId, score);
          setCurrentScreen('packages');
        }}
        onRetry={() => setCurrentScreen('quiz')}
        onBack={() => setCurrentScreen('packages')}
      />
    );
  }

  return null;
}