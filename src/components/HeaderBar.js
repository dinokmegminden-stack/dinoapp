import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const dinoLogo = require('../../assets/images/dino_logo.png');
import AppInfoModal from './AppInfoModal';
import RankModal from './RankModal';
import ProgressRing from './ProgressRing';
import { getTotalXP } from './XPBar';
import { recordAndGetStreak } from '../utils/dailyStreak';
import { rankForXP } from '../utils/ranks';
import { overallCompletionRatio } from '../utils/regionProgress';
import { playSound } from '../audio/audioSystem';
import { COLORS, RADIUS, FONTS, TEXT_OPACITY } from '../constants/theme';
import { isGuestMode } from '../utils/guestMode';

const YOUTUBE_URL = 'https://www.youtube.com/@dinokmegminden';

function XPPill({ onPress }) {
  const [xp, setXP] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    getTotalXP().then(setXP);
    const interval = setInterval(() => {
      getTotalXP().then(setXP);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const { rank } = rankForXP(xp);

  return (
    <Pressable
      style={[
        styles.xpPill,
        hovered && styles.xpPillHovered,
        pressed && styles.xpPillPressed,
        focused && styles.roundBtnFocused,
      ]}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      accessibilityRole="button"
      accessibilityLabel={`XP Ranglétrák: ${xp} XP`}
    >
      <Text style={styles.xpPillIcon}>{rank.icon}</Text>
      <Text style={styles.xpPillText}>{xp} XP</Text>
    </Pressable>
  );
}

function StreakPill({ days }) {
  if (days == null) return null;
  return (
    <View style={styles.streakPill}>
      <MaterialCommunityIcons name="fire" size={15} color={COLORS.accent} />
      <Text style={styles.streakPillText}>{days} nap</Text>
    </View>
  );
}

function RoundIconButton({ icon, onPress, tooltip, secondary }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.roundBtnWrap}>
      <Pressable
        style={[
          styles.roundBtn,
          secondary && styles.roundBtnSecondary,
          hovered && styles.roundBtnHovered,
          pressed && styles.roundBtnPressed,
          focused && styles.roundBtnFocused,
        ]}
        onPress={onPress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <MaterialCommunityIcons name={icon} size={secondary ? 15 : 18} color={COLORS.cream} style={secondary && styles.roundBtnIconSecondary} />
      </Pressable>
      {!!tooltip && hovered && (
        <View style={styles.accountTooltip} pointerEvents="none">
          <Text style={styles.accountTooltipText} numberOfLines={1}>{tooltip}</Text>
        </View>
      )}
    </View>
  );
}

function ProgressCircle({ ratio, onPress }) {
  const [focused, setFocused] = useState(false);
  const pct = Math.round((ratio || 0) * 100);
  return (
    <Pressable
      style={[styles.progressCircleBtn, focused && styles.roundBtnFocused]}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      accessibilityRole="button"
      accessibilityLabel={`Gyűjtemény ${pct}%`}
    >
      <ProgressRing size={40} stroke={3.5} ratio={ratio || 0} color="#a9cf6b" trackColor="rgba(254,250,224,0.18)">
        <Text style={styles.progressCircleText}>{pct}%</Text>
      </ProgressRing>
    </Pressable>
  );
}

function NavLink({ label, active, onPress }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
    >
      <Text style={[styles.navLink, (active || hovered) && styles.navLinkActive]}>{label}</Text>
    </Pressable>
  );
}

export default function HeaderBar({
  nickname,
  progress,
  currentView = 'landing',
  onNavigate,
}) {
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;
  const [infoOpen, setInfoOpen] = useState(false);
  const [rankOpen, setRankOpen] = useState(false);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(null);

  useEffect(() => {
    getTotalXP().then(setXp);
    const t = setInterval(() => getTotalXP().then(setXp), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    recordAndGetStreak().then(setStreak);
  }, []);

  const handleNav = (targetView) => {
    playSound('click');
    onNavigate?.(targetView);
  };

  const handleOpenYoutube = () => {
    playSound('click');
    Linking.openURL(YOUTUBE_URL);
  };

  const handleOpenInfo = () => {
    playSound('click');
    setInfoOpen(true);
  };

  const handleOpenRank = () => {
    playSound('click');
    setRankOpen(true);
  };

  const collectionRatio = overallCompletionRatio(progress || {});

  return (
    <>
      <View style={[styles.headerBar, isWide && styles.headerBarWide]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.brand} onPress={() => handleNav('landing')}>
            <Image source={dinoLogo} style={styles.brandLogo} resizeMode="contain" />
            <Text style={styles.brandText}>Dínó Lexikon</Text>
          </Pressable>

          {isWide && (
            <View style={styles.navLinks}>
              <NavLink label="Kezdőlap" active={currentView === 'landing'} onPress={() => handleNav('landing')} />
              <NavLink label="Játékok" active={currentView === 'gaming'} onPress={() => handleNav('gaming')} />
              <NavLink label="Gyűjtemény" active={currentView === 'collection'} onPress={() => handleNav('collection')} />
              <NavLink label="Ranglista" active={currentView === 'leaderboard'} onPress={() => handleNav('leaderboard')} />
              <NavLink label="Hírek" active={currentView === 'news'} onPress={() => handleNav('news')} />
              <NavLink label="Kutatók" active={currentView === 'kutatok'} onPress={() => handleNav('kutatok')} />
            </View>
          )}
        </View>

        <View style={styles.headerIcons}>
          <StreakPill days={streak} />
          <XPPill onPress={handleOpenRank} />
          <ProgressCircle ratio={collectionRatio} onPress={() => handleNav('collection')} />
          <RoundIconButton
            icon="account-circle"
            onPress={() => handleNav(isGuestMode() ? 'nicknamePicker' : 'dashboard')}
            tooltip={isGuestMode() ? 'Vendég — koppints a regisztrációhoz' : nickname}
          />
          <RoundIconButton icon="youtube" onPress={handleOpenYoutube} tooltip="YouTube" />
          <RoundIconButton icon="information" onPress={handleOpenInfo} tooltip="Info" />
        </View>
      </View>

      <AppInfoModal visible={infoOpen} onClose={() => setInfoOpen(false)} />
      <RankModal visible={rankOpen} onClose={() => setRankOpen(false)} xp={xp} />
    </>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 20,
    gap: 16,
  },
  headerBarWide: {
    paddingHorizontal: 40,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  brandLogo: {
    width: 38,
    height: 38,
  },
  brandText: {
    color: COLORS.cream,
    fontSize: 20,
    fontFamily: FONTS.heading,
    opacity: TEXT_OPACITY.primary,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
  navLink: {
    color: COLORS.cream,
    fontSize: 14.5,
    fontFamily: FONTS.bodyBold,
    opacity: TEXT_OPACITY.secondary,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  navLinkActive: {
    color: COLORS.accent,
    opacity: TEXT_OPACITY.primary,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139,86,48,0.55)',
    borderRadius: RADIUS.pill,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  streakPillText: {
    color: COLORS.cream,
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    letterSpacing: 0.3,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20,18,16,0.7)',
    borderRadius: RADIUS.pill,
    paddingVertical: 7,
    paddingHorizontal: 14,
    ...Platform.select({
      web: {
        transitionProperty: 'background-color, transform',
        transitionDuration: '120ms',
        cursor: 'pointer',
      },
    }),
  },
  xpPillHovered: {
    backgroundColor: COLORS.bgMidLight,
  },
  xpPillPressed: {
    transform: [{ scale: 0.94 }],
  },
  xpPillIcon: {
    fontSize: 15,
  },
  xpPillText: {
    color: COLORS.cream,
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    letterSpacing: 0.3,
  },
  progressCircleBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  progressCircleText: {
    color: COLORS.cream,
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
  },
  roundBtnWrap: {
    position: 'relative',
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(20,18,16,0.7)',
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
  roundBtnSecondary: {
    width: 34,
    height: 34,
    backgroundColor: 'rgba(20,18,16,0.5)',
  },
  roundBtnHovered: {
    backgroundColor: COLORS.bgMidLight,
  },
  roundBtnPressed: {
    transform: [{ scale: 0.9 }],
  },
  roundBtnFocused: {
    ...Platform.select({
      web: {
        outlineStyle: 'solid',
        outlineWidth: 2,
        outlineColor: COLORS.accent,
        outlineOffset: 2,
      },
    }),
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
    fontFamily: FONTS.bodyBold,
  },
});
