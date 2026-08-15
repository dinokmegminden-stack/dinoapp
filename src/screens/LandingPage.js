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

import Shell from '../components/Shell';
import HeaderBar from '../components/HeaderBar';
import PrimaryCTA from '../components/PrimaryCTA';
import DailyDinoCard from '../components/DailyDinoCard';
import AppInfoModal from '../components/AppInfoModal';
import RankModal from '../components/RankModal';
import MessageBoard from '../components/MessageBoard';
import Footer from '../components/Footer';
import LandingMenu from './LandingMenu';
import { IMAGE_MAP } from '../constants/imageMap';
import { playSound } from '../audio/audioSystem';
import { getTotalXP } from '../components/XPBar';
import { recordAndGetStreak } from '../utils/dailyStreak';
import { isAdminNickname } from '../constants/admins';
import { fetchDinoNews, genusOf } from '../services/dinoNewsService';
import { findNextPack, overallCompletionRatio, regionCollectionStats } from '../utils/regionProgress';
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

// A hero tetején minden betöltéskor véletlen (képpel rendelkező) őslények
// kicsi 16:9-es fotói — csak dekoráció/kedvcsináló. Hány fér ki, azt a sáv
// tényleges szélessége dönti el (onLayout): full HD desktopon több (max 8),
// telefonon akár csak 1. A random pool mount-kor egyszer sorsolódik (useMemo
// []), a látható darabszám a szélességből számolódik. Képre kattintva a lény
// régiójába lép.
const THUMB_W = 178;   // 16:9 kép szélessége (100px magassághoz)
const THUMB_GAP = 10;  // randomStrip gap
const MAX_THUMBS = 8;  // felső korlát (nagyon széles kijelzőn se legyen túl sok)

function RandomDinoStrip({ allDinos, onPress }) {
  const [count, setCount] = useState(0);

  // Egyszer sorsolt pool (a maximális darabszámig), ebből vágunk annyit,
  // amennyi a mért szélességbe belefér.
  const pool = useMemo(() => {
    const withImg = (allDinos || []).filter((d) => IMAGE_MAP[d.name_hu]);
    if (withImg.length === 0) return [];
    const rest = [...withImg];
    const out = [];
    for (let i = 0; i < MAX_THUMBS && rest.length > 0; i++) {
      const idx = Math.floor(Math.random() * rest.length);
      out.push(rest.splice(idx, 1)[0]);
    }
    return out;
  }, [allDinos]);

  // A sáv szélességéből: hány (THUMB_W + gap) egység fér el, min. 1.
  const handleLayout = (e) => {
    const w = e.nativeEvent.layout.width;
    if (!w) return;
    const fits = Math.max(1, Math.floor((w + THUMB_GAP) / (THUMB_W + THUMB_GAP)));
    setCount(fits);
  };

  // "Betöltés" = még nincs adat (allDinos üres/null). Ilyenkor NEM omlasztjuk
  // össze a slotot, hanem fix magasságú skeleton-sort mutatunk, hogy a hero
  // első paintje ne csupasz cím legyen és ne ugorjon a layout, amint az adat
  // beér. Ha az adat már betöltött, de a pool üres (name_hu ↔ IMAGE_MAP nem
  // illik egy lényre sem), akkor viszont nincs mit mutatni → null.
  const loading = !allDinos || allDinos.length === 0;
  if (!loading && pool.length === 0) return null;

  // Amíg a szélesség nincs megmérve (count === 0), 1 helyőrzőt feltételezünk,
  // hogy a skeleton már az első kereten látszódjon.
  const slots = count > 0 ? count : 1;
  const picks = loading ? [] : pool.slice(0, Math.min(slots, pool.length));

  return (
    <View style={styles.randomStrip} onLayout={handleLayout}>
      {loading
        ? Array.from({ length: slots }).map((_, i) => (
            <View key={`sk-${i}`} style={styles.randomThumbSkeleton} />
          ))
        : picks.map((dino) => (
            <Pressable
              key={dino.id ?? dino.name_hu}
              style={styles.randomThumb}
              onPress={() => onPress?.(dino)}
              accessibilityRole="button"
              accessibilityLabel={dino.name_hu}
            >
              <Image source={IMAGE_MAP[dino.name_hu]} style={styles.randomThumbImg} resizeMode="cover" />
              <Text style={styles.randomThumbName} numberOfLines={1}>{dino.name_hu}</Text>
            </Pressable>
          ))}
    </View>
  );
}

export default function LandingPage({ nickname, progress, allDinos, dinosError = false, dinosLoading = false, onRetryLoadDinos, onEnterRegion, onOpenGallery, onOpenAlbum, onOpenLeaderboard, onOpenDashboard, onOpenGaming, onOpenNews, onOpenKutatok, onRequireRegister, onOpenJoin, onOpenLogin }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;
  const [infoOpen, setInfoOpen] = useState(false);
  const [rankOpen, setRankOpen] = useState(false);
  const [xp, setXp] = useState(0);
  // A térkép-marker és az alsó "Gyűjtési előrehaladás" kártyák közti hover-
  // szinkronhoz (spec 4. pont): amelyiken az egér áll, a másikon is felvillan.
  const [hoveredRegion, setHoveredRegion] = useState(null);

  // XP a rang-modálhoz (a fejléc XP-pilljével azonos forrás, könnyű pollozással).
  useEffect(() => {
    getTotalXP().then(setXp);
    const t = setInterval(() => getTotalXP().then(setXp), 1000);
    return () => clearInterval(t);
  }, []);

  // Lokális napi belépési széria — megnyitáskor regisztráljuk (side effect;
  // a visszaadott értéket a landing jelenleg nem jeleníti meg).
  useEffect(() => {
    recordAndGetStreak();
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

  // Régiónkénti teljesítési arány (0..1) a térkép-markerek progresszió-
  // gyűrűjéhez — ugyanaz a forrás, mint a lenti Gyűjtési előrehaladás kártyák.
  const regionRatios = useMemo(() => {
    const stats = regionCollectionStats(allDinos, progress || {});
    const ratios = {};
    Object.keys(stats).forEach((edu) => {
      const s = stats[edu];
      ratios[edu] = s.total > 0 ? s.collected / s.total : 0;
    });
    return ratios;
  }, [allDinos, progress]);

  // A fejléc a Shell teljes böngésző-szélességű sávjaként jelenik meg (a Shell
  // `header` propján át), az inner belső tartalmon kívül. A sáv full-width, a
  // benne lévő tartalom vízszintes paddinggel igazodik.
  const handleNavigate = (targetView) => {
    if (targetView === 'landing') return;
    if (targetView === 'gaming') onOpenGaming?.();
    else if (targetView === 'collection') onOpenGallery?.();
    else if (targetView === 'album') onOpenAlbum?.();
    else if (targetView === 'leaderboard') onOpenLeaderboard?.();
    else if (targetView === 'news') onOpenNews?.();
    else if (targetView === 'kutatok') onOpenKutatok?.();
    else if (targetView === 'dashboard') onOpenDashboard?.();
    else if (targetView === 'nicknamePicker') onRequireRegister?.();
    else if (targetView === 'join') onOpenJoin?.();
    else if (targetView === 'login') onOpenLogin?.();
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
    </>
  );

  // Jobb oldali sáv: bejelentkezve a közösségi üzenőfal; vendégnek NEM zárolt
  // fal (hideg kapu), hanem meleg belépő-csali — "válassz dínó-nevet és kezdd".
  const progressSidebarInner = nickname ? (
    <>
      <Text style={styles.sidebarHeading}>KÖZÖSSÉG</Text>
      <MessageBoard
        nickname={nickname}
        isAdmin={isAdminNickname(nickname)}
        onRequireRegister={onRequireRegister}
      />
    </>
  ) : (
    <>
      <Text style={styles.sidebarHeading}>CSATLAKOZZ</Text>
      <View style={styles.guestCard}>
        <Text style={styles.guestTitle}>Válassz dínó-nevet és kezdd!</Text>
        <Text style={styles.guestBody}>
          Gyűjts kártyákat, szerezz XP-t és mászd meg a ranglistákat — pár
          másodperc az egész, jelszó nélkül.
        </Text>
        <Pressable
          style={styles.guestBtn}
          onPress={() => { playSound('click'); onOpenJoin?.(); }}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="rocket-launch" size={16} color={COLORS.bgDark} />
          <Text style={styles.guestBtnText}>Csatlakozz</Text>
        </Pressable>
      </View>
    </>
  );

  // Hero-blokk (a T-rex háttér fölött): figyelem-csali képsáv, headline + CTA,
  // RÉGIÓK térkép. Ez a landing egyetlen dolga — full-width felső sávban él.
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

      <RandomDinoStrip allDinos={allDinos} onPress={handleDailyDinoPress} />

      <View style={styles.heroCopy}>
        <Text style={styles.heroTitle}>Légy Te a Dínó Professzor!</Text>
        <Text style={styles.heroSubtitle}>
          Fedezd fel a mélyidő őslényeit, gyűjts kártyákat, és válj a legnagyobb szakértővé!
        </Text>
        <View style={styles.heroCtaWrap}>
          <PrimaryCTA onPress={handleStartAdventure} label="Kezdd el a felfedezést!" />
        </View>
      </View>

      <LandingMenu
        onSelectRegion={handleSelectRegion}
        regionCounts={regionCounts}
        regionRatios={regionRatios}
        highlightEdu={hoveredRegion}
        onHoverRegion={setHoveredRegion}
      />
    </>
  );

  return (
    <Shell
      header={header}
      footer={<Footer onOpenInfo={handleOpenInfo} />}
      gradientColors={[COLORS.bgDark, COLORS.bgMid]}
      backgroundImage={landingBg}
      backgroundDim
      contentMaxWidth={isWide ? 1920 : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
      <AppInfoModal visible={infoOpen} onClose={() => setInfoOpen(false)} />
      <RankModal visible={rankOpen} onClose={() => setRankOpen(false)} xp={xp} />

      {isWide ? (
        // Asztali/Full HD: a hero full-width felső sávban dominál, alatta a
        // hajtás alá kerül a másodlagos tartalom (Napi Dínó + Hírek | Közösség).
        <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent}>
          <View style={styles.heroBand}>{rightBlock}</View>
          <View style={styles.belowFoldRow}>
            <View style={styles.belowCol}>{sidebarInner}</View>
            <View style={styles.belowCol}>{progressSidebarInner}</View>
          </View>
        </ScrollView>
      ) : (
        // Mobil/tablet: egy oszlopban, a HERO legfelül (ő a figyelem-horog),
        // utána Napi Dínó + Hírek, végül a közösség/csatlakozás.
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.columnNarrow}>
            {rightBlock}
            <View style={styles.narrowBelowBlock}>{sidebarInner}</View>
            <View style={styles.narrowBelowBlock}>{progressSidebarInner}</View>
          </View>
        </ScrollView>
      )}

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
  // ── Hero-domináns elrendezés (wide) ───────────────────────────────────────
  // A hero full-width felső sávban, alatta a hajtás alá kerülő másodlagos sor.
  pageScroll: {
    flex: 1,
    width: '100%',
  },
  pageContent: {
    flexGrow: 1,
    paddingBottom: 48,
  },
  heroBand: {
    width: '100%',
    paddingHorizontal: 48,
    paddingTop: 20,
    paddingBottom: 28,
  },
  belowFoldRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 32,
    paddingHorizontal: 48,
  },
  belowCol: {
    flex: 1,
    minWidth: 0,
  },
  narrowBelowBlock: {
    width: '100%',
    marginTop: 20,
  },
  // Vendég belépő-csali kártya (a zárolt üzenőfal helyett).
  guestCard: {
    padding: 18,
    borderRadius: RADIUS.cardLarge,
    backgroundColor: 'rgba(20,18,16,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.10)',
    gap: 10,
  },
  guestTitle: {
    color: COLORS.cream,
    fontSize: 18,
    fontFamily: FONTS.heading,
    opacity: TEXT_OPACITY.primary,
  },
  guestBody: {
    color: COLORS.cream,
    fontSize: 13.5,
    lineHeight: 20,
    fontFamily: FONTS.body,
    opacity: TEXT_OPACITY.secondary,
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    marginTop: 2,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
    paddingVertical: 9,
    paddingHorizontal: 18,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  guestBtnText: {
    color: COLORS.bgDark,
    fontSize: 15,
    fontFamily: FONTS.bodyBold,
    letterSpacing: 0.4,
  },
  // ── Régi, sidebaros elrendezés (mobil is használ pár darabot) ─────────────
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
  // Jobb oldali sáv: azonos szélesség és stílus, mint a bal (spec: 3-oszlopos
  // elrendezés) — a "Te haladásod" panelt tartalmazza, bal szegély helyett
  // jobb szegéllyel (a középső tartalom felé néz), tükrözve a bal sávot.
  sidebarRight: {
    borderRightWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(254,250,224,0.10)',
  },
  narrowProgressBlock: {
    width: '100%',
    marginTop: 8,
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
  // A hero tetején lévő 3 random dínó mini-fotó sávja.
  randomStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  randomThumb: {
    width: 178,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  randomThumbImg: {
    width: 178,
    height: 100,
    borderRadius: RADIUS.card,
    borderWidth: 1.5,
    borderColor: 'rgba(254,250,224,0.25)',
    backgroundColor: COLORS.darkGreen,
  },
  randomThumbName: {
    color: COLORS.cream,
    fontSize: 10.5,
    fontFamily: FONTS.bodyBold,
    opacity: TEXT_OPACITY.secondary,
    textAlign: 'center',
    marginTop: 3,
  },
  // Skeleton helyőrző (adatbetöltés alatt) — a kép slotjával azonos méret, hogy
  // ne ugorjon a layout, amint az igazi kártyák beérnek.
  randomThumbSkeleton: {
    width: 178,
    height: 100,
    borderRadius: RADIUS.card,
    backgroundColor: 'rgba(254,250,224,0.07)',
    borderWidth: 1.5,
    borderColor: 'rgba(254,250,224,0.10)',
  },
  // Hero-headline a térkép fölött (spec 2. pont) — rövid, cselekvésorientált
  // cím + alcím, a korábbi hosszabb "loremText" bekezdés helyett.
  heroCopy: {
    marginTop: 8,
    marginBottom: 18,
  },
  heroTitle: {
    color: COLORS.cream,
    fontSize: 30,
    fontFamily: FONTS.headingXBold,
    opacity: TEXT_OPACITY.primary,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginBottom: 6,
  },
  heroSubtitle: {
    color: COLORS.cream,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: FONTS.body,
    opacity: TEXT_OPACITY.secondary,
    maxWidth: 560,
  },
  heroCtaWrap: {
    maxWidth: 320,
    marginTop: 14,
    alignSelf: 'center',
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
