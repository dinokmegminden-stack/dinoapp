import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { IMAGE_MAP } from '../../constants/imageMap';
import { CHARACTERS } from '../../constants/characters';
import DinoCard from '../../components/DinoCard';
import { s } from './RegionLevel.styles';

export default function BrowseScreen({ csomag, packages, onStartQuiz, onBack }) {
  const pkg = packages.find((p) => p.csomag === csomag);
  const dinos = pkg?.dinos || [];
  const [index, setIndex] = useState(0);
  const [selectedCharacter, setSelectedCharacter] = useState(CHARACTERS[0]);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const dino = dinos[index];

  return (
    <View style={s.screen}>
      <View style={s.browseHeader}>
        <TouchableOpacity onPress={onBack}>
          <Text style={s.backText}>← Csomagok</Text>
        </TouchableOpacity>
        <Text style={s.browseCounter}>{index + 1} / {dinos.length}</Text>
      </View>

      <View style={s.browseMainRow}>
        {/* Bal gomb - csak desktop nézetnél */}
        {isDesktop && (
          <TouchableOpacity
            style={[s.sideBtnLeft, index === 0 && s.sideBtnDisabled]}
            onPress={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            <Text style={[s.sideBtnText, index === 0 && s.sideBtnDisabledText]}>←</Text>
          </TouchableOpacity>
        )}

        {/* Középső tartalom */}
        <ScrollView contentContainerStyle={{ padding: 14, flexGrow: 1 }}>
          {dino && (
            <>
              <DinoCard
                dino={dino}
                imageSource={IMAGE_MAP[dino.name_hu] || null}
                character={selectedCharacter}
                showTimeline
                onPrevious={() => setIndex((i) => Math.max(0, i - 1))}
                onNext={() => {
                  if (index === dinos.length - 1) {
                    onStartQuiz();
                  } else {
                    setIndex((i) => Math.min(dinos.length - 1, i + 1));
                  }
                }}
                isFirstDino={index === 0}
                isLastDino={index === dinos.length - 1}
                characters={CHARACTERS}
                selectedCharacter={selectedCharacter}
                onCharacterSelect={setSelectedCharacter}
              />
            </>
          )}
        </ScrollView>

        {/* Jobb gomb - csak desktop nézetnél */}
        {isDesktop && (
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
        )}
      </View>
    </View>
  );
}