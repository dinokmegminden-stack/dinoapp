// LandingPage — a claude.ai/design "Dino Tudos Home" terv megvalósítása
// (Organic design system, sötét változat: lásd ORGANIC tokenek a theme.js-ben).
//
// A terv szerkezete, fentről lefelé:
//   1. Sticky nav — márkajel, szekció-linkek, széria/XP pill, gyűjtemény-gyűrű, profil
//   2. Hero — köszöntés, "folytasd" csempe, három statisztika + gyűjtemény-panel gyűrűvel
//   3. Régiók — világtérkép és régiónkénti haladás-csempék
//   4. Napi dínó + korszakok listája
//
// FONTOS: a terv minden számát valós adatból töltjük (XP, gyűjtött fajok,
// napi széria, régió-számok, korszakok). A tervlapon szereplő "Szint 7 /
// Kutató" kimaradt: az appban nincs szint-rendszer, és nem találunk ki egyet.
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
import Svg, { Circle } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useFonts as useCaprasimo,
  Caprasimo_400Regular,
} from '@expo-google-fonts/caprasimo';
import {
  useFonts as useFigtree,
  Figtree_400Regular,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';
import Shell from '../components/Shell';
import AppInfoModal from '../components/AppInfoModal';
import CreatureMarquee from '../components/CreatureMarquee';
import RegionWorldMap from '../components/RegionWorldMap';
import { playSound, getSoundMuted, setSoundMuted } from '../audio/audioSystem';
import { getTotalXP } from '../components/XPBar';
import {
  findNextPack,
  creatureCollectionStats,
  regionCompletionRatio,
  EDU_LABELS,
  REGION_ORDER,
} from '../utils/regionProgress';
import { getVisitDates } from '../services/gameEventsService';
import { computeStreak } from '../utils/visitStats';
import { pickDailyDino } from '../utils/dailyDino';
import { IMAGE_MAP, MISSING_IMAGE } from '../constants/imageMap';
import { ORGANIC } from '../constants/theme';

const YOUTUBE_URL = 'https://www.youtube.com/@dinokmegminden';

// Az "ennyi idő alatt ért el X XP-t" ranglista mérföldköve (lásd xp_milestones).
const XP_MILESTONE = 1000;

// A terv "Korszak szerint" listája — a határok millió évben (idősebb → fiatalabb).
const PERIODS = [
  { label: 'Triász', older: 252, younger: 201, color: ORGANIC.accent2_400 },
  { label: 'Jura', older: 201, younger: 145, color: ORGANIC.accent400 },
  { label: 'Kréta', older: 145, younger: 66, color: ORGANIC.accent },
];

function countInPeriod(allDinos, period) {
  return (allDinos || []).filter((d) => {
    const older = d.mya_max ?? d.mya_min;
    const younger = d.mya_min ?? d.mya_max;
    if (older == null || younger == null) return false;
    // Átfedés a korszak sávjával.
    return older >= period.younger && younger <= period.older;
  }).length;
}

// Kör alakú haladásjelző (a terv nagy gyűjtemény-gyűrűje és a nav kis gyűrűje).
function ProgressRing({ size, stroke, ratio, color, trackColor, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, ratio)));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={trackColor} strokeWidth={stroke}
        />
        <Circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

// Vízszintes haladás-sáv (XP és régió-csempék).
function ProgressBar({ ratio, color, height = 7 }) {
  return (
    <View style={[styles.barTrack, { height, borderRadius: ORGANIC.radiusPill }]}>
      <View
        style={{
          height: '100%',
          borderRadius: ORGANIC.radiusPill,
          backgroundColor: color,
          width: `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`,
        }}
      />
    </View>
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

function IconBtn({ icon, onPress, label }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.iconBtn, hovered && styles.iconBtnHover]}
    >
      <MaterialCommunityIcons name={icon} size={18} color={ORGANIC.text} />
    </Pressable>
  );
}

export default function LandingPage({
  nickname,
  playerId,
  progress,
  allDinos,
  dinosError = false,
  dinosLoading = false,
  onRetryLoadDinos,
  onEnterRegion,
  onOpenGallery,
  onOpenLeaderboard,
  onOpenDashboard,
  onOpenGaming,
}) {
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;
  const isTablet = width >= 700 && width < 1024;

  const [infoOpen, setInfoOpen] = useState(false);
  const [xp, setXP] = useState(0);
  const [streak, setStreak] = useState(null);
  const [muted, setMuted] = useState(getSoundMuted());

  const [caprasimoLoaded] = useCaprasimo({ Caprasimo_400Regular });
  const [figtreeLoaded] = useFigtree({
    Figtree_400Regular, Figtree_600SemiBold, Figtree_700Bold,
  });
  const headingFont = caprasimoLoaded ? ORGANIC.fontHeading : 'serif';
  const bodyFont = figtreeLoaded ? ORGANIC.fontBody : 'System';
  const bodySemi = figtreeLoaded ? ORGANIC.fontBodySemi : 'System';
  const bodyBold = figtreeLoaded ? ORGANIC.fontBodyBold : 'System';

  useEffect(() => {
    getTotalXP().then(setXP);
    const interval = setInterval(() => getTotalXP().then(setXP), 500);
    return () => clearInterval(interval);
  }, []);

  // Napi széria — ugyanaz a forrás, amit a PlayerDashboardScreen használ.
  useEffect(() => {
    let cancelled = false;
    if (!playerId) return undefined;
    getVisitDates(playerId)
      .then((dates) => { if (!cancelled) setStreak(computeStreak(dates)); })
      .catch(() => { if (!cancelled) setStreak(null); });
    return () => { cancelled = true; };
  }, [playerId]);

  const sound = (fn) => () => { playSound('click'); fn?.(); };

  const toggleMute = () => {
    const next = !getSoundMuted();
    setSoundMuted(next);
    setMuted(next);
    if (!next) playSound('click');
  };

  const handleSelectRegion = (eduLevel) => {
    playSound('click');
    onEnterRegion(eduLevel);
  };

  const handleContinue = () => {
    playSound('click');
    const next = findNextPack(progress || {});
    onEnterRegion(next ? next.eduLevel : 1);
  };

  const stats = useMemo(
    () => creatureCollectionStats(allDinos, progress || {}),
    [allDinos, progress]
  );
  const collectPct = stats.total ? Math.round((stats.collected / stats.total) * 100) : 0;

  const regionCounts = useMemo(() => {
    const counts = {};
    (allDinos || []).forEach((d) => { counts[d.edu] = (counts[d.edu] || 0) + 1; });
    return counts;
  }, [allDinos]);

  // Régió-csempék: a legtöbb fajt tartalmazó négy régió, valós haladással.
  const regionTiles = useMemo(() => {
    return REGION_ORDER
      .map((edu) => {
        const inRegion = (allDinos || []).filter((d) => d.edu === edu);
        const collected = inRegion.filter(
          (d) => progress?.[edu]?.[d.csomag]?.quizPassed === true
        ).length;
        return {
          edu,
          label: EDU_LABELS[edu] || `Régió ${edu}`,
          collected,
          total: inRegion.length,
          ratio: regionCompletionRatio(edu, progress || {}),
        };
      })
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);
  }, [allDinos, progress]);

  const periods = useMemo(
    () => PERIODS.map((p) => ({ ...p, count: countInPeriod(allDinos, p) })),
    [allDinos]
  );

  const nextPack = useMemo(() => findNextPack(progress || {}), [progress]);
  // A "folytasd" csempe képe: a következő csomag első lénye.
  const continueDino = useMemo(() => {
    if (!nextPack) return null;
    return (allDinos || []).find(
      (d) => d.edu === nextPack.eduLevel && d.csomag === nextPack.packNumber
    ) || null;
  }, [allDinos, nextPack]);

  const dailyDino = useMemo(() => pickDailyDino(allDinos), [allDinos]);
  const dailyImage = dailyDino ? (IMAGE_MAP[dailyDino.name_hu] || MISSING_IMAGE) : null;
  const dailyLatin = dailyDino
    ? (dailyDino.latin_name_ending &&
       !String(dailyDino.name_latin || '').toLowerCase()
         .endsWith(String(dailyDino.latin_name_ending).toLowerCase())
        ? [dailyDino.name_latin, dailyDino.latin_name_ending].filter(Boolean).join(' ')
        : dailyDino.name_latin)
    : null;

  const toMilestone = Math.max(0, XP_MILESTONE - xp);

  return (
    <Shell
      gradientColors={[ORGANIC.bg, ORGANIC.bg]}
      backgroundImage={null}
      contentMaxWidth={isWide ? 1180 : undefined}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <StatusBar barStyle="light-content" backgroundColor={ORGANIC.bg} />

        {/* ── 1. NAV ─────────────────────────────────────────────── */}
        <View style={[styles.nav, isWide && styles.navWide]}>
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <MaterialCommunityIcons name="paw" size={19} color={ORGANIC.bg} />
            </View>
            <Text style={[styles.brandText, { fontFamily: headingFont }]}>Dínó Tudós</Text>
          </View>

          {isWide && (
            <View style={styles.navLinks}>
              <NavLink label="Kezdőlap" active />
              <NavLink label="Játékok" onPress={sound(onOpenGaming)} />
              <NavLink label="Gyűjtemény" onPress={sound(onOpenGallery)} />
              <NavLink label="Ranglista" onPress={sound(onOpenLeaderboard)} />
            </View>
          )}

          <View style={styles.navRight}>
            {streak != null && streak > 0 && (
              <View style={styles.streakPill}>
                <MaterialCommunityIcons name="fire" size={15} color={ORGANIC.accent400} />
                <Text style={[styles.pillText, { fontFamily: bodyBold }]}>{streak} nap</Text>
              </View>
            )}
            <View style={styles.xpPill}>
              <MaterialCommunityIcons name="star" size={15} color={ORGANIC.accent400} />
              <Text style={[styles.pillText, { fontFamily: bodyBold }]}>{xp} XP</Text>
            </View>

            <Pressable onPress={sound(onOpenGallery)} accessibilityRole="button" accessibilityLabel="Gyűjtemény">
              <ProgressRing
                size={40} stroke={3.2}
                ratio={stats.total ? stats.collected / stats.total : 0}
                color={ORGANIC.accent2_400} trackColor={ORGANIC.divider}
              >
                <Text style={[styles.ringMini, { fontFamily: bodyBold }]}>{collectPct}%</Text>
              </ProgressRing>
            </Pressable>

            <IconBtn icon="account" onPress={sound(onOpenDashboard)} label="Profil" />
            <IconBtn icon={muted ? 'volume-off' : 'volume-high'} onPress={toggleMute} label="Hang" />
            <IconBtn icon="youtube" onPress={sound(() => Linking.openURL(YOUTUBE_URL))} label="YouTube" />
            <IconBtn icon="information" onPress={sound(() => setInfoOpen(true))} label="Névjegy" />
          </View>
        </View>

        <View style={[styles.main, isWide && styles.mainWide, isTablet && styles.mainTablet]}>
          <AppInfoModal visible={infoOpen} onClose={() => setInfoOpen(false)} />

          {dinosError && (
            <View style={styles.errorBanner}>
              <MaterialCommunityIcons name="wifi-off" size={16} color={ORGANIC.text} />
              <Text style={[styles.errorText, { fontFamily: bodySemi }]}>
                Nem sikerült betölteni a lényeket. Ellenőrizd az internetkapcsolatot.
              </Text>
              <Pressable style={styles.retryBtn} onPress={() => onRetryLoadDinos?.()} disabled={dinosLoading}>
                <Text style={[styles.retryText, { fontFamily: bodyBold }]}>
                  {dinosLoading ? 'Töltés…' : 'Újra'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* ── 2. HERO ──────────────────────────────────────────── */}
          <View style={[styles.hero, isWide && styles.heroWide]}>
            <View style={isWide ? styles.heroLeft : undefined}>
              <Text style={[styles.eyebrow, { fontFamily: bodyBold }]}>
                FOLYTASD OTT, AHOL ABBAHAGYTAD
              </Text>
              <Text style={[styles.h1, { fontFamily: headingFont }]}>
                Üdv újra,{'\n'}{nickname || 'Kutató'}.
              </Text>
              <Text style={[styles.lead, { fontFamily: bodyFont }]}>
                Gyűjteményed {collectPct}%-nál jár.
                {toMilestone > 0
                  ? ` Még ${toMilestone} XP a következő mérföldkőig — folytasd a felfedezést.`
                  : ` Megvan az ${XP_MILESTONE} XP-s mérföldkő — hajrá a következő fajokért!`}
              </Text>

              {/* folytatás-csempe */}
              <Pressable style={styles.continueTile} onPress={handleContinue} accessibilityRole="button">
                <View style={styles.continueThumb}>
                  {continueDino ? (
                    <Image
                      source={IMAGE_MAP[continueDino.name_hu] || MISSING_IMAGE}
                      style={styles.continueImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.continueImg, styles.thumbFallback]}>
                      <MaterialCommunityIcons name="paw" size={26} color={ORGANIC.text55} />
                    </View>
                  )}
                </View>
                <View style={styles.continueBody}>
                  <Text style={[styles.tileKicker, { fontFamily: bodySemi }]}>
                    {nextPack ? 'KÖVETKEZŐ CSOMAG' : 'MINDEN CSOMAG KÉSZ'}
                  </Text>
                  <Text style={[styles.continueTitle, { fontFamily: headingFont }]} numberOfLines={1}>
                    {nextPack ? EDU_LABELS[nextPack.eduLevel] : 'Gratulálunk!'}
                  </Text>
                  <Text style={[styles.continueMeta, { fontFamily: bodyFont }]} numberOfLines={1}>
                    {nextPack
                      ? `${nextPack.packNumber}. csomag${continueDino ? ` · ${continueDino.name_hu}` : ''}`
                      : 'Nézd meg a gyűjteményedet'}
                  </Text>
                </View>
                <View style={styles.primaryBtn}>
                  <MaterialCommunityIcons name="play" size={15} color={ORGANIC.bg} />
                  <Text style={[styles.primaryBtnText, { fontFamily: headingFont }]}>Folytatás</Text>
                </View>
              </Pressable>

              {/* három statisztika */}
              <View style={styles.statRow}>
                <View style={styles.statTile}>
                  <Text style={[styles.statValue, { fontFamily: headingFont }]}>{xp}</Text>
                  <Text style={[styles.statLabel, { fontFamily: bodyFont }]}>XP</Text>
                </View>
                <View style={styles.statTile}>
                  <Text style={[styles.statValue, { fontFamily: headingFont }]}>
                    {streak == null ? '—' : `${streak} nap`}
                  </Text>
                  <Text style={[styles.statLabel, { fontFamily: bodyFont }]}>Sorozat</Text>
                </View>
                <View style={styles.statTile}>
                  <Text style={[styles.statValue, { fontFamily: headingFont }]}>{stats.collected}</Text>
                  <Text style={[styles.statLabel, { fontFamily: bodyFont }]}>Faj a gyűjteményben</Text>
                </View>
              </View>
            </View>

            {/* gyűjtemény-panel */}
            <View style={[styles.collectPanel, isWide && styles.collectPanelWide]}>
              <Text style={[styles.eyebrow, { fontFamily: bodyBold }]}>GYŰJTEMÉNY</Text>
              <ProgressRing
                size={180} stroke={12}
                ratio={stats.total ? stats.collected / stats.total : 0}
                color={ORGANIC.accent} trackColor={ORGANIC.track}
              >
                <View style={styles.ringCenter}>
                  <Text style={[styles.ringPct, { fontFamily: headingFont }]}>{collectPct}%</Text>
                  <Text style={[styles.ringSub, { fontFamily: bodyFont }]}>
                    {stats.collected} / {stats.total || '…'}
                  </Text>
                </View>
              </ProgressRing>

              <View style={styles.xpBlock}>
                <View style={styles.xpRow}>
                  <Text style={[styles.xpRowText, { fontFamily: bodyFont }]}>Mérföldkő</Text>
                  <Text style={[styles.xpRowText, { fontFamily: bodyFont }]}>
                    {xp} / {XP_MILESTONE} XP
                  </Text>
                </View>
                <ProgressBar ratio={xp / XP_MILESTONE} color={ORGANIC.accent2_400} height={9} />
              </View>

              <View style={styles.milestoneNote}>
                <MaterialCommunityIcons name="trophy-outline" size={17} color={ORGANIC.accent2_400} />
                <Text style={[styles.milestoneText, { fontFamily: bodyFont }]}>
                  Következő mérföldkő:{' '}
                  <Text style={{ color: ORGANIC.text, fontFamily: bodyBold }}>{XP_MILESTONE} XP</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* ── 3. RÉGIÓK ────────────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View>
                <Text style={[styles.eyebrow, { fontFamily: bodyBold }]}>BÖNGÉSSZ ÉLŐHELY SZERINT</Text>
                <Text style={[styles.h2, { fontFamily: headingFont }]}>Fedezd fel régiónként</Text>
              </View>
            </View>

            <View style={styles.mapFrame}>
              <RegionWorldMap onSelectRegion={handleSelectRegion} regionCounts={regionCounts} />
            </View>

            <View style={[styles.tileGrid, !isWide && styles.tileGridNarrow]}>
              {regionTiles.map((r) => (
                <Pressable
                  key={r.edu}
                  style={[styles.regionTile, isWide ? styles.regionTileWide : styles.regionTileNarrow]}
                  onPress={() => handleSelectRegion(r.edu)}
                  accessibilityRole="button"
                >
                  <Text style={[styles.regionName, { fontFamily: headingFont }]} numberOfLines={1}>
                    {r.label}
                  </Text>
                  <Text style={[styles.regionMeta, { fontFamily: bodyFont }]}>
                    {r.collected} / {r.total} faj
                  </Text>
                  <ProgressBar ratio={r.ratio} color={ORGANIC.accent} />
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── 4. NAPI DÍNÓ + KORSZAKOK ─────────────────────────── */}
          <View style={[styles.section, isWide && styles.bottomWide]}>
            <View style={isWide ? styles.bottomLeft : undefined}>
              <Text style={[styles.eyebrow, { fontFamily: bodyBold }]}>A NAP DÍNÓJA</Text>
              <Text style={[styles.h2, { fontFamily: headingFont }]}>Napi felfedezés</Text>

              <Pressable
                style={styles.dailyCard}
                onPress={() => dailyDino && handleSelectRegion(dailyDino.edu || 1)}
                accessibilityRole="button"
              >
                {dailyImage ? (
                  <Image source={dailyImage} style={styles.dailyImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.dailyImg, styles.thumbFallback]}>
                    <Text style={[styles.regionMeta, { fontFamily: bodyFont }]}>Napi dínó betöltése…</Text>
                  </View>
                )}
                {!!dailyDino && (
                  <View style={styles.dailyOverlay}>
                    <Text style={[styles.dailyName, { fontFamily: headingFont }]} numberOfLines={1}>
                      {dailyDino.name_hu}
                    </Text>
                    {!!dailyLatin && (
                      <Text style={[styles.dailyLatin, { fontFamily: bodyFont }]} numberOfLines={1}>
                        {dailyLatin}
                      </Text>
                    )}
                  </View>
                )}
              </Pressable>
            </View>

            <View style={isWide ? styles.bottomRight : styles.periodsNarrow}>
              <Text style={[styles.eyebrow, { fontFamily: bodyBold }]}>IDŐVONAL</Text>
              <Text style={[styles.h2, { fontFamily: headingFont }]}>Korszak szerint</Text>
              <View style={styles.periodList}>
                {periods.map((p) => (
                  <View key={p.label} style={styles.periodRow}>
                    <View style={[styles.periodBar, { backgroundColor: p.color }]} />
                    <View style={styles.periodBody}>
                      <Text style={[styles.periodName, { fontFamily: headingFont }]}>{p.label}</Text>
                      <Text style={[styles.periodMeta, { fontFamily: bodyFont }]}>
                        {p.older}–{p.younger} M év
                      </Text>
                    </View>
                    <Text style={[styles.periodCount, { fontFamily: headingFont }]}>
                      {p.count} faj
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <CreatureMarquee allDinos={allDinos} />
      </ScrollView>
    </Shell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, width: '100%' },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },

  // ── nav ──
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: ORGANIC.space3,
    paddingHorizontal: ORGANIC.space4,
    paddingVertical: ORGANIC.space3,
    borderBottomWidth: 1,
    borderBottomColor: ORGANIC.divider,
  },
  navWide: { paddingHorizontal: 40 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: ORGANIC.space2 },
  brandMark: {
    width: 34, height: 34, borderRadius: 12,
    backgroundColor: ORGANIC.accent, alignItems: 'center', justifyContent: 'center',
  },
  brandText: { color: ORGANIC.text, fontSize: 19 },
  navLinks: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  navLink: { color: ORGANIC.text78, fontSize: 14.5 },
  navLinkActive: { color: ORGANIC.accent400 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 'auto' },
  streakPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: ORGANIC.radiusPill,
    backgroundColor: ORGANIC.accentTint16,
    borderWidth: 1, borderColor: ORGANIC.accentBorder40,
  },
  xpPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: ORGANIC.radiusPill,
    backgroundColor: ORGANIC.surface,
    borderWidth: 1, borderColor: ORGANIC.divider,
  },
  pillText: { color: ORGANIC.text, fontSize: 13.5 },
  ringMini: { position: 'absolute', color: ORGANIC.text, fontSize: 10 },
  iconBtn: {
    width: 40, height: 40, borderRadius: ORGANIC.radiusPill,
    backgroundColor: ORGANIC.surface,
    borderWidth: 1, borderColor: ORGANIC.divider,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  iconBtnHover: { borderColor: ORGANIC.accentBorder40 },

  // ── fő tartalom ──
  main: { width: '100%', paddingHorizontal: ORGANIC.space4, paddingTop: ORGANIC.space6 },
  mainTablet: { paddingHorizontal: ORGANIC.space6 },
  mainWide: { paddingHorizontal: 40 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: ORGANIC.space4,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: ORGANIC.radiusMd,
    backgroundColor: ORGANIC.accent700,
  },
  errorText: { flex: 1, color: ORGANIC.text, fontSize: 13 },
  retryBtn: {
    backgroundColor: ORGANIC.accent100, borderRadius: ORGANIC.radiusPill,
    paddingVertical: 6, paddingHorizontal: 14,
  },
  retryText: { color: ORGANIC.accent800, fontSize: 13 },

  // ── hero ──
  hero: { marginBottom: 56 },
  heroWide: { flexDirection: 'row', gap: ORGANIC.space6, alignItems: 'stretch' },
  heroLeft: { flex: 1.15 },
  eyebrow: {
    color: ORGANIC.accent400, fontSize: 12,
    letterSpacing: 1.4, marginBottom: ORGANIC.space3,
  },
  h1: { color: ORGANIC.text, fontSize: 52, lineHeight: 55, marginBottom: 12 },
  lead: { color: ORGANIC.text78, fontSize: 17, lineHeight: 26, maxWidth: 520, marginBottom: ORGANIC.space6 },

  continueTile: {
    flexDirection: 'row', alignItems: 'center', gap: ORGANIC.space4,
    padding: 14, borderRadius: ORGANIC.radiusPanel,
    backgroundColor: ORGANIC.surface,
    borderWidth: 1, borderColor: ORGANIC.divider,
    marginBottom: ORGANIC.space4,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  continueThumb: { width: 112, height: 88, borderRadius: ORGANIC.radiusMd, overflow: 'hidden' },
  continueImg: { width: '100%', height: '100%' },
  thumbFallback: {
    backgroundColor: ORGANIC.imageWell, alignItems: 'center', justifyContent: 'center',
  },
  continueBody: { flex: 1, minWidth: 0 },
  tileKicker: { color: ORGANIC.text55, fontSize: 11, letterSpacing: 0.9, marginBottom: 3 },
  continueTitle: { color: ORGANIC.text, fontSize: 21 },
  continueMeta: { color: ORGANIC.text65, fontSize: 13 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: ORGANIC.accent, borderRadius: ORGANIC.radiusPill,
    paddingVertical: ORGANIC.space2, paddingHorizontal: ORGANIC.space4,
  },
  primaryBtnText: { color: ORGANIC.bg, fontSize: 14 },

  statRow: { flexDirection: 'row', gap: 12 },
  statTile: {
    flex: 1, paddingVertical: 14, paddingHorizontal: ORGANIC.space4,
    borderRadius: 18, backgroundColor: ORGANIC.surfaceSoft,
    borderWidth: 1, borderColor: ORGANIC.divider,
  },
  statValue: { color: ORGANIC.text, fontSize: 26 },
  statLabel: { color: ORGANIC.text60, fontSize: 12, marginTop: 4 },

  collectPanel: {
    alignItems: 'center', gap: ORGANIC.space4,
    padding: 30, borderRadius: ORGANIC.radiusLg,
    backgroundColor: ORGANIC.surface,
    borderWidth: 1, borderColor: ORGANIC.accentBorder24,
    marginTop: ORGANIC.space6,
  },
  collectPanelWide: { flex: 0.85, marginTop: 0, justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringPct: { color: ORGANIC.text, fontSize: 40 },
  ringSub: { color: ORGANIC.text65, fontSize: 13, marginTop: 2 },
  xpBlock: { width: '100%' },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpRowText: { color: ORGANIC.text70, fontSize: 12 },
  barTrack: { width: '100%', backgroundColor: ORGANIC.track, overflow: 'hidden' },
  milestoneNote: {
    width: '100%', flexDirection: 'row', alignItems: 'center', gap: 9,
    paddingVertical: 11, paddingHorizontal: 14,
    borderRadius: 14, backgroundColor: ORGANIC.wellSoft,
  },
  milestoneText: { color: ORGANIC.text78, fontSize: 13, flex: 1 },

  // ── szekciók ──
  section: { marginBottom: 56 },
  sectionHead: { marginBottom: 18 },
  h2: { color: ORGANIC.text, fontSize: 34, marginTop: 6 },

  mapFrame: {
    borderRadius: ORGANIC.radiusMedia, overflow: 'hidden',
    borderWidth: 1, borderColor: ORGANIC.divider,
    backgroundColor: ORGANIC.imageWell,
    marginBottom: ORGANIC.space4,
  },

  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  tileGridNarrow: { flexDirection: 'column' },
  regionTile: {
    padding: 18, borderRadius: ORGANIC.radiusTile,
    backgroundColor: ORGANIC.surface,
    borderWidth: 1, borderColor: ORGANIC.divider,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  regionTileWide: { flex: 1, minWidth: 0 },
  regionTileNarrow: { width: '100%' },
  regionName: { color: ORGANIC.text, fontSize: 19 },
  regionMeta: { color: ORGANIC.text60, fontSize: 13, marginTop: 2, marginBottom: 12 },

  // ── napi dínó + korszakok ──
  bottomWide: { flexDirection: 'row', gap: ORGANIC.space6, alignItems: 'flex-start' },
  bottomLeft: { flex: 1.3 },
  bottomRight: { flex: 1 },
  periodsNarrow: { marginTop: ORGANIC.space6 },

  dailyCard: {
    borderRadius: ORGANIC.radiusMedia, overflow: 'hidden',
    borderWidth: 1, borderColor: ORGANIC.divider,
    backgroundColor: ORGANIC.imageWell,
    aspectRatio: 16 / 10,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  dailyImg: { width: '100%', height: '100%' },
  dailyOverlay: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: 22, backgroundColor: 'rgba(26,23,18,0.72)',
  },
  dailyName: { color: ORGANIC.text, fontSize: 30 },
  dailyLatin: { color: ORGANIC.text70, fontSize: 14, fontStyle: 'italic' },

  periodList: { gap: 12 },
  periodRow: {
    flexDirection: 'row', alignItems: 'center', gap: ORGANIC.space4,
    paddingVertical: ORGANIC.space4, paddingHorizontal: 18,
    borderRadius: 18, backgroundColor: ORGANIC.surface,
    borderWidth: 1, borderColor: ORGANIC.divider,
  },
  periodBar: { width: 6, height: 44, borderRadius: ORGANIC.radiusPill },
  periodBody: { flex: 1 },
  periodName: { color: ORGANIC.text, fontSize: 20 },
  periodMeta: { color: ORGANIC.text60, fontSize: 12.5 },
  periodCount: { color: ORGANIC.accent400, fontSize: 17 },
});
