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
import { playSound, getSoundMuted, setSoundMuted } from '../audio/audioSystem';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MUTE_KEY = 'dmm_sound_muted';
import { COLORS, RADIUS, FONTS, TEXT_OPACITY } from '../constants/theme';
import { isGuestMode } from '../utils/guestMode';
import { useT } from '../i18n';

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
        accessibilityRole="button"
        accessibilityLabel={tooltip}
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
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={[styles.navLinkWrap, hovered && styles.navLinkWrapHovered]}
    >
      <Text
        style={[
          styles.navLink,
          (active || hovered) && styles.navLinkActive,
          hovered && styles.navLinkHoveredText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function HeaderBar({
  nickname,
  progress,
  currentView = 'landing',
  onNavigate,
}) {
  const { t, lang, setLanguage } = useT();
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;
  const isNarrow = width < 700;
  const guest = isGuestMode();
  const [infoOpen, setInfoOpen] = useState(false);
  const [rankOpen, setRankOpen] = useState(false);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(null);
  const [muted, setMuted] = useState(getSoundMuted());

  // Némítás-állapot betöltése induláskor (perzisztens, eszközön belül).
  useEffect(() => {
    AsyncStorage.getItem(MUTE_KEY).then((v) => {
      if (v === '1') { setSoundMuted(true); setMuted(true); }
    }).catch(() => {});
  }, []);

  const handleToggleMute = () => {
    const next = !muted;
    setSoundMuted(next);
    setMuted(next);
    if (!next) playSound('click'); // csak visszakapcsoláskor van értelme hangnak
    AsyncStorage.setItem(MUTE_KEY, next ? '1' : '0').catch(() => {});
  };

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
      <View style={styles.headerTexture}>
      <View style={[styles.headerBar, isWide && styles.headerBarWide]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.brand} onPress={() => handleNav('landing')}>
            <Image source={dinoLogo} style={styles.brandLogo} resizeMode="contain" />
            {!isNarrow && <Text style={styles.brandText}>DMM Lexikon</Text>}
          </Pressable>

          {isWide && (
            <View style={styles.navLinks}>
              <NavLink label={t('nav.home')} active={currentView === 'landing'} onPress={() => handleNav('landing')} />
              <NavLink label={t('nav.games')} active={currentView === 'gaming'} onPress={() => handleNav('gaming')} />
              <NavLink label={t('nav.catalog')} active={currentView === 'collection'} onPress={() => handleNav('collection')} />
              {!guest && <NavLink label={t('nav.album')} active={currentView === 'album'} onPress={() => handleNav('album')} />}
              <NavLink label={t('nav.news')} active={currentView === 'news'} onPress={() => handleNav('news')} />
              <NavLink label={t('nav.researchers')} active={currentView === 'kutatok'} onPress={() => handleNav('kutatok')} />
            </View>
          )}
        </View>

        <View style={styles.headerIcons}>
          {/* "Vezérlőpult" csoport: haladás/XP/profil, egy közös keretben. */}
          <View style={styles.dashboardGroup}>
            {!guest && <StreakPill days={streak} />}
            {!guest && <XPPill onPress={handleOpenRank} />}
            {!guest && (
              <ProgressCircle ratio={collectionRatio} onPress={() => handleNav('collection')} />
            )}
            {!guest && (
              <RoundIconButton
                icon="account-circle"
                onPress={() => handleNav('dashboard')}
                tooltip={nickname}
              />
            )}
            <RoundIconButton
              icon={muted ? 'volume-off' : 'volume-high'}
              onPress={handleToggleMute}
              tooltip={muted ? t('header.sound_on') : t('header.sound_off')}
            />
            {/* Nyelvváltó: HU ↔ EN (2 nyelvnél elég egy pill, ami a MÁSIK
                nyelvet mutatja és arra vált). */}
            <Pressable
              style={styles.langBtn}
              onPress={() => setLanguage(lang === 'hu' ? 'en' : 'hu')}
              accessibilityRole="button"
              accessibilityLabel={t('lang.label')}
            >
              <Text style={styles.langBtnText}>{lang === 'hu' ? 'EN' : 'HU'}</Text>
            </Pressable>
            {!isNarrow && <RoundIconButton icon="youtube" onPress={handleOpenYoutube} tooltip="YouTube" />}
            {!isNarrow && <RoundIconButton icon="information" onPress={handleOpenInfo} tooltip="Info" />}
          </View>
          {guest && (
            <View style={styles.authButtons}>
              <Pressable style={styles.loginBtn} onPress={() => handleNav('login')} accessibilityRole="button">
                <Text style={styles.loginBtnText}>{t('auth.login')}</Text>
              </Pressable>
              <Pressable style={styles.joinBtn} onPress={() => handleNav('join')} accessibilityRole="button">
                <Text style={styles.joinBtnText}>{t('auth.join')}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
      </View>

      <AppInfoModal visible={infoOpen} onClose={() => setInfoOpen(false)} />
      <RankModal visible={rankOpen} onClose={() => setRankOpen(false)} xp={xp} />
    </>
  );
}

const styles = StyleSheet.create({
  // Finom, sötét, texturált fejléc-sáv — kőerezet-hatás rétegzett, halvány
  // átlós csíkokkal (repeating-linear-gradient), hogy elváljon a landing
  // alatta lévő T-rex hátterétől.
  headerTexture: {
    width: '100%',
    backgroundColor: 'rgba(8,10,10,0.86)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(238,155,0,0.16)',
    ...Platform.select({
      web: {
        backgroundImage:
          'repeating-linear-gradient(135deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 2px, transparent 2px, transparent 8px), ' +
          'linear-gradient(180deg, rgba(30,26,22,0.94) 0%, rgba(10,9,8,0.9) 100%)',
        boxShadow: '0 2px 14px rgba(0,0,0,0.35)',
      },
    }),
  },
  dashboardGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(254,250,224,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.08)',
  },
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
    gap: 6,
  },
  navLinkWrap: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transitionProperty: 'background-color',
        transitionDuration: '150ms',
      },
    }),
  },
  navLinkWrapHovered: {
    backgroundColor: 'rgba(221,161,94,0.16)',
  },
  navLink: {
    color: COLORS.cream,
    fontSize: 14.5,
    fontFamily: FONTS.bodyBold,
    opacity: TEXT_OPACITY.secondary,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transitionProperty: 'font-size, color, opacity',
        transitionDuration: '150ms',
      },
    }),
  },
  navLinkActive: {
    color: COLORS.accent,
    opacity: TEXT_OPACITY.primary,
  },
  navLinkHoveredText: {
    fontSize: 16.5,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 4,
  },
  langBtn: {
    minWidth: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    backgroundColor: 'rgba(20,18,16,0.7)',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  langBtnText: {
    color: COLORS.cream,
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  joinBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
    paddingVertical: 9,
    paddingHorizontal: 18,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 0 0 1px rgba(238,155,0,0.4), 0 4px 14px rgba(238,155,0,0.35)',
        transitionProperty: 'background-color, transform, box-shadow',
        transitionDuration: '120ms',
      },
    }),
  },
  joinBtnText: {
    color: COLORS.bgDark,
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
  },
  loginBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(254,250,224,0.35)',
    borderRadius: RADIUS.pill,
    paddingVertical: 8,
    paddingHorizontal: 16,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transitionProperty: 'background-color, border-color',
        transitionDuration: '120ms',
      },
    }),
  },
  loginBtnText: {
    color: COLORS.cream,
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
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
