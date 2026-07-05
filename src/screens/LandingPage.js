// LandingPage.js
console.log("LANDING PAGE RENDER - PALEO THEME OPTIMIZED");

import { View, Text, StatusBar, StyleSheet, Platform } from 'react-native';
import Shell from '../components/Shell';
import LandingMenu from './LandingMenu';
import { playSound } from '../audio/audioSystem';
import { COLORS } from '../constants/colors'; // Beimportálva a közös palettád

export default function LandingPage({ onEnterRegion }) {
  const handleSelectRegion = (eduLevel) => {
    playSound('click');
    onEnterRegion(eduLevel);
  };

  return (
    <Shell>
      <View style={styles.container}>
        {/* Illeszkedik a teljes sötétzöld háttérhez */}
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg || '#283618'} />
        
        {/* Bal oldali hasáb: Címek és Főmenü */}
        <View style={styles.leftColumn}>
          <View style={styles.hero}>
            <Text style={styles.mainTitle}>DÍNÓ TUDÓS</Text>
            <Text style={styles.subtitle}>
              Gyűjtsd össze a kártyákat, oldd meg a kvízeket, és válj paleontológus szakértővé!
            </Text>
          </View>
          
          <View style={styles.menuWrapper}>
            <LandingMenu onSelectRegion={handleSelectRegion} />
          </View>
        </View>

        {/* Jobb oldali hasáb: Játékos Feature Grid a megadott kártya-stílusban */}
        <View style={styles.rightColumn}>
          <View style={styles.gridContainer}>
            <FeatureCard
              icon="🎴"
              title="Kártyagyűjtemény"
              desc="51 dínó fajta 5 kontinensen — teljes enciklopédia."
            />
            <FeatureCard
              icon="🧠"
              title="Dínó Kvízek"
              desc="ABCD kérdések minden lényről. Tanulj játszva!"
            />
            <FeatureCard
              icon="🌍"
              title="Felfedezés"
              desc="Kárpát-medence, Afrika, Amerika és azon túl."
            />
            <FeatureCard
              icon="👑"
              title="Professzor Szint"
              desc="Nyiss ki minden pakkot, és légy a végső szakértő!"
            />
          </View>
        </View>

      </View>
    </Shell>
  );
}

// A stílusfájlod packageCard logikájára épülő, de fekvőre optimalizált komponens
function FeatureCard({ icon, title, desc }) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.packageIconWrap}>
        <Text style={styles.packageIcon}>{icon}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc} numberOfLines={2}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row', // Fekvő elrendezés
    backgroundColor: COLORS.bg || '#283618', // A kép alapján használt mély őserdő-zöld
    padding: 24,
    alignItems: 'center',
  },
  leftColumn: {
    flex: 4,
    paddingRight: 20,
    justifyContent: 'center',
  },
  rightColumn: {
    flex: 6,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: Platform.select({ web: 46, default: 38 }),
    fontWeight: '900',
    color: COLORS.gold || '#DDA15E', // A gyönyörű arany/homok színed
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(254,250,224,0.65)', // Lágyított krémszín
    lineHeight: 19,
  },
  menuWrapper: {
    width: '100%',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  featureCard: {
    // A CSS-edből átemelt áttetsző krém háttér és finom keret
    backgroundColor: 'rgba(254,250,224,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.12)',
    borderRadius: 16,
    width: '48%', // 2x2 grid
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      web: { transition: 'transform 0.2s ease-in-out' }
    })
  },
  packageIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  packageIcon: {
    fontSize: 22,
  },
  cardContent: {
    flex: 1,
  },
  featureTitle: {
    color: '#FEFAE0', // Tiszta krémszín a címeknek
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  featureDesc: {
    color: 'rgba(254,250,224,0.55)', // Halványított leírás
    fontSize: 11,
    lineHeight: 15,
  },
});