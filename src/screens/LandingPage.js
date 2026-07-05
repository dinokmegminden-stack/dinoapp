// LandingPage.js
console.log("LANDING PAGE RENDER - LANDSCAPE UX OPTIMIZED");

import { View, Text, StatusBar, StyleSheet, Platform, ScrollView } from 'react-native';
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
        {/* Vidám, de nem dedós dínó-zöld státuszbár */}
        <StatusBar barStyle="light-content" backgroundColor="#1E4620" />
        
        {/* Bal oldali fix sáv: Cím és a Régióválasztó Főgombok */}
        <View style={styles.leftColumn}>
          <View style={styles.hero}>
            <Text style={styles.mainTitle}>DÍNÓ TUDÓS</Text>
            <Text style={styles.subtitle}>
              Gyűjtsd össze a kártyákat, oldd meg a kvízeket, és válj paleontológus szakértővé!
            </Text>
          </View>
          
          {/* A te menüd, ami a navigációt és indítást kezeli */}
          <View style={styles.menuWrapper}>
            <LandingMenu onSelectRegion={handleSelectRegion} />
          </View>
        </View>

        {/* Jobb oldali sáv: 2x2-es interaktív jellemző-kártyák */}
        <View style={styles.rightColumn}>
          <View style={styles.gridContainer}>
            <FeatureCard
              icon="🎴"
              title="Kártyagyűjtemény"
              desc="51 dínó fajta 5 kontinensen — teljes enciklopédia."
              badgeColor="#FF6B6B"
            />
            <FeatureCard
              icon="🧠"
              title="Dínó Kvízek"
              desc="ABCD kérdések minden lényről. Tanulj játszva!"
              badgeColor="#4D96FF"
            />
            <FeatureCard
              icon="🌍"
              title="Felfedezés"
              desc="Kárpát-medence, Afrika, Amerika és azon túl."
              badgeColor="#6BCB77"
            />
            <FeatureCard
              icon="👑"
              title="Professzor Szint"
              desc="Nyiss ki minden pakkot, és légy a végső szakértő!"
              badgeColor="#FFD93D"
            />
          </View>
        </View>

      </View>
    </Shell>
  );
}

// 3D-s hatású, modern játék-kártya komponens
function FeatureCard({ icon, title, desc, badgeColor }) {
  return (
    <View style={styles.featureCard}>
      <View style={[styles.iconBadge, { backgroundColor: badgeColor }]}>
        <Text style={styles.featureIcon}>{icon}</Text>
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
    flexDirection: 'row', // Fekvő nézet miatt egymás mellett vannak a hasábok!
    backgroundColor: '#F4F7F4', // Kellemes, világos "paleo-kaland" háttér
    padding: 20,
  },
  leftColumn: {
    flex: 4, // 40% szélesség a címnek és a főmenünek
    justifyContent: 'center',
    paddingRight: 15,
  },
  rightColumn: {
    flex: 6, // 60% szélesség a feature kártyáknak
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: Platform.select({ web: 42, default: 36 }),
    fontWeight: '900',
    fontFamily: Platform.select({
      web: 'system-ui, -apple-system, sans-serif',
      default: 'System',
    }),
    color: '#1A3A1C', // Mély dínó-zöld
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#4A5D4B',
    lineHeight: 20,
  },
  menuWrapper: {
    width: '100%',
    // Itt a LandingMenu-d stílusát finomhangolhatod, hogy jól mutasson a bal sávban
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    width: '48%', // 2x2-es elrendezés a résen belül
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    // 3D Játék-effektus: az alsó szegély vastagabb, mintha megnyomható lenne
    borderBottomWidth: 4,
    borderBottomColor: '#E0E5E0',
    // Kellemes, lágy árnyékok
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        shadowColor: 'rgba(0,0,0,0.06)',
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
      }
    })
  },
  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A3A1C',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: '#607261',
    lineHeight: 16,
  },
});