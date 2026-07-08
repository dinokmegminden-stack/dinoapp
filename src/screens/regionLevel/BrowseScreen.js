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

  return (
    <LevelShell>
      <View style={s.browseHeader}>
        <TouchableOpacity onPress={onBack}>
          <Text style={s.backText}>← Csomagok</Text>
        </TouchableOpacity>
        <Text style={s.browseCounter}>{index + 1} / {dinos.length}</Text>
      </View>

      <View style={s.browseMainRow}>
        <TouchableOpacity
          style={[s.sideBtnLeft, index === 0 && s.sideBtnDisabled]}
          onPress={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          <Text style={[s.sideBtnText, index === 0 && s.sideBtnDisabledText]}>←</Text>
        </TouchableOpacity>

        {/* Középső tartalom */}
        <ScrollView contentContainerStyle={{ padding: 14, flexGrow: 1 }}>
          {dino && (
            <DinoCard
              dino={dino}
              imageSource={IMAGE_MAP[dino.name_hu] || null}
            />
          )}
        </ScrollView>

        <TouchableOpacity
          style={[s.sideBtnRight, index === dinos.length - 1 && s.sideBtnPrimary]}
          onPress={() => {
            if (index === dinos.length - 1) {
              onStartQuiz();
            } else {
              setIndex((i) => Math.min(dinos.length - 1, i + 1));
            }
          }}
        >
          <Text style={[s.sideBtnText, index === dinos.length - 1 && s.sideBtnPrimaryText]}>
            {index === dinos.length - 1 ? '▶' : '→'}
          </Text>
        </TouchableOpacity>
      </View>
    </LevelShell>
  );
}