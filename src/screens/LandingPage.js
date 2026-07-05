// LandingPage.js
console.log("LANDING PAGE RENDER - GAMIFIED LANDSCAPE");

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

  // Statikus vagy backendről jövő XP / Progress adatok a dashboardhoz
  const playerStats = {
    currentXp: 4500,
    maxXp: 6000,
    passedPacks: 2,
    totalPacks: 5
  };

  // Kiszámoljuk a progress bar százalékát
  const progressPercent = `${Math.min((playerStats.currentXp / playerStats.maxXp) * 100, 100)}%`;

  return (
    <Shell>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg || '#283618'} />
        
        {/* === BAL OLDAL: CÍM + KÁRTYÁK + XP DASHBOARD === */}
        <View style={styles.leftContent}>
          
          {/* Főcím szekció */}
          <View style={styles.hero}>
            <Text style={styles.mainTitle}>DÍNÓ TUDÓS</Text>
            <Text style={styles.subtitle}>
              Gyűjtsd össze a kártyákat, oldd meg a kvízeket, és válj paleontológus szakértővé!
            </Text>
          </View>

          {/* Alsó elrendezés: 3 kis kártya balra, a hatalmas XP panel jobbra */}
          <View style={styles.dashboardRow}>
            
            {/* 3 darab Feature kártya függőlegesen egymás alatt */}
            <View style={styles.cardsColumn}>
              <FeatureCard icon="🎴" title="Kártyagyűjtemény" desc="51 dínó fajta 5 kontinensen." />
              <FeatureCard icon="🧠" title="Dínó Kvízek" desc="ABCD kérdések minden lényről." />
              <FeatureCard icon="🌍" title="Felfedezés" desc="Kárpát-medence és a nagyvilág." />
            </View>

            {/* A nagy, kiemelt XP és Haladási Dashboard panel */}
            <View style={styles.xpPanel}>
              <View style={styles.xpHeaderRow}>
                <View>
                  <Text style={styles.xpPanelTitle}>PROFESSZOR SZINT</Text>
                  <Text style={styles.xpSubTitle}>
                    HALADÁS: <Text style={styles.xpHighlight}>{playerStats.currentXp} / {playerStats.maxXp} XP</Text>
                  </Text>
                </View>
                {/* Kalapos dínó kutató emoji avatár helye */}
                <View style={styles.avatarWrap}>
                  <Text style={styles.avatarEmoji}>🤠</Text>
                </View>
              </View>

              {/* Egyedi Progress Bar csík */}
              <View style={styles.progressBarOuter}>
                <View style={[styles.progressBarInner, { width: progressPercent }]} />
              </View>

              {/* Csomagok státuszjelző pöttyei */}
              <View style={styles.packStatusRow}>
                <View style={[styles.packDot, styles.packDotDone]}><Text style={styles.packDotText}>✓</Text></View>
                <View style={[styles.packDot, styles.packDotDone]}><Text style={styles.packDotText}>✓</Text></View>
                <View style={[styles.packDot, styles.packDotActive]}><Text style={styles.packDotText}>🔒</Text></View>
                <View style={styles.packDot}><Text style={styles.packDotText}>🔒</Text></View>
                <View style={styles.packDot}><Text style={styles.packDotText}>🔒</Text></View>
              </View>
              
              <Text style={styles.packMetaText}>
                {playerStats.passedPacks} CSOMAG KÉSZ, {playerStats.totalPacks - playerStats.passedPacks} ZÁRVA
              </Text>
            </View>

          </View>
        </View>

        {/* === JOBB OLDAL: RÉGIÓVÁLASZTÓ MENÜ (LandingMenu) === */}
        <View style={styles.rightMenuColumn}>
          <LandingMenu onSelectRegion={handleSelectRegion} />
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
    flexDirection: 'row', // Fekvő nézet elrendezése
    backgroundColor: COLORS.bg || '#283618',
    padding: 20,
    gap: 20,
  },
  // Bal oldali nagy információs blokk
  leftContent: {
    flex: 7,
    justifyContent: 'space-between',
  },
  // Jobb oldali sáv a gomboknak (hüvelykujjhoz igazítva)
  rightMenuColumn: {
    flex: 3,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)', // Finom vizuális leválasztás a gombok mögött
    borderRadius: 20,
    padding: 12,
  },
  hero: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  mainTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.gold || '#DDA15E',
    letterSpacing: 3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#FEFAE0',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 550,
  },
  dashboardRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'stretch',
    marginBottom: 10,
  },
  cardsColumn: {
    flex: 4,
    gap: 10,
    justifyContent: 'center',
  },
  // Hatalmas XP doboz stílusa a mockup alapján
  xpPanel: {
    flex: 6,
    backgroundColor: 'rgba(254,250,224,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.12)',
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
  },
  xpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpPanelTitle: {
    color: COLORS.gold || '#DDA15E',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  xpSubTitle: {
    color: '#FEFAE0',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  xpHighlight: {
    color: '#FEFAE0',
    fontWeight: '900',
  },
  avatarWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  // Progress Bar
  progressBarOuter: {
    height: 16,
    backgroundColor: 'rgba(254,250,224,0.1)',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 12,
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: COLORS.gold || '#DDA15E', // Az arany csík a haladásnak
    borderRadius: 8,
  },
  // Csomag pöttyei
  packStatusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  packDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  packDotDone: {
    backgroundColor: '#606C38', // A zöld színed a stílusfájlból sikeres csomaghoz
    borderColor: '#7d8d49',
  },
  packDotActive: {
    backgroundColor: COLORS.action || '#BC6C25', // A terrakotta színed az aktív hártyához
    borderColor: '#e2873a',
  },
  packDotText: {
    color: '#FEFAE0',
    fontSize: 12,
    fontWeight: '700',
  },
  packMetaText: {
    color: 'rgba(254,250,224,0.5)',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  // Kis feature kártyák
  featureCard: {
    backgroundColor: 'rgba(254,250,224,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.08)',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 18,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#FEFAE0',
    fontSize: 13,
    fontWeight: '800',
  },
  cardDesc: {
    color: 'rgba(254,250,224,0.5)',
    fontSize: 10,
    marginTop: 1,
  },
});