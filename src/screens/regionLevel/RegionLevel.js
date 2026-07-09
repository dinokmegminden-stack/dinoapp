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
  // A "quiz" screen mindig ugyanaz a currentScreen érték marad újrapróbálkozáskor,
  // úgyhogy setCurrentScreen('quiz') önmagában nem re-renderelne (React bail-out
  // azonos state-értéknél) — a quizAttempt key-kényszerített remountot ad helyette,
  // ami friss belső state-et ÉS friss (újrakevert) kérdéssort is jelent.
  const [quizAttempt, setQuizAttempt] = useState(0);

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
        key={quizAttempt}
        eduLevel={eduLevel}
        csomag={selectedCsomag}
        packages={packages}
        creatures={creatures}
        onPassed={(csomag, packId, score) => {
          onPassed(csomag, packId, score);
          setCurrentScreen('packages');
        }}
        onRetry={() => setQuizAttempt((n) => n + 1)}
        onBack={() => setCurrentScreen('packages')}
      />
    );
  }

  return null;
}