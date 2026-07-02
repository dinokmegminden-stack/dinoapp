import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { getScaledDimensions } from '../utils/scaleUtils';

export default function CharacterCompare({ creature, character, characters, onSelectCharacter }) {
  const dims = character ? getScaledDimensions(character, creature) : null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Méretösszehasonlítás</Text>

      {dims ? (
        <View style={styles.stage}>
          <View style={[styles.figure, { height: dims.character.height, width: dims.character.width }]}>
            <Image
              source={character.imageAsset}
              style={styles.img}
              resizeMode="contain"
            />
          </View>
          <View style={[styles.figure, { height: dims.dino.height, width: dims.dino.width }]}>
            {creature.image_url ? (
              <Image
                source={{ uri: creature.image_url }}
                style={styles.img}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </View>
      ) : (
        <Text style={styles.noData}>Nincs elegendő méretadat az összehasonlításhoz.</Text>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selector}>
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
      </ScrollView>
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
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  stage: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 260,
    gap: 16,
    marginBottom: 12,
  },
  figure: {
    justifyContent: 'flex-end',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  noData: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 40,
  },
  selector: {
    gap: 10,
    paddingVertical: 4,
  },
  thumbWrap: {
    width: 56,
    alignItems: 'center',
    padding: 4,
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
    fontSize: 9,
    marginTop: 2,
  },
});