console.log("LANDING PAGE RENDER");

import { View, Text, Image, ScrollView, StatusBar, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';

import Shell from '../components/Shell';
import MuteButton from '../components/MuteButton';
import { playSound } from '../audio/audioSystem';

const BG_IMAGE = require('../../assets/images/landing_menu_bg.png');

const REGION_BUTTONS = [
  { key: 1, label: 'Kárpát-medence' },
  { key: 2, label: 'Európa' },
  { key: 3, label: 'Afrika' },
  { key: 4, label: 'Ázsia' },
  { key: 5, label: 'Amerika' },
];

export default function LandingPage({ onEnterRegion }) {
  const { width: windowWidth } = useWindowDimensions();
  const stageWidth = windowWidth > 600 ? 600 : windowWidth; 
  const stageHeight = stageWidth * 1.777;

  const handlePress = (eduLevel) => {
    playSound('click');
    onEnterRegion(eduLevel);
  };

  return (
    <Shell>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a06" />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stageWrapper}>
            <View style={[styles.stage, { width: stageWidth, height: stageHeight }]}>
              <Image
                source={BG_IMAGE}
                style={[styles.background, styles.imageResize]}
              />

              <View style={styles.buttonGrid}>
                {REGION_BUTTONS.map((btn) => (
                  <TouchableOpacity
                    key={btn.key}
                    style={styles.regionButton}
                    onPress={() => handlePress(btn.key)}
                    activeOpacity={0.7}
                    accessibilityLabel={`Régió kiválasztása: ${btn.label}`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.buttonLabel}>{btn.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <MuteButton />
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a06',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  stageWrapper: {
    width: '100%',
  },
  stage: {
    position: 'relative',
    alignSelf: 'center',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%',
    height: '100%',
  },
  imageResize: {
    resizeMode: 'stretch',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  regionButton: {
    backgroundColor: 'rgba(40, 54, 24, 0.85)',
    borderWidth: 2,
    borderColor: 'rgba(221, 161, 94, 0.6)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#FEFAE0',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});