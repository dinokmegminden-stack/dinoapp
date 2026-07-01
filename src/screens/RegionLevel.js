import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, StyleSheet } from 'react-native';

import { COLORS } from '../constants/colors';
import { IMAGE_MAP } from '../constants/imageMap';
import { playQuizSfx } from '../audio/audioSystem';

import { adaptCreature } from '../../services/creaturesService';
import { groupByPackage, csomagToPackId, getRegionKeyFromEdu } from '../../services/packageUtils';
import { generateQuestions } from '../../services/questionGenerator';

import DinoCard from '../components/DinoCard';
import { REGION_PACKS, isPackUnlocked } from './regionProgress';

export default function RegionLevel({ eduLevel, progress, onPassed, onBack }) {
  const [creatures, setCreatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState('packages');
  const [selectedCsomag, setSelectedCsomag] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('creatures').select('*').eq('edu', eduLevel);
      if (!mounted) return;
      setCreatures((data || []).map(adaptCreature));
      setLoading(false);
    })();
    return () => (mounted = false);
  }, [eduLevel]);

  const packages = useMemo(() => groupByPackage(creatures), [creatures]);

  if (loading) {
    return <Text style={{ color: '#fff', marginTop: 40 }}>Betöltés…</Text>;
  }

  if (screen === 'packages') {
    return (
      <PackagesScreen
        eduLevel={eduLevel}
        progress={progress}
        packages={packages}
        onOpen={(csomag) => {
          setSelectedCsomag(csomag);
          setScreen('browse');
        }}
        onBack={onBack}
      />
    );
  }

  if (screen === 'browse') {
    return (
      <BrowseScreen
        csomag={selectedCsomag}
        packages={packages}
        onStartQuiz={() => setScreen('quiz')}
        onBack={() => setScreen('packages')}
      />
    );
  }

  if (screen === 'quiz') {
    return (
      <QuizScreen
        eduLevel={eduLevel}
        csomag={selectedCsomag}
        packages={packages}
        creatures={creatures}
        onPassed={(csomag, score) => {
          const packId = csomagToPackId(eduLevel, csomag, REGION_PACKS);
          onPassed(csomag, packId, score);
          setScreen('packages');
        }}
        onRetry={() => setScreen('quiz')}
        onBack={() => setScreen('packages')}
      />
    );
  }

  return null;
}
