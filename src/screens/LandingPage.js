import { useState } from 'react';
import { View, Text, Image, ScrollView, StatusBar, StyleSheet } from 'react-native';

import Shell from '../components/Shell';
import MuteButton from '../components/MuteButton';
import LaserBorderButton from '../components/LaserBorderButton';
import { playSound } from '../audio/audioSystem';

import { REGION_BUTTONS } from '../constants/regionButtons';

export default function LandingPage({ onEnterRegion }) {
  const [stageWidth, setStageWidth] = useState(0);

  const handlePress = (eduLevel) => {
    playSound('click');
    onEnterRegion(eduLevel);   // mindig szám
  };

  const stageHeight = stageWidth * 0.558; // optimalizált arány

  return (
    <Shell>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a06" />

        <ScrollView
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
                  source={require('../../assets/images/landing_menu_bg.png')}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
