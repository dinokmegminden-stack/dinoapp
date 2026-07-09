import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { IMAGE_MAP } from '../../constants/imageMap';
import DinoCard from '../../components/DinoCard';
import LevelShell from './LevelShell';
import { s } from './RegionLevel.styles';

export default function BrowseScreen({ csomag, packages, onStartQuiz, onBack }) {
  const pkg = packages.find((p) => p.csomag === csomag);
  const dinos = pkg?.dinos || [];
  const [index, setIndex] = useState(0);

  const dino = dinos[index];
  const isLastDino = index === dinos.length - 1;

  const handleNext = () => {
    if (isLastDino) {
      onStartQuiz();
    } else {
      setIndex((i) => Math.min(dinos.length - 1, i + 1));
    }
  };

  return (
    <LevelShell>
      <View style={s.browseHeader}>
        <TouchableOpacity onPress={onBack}>
          <Text style={s.backText}>← Csomagok</Text>
        </TouchableOpacity>
        <Text style={s.browseCounter}>{index + 1} / {dinos.length}</Text>
      </View>

      {/* A léptetés a DinoCard saját, képre helyezett nyilaival történik —
          nem oldalsó gombokkal, mert azok mobilon annyi szélességet
          vittek el, hogy a kártya tartalma (név, statisztikák) alig fért ki. */}
      <ScrollView contentContainerStyle={{ padding: 14, flexGrow: 1 }}>
        {dino && (
          <DinoCard
            dino={dino}
            imageSource={IMAGE_MAP[dino.name_hu] || null}
            onPrevious={() => setIndex((i) => Math.max(0, i - 1))}
            onNext={handleNext}
            isFirstDino={index === 0}
            isLastDino={false}
            nextIcon={isLastDino ? '▶' : '›'}
          />
        )}
      </ScrollView>
    </LevelShell>
  );
}
