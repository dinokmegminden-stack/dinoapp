// LandingPage.js
console.log("LANDING PAGE RENDER");

import { View, Text, StatusBar, StyleSheet, Platform } from 'react-native';

import Shell from '../components/Shell';
import LandingMenu from './LandingMenu';
import { playSound } from '../audio/audioSystem';

export default function LandingPage({ onEnterRegion }) {
  const handleSelectRegion = (eduLevel) => {
    playSound('click');
    onEnterRegion(eduLevel);
  };

  return (
    <Shell>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a06" />
        <View style={styles.hero}>
          <Text style={styles.mainTitle}>DÍNÓ TUDÓS</Text>
          <Text style={styles.subtitle}>
            Gyűjtsd össze a kártyákat, oldd meg a kvízeket, és válj paleontológus szakértővé.
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          <FeatureCard
            icon="🎴"
            title="Gyűjtsd össze a kártyákat"
            desc="51 dinoszaurus fajta 5 kontinensen — teljes paleontológiai enciklopédia."
          />
          <FeatureCard
            icon="🧠"
            title="Válaszolj a kvízekre"
            desc="ABCD kérdések mindegyik dinóról — tanulj a játék közben."
          />
          <FeatureCard
            icon="🌍"
            title="Fedezd fel a dinoszauruszokat"
            desc="Kárpát-medence, Európa, Afrika, Ázsia, Amerika — világméretű felfedezés."
          />
          <FeatureCard
            icon="👑"
            title="Érj el professzori szintet"
            desc="Nyisd fel az összes pakk és válj a dinoszauruszok végső szakértőjévé."
          />
        </View>

        <LandingMenu onSelectRegion={handleSelectRegion} />
      </View>
    </Shell>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <View style={styles.featureCard}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a06',
  },
  hero: {
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: Platform.select({ web: 56, default: 40 }),
    fontWeight: '900',
    fontFamily: Platform.select({
      web: "'Impact', 'Arial Black', sans-serif",
      default: 'System',
    }),
    color: '#ECEFF1',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(236,239,241,0.75)',
    textAlign: 'center',
    maxWidth: 480,
    lineHeight: 22,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  featureCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIcon: {
    fontSize: 28,
    marginTop: 2,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ECEFF1',
    flex: 1,
  },
  featureDesc: {
    fontSize: 12,
    color: 'rgba(236,239,241,0.65)',
    flex: 1,
  },
});