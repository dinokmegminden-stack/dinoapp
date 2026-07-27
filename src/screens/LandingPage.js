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
  Image,
  Platform,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const dinoLogo = require('../../assets/images/dino_logo.png');
import Shell from '../components/Shell';
import HeaderBar from '../components/HeaderBar';
import HeroTop from '../components/HeroTop';
import PrimaryCTA from '../components/PrimaryCTA';
import DailyDinoCard from '../components/DailyDinoCard';
import AppInfoModal from '../components/AppInfoModal';
import RankModal from '../components/RankModal';
import CreatureMarquee from '../components/CreatureMarquee';
import ProgressRing from '../components/ProgressRing';
import RegionProgressDashboard from '../components/RegionProgressDashboard';
import MessageBoard from '../components/MessageBoard';
import LandingMenu from './LandingMenu';
import { playSound } from '../audio/audioSystem';
import { getTotalXP } from '../components/XPBar';
import { recordAndGetStreak } from '../utils/dailyStreak';
import { rankForXP } from '../utils/ranks';
import { isAdminNickname } from '../constants/admins';
import { fetchDinoNews, genusOf } from '../services/dinoNewsService';
import { findNextPack, overallCompletionRatio } from '../utils/regionProgress';
import { COLORS, RADIUS, FONTS, TEXT_OPACITY } from '../constants/theme';

// Teljes oldalas háttérkép — csak asztali (web, >=700px) nézetben, a Shell rendereli
// (lásd Shell.js backgroundImage prop), sötét overlay-jel a gombok olvashatóságáért.
const landingBg = require('../../assets/images/trexhead_bg.jpg');

const YOUTUBE_URL = 'https://www.youtube.com/@dinokmegminden';

// Hír dátuma magyar formátumban (2026. 07. 25.) — hibás/üres érték esetén üres.
function formatNewsDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}. ${m}. ${day}.`;
}

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

// Napi belépési széria (lokális, AsyncStorage) — barnás pill láng-ikonnal.
function StreakPill({ days }) {
  if (days == null) return null;
  return (
    <View style={styles.streakPill}>
      <MaterialCommunityIcons name="fire" size={15} color={COLORS.accent} />
      <Text style={styles.streakPillText}>{days} nap</Text>
    </View>
  );
}

// Az XP mellett élő, egyetlen belépési pont az összes játékmódhoz — a korábbi
// 6 külön landing-gomb helyett a GamingScreen-t nyitja meg (lásd App.js).
function GamingButton({ onPress }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      style={[
        styles.gamingBtn,
        hovered && styles.gamingBtnHovered,
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
      <MaterialCommunityIcons name="gamepad-variant" size={16} color={COLORS.bgDark} />
      <Text style={styles.gamingBtnText}>Játékok</Text>
    </Pressable>
  );
}

// tooltip: opcionális — ha van, hoverre egy kis buborékban megjelenik alatta
// (pl. a fiók-ikonnál a játékos neve, aminek eddig nem volt semmi funkciója).
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

// A gyűjtemény korábban egy külön, teljes szélességű sávban élt a menüben —
// most a fejlécben, a ranglista-ikon mellett kapott helyet, a már kinyitott
// kártyák arányával egy jelvényként az ikon elülső (bal felső) sarkán, rajta.
function CollectionIconButton({ ratio, onPress }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);
  const pct = Math.round((ratio || 0) * 100);

  return (
    <View style={styles.collectionIconWrap}>
      <Pressable
        style={[
          styles.roundBtn,
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
        <MaterialCommunityIcons name="image-multiple" size={18} color={COLORS.cream} />
      </Pressable>
      <View style={styles.collectionBadge} pointerEvents="none">
        <Text style={styles.collectionBadgeText}>{pct}%</Text>
      </View>
    </View>
  );
}

// Szöveges fő-navigációs link a fejléc bal oldalán (Kezdőlap/Játékok/…),
// hoverre és aktív állapotban accent-színnel kiemelve.
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

// Kör alakú haladásjelző a fejléc jobb oldalán — a gyűjtemény kinyitott
// arányát mutatja zöld SVG-gyűrűvel + százalékkal, a gyűjtemény-nézetet nyitja.
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

export default function LandingPage({ nickname, progress, allDinos, dinosError = false, dinosLoading = false, onRetryLoadDinos, onEnterRegion, onOpenGallery, onOpenLeaderboard, onOpenDashboard, onOpenGaming, onOpenNews, onRequireRegister }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;
  // 700–1023px: még egy oszlopos elrendezés, de a tartalom ne ragadjon a
  // mobilra szabott 520px-es korlátnál — levegősebb, tablet-méretű teret kap.
  const isTablet = width >= 700 && width < 1024;
  const [infoOpen, setInfoOpen] = useState(false);
  const [rankOpen, setRankOpen] = useState(false);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(null);

  // XP a rang-modálhoz (a fejléc XP-pilljével azonos forrás, könnyű pollozással).
  useEffect(() => {
    getTotalXP().then(setXp);
    const t = setInterval(() => getTotalXP().then(setXp), 1000);
    return () => clearInterval(t);
  }, []);

  // Lokális napi belépési széria — megnyitáskor regisztráljuk és kiírjuk.
  useEffect(() => {
    recordAndGetStreak().then(setStreak);
  }, []);

  // Betöltéskor dínóbőgés (mute-aware; weben az autoplay-tiltás miatt csak
  // felhasználói interakció után szólal meg — natívon azonnal).
  useEffect(() => {
    playSound('roar', { volume: 0.5 });
  }, []);

  // Dínós Hírek betöltése a sidebarhoz (legfrissebb elöl).
  const [news, setNews] = useState([]);
  useEffect(() => {
    fetchDinoNews(5).then(setNews);
  }, []);

  const handleOpenYoutube = () => {
    playSound('click');
    Linking.openURL(YOUTUBE_URL);
  };

  const handleOpenInfo = () => {
    playSound('click');
    setInfoOpen(true);
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

  const handleOpenGaming = () => {
    playSound('click');
    onOpenGaming?.();
  };

  const handleOpenNews = () => {
    playSound('click');
    onOpenNews?.();
  };

  const handleOpenRank = () => {
    playSound('click');
    setRankOpen(true);
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

  // A fejléc a Shell teljes böngésző-szélességű sávjaként jelenik meg (a Shell
  // `header` propján át), az inner belső tartalmon kívül. A sáv full-width, a
  // benne lévő tartalom vízszintes paddinggel igazodik.
  const handleNavigate = (targetView) => {
    if (targetView === 'landing') return;
    if (targetView === 'gaming') onOpenGaming?.();
    else if (targetView === 'collection') onOpenGallery?.();
    else if (targetView === 'leaderboard') onOpenLeaderboard?.();
    else if (targetView === 'news') onOpenNews?.();
    else if (targetView === 'dashboard') onOpenDashboard?.();
    else if (targetView === 'nicknamePicker') onRequireRegister?.();
  };

  const header = (
    <HeaderBar
      nickname={nickname}
      progress={progress}
      currentView="landing"
      onNavigate={handleNavigate}
    />
  );

  // Bal oldali sáv tartalma: Dínós Hírek → Napi Dínó → Üzenőfal. Wide nézetben a
  // sáv fix magasságú és belül görgethető (a tartalom túlnyúlhat a viewporton).
  const sidebarInner = (
    <>
      <Text style={styles.sidebarHeading}>NAPI DÍNÓ</Text>
      <DailyDinoCard allDinos={allDinos} onPress={handleDailyDinoPress} isWide={false} />

      <Text style={[styles.sidebarHeading, styles.sidebarHeadingSpaced]}>DÍNÓS HÍREK</Text>
      {news.length === 0 ? (
        <View style={styles.newsPlaceholder}>
          <MaterialCommunityIcons name="newspaper-variant-outline" size={22} color={COLORS.accent} />
          <Text style={styles.newsText}>
            Hamarosan: friss dínós hírek, felfedezések és app-frissítések.
          </Text>
        </View>
      ) : (
        <View style={styles.newsList}>
          {news.map((item) => (
            <Pressable
              key={item.id}
              style={styles.newsItem}
              onPress={handleOpenNews}
              accessibilityRole="button"
            >
              <Text style={styles.newsDate}>{formatNewsDate(item.published_at)}</Text>
              <Text style={styles.newsTitle} numberOfLines={1}>
                {genusOf(item.scientific_name) || item.scientific_name}
              </Text>
              {!!item.scientific_name && (
                <Text style={styles.newsSci} numberOfLines={1}>{item.scientific_name}</Text>
              )}
              <Text style={styles.newsBody} numberOfLines={4}>{item.news_text}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Text style={[styles.sidebarHeading, styles.sidebarHeadingSpaced]}>ÜZENŐFAL</Text>
      <MessageBoard nickname={nickname} isAdmin={isAdminNickname(nickname)} />
    </>
  );

  const sidebarBlock = isWide ? (
    <ScrollView
      style={[styles.sidebar, styles.sidebarWide]}
      contentContainerStyle={styles.sidebarWideContent}
      showsVerticalScrollIndicator={false}
    >
      {sidebarInner}
    </ScrollView>
  ) : (
    <View style={styles.sidebar}>{sidebarInner}</View>
  );

  // Jobb oldali (tágas) tartalom: a T-rex háttér fölött lebegő helyőrző szöveg,
  // RÉGIÓK térkép és a gyűjtés-dashboard.
  const rightBlock = (
    <>
      {dinosError && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="wifi-off" size={16} color={COLORS.cream} />
          <Text style={styles.errorBannerText}>
            Nem sikerült betölteni a lényeket. Ellenőrizd az internetkapcsolatot.
          </Text>
          <Pressable
            style={styles.errorRetryBtn}
            onPress={() => onRetryLoadDinos?.()}
            disabled={dinosLoading}
            accessibilityRole="button"
          >
            <Text style={styles.errorRetryText}>
              {dinosLoading ? 'Töltés…' : 'Újra'}
            </Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.loremText}>
        Fedezd fel a mélyidő őslényeit, játssz, kvízelj — minden győzelem XP, és
        közelebb visz a Dínó Professzor ranghoz. Kezdődhet a kaland?
      </Text>

      <LandingMenu onSelectRegion={handleSelectRegion} regionCounts={regionCounts} />

      <RegionProgressDashboard allDinos={allDinos} progress={progress} />
    </>
  );

  return (
    <Shell
      header={header}
      gradientColors={[COLORS.bgDark, COLORS.bgMid]}
      backgroundImage={landingBg}
      contentMaxWidth={isWide ? 1920 : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
      <AppInfoModal visible={infoOpen} onClose={() => setInfoOpen(false)} />
      <RankModal visible={rankOpen} onClose={() => setRankOpen(false)} xp={xp} />

      {isWide ? (
        // Asztali/Full HD: fix bal sáv (teljes magasság) + tágas, görgethető jobb oldal.
        <View style={styles.bodyRow}>
          {sidebarBlock}
          <ScrollView style={styles.rightArea} contentContainerStyle={styles.rightContent}>
            {rightBlock}
          </ScrollView>
          {/* Jobb oldali, a ballal azonos méretű üres üveghatású sáv. */}
          <View style={[styles.sidebarWide, styles.sidebarRight]} />
        </View>
      ) : (
        // Mobil/tablet: egy oszlopban egymás alatt, közös görgetéssel.
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.columnNarrow}>
            {sidebarBlock}
            {rightBlock}
          </View>
        </ScrollView>
      )}

      {/* Alsó futósáv: lény-nevek véletlen sorrendben, jobbról balra görögve */}
      <CreatureMarquee allDinos={allDinos} />
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
  // ── Új, sidebaros elrendezés ──────────────────────────────────────────────
  bodyRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    // RN-web flex-lánc nem mindig nyúlik a viewportig (lásd Shell komment) —
    // a fejléc-sáv (~96px) alatti teljes magasságot 100vh-ból számoljuk, hogy a
    // bal sáv tényleg a képernyő aljáig érjen.
    ...Platform.select({ web: { minHeight: 'calc(100vh - 96px)' } }),
  },
  sidebar: {
    width: '100%',
  },
  // Wide: fix szélességű, teljes magasságú, belül GÖRGETHETŐ üveghatású sáv.
  // A fix magasság (100vh - fejléc) korlátozza a ScrollView-t, hogy a hosszú
  // tartalom (hírek + napi dínó + üzenőfal) a sávon belül görögjön.
  sidebarWide: {
    width: 360,
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: 'rgba(16,14,12,0.55)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(254,250,224,0.10)',
    ...Platform.select({
      web: {
        height: 'calc(100vh - 96px)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      },
    }),
  },
  sidebarWideContent: {
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  sidebarHeading: {
    color: COLORS.accent,
    fontSize: 14,
    fontFamily: FONTS.heading,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    opacity: 0.9,
    marginBottom: 10,
  },
  // Jobb oldali sáv: azonos méret (360px, teljes magasság), de teljesen
  // átlátszó — se háttér, se üveghatás, se szegély.
  sidebarRight: {
    borderRightWidth: 0,
    backgroundColor: 'transparent',
    ...Platform.select({ web: { backdropFilter: 'none', WebkitBackdropFilter: 'none' } }),
  },
  sidebarHeadingSpaced: { marginTop: 20 },
  newsPlaceholder: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(20,18,16,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.08)',
  },
  newsText: {
    flex: 1,
    color: COLORS.cream,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FONTS.body,
    opacity: TEXT_OPACITY.secondary,
  },
  newsList: { gap: 12 },
  newsItem: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(20,18,16,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.08)',
  },
  newsDate: {
    color: COLORS.accent,
    fontSize: 11,
    fontFamily: FONTS.bodyBold,
    letterSpacing: 0.5,
    marginBottom: 4,
    opacity: TEXT_OPACITY.meta,
  },
  newsTitle: {
    color: COLORS.cream,
    fontSize: 15,
    fontFamily: FONTS.heading,
    opacity: TEXT_OPACITY.primary,
  },
  newsSci: {
    color: COLORS.cream,
    fontSize: 11,
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    opacity: TEXT_OPACITY.meta,
    marginBottom: 6,
  },
  newsBody: {
    color: COLORS.cream,
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: FONTS.body,
    opacity: TEXT_OPACITY.secondary,
    marginTop: 4,
  },
  sidebarSpacer: { flex: 1, minHeight: 24 },
  rightArea: {
    flex: 1,
    width: '100%',
  },
  rightContent: {
    paddingHorizontal: 40,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  columnNarrow: {
    width: '100%',
    maxWidth: 680,
    paddingHorizontal: 20,
    alignSelf: 'center',
  },
  column: {
    width: '100%',
    maxWidth: 520,
    paddingHorizontal: 20,
  },
  // 700–1023px: se a mobil 520px-es korlát, se a desktop kétoszlopos 1280px —
  // egy oszlop marad, de a tartalom (térkép, kártyák) számára levegősebb teret ad.
  columnTablet: {
    maxWidth: 680,
    paddingHorizontal: 28,
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
  },
  brandLogo: {
    width: 38,
    height: 38,
  },
  loremText: {
    color: COLORS.cream,
    fontSize: 15,
    lineHeight: 23,
    fontFamily: FONTS.body,
    opacity: TEXT_OPACITY.secondary,
    marginTop: 8,
    marginBottom: 16,
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
  progressCircleText: {
    color: COLORS.cream,
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.parokBtn,
  },
  errorBannerText: {
    flex: 1,
    color: COLORS.cream,
    fontSize: 13,
    fontFamily: FONTS.body,
  },
  errorRetryBtn: {
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.button,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  errorRetryText: {
    color: COLORS.bgDark,
    fontSize: 13,
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
  gamingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
    paddingVertical: 6,
    paddingHorizontal: 14,
    ...Platform.select({
      web: {
        transitionProperty: 'background-color, transform',
        transitionDuration: '120ms',
        cursor: 'pointer',
      },
    }),
  },
  gamingBtnHovered: {
    backgroundColor: COLORS.accentDark,
  },
  gamingBtnText: {
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
  headerIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(254,250,224,0.18)',
    marginHorizontal: 2,
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
    fontFamily: FONTS.bodyBold,
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
  roundBtnHovered: {
    backgroundColor: COLORS.bgMidLight,
  },
  roundBtnPressed: {
    transform: [{ scale: 0.9 }],
  },
  // Billentyűzetes navigációhoz (Tab) látható fókusz-gyűrű webes nézetben.
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
  roundBtnIcon: {
    fontSize: 18,
  },
  // Másodlagos (nem-fő navigációs) fejléc-gombok — YouTube, Info — kisebbek és
  // halványabbak, hogy vizuálisan alárendeltek legyenek a fő navigációnak
  // (Ranglista/Gyűjtemény/Profil).
  roundBtnSecondary: {
    width: 32,
    height: 32,
    backgroundColor: 'transparent',
    opacity: 0.65,
  },
  roundBtnIconSecondary: {
    opacity: 0.9,
  },
});
