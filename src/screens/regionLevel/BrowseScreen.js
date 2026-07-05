import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { IMAGE_MAP } from '../../constants/imageMap';
import { CHARACTERS } from '../../constants/characters';
import DinoCard from '../../components/DinoCard';
import { s } from './RegionLevel.styles';

export default function BrowseScreen({ csomag, packages, onStartQuiz, onBack }) {
  const pkg = packages.find((p) => p.csomag === csomag);
  const dinos = pkg?.dinos || [];
  const [index, setIndex] = useState(0);
  const [selectedCharacter, setSelectedCharacter] = useState(CHARACTERS[0]);

  const dino = dinos[index];

  return (
    <View style={s.screen}>
      <View style={s.browseHeader}>
        <TouchableOpacity onPress={onBack}>
          <Text style={s.backText}>← Csomagok</Text>
        </TouchableOpacity>
        <Text style={s.browseCounter}>{index + 1} / {dinos.length}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14 }}>
        {dino && (
          <>
            <DinoCard
              dino={dino}
              imageSource={IMAGE_MAP[dino.name_hu] || null}
              character={selectedCharacter}
              showTimeline
            />
            <View style={s.characterSelectorGrid}>
              {CHARACTERS.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setSelectedCharacter(c)}
                  style={[s.charThumb, selectedCharacter?.id === c.id && s.charThumbActive]}
                >
                  {c.imageAsset ? (
                    <Image source={c.imageAsset} style={s.charThumbImg} resizeMode="contain" />
                  ) : (
                    <View style={[s.charThumbImg, s.charThumbPlaceholder]}>
                      <Text style={s.charThumbInitial}>{c.name.charAt(0)}</Text>
                    </View>
                  )}
                  <Text style={s.charThumbName} numberOfLines={1}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View style={s.navRow}>
        <TouchableOpacity
          style={s.navBtn}
          onPress={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          <Text style={[s.navBtnText, index === 0 && s.navBtnDisabled]}>
            ← Előző
          </Text>
        </TouchableOpacity>

        {index === dinos.length - 1 ? (
          <TouchableOpacity style={[s.navBtn, s.navBtnPrimary]} onPress={onStartQuiz}>
            <Text style={s.navBtnPrimaryText}>Kvíz indítása →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={s.navBtn}
            onPress={() => setIndex((i) => Math.min(dinos.length - 1, i + 1))}
          >
            <Text style={s.navBtnText}>Következő →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}