import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

import { COLORS } from '../constants/colors';
import { IMAGE_MAP } from '../constants/imageMap';
import { getScaledDimensions } from '../utils/scaleUtils';

const STAGE_HEIGHT = 260;
const FIGURE_GAP = 16;

export default function CharacterCompare({ creature, character, characters, onSelectCharacter }) {
  const dinoImg = IMAGE_MAP[creature.nev_tudomanyos] || null;
  const dims = character ? getScaledDimensions(character, creature) : null;

  const characterLeft = dims ? (dims.dino.width - dims.character.width) / 2 : 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Méretösszehasonlítás</Text>

      {dims ? (
        <View style={styles.stageOuter}>
          <View style={[styles.stage, { width: dims.dino.width }]}>
            {dinoImg || creature.image_url ? (
              <Image
                source={dinoImg || { uri: creature.image_url }}
                resizeMode="contain"
                style={{
                  width: dims.dino.width,
                  height: dims.dino.height,
                }}
              />
            ) : null}

            {character?.imageAsset ? (
              <Image
                source={character.imageAsset}
                resizeMode="contain"
                style={[
                  styles.figureImg,
                  {
                    width: dims.character.width,
                    height: dims.character.height,
                    left: characterLeft,
                    bottom: dims.characterBottom
                  },
                ]}
              />
            ) : null}
          </View>
        </View>
      ) : (
        <Text style={styles.noData}>Nincs elegendő méretadat az összehasonlításhoz.</Text>
      )}

      <View style={styles.selectorGrid}>
        {characters.map((c) => (
          <TouchableOpacity
            key={c.id}
            onPress={() => onSelectCharacter(c)}
            style={[styles.thumbWrap, character?.id === c.id && styles.thumbActive]}
          >
            <Image source={c.imageAsset} style={styles.thumb} resizeMode="contain" />
            <Text style={styles.thumbName} numberOfLines={1}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  label: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  stageOuter: {
    height: STAGE_HEIGHT,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    height: STAGE_HEIGHT,
    position: 'relative',
  },
  figureImg: {
    position: 'absolute',
  },
  noData: {
    color: COLORS.textMuted,
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 40,
  },
  selectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  thumbWrap: {
    width: 70,
    alignItems: 'center',
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.greenBg,
  },
  thumb: {
    width: 40,
    height: 40,
  },
  thumbName: {
    color: COLORS.textMuted,
    fontSize: 15,
    marginTop: 2,
  },
});
