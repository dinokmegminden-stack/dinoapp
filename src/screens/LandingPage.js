// LandingPage.js
console.log("LANDING PAGE RENDER - REDESIGNED");

import Shell from '../components/Shell';
import HeroTop from '../components/HeroTop';
import { playSound } from '../audio/audioSystem';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { REGION_BUTTONS } from '../constants/regionButtons';
import { View, Text, StatusBar, StyleSheet, TouchableOpacity } from 'react-native';

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

        <View style={styles.content}>
          <View style={styles.introSection}>
            <Text style={styles.tagline}>Gyűjtsd össze a dínókat, tanulj és játssz!</Text>
            <View style={styles.bulletList}>
              <BulletPoint text="5 kontinens 100+ őslénye" />
              <BulletPoint text="Csomagokra bontva, kvízzel zárolva" />
              <BulletPoint text="Tanulj paleontológiát játék közben" />
              <BulletPoint text="Gyűjts XP-t és érj el professzori szintet!" />
            </View>
          </View>

          <View style={styles.regionsGrid}>
            {REGION_BUTTONS.map((region) => (
              <TouchableOpacity
                key={region.key}
                style={[styles.regionBtn, { borderColor: region.color }]}
                onPress={() => handleSelectRegion(region.key)}
              >
                <Text style={[styles.regionBtnText, { color: region.color }]}>
                  {region.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.galleryBtn} onPress={handleOpenGallery}>
            <Text style={styles.galleryBtnText}>🖼️ GALÉRIA</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Shell>
  );
}

function BulletPoint({ text }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg || '#283618',
  },
  content: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  introSection: {
    marginBottom: 32,
  },
  tagline: {
    color: '#DDA15E',
    fontFamily: FONTS.bold,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  bulletList: {
    gap: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulletDot: {
    color: '#DDA15E',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: -2,
  },
  bulletText: {
    color: '#FEFAE0',
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  regionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 24,
  },
  regionBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(254,250,224,0.05)',
    minWidth: 140,
    alignItems: 'center',
  },
  regionBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  galleryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    backgroundColor: 'rgba(254,250,224,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.2)',
    alignItems: 'center',
    alignSelf: 'center',
  },
  galleryBtnText: {
    color: '#FEFAE0',
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});