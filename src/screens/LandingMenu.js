import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../constants/colors'; // Beimportálva a színeidhez

const REGIONS = [
  { edu: 1, label: '🦴 Kárpát-medence' }, 
  { edu: 2, label: '🦕 Európa' },         
  { edu: 3, label: '🌍 Afrika' },          
  { edu: 4, label: '🪶 Ázsia' },           
  { edu: 5, label: '🦖 Amerika' },         
];

function RegionButton({ region, onPress }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={() => onPress(region.edu)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.navBtnPrimary,
        hovered && styles.navBtnPrimaryHovered,
      ]}
    >
      <Text style={styles.navBtnPrimaryText}>{region.label}</Text>
    </Pressable>
  );
}

function GalleryButton({ onPress }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[styles.galleryBtn, hovered && styles.galleryBtnHovered]}
    >
      <Text style={styles.galleryBtnText}>🖼️ Galéria</Text>
    </Pressable>
  );
}

function LightningQuizButton({ onPress }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[styles.lightningBtn, hovered && styles.lightningBtnHovered]}
    >
      <Text style={styles.lightningBtnText}>⚡ 5MP KÉPKVÍZ</Text>
    </Pressable>
  );
}

export default function LandingMenu({ onSelectRegion, onOpenGallery, onLightningQuiz }) {
  return (
    <View style={styles.menuContainer}>
      <View style={styles.list}>
        {REGIONS.map((region) => (
          <RegionButton
            key={region.edu}
            region={region}
            onPress={onSelectRegion}
          />
        ))}
        {onOpenGallery && <GalleryButton onPress={onOpenGallery} />}
        {onLightningQuiz && <LightningQuizButton onPress={onLightningQuiz} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    // KUKA a 100vh és a #2C3E50 háttér! Most már csak egy tiszta konténer.
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    width: '100%',
    gap: 12, // Kicsit szorosabb, hogy jobban elférjen fekvőben
    paddingHorizontal: 8,
  },
  // A te stílusfájlod mintájára épített prémium gomb dizájn
  navBtnPrimary: {
    width: '100%',
    backgroundColor: 'rgba(221,161,94,0.14)', // Az aranyod áttetsző verziója
    borderWidth: 2, // Kicsit vastagabb keret a jobb visszajelzésért
    borderColor: COLORS.gold || '#DDA15E',
    borderRadius: 16, // Modern, lekerekített sarkok
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
      },
    }),
  },
  navBtnPrimaryHovered: {
    backgroundColor: 'rgba(221,161,94,0.25)',
    ...Platform.select({
      web: {
        transform: 'scale(1.02)', // Finom ugrás hoverre
      },
    }),
  },
  navBtnPrimaryText: {
    color: COLORS.gold || '#DDA15E',
    fontFamily: Platform.select({
      web: "system-ui, -apple-system, sans-serif",
      default: 'System',
    }),
    fontWeight: '900', // Szuper vastag betűk a 10+ korosztálynak
    fontSize: 15,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  galleryBtn: {
    width: '100%',
    backgroundColor: 'rgba(254,250,224,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(254,250,224,0.25)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
      },
    }),
  },
  galleryBtnHovered: {
    backgroundColor: 'rgba(254,250,224,0.1)',
    ...Platform.select({
      web: {
        transform: 'scale(1.02)',
      },
    }),
  },
  galleryBtnText: {
    color: '#FEFAE0',
    fontFamily: Platform.select({
      web: "system-ui, -apple-system, sans-serif",
      default: 'System',
    }),
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  lightningBtn: {
    width: '100%',
    backgroundColor: 'rgba(255,193,7,0.14)',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
      },
    }),
  },
  lightningBtnHovered: {
    backgroundColor: 'rgba(255,193,7,0.25)',
    ...Platform.select({
      web: {
        transform: 'scale(1.02)',
      },
    }),
  },
  lightningBtnText: {
    color: '#FFD700',
    fontFamily: Platform.select({
      web: "system-ui, -apple-system, sans-serif",
      default: 'System',
    }),
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});