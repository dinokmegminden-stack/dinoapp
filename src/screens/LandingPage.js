// LandingPage.js
console.log("LANDING PAGE RENDER - WIDE HERO & COMPACT XP");


import Shell from '../components/Shell';
import HeroTop from '../components/HeroTop';
import LandingMenu from './LandingMenu';
import { playSound } from '../audio/audioSystem';
import { COLORS } from '../constants/colors';
import { View, Text, StatusBar, StyleSheet, Image } from 'react-native';

const tectonicGif = require('../assets/tectonic.gif');

export default function LandingPage({ onEnterRegion, onOpenGallery }) {
  const handleSelectRegion = (eduLevel) => {
    playSound('click');
    onEnterRegion(eduLevel);
  };

  const handleOpenGallery = () => {
    playSound('click');
    onOpenGallery();
  };

  return (
    <Shell>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg || '#283618'} />

        <HeroTop />

        <View style={styles.mainContentRow}>

          <View style={styles.leftDashboardColumn}>
            <View style={styles.gifWrap}>
              <Image source={tectonicGif} style={styles.gif} resizeMode="cover" />
            </View>
          </View>

          <View style={styles.rightMenuColumn}>
            <LandingMenu onSelectRegion={handleSelectRegion} onOpenGallery={handleOpenGallery} />
          </View>

        </View>
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg || '#283618',
  },
  mainContentRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 28,
    paddingVertical: 20,
    paddingHorizontal: 28,
  },
  leftDashboardColumn: {
    flex: 5,
    justifyContent: 'center',
  },
  rightMenuColumn: {
    flex: 5,
    justifyContent: 'center',
  },
  gifWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.1)',
    backgroundColor: 'rgba(254,250,224,0.03)',
  },
  gif: {
    width: '100%',
    height: '100%',
  },
});