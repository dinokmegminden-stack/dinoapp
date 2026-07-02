import React, { useRef } from 'react';
import {
  View,
  Image,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { CHARACTERS } from '../constants/characters';
import { COLORS } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_DESKTOP = SCREEN_WIDTH >= 1024;

const ITEM_WIDTH = 220;
const ITEM_SPACING = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

export default function CharacterSelectScreen({ onSelectCharacter }) {
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleConfirm = (characterId) => {
    onSelectCharacter(characterId);
  };

  const renderItem = ({ item, index }) => {
    const inputRange = [
      (index - 1) * ITEM_WIDTH,
      index * ITEM_WIDTH,
      (index + 1) * ITEM_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.75, 1.15, 0.75],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleConfirm(item.id)}
        style={styles.itemWrapper}
      >
        <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
          <Image
            source={item.imageAsset}
            style={{
              width: ITEM_WIDTH * 0.8,
              height: ITEM_WIDTH * 0.8 / item.aspectRatio,
              resizeMode: 'contain',
            }}
          />
          <Text style={styles.name}>{item.name}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        IS_DESKTOP && {
          width: SCREEN_WIDTH * 0.33,
          alignSelf: 'center',
        },
      ]}
    >
      <Text style={styles.title}>Válassz karaktert</Text>

      <Animated.FlatList
        data={CHARACTERS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        style={{ flexGrow: 0, height: 320 }}
        contentContainerStyle={{
          paddingHorizontal: ITEM_SPACING,
          alignItems: 'center',
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />

      <Text style={styles.hint}>Koppints a kiválasztáshoz</Text>
    </View>
  );
} // ← THIS WAS MISSING

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Cinzel',
    fontSize: 22,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  itemWrapper: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  name: {
    fontFamily: 'Roboto',
    fontSize: 16,
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  hint: {
    fontFamily: 'Roboto',
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
});
