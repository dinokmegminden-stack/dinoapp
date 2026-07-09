// LandingPage — redesign spec 3. pont: header sáv (XP pill + ikon gombok),
// döntött logó blokk, majd a LandingMenu szekciói egyetlen oszlopban.
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StatusBar,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Shell from '../components/Shell';
import HeroTop from '../components/HeroTop';
import LandingMenu from './LandingMenu';
import { playSound, getSoundMuted, setSoundMuted } from '../audio/audioSystem';
import { getTotalXP } from '../components/XPBar';
import { COLORS, RADIUS } from '../constants/theme';

// Kísérlet: háttér-illusztráció a menügombok mögött — kivehető, ha nem válik be.
// Csak asztali nézetben jelenik meg, mobilon túl zsúfolt lenne.
const bgDino = require('../../assets/images/bg.png');
const DESKTOP_BREAKPOINT = 700;

function XPPill() {
  const [xp, setXP] = useState(0);

  useEffect(() => {
    getTotalXP().then(setXP);
    const interval = setInterval(() => {
      getTotalXP().then(setXP);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.xpPill}>
      <MaterialCommunityIcons name="star" size={16} color={COLORS.bgDark} />
      <Text style={styles.xpPillText}>{xp} XP</Text>
    </View>
  );
}

function RoundIconButton({ icon, onPress }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      style={[
        styles.roundBtn,
        hovered && styles.roundBtnHovered,
        pressed && styles.roundBtnPressed,
      ]}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <MaterialCommunityIcons name={icon} size={18} color={COLORS.cream} />
    </Pressable>
  );
}

export default function LandingPage({ onEnterRegion, onOpenGallery, onStartLightningQuiz, onStartMillionaire, onStartMemory }) {
  const [muted, setMuted] = useState(getSoundMuted());
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  const toggleMute = () => {
    const next = !getSoundMuted();
    setSoundMuted(next);
    setMuted(next);
  };

  const handleSelectRegion = (eduLevel) => {
    playSound('click');
    onEnterRegion(eduLevel);
  };

  const handleOpenGallery = () => {
    playSound('click');
    onOpenGallery?.();
  };

  const handleStartLightningQuiz = () => {
    playSound('click');
    onStartLightningQuiz?.();
  };

  const handleStartMillionaire = () => {
    playSound('click');
    onStartMillionaire?.();
  };

  const handleStartMemory = () => {
    playSound('click');
    onStartMemory?.();
  };

  return (
    <Shell gradientColors={[COLORS.bgDark, COLORS.bgMid]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.column}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

          {/* 1. Header sáv: XP pill balra, ikon gombok jobbra */}
          <View style={styles.headerBar}>
            <XPPill />
            <View style={styles.headerIcons}>
              <RoundIconButton icon={muted ? 'volume-off' : 'volume-high'} onPress={toggleMute} />
              <RoundIconButton icon="account-circle" onPress={() => playSound('click')} />
            </View>
          </View>

          {/* 2. Logó blokk (döntött cím, accent alcím) */}
          <HeroTop />

          {/* 3–5. Menü szekciók — a háttérkép mögöttük ül, nem blokkolja a koppintást */}
          <View style={styles.menuWrapper}>
            {isDesktop && (
              <Image
                source={bgDino}
                style={[styles.bgDino, { height: height * 0.7 }]}
                pointerEvents="none"
              />
            )}
            <LandingMenu
              onSelectRegion={handleSelectRegion}
              onOpenGallery={handleOpenGallery}
              onLightningQuiz={handleStartLightningQuiz}
              onMillionaire={handleStartMillionaire}
              onMemory={handleStartMemory}
            />
          </View>
        </View>
      </ScrollView>
    </Shell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 32,
  },
  column: {
    width: '100%',
    maxWidth: 520,
    paddingHorizontal: 20,
  },
  menuWrapper: {
    position: 'relative',
  },
  bgDino: {
    position: 'fixed',
    top: -20,
    left: '50%',
    marginLeft: '-162.5%',
    width: '325%',
    opacity: 0.16,
    resizeMode: 'contain',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.pill,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  xpPillText: {
    color: COLORS.bgDark,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgMid,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        transitionProperty: 'background-color, transform',
        transitionDuration: '120ms',
        cursor: 'pointer',
      },
    }),
  },
  roundBtnHovered: {
    backgroundColor: COLORS.bgMidLight,
  },
  roundBtnPressed: {
    transform: [{ scale: 0.9 }],
  },
  roundBtnIcon: {
    fontSize: 18,
  },
});
