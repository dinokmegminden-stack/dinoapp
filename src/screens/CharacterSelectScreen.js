import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CHARACTERS } from '../constants/characters';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';

export default function CharacterSelectScreen({ onSelectCharacter }) {
  const handleConfirm = (characterId) => {
    onSelectCharacter(characterId);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Válassz karaktert</Text>

      <View style={styles.grid}>
        {CHARACTERS.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            onPress={() => handleConfirm(item.id)}
            style={styles.card}
          >
            <Image
              source={item.imageAsset}
              style={styles.image}
              resizeMode="contain"
            />
            <Text style={styles.name}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.hint}>Koppints a kiválasztáshoz</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 22,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  card: {
    width: 140,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 8,
  },
  image: {
    width: 100,
    height: 100,
  },
  name: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  hint: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
});
