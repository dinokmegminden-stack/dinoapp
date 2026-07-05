// LandingPage.js
console.log("LANDING PAGE RENDER - HIGH-FIDELITY GAMIFIED LANDSCAPE");

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

  // Gamification adatok
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
        
        {/* === BAL OLDAL: SZÉLES DASHBOARD ÉS INFORMÁCIÓK (70%) === */}
        <View style={styles.leftContent}>
          
          {/* Főcím rész - nem nyomódik össze */}
          <View style={styles.hero}>
            <Text style={styles.mainTitle}>DÍNÓ TUDÓS</Text>
            <Text style={styles.subtitle}>
              Gyűjtsd össze a kártyákat, oldd meg a kvízeket, és válj paleontológus szakértővé!
            </Text>
          </View>

          {/* Széles elrendezés: A 3 kártya és a nagy XP panel egymás mellett fekszik tágasan */}
          <View style={styles.dashboardRow}>
            
            {/* Kis infó kártyák oszlopa */}
            <View style={styles.cardsColumn}>
              <FeatureCard icon="🎴" title="Kártyagyűjtemény" desc="51 dínó fajta 5 kontinensen." />
              <FeatureCard icon="🧠" title="Dínó Kvízek" desc="ABCD kérdések minden lényről." />
              <FeatureCard icon="🌍" title="Felfedezés" desc="Kárpát-medence és a nagyvilág." />
            </View>

            {/* Professzor Szint Kiemelt Panel */}
            <View style={styles.xpPanel}>
              <View style={styles.xpHeaderRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.xpPanelTitle}>PROFESSZOR SZINT</Text>
                  <Text style={styles.xpSubTitle}>
                    HALADÁS: <Text style={styles.xpHighlight}>{playerStats.currentXp} / {playerStats.maxXp} XP</Text>
                  </Text>
                </View>
                <View style={styles.avatarWrap}>
                  <Text style={styles.avatarEmoji}>🤠</Text>
                </View>
              </View>

              {/* Széles, jól látható Haladási Csík */}
              <View style={styles.progressBarOuter}>
                <View style={[styles.progressBarInner, { width: progressPercent }]} />
              </View>

              {/* Lakatok és pipák vízszintes, tágas sora */}
              <View style={styles.packStatusRow}>
                <View style={[styles.packDot, styles.packDotDone]}><Text style={styles.packDotText}>✓</Text></View>
                <View style={[styles.packDot, styles.packDotDone]}><Text style={styles.packDotText}>✓</Text></View>
                <View style={[styles.packDot, styles.packDotActive]}><Text style={styles.packDotText}>🔒</Text></View>
                <View style={styles.packDot}><Text style={styles.packDotText}>🔒</Text></View>
                <View style={styles.packDot}><Text style={styles.packDotText}>🔒</Text></View>
              </View>
              
              <Text style={styles.packMetaText}>
                {playerStats.passedPacks} CSOMAG KÉSZ • {playerStats.totalPacks - playerStats.passedPacks} ZÁRVA
              </Text>
            </View>

          </View>
        </View>

        {/* === JOBB OLDAL: LEBEGŐ RÉGIÓNAVIGÁCIÓ (30%) === */}
        {/* Nincs sötétkék háttér, teljesen áttetsző, így a gombok lebegnek a zöldön */}
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
    flexDirection: 'row', 
    backgroundColor: COLORS.bg || '#283618',
    paddingVertical: 24,
    paddingHorizontal: 32, // Nagyobb oldalsó térköz a szétterülésért
    gap: 32, // Tágas rés a bal és jobb oldal között
  },
  leftContent: {
    flex: 6.8, // Széles tartomány a dashboardnak
    justifyContent: 'space-between',
  },
  rightMenuColumn: {
    flex: 3.2, // Kézre álló szélesség a gomboknak
    justifyContent: 'center',
    // ELTÁVOLÍTVA: minden merev háttérszín és keret, hogy a gombok szabadon lebegjenek
  },
  hero: {
    alignItems: 'flex-start', // Balra zárt a stabilabb struktúráért fekvőben
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: Platform.select({ web: 46, default: 38 }),
    fontWeight: '950',
    color: COLORS.gold || '#DDA15E',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#FEFAE0',
    opacity: 0.75,
    marginTop: 6,
    lineHeight: 20,
  },
  dashboardRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 24, // Tágas hely a panelek között
    alignItems: 'stretch',
  },
  cardsColumn: {
    flex: 1, // Egyenlő arányban osztozik a hellyel az XP panellel
    gap: 12,
    justifyContent: 'center',
  },
  featureCard: {
    backgroundColor: 'rgba(254,250,224,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.12)',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 20,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#FEFAE0',
    fontSize: 14,
    fontWeight: '800',
  },
  cardDesc: {
    color: 'rgba(254,250,224,0.55)',
    fontSize: 11,
    marginTop: 2,
  },
  // Kiterjesztett XP Panel stílus
  xpPanel: {
    flex: 1.2, // Kicsit szélesebb, mint a kis kártyák oszlopa
    backgroundColor: 'rgba(254,250,224,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.12)',
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
  },
  xpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpPanelTitle: {
    color: COLORS.gold || '#DDA15E',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  xpSubTitle: {
    color: '#FEFAE0',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  xpHighlight: {
    color: '#FEFAE0',
    fontWeight: '900',
  },
  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 30,
  },
  progressBarOuter: {
    height: 16,
    backgroundColor: 'rgba(254,250,224,0.1)',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 16,
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: COLORS.gold || '#DDA15E',
    borderRadius: 8,
  },
  packStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Szééthúzzuk a pöttyöket, hogy kitöltsék a teret
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  packDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.16)',
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
    fontSize: 13,
    fontWeight: '800',
  },
  packMetaText: {
    color: 'rgba(254,250,224,0.45)',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});