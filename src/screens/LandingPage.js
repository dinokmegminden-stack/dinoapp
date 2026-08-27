// LandingPage — redesign spec 3. pont: header sáv (XP pill + ikon gombok),
// döntött logó blokk, majd a LandingMenu szekciói egyetlen oszlopban.
import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  View,
  Text,
  Image,
  StatusBar,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Platform,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Shell from '../components/Shell';
import HeaderBar from '../components/HeaderBar';
import PrimaryCTA from '../components/PrimaryCTA';
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
import { findNextPack, overallCompletionRatio, regionCollectionStats, EDU_LABELS } from '../utils/regionProgress';
import { COLORS, RADIUS, FONTS, TEXT_OPACITY } from '../constants/theme';
import { useT } from '../i18n';

// Teljes oldalas háttérkép — csak asztali (web, >=700px) nézetben, a Shell rendereli
// (lásd Shell.js backgroundImage prop), sötét overlay-jel a gombok olvashatóságáért.
const landingBg = require('../../assets/images/trexhead_bg.jpg');
// Mobil hero-vízjel: bőgő raptor (áttetsző PNG). Csak keskeny nézetben, halvány
// háttérként a cím mögött — asztali nézetnek már van T-rex háttere (landingBg).
const heroRaptor = require('../../assets/images/12-2-dinosaur-png.png');

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
// A hero-sáv és a hajtás-alatti sor tartalmi max-szélessége (wide). Full HD-n a
// teljes szélességű RÉGIÓK-térkép indokolatlanul elnyúlt — ez középre fogja a
// tartalmat, esztétikus whitespace-szel mindkét oldalon.
const HERO_MAX_WIDTH = 1180;

// Kép halványulva jelenik meg, amint betöltött — a skeleton→kép csere ne
// legyen kemény vágás. Web: opacity transition a natív driver helyett.
function FadeInImage({ source, style }) {
  const op = useRef(new Animated.Value(0)).current;
  return (
    <Animated.Image
      source={source}
      style={[style, { opacity: op }]}
      resizeMode="cover"
      onLoad={() =>
        Animated.timing(op, {
          toValue: 1,
          duration: 220,
          useNativeDriver: Platform.OS !== 'web',
        }).start()
      }
    />
  );
}

function RandomDinoStrip({ allDinos, onPress, availWidth }) {
  // Hány thumbnail fér el a rendelkezésre álló sávszélességbe (min. 1). A
  // szélességet a szülő számolja ki a viewportból (availWidth) — megbízhatóbb,
  // mint a flexWrap-es sáv onLayout-ja, ami RN-weben a becsomagolt tartalom
  // szélességét adja vissza, nem a rendelkezésre állót.
  const count = Math.max(1, Math.floor((availWidth + THUMB_GAP) / (THUMB_W + THUMB_GAP)));

  // Sorsolt pool (a férőhelyek számáig), mount-kor egyszer.
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

  // "Betöltés" = még nincs adat (allDinos üres/null). Ilyenkor NEM omlasztjuk
  // össze a slotot, hanem fix magasságú skeleton-sort mutatunk, hogy a hero
  // első paintje ne csupasz cím legyen és ne ugorjon a layout, amint az adat
  // beér. Ha az adat már betöltött, de a pool üres (name_hu ↔ IMAGE_MAP nem
  // illik egy lényre sem), akkor viszont nincs mit mutatni → null.
  const loading = !allDinos || allDinos.length === 0;
  if (!loading && pool.length === 0) return null;

  const picks = loading ? [] : pool.slice(0, Math.min(count, pool.length));

  // Ha csak EGY fér ki (jellemzően telefon), a magányos, fix-szélességű
  // thumbnail üres margóval "törött kép-slotnak" néz. Ilyenkor a lényből
  // teljes szélességű, 16:9 hero-képet csinálunk — a dínó legyen a domináns
  // elem, ne egy 100px-es dekor-csík.
  const single = count === 1;
  // Magasság-clamp: tranziens 0/negatív availWidth-nél (pl. első paint,
  // forgatás) a kép NE essen 0 magasra (eltűnő hero-kép) — legalább 120px.
  const singleImg = single ? { width: '100%', height: Math.max(120, Math.round(availWidth * 9 / 16)) } : null;

  return (
    <View style={styles.randomStrip}>
      {loading
        ? Array.from({ length: count }).map((_, i) => (
            <View key={`sk-${i}`} style={[styles.randomThumbSkeleton, singleImg]} />
          ))
        : picks.map((dino) => (
            <Pressable
              key={dino.id ?? dino.name_hu}
              style={({ pressed }) => [styles.randomThumb, single && styles.randomThumbSingle, pressed && styles.randomThumbPressed]}
              onPress={() => onPress?.(dino)}
              accessibilityRole="button"
              accessibilityLabel={dino.name_hu}
            >
              <FadeInImage source={IMAGE_MAP[dino.name_hu]} style={[styles.randomThumbImg, singleImg]} />
              <Text style={[styles.randomThumbName, single && styles.randomThumbNameSingle]} numberOfLines={1}>{dino.name_hu}</Text>
            </Pressable>
          ))}
    </View>
  );
}

export default function LandingPage({ nickname, progress, allDinos, dinosError = false, dinosLoading = false, onRetryLoadDinos, onEnterRegion, onOpenGallery, onOpenAlbum, onOpenLeaderboard, onOpenDashboard, onOpenGaming, onOpenNews, onOpenKutatok, onOpenGeology, onOpenMovies, onOpenEvolution, onOpenComparison, onOpenCalendar, onRequireRegister, onOpenJoin, onOpenLogin }) {
  const { t } = useT();
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;
  // A hero-képsáv rendelkezésre álló szélessége a viewportból (a heroBand
  // ph 48*2, ill. mobilon a columnNarrow maxWidth 680 / ph 20*2 alapján) — a
  // RandomDinoStrip ebből számolja a férőhelyek számát.
  const stripAvailWidth = Math.max(
    THUMB_W,
    isWide ? Math.min(width, HERO_MAX_WIDTH) - 96 : Math.min(width, 680) - 40,
  );
  const [infoOpen, setInfoOpen] = useState(false);
  const [rankOpen, setRankOpen] = useState(false);
  const [xp, setXp] = useState(0);
  // A térkép-marker és az alsó "Gyűjtési előrehaladás" kártyák közti hover-
  // szinkronhoz (spec 4. pont): amelyiken az egér áll, a másikon is felvillan.
  const [hoveredRegion, setHoveredRegion] = useState(null);

  // XP a rang-modálhoz (a fejléc XP-pilljével azonos forrás, könnyű pollozással).
  useEffect(() => {
    getTotalXP().then(setXp);
    const timer = setInterval(() => getTotalXP().then(setXp), 1000);
    return () => clearInterval(timer);
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
    onEnterRegion(nextPack ? nextPack.eduLevel : 1);
  };

  const handleDailyDinoPress = (dino) => {
    playSound('click');
    onEnterRegion(dino?.edu || 1);
  };

  const collectionRatio = overallCompletionRatio(progress || {});

  // A hero CTA mondja meg, hova visz (H7): visszatérő játékosnál a soron
  // következő, még nem teljesített régió nevével ("Folytasd: Afrika →"),
  // új játékosnál (nincs haladás) a generikus "Kezdd el a felfedezést!".
  const nextPack = findNextPack(progress || {});
  const ctaLabel = nextPack && collectionRatio > 0
    ? t('landing.cta_continue', { region: EDU_LABELS[nextPack.eduLevel] })
    : t('landing.cta_start');

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
    else if (targetView === 'geology') onOpenGeology?.();
    else if (targetView === 'movies') onOpenMovies?.();
    else if (targetView === 'evolution') onOpenEvolution?.();
    else if (targetView === 'comparison') onOpenComparison?.();
    else if (targetView === 'calendar') onOpenCalendar?.();
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

  // Bal oldali sáv tartalma: Dínós Hírek (a Napi Dínó blokkot eltávolítottuk).
  const sidebarInner = (
    <>
      <Text style={styles.sidebarHeading}>{t('landing.news_heading')}</Text>
      {news.length === 0 ? (
        <View style={styles.newsPlaceholder}>
          <MaterialCommunityIcons name="newspaper-variant-outline" size={22} color={COLORS.accent} />
          <Text style={styles.newsText}>
            {t('landing.news_placeholder')}
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
              <Text style={styles.newsBody} numberOfLines={2}>{item.news_text}</Text>
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
      <Text style={styles.sidebarHeading}>{t('landing.community_heading')}</Text>
      <MessageBoard
        nickname={nickname}
        isAdmin={isAdminNickname(nickname)}
        onRequireRegister={onRequireRegister}
      />
    </>
  ) : (
    <>
      <Text style={styles.sidebarHeading}>{t('landing.join_heading')}</Text>
      <View style={styles.guestCard}>
        <Text style={styles.guestTitle}>{t('landing.guest_title')}</Text>
        <Text style={styles.guestBody}>
          {t('landing.guest_body')}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.guestBtn, pressed && styles.guestBtnPressed]}
          onPress={() => { playSound('click'); onOpenJoin?.(); }}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="rocket-launch" size={16} color={COLORS.bgDark} />
          <Text style={styles.guestBtnText}>{t('landing.guest_btn')}</Text>
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
            {t('landing.load_error')}
          </Text>
          <Pressable
            style={styles.errorRetryBtn}
            onPress={() => onRetryLoadDinos?.()}
            disabled={dinosLoading}
            accessibilityRole="button"
          >
            <Text style={styles.errorRetryText}>
              {dinosLoading ? t('common.loading') : t('common.retry')}
            </Text>
          </Pressable>
        </View>
      )}

      <RandomDinoStrip allDinos={allDinos} onPress={handleDailyDinoPress} availWidth={stripAvailWidth} />

      <View style={styles.heroCopy}>
        {!isWide && (
          <Image
            source={heroRaptor}
            style={styles.heroRaptor}
            resizeMode="contain"
            pointerEvents="none"
          />
        )}
        <Text style={styles.heroTitle}>{t('landing.hero_title')}</Text>
        <Text style={styles.heroStats}>
          {t('landing.hero_stats', { count: allDinos?.length || 111 })}
        </Text>
        <Text style={styles.heroSubtitle}>
          {t('landing.hero_subtitle')}
        </Text>
        <View style={styles.heroCtaWrap}>
          <PrimaryCTA onPress={handleStartAdventure} label={ctaLabel} />
          {/* A CTA az elsődleges út; a térkép az "or" alternatíva — így a kettő
              egy egységként olvas, nem két versengő primary döntésként. */}
          <Text style={styles.heroCtaHint}>{t('landing.hero_cta_hint')}</Text>
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
    maxWidth: HERO_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 48,
    paddingTop: 20,
    paddingBottom: 28,
  },
  belowFoldRow: {
    width: '100%',
    maxWidth: HERO_MAX_WIDTH,
    alignSelf: 'center',
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
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transitionProperty: 'transform, background-color',
        transitionDuration: '140ms',
        transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
    }),
  },
  guestBtnPressed: {
    backgroundColor: COLORS.accentDark,
    transform: [{ scale: 0.97 }],
  },
  guestBtnText: {
    color: COLORS.bgDark,
    fontSize: 15,
    fontFamily: FONTS.bodyBold,
    letterSpacing: 0.4,
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
    // Dátumok azonos szélességű számjegyekkel — nem "táncolnak" a hírsorban.
    fontVariant: ['tabular-nums'],
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
  columnNarrow: {
    width: '100%',
    maxWidth: 680,
    paddingHorizontal: 20,
    alignSelf: 'center',
  },
  // A hero tetején lévő 3 random dínó mini-fotó sávja.
  randomStrip: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  randomThumb: {
    width: 178,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transitionProperty: 'transform',
        transitionDuration: '140ms',
        transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
    }),
  },
  randomThumbPressed: {
    transform: [{ scale: 0.96 }],
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
  // Egyetlen thumbnail (telefon): teljes szélességű 16:9 hero-kép — a dínó a
  // domináns elem, nem egy magányos 178px-es csík üres margóval.
  randomThumbSingle: {
    width: '100%',
  },
  randomThumbNameSingle: {
    fontSize: 13,
    textAlign: 'left',
    marginTop: 6,
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
    position: 'relative',
  },
  // Mobil hero-vízjel: bőgő raptor a cím mögött, jobbra kilógva, halványan. Első
  // gyerekként abszolút pozícióban ül, így a rá következő szöveg fölé rajzolódik
  // (nem kell zIndex) — a cím olvasható marad, a "dínó" mégis 50ms alatt leolvad.
  heroRaptor: {
    position: 'absolute',
    top: -18,
    right: -34,
    width: 210,
    height: 168,
    opacity: 0.22,
    transform: [{ scaleX: -1 }],
  },
  // "111 őslény · 6 régió" — mindig látható, hangos bizonyíték (a korábbi
  // hover-mögé-rejtett value prop helyett; telefonon nincs hover).
  heroStats: {
    color: COLORS.heroYellow,
    fontSize: 15,
    fontFamily: FONTS.bodyBold,
    letterSpacing: 0.5,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroTitle: {
    color: COLORS.cream,
    fontSize: 34,
    lineHeight: 38,
    fontFamily: FONTS.headingXBold,
    // Nagy címnél szorosabb tracking — súlyosabb, szándékosabb hatás.
    letterSpacing: -0.5,
    opacity: TEXT_OPACITY.primary,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginBottom: 8,
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
    // Balra igazítva, egy tengelyen a bal-igazított címmel/alcímmel — a
    // korábbi középre-igazítás átlós szemugrást okozott (cím balra, CTA
    // középen), ami befejezetlennek olvasott.
    maxWidth: 320,
    marginTop: 14,
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  // A CTA alatti finom "or" híd a régiótérképhez — a másodlagos utat jelzi,
  // hogy a CTA maradjon az egyetlen domináns primary.
  heroCtaHint: {
    color: COLORS.cream,
    fontSize: 12.5,
    fontFamily: FONTS.body,
    opacity: TEXT_OPACITY.meta,
    letterSpacing: 0.3,
    marginTop: 10,
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
});
