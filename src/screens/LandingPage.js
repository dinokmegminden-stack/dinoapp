// LandingPage.js
console.log("LANDING PAGE RENDER - WIDE HERO & COMPACT XP");

import { View, Text, StatusBar, StyleSheet, Platform } from 'react-native';
import Shell from '../components/Shell';
import LandingMenu from './LandingMenu';
import { playSound } from '../audio/audioSystem';
import { COLORS } from '../constants/colors';

export default function LandingPage({ onEnterRegion }) {
  const handleSelectRegion = (eduLevel) => {
    playSound('click');
    onEnterRegion(eduLevel);
  };

  const playerStats = {
    currentXp: 4500,
    maxXp: 6000,
    passedPacks: 2,
    totalPacks: 5
  };

  const progressPercent = `${Math.min((playerStats.currentXp / playerStats.maxXp) * 100, 100)}%`;

  return (
    <Shell>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg || '#283618'} />
        
        {/* === FENTI SÁV: TELJES SZÉLESSÉGŰ CÍM (TOP KOMPONENS) === */}
        <View style={styles.topHero}>
          <Text style={styles.mainTitle}>DÍNÓ TUDÓS</Text>
          <Text style={styles.subtitle}>
            Gyűjtsd össze a kártyákat, oldd meg a kvízeket, és válj paleontológus szakértővé!
          </Text>
        </View>

        {/* === ALSÓ SÁV: KÉT HASÁBOS ELRENDEZÉS === */}
        <View style={styles.mainContentRow}>
          
          {/* BAL OLDAL: Kompaktabb Dashboard & Kártyák (Most már kevesebb helyet foglal) */}
          <View style={styles.leftDashboardColumn}>
            
            {/* Kisebb, letisztultabb XP Panel */}
            <View style={styles.xpPanelCompact}>
              <View style={styles.xpHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.xpPanelTitle}>PROFESSZOR SZINT</Text>
                  <Text style={styles.xpSubTitle}>
                    HALADÁS: <Text style={styles.xpHighlight}>{playerStats.currentXp} / {playerStats.maxXp} XP</Text>
                  </Text>
                </View>
                <View style={styles.avatarWrap}>
                  <Text style={styles.avatarEmoji}>🤠</Text>
                </View>
              </View>

              {/* Vékonyabb, kisebb progress bar */}
              <View style={styles.progressBarOuter}>
                <View style={[styles.progressBarInner, { width: progressPercent }]} />
              </View>

              {/* Kompaktabb lakat/pipa sor */}
              <View style={styles.packStatusRow}>
                <View style={[styles.packDot, styles.packDotDone]}><Text style={styles.packDotText}>✓</Text></View>
                <View style={[styles.packDot, styles.packDotDone]}><Text style={styles.packDotText}>✓</Text></View>
                <View style={[styles.packDot, styles.packDotActive]}><Text style={styles.packDotText}>🔒</Text></View>
                <View style={styles.packDot}><Text style={styles.packDotText}>🔒</Text></View>
                <View style={styles.packDot}><Text style={styles.packDotText}>🔒</Text></View>
              </View>
            </View>

            {/* Feature kártyák listája */}
            <View style={styles.cardsColumn}>
              <FeatureCard icon="🎴" title="Kártyagyűjtemény" desc="51 dínó fajta 5 kontinensen." />
              <FeatureCard icon="🧠" title="Dínó Kvízek" desc="ABCD kérdések minden lényről." />
              <FeatureCard icon="🌍" title="Felfedezés" desc="Kárpát-medence és a nagyvilág." />
            </View>
            
          </View>

          {/* JOBB OLDAL: NAGYOBB, OLVASHATÓBB RÉGIÓGOMBOK */}
          <View style={styles.rightMenuColumn}>
            <LandingMenu onSelectRegion={handleSelectRegion} />
          </View>

        </View>
      </View>
    </Shell>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.iconWrap}>
        <Text style={styles.cardIcon}>{icon}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc} numberOfLines={1}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg || '#283618',
    paddingVertical: 20,
    paddingHorizontal: 28,
  },
  // Teljes szélességű felső rész
  topHero: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(254,250,224,0.08)',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: Platform.select({ web: 44, default: 36 }),
    fontWeight: '950',
    color: COLORS.gold || '#DDA15E',
    letterSpacing: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#FEFAE0',
    opacity: 0.75,
    marginTop: 4,
    textAlign: 'center',
  },
  // Alsó kétoszlopos elrendezés
  mainContentRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 28,
  },
  // Bal hasáb (Kompaktabb méretre szabva)
  leftDashboardColumn: {
    flex: 4.5, 
    gap: 14,
    justifyContent: 'flex-start',
  },
  // Jobb hasáb (Nagyobb súly a gomboknak)
  rightMenuColumn: {
    flex: 5.5,
    justifyContent: 'center',
  },
  // Kisebb, áramvonalasított XP Panel
  xpPanelCompact: {
    backgroundColor: 'rgba(254,250,224,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.1)',
    borderRadius: 20,
    padding: 16,
  },
  xpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpPanelTitle: {
    color: COLORS.gold || '#DDA15E',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  xpSubTitle: {
    color: '#FEFAE0',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  xpHighlight: {
    fontWeight: '900',
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  // Kisebb Progress Bar
  progressBarOuter: {
    height: 10, // Vékonyabb csík
    backgroundColor: 'rgba(254,250,224,0.08)',
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 10,
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: COLORS.gold || '#DDA15E',
    borderRadius: 5,
  },
  packStatusRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
    marginTop: 2,
  },
  packDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  packDotDone: {
    backgroundColor: '#606C38',
    borderColor: '#7d8d49',
  },
  packDotActive: {
    backgroundColor: COLORS.action || '#BC6C25',
    borderColor: '#e2873a',
  },
  packDotText: {
    color: '#FEFAE0',
    fontSize: 10,
    fontWeight: '800',
  },
  // Feature kártyák csoportja
  cardsColumn: {
    gap: 8,
  },
  featureCard: {
    backgroundColor: 'rgba(254,250,224,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.06)',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#FEFAE0',
    fontSize: 12,
    fontWeight: '800',
  },
  cardDesc: {
    color: 'rgba(254,250,224,0.45)',
    fontSize: 10,
  },
});