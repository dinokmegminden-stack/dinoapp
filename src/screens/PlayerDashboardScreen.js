// src/screens/PlayerDashboardScreen.js
// A fejléc fiók-ikonjára kattintva nyíló irányítópult: hányadik napos szériája
// van a játékosnak, hány dínót gyűjtött össze a 111-ből, és egy havi naptár,
// amin kiemelve látszik, mely napokon indított játékot (game_events.started_at
// alapján, lásd gameEventsService.getVisitDates()).
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import Shell from '../components/Shell';
import HeaderBar from '../components/HeaderBar';
import Fireworks from '../components/Fireworks';
import EraTimeline, { MESOZOIC_ERAS, MESOZOIC_EPOCH_STAGES, CENOZOIC_ERAS, CENOZOIC_EPOCH_STAGES } from '../components/EraTimeline';
import { getTotalXP } from '../components/XPBar';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { getVisitDates } from '../services/gameEventsService';
import { toDateKey, computeStreak } from '../utils/visitStats';
import { creatureCollectionStats, unlockAllProgress } from '../utils/regionProgress';
import { redeemUnlockCode } from '../services/unlockCodesService';

// Az irányítópult idővonala a dínókártyán látott sávot folytatja a kréta
// végétől (66M) egészen máig (0M), hogy a jégkorszaki emlősök (pl. Kárpát-medence
// régió) is kontextusba kerüljenek, nem csak a Mezozoikum.
const FULL_TIMELINE_ERAS = [...MESOZOIC_ERAS, ...CENOZOIC_ERAS];
const FULL_TIMELINE_EPOCHS = [...MESOZOIC_EPOCH_STAGES, ...CENOZOIC_EPOCH_STAGES];

const WEEKDAY_LABELS = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
const MONTH_LABELS = [
  'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
  'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December',
];

// Hétfővel kezdődő hét — a JS getDay() vasárnappal (0) kezd, ezt toljuk el.
function mondayIndex(jsDay) {
  return (jsDay + 6) % 7;
}

function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = mondayIndex(firstOfMonth.getDay());

  const cells = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

export default function PlayerDashboardScreen({ nickname, playerId, allDinos, progress, onUnlocked, onBack }) {
  const [loading, setLoading] = useState(true);
  const [visitDateKeys, setVisitDateKeys] = useState([]);
  const [monthOffset, setMonthOffset] = useState(0); // 0 = jelen hónap, -1 = előző, stb.
  const [xp, setXP] = useState(0);

  useEffect(() => {
    getTotalXP().then(setXP);
    const interval = setInterval(() => {
  const [loading, setLoading] = useState(true);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemStatus, setRedeemStatus] = useState(null); // { type: 'success'|'error', text: '' }
  const [celebration, setCelebration] = useState({ visible: false, message: '' });

  useEffect(() => {
    getTotalXP().then(setXp);
  }, []);

  const handleRedeem = async () => {
    if (!redeemCode.trim() || !playerId) return;
    setRedeemStatus(null);
    const result = await redeemUnlockCode(redeemCode.trim(), playerId);
    if (!result.success) {
      setRedeemStatus({
        type: 'error',
        text: result.error === 'already_used'
          ? 'Ezt a kódot már beváltotta valaki.'
          : result.error === 'invalid_code'
            ? 'Érvénytelen kód.'
            : 'Hiba történt, próbáld újra.',
      });
      return;
    }

    setRedeemCode('');
    onUnlocked?.(unlockAllProgress());
    setCelebration({ visible: true, message: '🎉 Minden dínókártya kinyitva!' });
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getVisitDates(playerId).then((dates) => {
      if (!cancelled) {
        setVisitDateKeys(dates);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [playerId]);

  const visitSet = useMemo(() => new Set(visitDateKeys), [visitDateKeys]);
  const streak = useMemo(() => computeStreak(visitDateKeys), [visitDateKeys]);
  const { collected, total } = useMemo(
    () => creatureCollectionStats(allDinos, progress),
    [allDinos, progress]
  );
  const collectionPct = total > 0 ? Math.round((collected / total) * 100) : 0;

  const today = new Date();
  const shownDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = shownDate.getFullYear();
  const month = shownDate.getMonth();
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const todayKey = toDateKey(today);
  const isCurrentMonth = monthOffset === 0;

  return (
    <Shell header={<HeaderBar currentView="dashboard" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
        <Fireworks
          visible={celebration.visible}
          message={celebration.message}
          onDone={() => setCelebration((c) => ({ ...c, visible: false }))}
        />

        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>🧭 {nickname}</Text>
            <View style={styles.xpPill}>
              <Text style={styles.xpPillText}>⭐ {xp} XP</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={COLORS.accent} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>🔥</Text>
                <Text style={styles.statValue}>{streak}</Text>
                <Text style={styles.statLabel}>{streak === 1 ? 'napos széria' : 'napos széria'}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>🗂️</Text>
                <Text style={styles.statValue}>{collectionPct}%</Text>
                <Text style={styles.statLabel}>{collected} / {total} dínó</Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${collectionPct}%` }]} />
            </View>

            <View style={styles.timelineWrapper}>
              <EraTimeline
                scaleStart={250}
                scaleEnd={0}
                eras={FULL_TIMELINE_ERAS}
                epochStages={FULL_TIMELINE_EPOCHS}
                startLabel="250M"
                endLabel="Ma"
                boldFont={FONTS.bold}
                bodyFont={FONTS.body}
                showRange={false}
                xlarge
              />
            </View>

            <View style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => setMonthOffset((m) => m - 1)} style={styles.monthNavBtn}>
                  <Text style={styles.monthNavText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.monthLabel}>{MONTH_LABELS[month]} {year}</Text>
                <TouchableOpacity
                  onPress={() => setMonthOffset((m) => Math.min(0, m + 1))}
                  style={styles.monthNavBtn}
                  disabled={isCurrentMonth}
                >
                  <Text style={[styles.monthNavText, isCurrentMonth && styles.monthNavTextDisabled]}>›</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.weekdayRow}>
                {WEEKDAY_LABELS.map((label) => (
                  <Text key={label} style={styles.weekdayLabel}>{label}</Text>
                ))}
              </View>

              <View style={styles.grid}>
                {cells.map((day, idx) => {
                  if (day === null) return <View key={idx} style={styles.dayCell} />;
                  const key = toDateKey(new Date(year, month, day));
                  const visited = visitSet.has(key);
                  const isToday = key === todayKey;
                  return (
                    <View key={idx} style={styles.dayCell}>
                      <View style={[
                        styles.dayCircle,
                        visited && styles.dayCircleVisited,
                        isToday && styles.dayCircleToday,
                      ]}>
                        <Text style={[styles.dayText, visited && styles.dayTextVisited]}>{day}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              <Text style={styles.calendarHint}>
                Kiemelve azok a napok, amikor játszottál valamelyik játékmóddal.
              </Text>
            </View>

            <View style={styles.redeemCard}>
              <Text style={styles.redeemTitle}>🎁 Kód beváltása</Text>
              <Text style={styles.redeemHint}>
                Ha támogattad a csatornát és kaptál egy egyedi kódot, itt válthatod be —
                az összes dínókártya azonnal megnyílik.
              </Text>
              <View style={styles.redeemRow}>
                <TextInput
                  style={styles.redeemInput}
                  value={redeemCode}
                  onChangeText={(text) => setRedeemCode(text.toUpperCase())}
                  placeholder="pl. DMM-7KX9QA"
                  placeholderTextColor="rgba(254,250,224,0.35)"
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.redeemBtn, (redeeming || !redeemCode.trim()) && styles.redeemBtnDisabled]}
                  onPress={handleRedeem}
                  disabled={redeeming || !redeemCode.trim()}
                >
                  <Text style={styles.redeemBtnText}>{redeeming ? '…' : 'Beváltás'}</Text>
                </TouchableOpacity>
              </View>
              {!!redeemError && <Text style={styles.redeemError}>{redeemError}</Text>}
            </View>
          </ScrollView>
        )}
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 12,
  },
  title: {
    flexShrink: 1,
    color: COLORS.accent,
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.pill,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  xpPillText: {
    color: COLORS.bgDark,
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '800',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 80,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(0,95,115,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.16)',
    borderRadius: RADIUS.cardLarge,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  statValue: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 12,
    opacity: 0.75,
    marginTop: 2,
  },
  progressTrack: {
    height: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(254,250,224,0.12)',
    overflow: 'hidden',
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.accent,
  },
  timelineWrapper: {
    width: '100%',
    marginTop: 20,
    borderRadius: RADIUS.cardLarge,
    overflow: 'hidden',
  },
  calendarCard: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(0,95,115,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.16)',
    borderRadius: RADIUS.cardLarge,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavText: {
    color: COLORS.cream,
    fontSize: 20,
    fontWeight: '700',
  },
  monthNavTextDisabled: {
    opacity: 0.25,
  },
  monthLabel: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 11,
    opacity: 0.55,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleVisited: {
    backgroundColor: COLORS.accent,
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: COLORS.cream,
  },
  dayText: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 11,
    opacity: 0.7,
  },
  dayTextVisited: {
    color: COLORS.bgDark,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    opacity: 1,
  },
  calendarHint: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 12,
    opacity: 0.6,
    marginTop: 10,
    textAlign: 'center',
  },
  redeemCard: {
    marginTop: 16,
    backgroundColor: 'rgba(0,95,115,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.16)',
    borderRadius: RADIUS.cardLarge,
    padding: 16,
  },
  redeemTitle: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  redeemHint: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 12,
    opacity: 0.7,
    lineHeight: 17,
    marginBottom: 12,
  },
  redeemRow: {
    flexDirection: 'row',
    gap: 10,
  },
  redeemInput: {
    flex: 1,
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    backgroundColor: COLORS.bgMid,
    borderRadius: RADIUS.button,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  redeemBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.button,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemBtnDisabled: {
    opacity: 0.5,
  },
  redeemBtnText: {
    color: COLORS.bgDark,
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
  },
  redeemError: {
    color: '#F44336',
    fontFamily: FONTS.body,
    fontSize: 13,
    marginTop: 10,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
