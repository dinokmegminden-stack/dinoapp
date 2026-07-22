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

// tooltip: opcionális — ha van, hoverre egy kis buborékban megjelenik alatta
// (pl. a fiók-ikonnál a játékos neve, aminek eddig nem volt semmi funkciója).
function RoundIconButton({ icon, onPress, tooltip }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <View style={styles.roundBtnWrap}>
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
      {!!tooltip && hovered && (
        <View style={styles.accountTooltip} pointerEvents="none">
          <Text style={styles.accountTooltipText} numberOfLines={1}>{tooltip}</Text>
        </View>
      )}
    </View>
  );
}

// A gyűjtemény korábban egy külön, teljes szélességű sávban élt a menüben —
// most a fejlécben, a ranglista-ikon mellett kapott helyet, a már kinyitott
// kártyák arányával egy jelvényként az ikon elülső (bal felső) sarkán, rajta.
function CollectionIconButton({ ratio, onPress }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const pct = Math.round((ratio || 0) * 100);

  return (
    <View style={styles.collectionIconWrap}>
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
      <View style={styles.collectionBadge} pointerEvents="none">
        <Text style={styles.collectionBadgeText}>{pct}%</Text>
      </View>
    </View>
  );
}

export default function LandingPage({ nickname, progress, allDinos, onEnterRegion, onOpenGallery, onOpenLeaderboard, onOpenDashboard, onStartLightningQuiz, onStartMillionaire, onStartMemory, onStartWhoAmI, onStartRunner, onStartHangman }) {
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

  const handleOpenDashboard = () => {
    playSound('click');
    onOpenDashboard?.();
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

  const handleStartRunner = () => {
    playSound('click');
    onStartRunner?.();
  };

  const handleStartHangman = () => {
    playSound('click');
    onStartHangman?.();
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
      contentMaxWidth={isWide ? 1280 : undefined}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.column, isWide && styles.columnWide]}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

          {/* 1. Header sáv: XP pill + ikon gombok, mind jobbra rendezve */}
          <View style={styles.headerBar}>
            <View style={styles.headerIcons}>
              <XPPill />
              <RoundIconButton icon="trophy" onPress={handleOpenLeaderboard} />
              <CollectionIconButton ratio={collectionRatio} onPress={handleOpenGallery} />
              <RoundIconButton icon={muted ? 'volume-off' : 'volume-high'} onPress={toggleMute} />
              <RoundIconButton icon="account-circle" onPress={handleOpenDashboard} tooltip={nickname} />
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
                onRunner={handleStartRunner}
                onHangman={handleStartHangman}
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
    maxWidth: 1280,
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
    // 2:3 helyett 11:14 — a bal oszlop részesedése 40%-ról 44%-ra nő
    // (pontosan 10%-os relatív növekedés), a jobb oszlop 56%-ra csökken.
    flex: 11,
  },
  rightCol: {
    width: '100%',
    position: 'relative',
  },
  rightColWide: {
    flex: 14,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
    position: 'relative',
  },
  collectionBadge: {
    position: 'absolute',
    top: -6,
    left: -8,
    minWidth: 20,
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: COLORS.bgDark,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  collectionBadgeText: {
    color: COLORS.bgDark,
    fontSize: 9,
    fontWeight: '800',
  },
  roundBtnWrap: {
    position: 'relative',
  },
  accountTooltip: {
    position: 'absolute',
    top: 48,
    right: 0,
    zIndex: 20,
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    ...Platform.select({ web: { whiteSpace: 'nowrap' } }),
  },
  accountTooltipText: {
    color: COLORS.bgDark,
    fontSize: 13,
    fontWeight: '700',
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
