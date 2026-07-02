import { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, StatusBar, StyleSheet } from 'react-native';

import Shell from '../components/Shell';
import MuteButton from '../components/MuteButton';
import LaserBorderButton from '../components/LaserBorderButton';
import { playSound } from '../audio/audioSystem';

const BG_IMAGE = require('../../assets/images/landing_menu_bg.png');

const REGION_BUTTONS = [
  { key: 1, label: 'Kárpát-medence', centerY: 10, color: '#c7d39a' },
  { key: 2, label: 'Európa',          centerY: 30, color: '#9fd17a' },
  { key: 3, label: 'Afrika',          centerY: 50, color: '#3a3424' },
  { key: 4, label: 'Ázsia',           centerY: 70, color: '#fff1d6' },
  { key: 5, label: 'Amerika',         centerY: 90, color: '#ffe0b0' },
];

export default function LandingPage({ onEnterRegion }) {
  const [stageWidth, setStageWidth] = useState(0);
  const [ratio, setRatio] = useState(1.79); // fallback, amíg Image.getSize lefut
  const stageHeight = stageWidth * 1.777;
  useEffect(() => {
    const resolved = Image.resolveAssetSource(BG_IMAGE);
    if (resolved?.uri) {
      Image.getSize(
        resolved.uri,
        (w, h) => setRatio(h / w),
        () => {}
      );
    } else if (resolved?.width && resolved?.height) {
      setRatio(resolved.height / resolved.width);
    }
  }, []);

  const handlePress = (eduLevel) => {
    playSound('click');
    onEnterRegion(eduLevel); // mindig szám (1-5)
  };

  const stageHeight = stageWidth * ratio;

  return (
    <Shell>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a06" />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={styles.stageWrapper}
            onLayout={(e) => setStageWidth(e.nativeEvent.layout.width)}
          >
            {stageWidth > 0 && (
              <View style={[styles.stage, { width: stageWidth, height: stageHeight }]}>
                <Image
                  source={BG_IMAGE}
                  style={styles.background}
                  resizeMode="stretch"
                />

                {REGION_BUTTONS.map((btn) => (
                  <LaserBorderButton
                    key={btn.key}
                    style={[styles.regionButton, { top: `${btn.centerY}%` }]}
                    color={btn.color}
                    borderRadius={28}
                    onPress={() => handlePress(btn.key)}
                  >
                    <View style={styles.arrowWrap}>
                      <Text style={styles.arrowText}>›</Text>
                    </View>
                  </LaserBorderButton>
                ))}
              </View>
            )}
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
  regionButton: {
    position: 'absolute',
    right: '4%',
    width: 56,
    height: 56,
    marginTop: -28,
    borderRadius: 28,
    backgroundColor: 'rgba(10,10,8,0.35)',
  },
  arrowWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    marginTop: -3,
  },
});
