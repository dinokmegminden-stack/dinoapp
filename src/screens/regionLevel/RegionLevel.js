import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useRegionData } from '../../hooks/useRegionData';
import LevelShell from './LevelShell';
import PackagesScreen from './PackagesScreen';
import BrowseScreen from './BrowseScreen';
import PackageQuizScreen from './PackageQuizScreen';
import { s } from './RegionLevel.styles';
import { useT } from '../../i18n';

export default function RegionLevel({ eduLevel, progress, onPassed, onBack, onBrowsingChange, playerId, nickname, onNavigate }) {
  const { t } = useT();
  const { packages, creatures, loading, error } = useRegionData(eduLevel);

  const [currentScreen, setCurrentScreen] = useState('packages'); // 'packages' | 'browse' | 'quiz'
  const [selectedCsomag, setSelectedCsomag] = useState(null);
  // A "quiz" screen mindig ugyanaz a currentScreen érték marad újrapróbálkozáskor,
  // úgyhogy setCurrentScreen('quiz') önmagában nem re-renderelne (React bail-out
  // azonos state-értéknél) — a quizAttempt key-kényszerített remountot ad helyette,
  // ami friss belső state-et ÉS friss (újrakevert) kérdéssort is jelent.
  const [quizAttempt, setQuizAttempt] = useState(0);

  // A TradingCard böngészésekor (currentScreen === 'browse') az App.js elrejti az
  // XP-sávot, hogy ne zavarja a kártya fejlécét — lásd App.js hideXPBar.
  // Unmountkor kötelező visszaállítani, különben más képernyőkre navigálva
  // (pl. vissza a főmenübe) is rejtve maradna.
  useEffect(() => {
    onBrowsingChange?.(currentScreen === 'browse');
    return () => onBrowsingChange?.(false);
  }, [currentScreen, onBrowsingChange]);

  if (loading) {
    return (
      <LevelShell>
        <Text style={s.loadingText}>{t('regionLevel.loading', { region: eduLevel })}</Text>
      </LevelShell>
    );
  }

  if (error) {
    return (
      <LevelShell>
        <Text style={s.errorText}>{t('regionLevel.error')}</Text>
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
        nickname={nickname}
        onNavigate={onNavigate}
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
        playerId={playerId}
        nickname={nickname}
        progress={progress}
        onNavigate={onNavigate}
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
        onPassed={onPassed}
        onRetry={() => setQuizAttempt((n) => n + 1)}
        onBack={() => setCurrentScreen('packages')}
        nickname={nickname}
        progress={progress}
        onNavigate={onNavigate}
      />
    );
  }

  return null;
}