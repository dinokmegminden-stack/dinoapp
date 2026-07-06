// LandingPage.js
console.log("LANDING PAGE RENDER - WIDE HERO & COMPACT XP");


import Shell from '../components/Shell';
import HeroTop from '../components/HeroTop';
import LandingMenu from './LandingMenu';
import { playSound } from '../audio/audioSystem';
import { COLORS } from '../constants/colors';
import { View, Text, StatusBar, StyleSheet } from 'react-native';

export default function LandingPage({ onEnterRegion }) {
  const handleSelectRegion = (eduLevel) => {
    playSound('click');
    onEnterRegion(eduLevel);
  };

  const playerStats = {
    currentXp: 4500,
    maxXp: 6000,
  };

  const progressPercent = `${Math.min((playerStats.currentXp / playerStats.maxXp) * 100, 100)}%`;

  return (
    <Shell>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg || '#283618'} />

        <HeroTop />

        <View style={styles.mainContentRow}>

          <View style={styles.leftDashboardColumn}>

            
            <View style={styles.cardsColumn}>
              <FeatureCard icon="🎴" title="Kártyagyűjtemény" desc="51 dínó fajta 5 kontinensen." />
              <FeatureCard icon="🧠" title="Dínó Kvízek" desc="ABCD kérdések minden lényről." />
            </View>

            <View style={{ flex: 1 }} />

            <View style={styles.progressBarSection}>
              <View style={styles.progressBarOuter}>
                <View style={[styles.progressBarInner, { width: progressPercent }]} />
              </View>
              <View style={styles.packStatusRow}>
                <View style={[styles.packDot, styles.packDotDone]}><Text style={styles.packDotText}>✓</Text></View>
                <View style={[styles.packDot, styles.packDotDone]}><Text style={styles.packDotText}>✓</Text></View>
                <View style={[styles.packDot, styles.packDotActive]}><Text style={styles.packDotText}>🔒</Text></View>
                <View style={styles.packDot}><Text style={styles.packDotText}>🔒</Text></View>
                <View style={styles.packDot}><Text style={styles.packDotText}>🔒</Text></View>
              </View>
            </View>
            <View style={styles.xpPanelCompact}>
              <View style={styles.xpHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.xpPanelTitle}>PROFESSZOR SZINT</Text>
                  <Text style={styles.xpSubTitle}>
                    HALADÁS: <Text style={styles.xpHighlight}>{playerStats.currentXp} / {playerStats.maxXp} XP</Text>
                  </Text>
                </View>
                <View style={styles.avatarWrap}>
                  <Text style={styles.avatarEmoji}>🎓</Text>
                </View>
              </View>
            </View>

          </View>

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
  },
  mainContentRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 28,
    paddingVertical: 20,
    paddingHorizontal: 28,
  },
  leftDashboardColumn: {
    flex: 4.5,
    gap: 14,
    justifyContent: 'flex-start',
  },
  rightMenuColumn: {
    flex: 5.5,
    justifyContent: 'center',
  },
  xpPanelCompact: {
    backgroundColor: 'rgba(254,250,224,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.1)',
    borderRadius: 20,
    padding: 14,
  },
  xpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpPanelTitle: {
    color: COLORS.gold || '#DDA15E',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  xpSubTitle: {
    color: '#FEFAE0',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  xpHighlight: {
    fontWeight: '900',
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
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
  progressBarSection: {
    minHeight: 120,
    justifyContent: 'center',
    gap: 14,
  },
  progressBarOuter: {
    height: 12,
    backgroundColor: 'rgba(254,250,224,0.08)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: COLORS.gold || '#DDA15E',
    borderRadius: 6,
  },
  packStatusRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 6,
  },
  packDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
});