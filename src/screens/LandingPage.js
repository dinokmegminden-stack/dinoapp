console.log("LANDING PAGE RENDER");

import { View, Text, Image, ScrollView, StatusBar, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';

import Shell from '../components/Shell';
import MuteButton from '../components/MuteButton';
import { playSound } from '../audio/audioSystem';

const BG_IMAGE = require('../../assets/images/landing_menu_bg.png');

const REGION_BUTTONS = [
  { key: 1, label: 'Kárpát-medence', centerY: 10 },
  { key: 2, label: 'Európa',          centerY: 30 },
  { key: 3, label: 'Afrika',           centerY: 50 },
  { key: 4, label: 'Ázsia',            centerY: 70 },
  { key: 5, label: 'Amerika',          centerY: 90 },
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

              {REGION_BUTTONS.map((btn) => (
                <TouchableOpacity
                  key={btn.key}
                  style={[styles.dinoButton, { top: `${btn.centerY}%` }]}
                  onPress={() => handlePress(btn.key)}
                  activeOpacity={0.7}
                  accessibilityLabel={`Régió kiválasztása: ${btn.label}`} // Weben ez tiszta aria-label lesz
                  accessibilityRole="button"
                >
                  <Text style={styles.dinoIcon}>🦖</Text>
                </TouchableOpacity>
              ))}
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
  dinoButton: {
    position: 'absolute',
    right: '6%',
    width: 50,
    height: 50,
    marginTop: -25,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Áttetsző kör a dínó mögött, hogy látszódjon, gomb
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    // Finom árnyék, hogy kiemelkedjen a háttérből
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dinoIcon: {
    fontSize: 26,
    textAlign: 'center',
  },
});