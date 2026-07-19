// LandingPage — redesign spec 3. pont: header sáv (XP pill + ikon gombok),
// döntött logó blokk, majd a LandingMenu szekciói egyetlen oszlopban.
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
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
import PrimaryCTA from '../components/PrimaryCTA';
import DailyDinoCard from '../components/DailyDinoCard';
import LandingMenu from './LandingMenu';
import { playSound, getSoundMuted, setSoundMuted } from '../audio/audioSystem';
import { getTotalXP } from '../components/XPBar';
import { findNextPack, overallCompletionRatio } from '../utils/regionProgress';
import { COLORS, RADIUS } from '../constants/theme';

// Teljes oldalas háttérkép — csak asztali (web, >=700px) nézetben, a Shell rendereli
// (lásd Shell.js backgroundImage prop), sötét overlay-jel a gombok olvashatóságáért.
const landingBg = require('../../assets/images/new_bg.jpg');

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

// A gyűjtemény korábban egy külön, teljes szélességű sávban élt a menüben —
// most a fejlécben, a ranglista-ikon mellett kapott helyet, a már kinyitott
// kártyák arányával a pici ikon fölött, hogy állandóan látszódjon.
function CollectionIconButton({ ratio, onPress }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const pct = Math.round((ratio || 0) * 100);

  return (
    <View style={styles.collectionIconWrap}>
      <Text style={styles.collectionIconPct}>{pct}%</Text>
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
        <MaterialCommunityIcons name="image-multiple" size={18} color={COLORS.cream} />
      </Pressable>
    </View>
  );
}

export default function LandingPage({ nickname, progress, allDinos, onEnterRegion, onOpenGallery, onOpenLeaderboard, onStartLightningQuiz, onStartMillionaire, onStartMemory, onStartWhoAmI }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;
  const [muted, setMuted] = useState(getSoundMuted());

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

  const handleOpenLeaderboard = () => {
    playSound('click');
    onOpenLeaderboard?.();
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

  const handleStartWhoAmI = () => {
    playSound('click');
    onStartWhoAmI?.();
  };

  const handleStartAdventure = () => {
    playSound('click');
    const next = findNextPack(progress || {});
    onEnterRegion(next ? next.eduLevel : 1);
  };

  const handleDailyDinoPress = (dino) => {
    playSound('click');
    onEnterRegion(dino?.edu || 1);
  };

  const collectionRatio = overallCompletionRatio(progress || {});

  // Régiónkénti fajszám az allDinos (App.js már betölti mind a 6 edu-t egyszer)
  // csoportosításából — így az összeg mindig pontosan egyezik a hero-ban írt
  // összlény-számmal, nem kell külön Supabase-lekérdezés.
  const regionCounts = useMemo(() => {
    const counts = {};
    (allDinos || []).forEach((d) => {
      counts[d.edu] = (counts[d.edu] || 0) + 1;
    });
    return counts;
  }, [allDinos]);

  return (
    <Shell
      gradientColors={[COLORS.bgDark, COLORS.bgMid]}
      backgroundImage={landingBg}
      contentMaxWidth={isWide ? 1120 : undefined}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.column, isWide && styles.columnWide]}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

          {/* 1. Header sáv: XP pill balra, ikon gombok jobbra */}
          <View style={styles.headerBar}>
            <XPPill />
            <View style={styles.headerIcons}>
              <RoundIconButton icon="trophy" onPress={handleOpenLeaderboard} />
              <CollectionIconButton ratio={collectionRatio} onPress={handleOpenGallery} />
              <RoundIconButton icon={muted ? 'volume-off' : 'volume-high'} onPress={toggleMute} />
              <RoundIconButton icon="account-circle" onPress={() => playSound('click')} />
            </View>
          </View>

          {/* Desktopon (>=1024px) két oszlop: bal = logó/CTA/napi dínó, jobb = menü.
              Mobilon/tableten marad az eredeti, egy-oszlopos sorrend. */}
          <View style={[styles.mainArea, isWide && styles.mainAreaWide]}>
            <View style={[styles.leftCol, isWide && styles.leftColWide]}>
              {/* 2. Logó blokk (döntött cím, accent alcím) */}
              <HeroTop isWide={isWide} totalCreatures={allDinos?.length} />

              {/* 2b. Elsődleges CTA */}
              <PrimaryCTA onPress={handleStartAdventure} />

              {/* 2c. Napi Dínó flip-kártya — wide nézetben nyúljon le a jobb oszlop aljáig */}
              <DailyDinoCard allDinos={allDinos} onPress={handleDailyDinoPress} isWide={isWide} />
            </View>

            {/* 3–5. Menü szekciók */}
            <View style={[styles.rightCol, isWide && styles.rightColWide]}>
              <LandingMenu
                onSelectRegion={handleSelectRegion}
                onLightningQuiz={handleStartLightningQuiz}
                onMillionaire={handleStartMillionaire}
                onMemory={handleStartMemory}
                onWhoAmI={handleStartWhoAmI}
                regionCounts={regionCounts}
              />
            </View>
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
  columnWide: {
    maxWidth: 1120,
    paddingHorizontal: 32,
  },
  mainArea: {
    width: '100%',
  },
  mainAreaWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 32,
  },
  leftCol: {
    width: '100%',
  },
  leftColWide: {
    flex: 2,
  },
  rightCol: {
    width: '100%',
    position: 'relative',
  },
  rightColWide: {
    flex: 3,
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
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  collectionIconWrap: {
    alignItems: 'center',
  },
  collectionIconPct: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 2,
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
