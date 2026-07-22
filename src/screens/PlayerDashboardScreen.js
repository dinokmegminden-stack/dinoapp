// src/screens/PlayerDashboardScreen.js
// A fejléc fiók-ikonjára kattintva nyíló irányítópult: hányadik napos szériája
// van a játékosnak, hány dínót gyűjtött össze a 111-ből, és egy havi naptár,
// amin kiemelve látszik, mely napokon indított játékot (game_events.started_at
// alapján, lásd gameEventsService.getVisitDates()).
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import Shell from '../components/Shell';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { getVisitDates } from '../services/gameEventsService';
import { toDateKey, computeStreak } from '../utils/visitStats';
import { creatureCollectionStats } from '../utils/regionProgress';

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

export default function PlayerDashboardScreen({ nickname, playerId, allDinos, progress, onBack }) {
  const [loading, setLoading] = useState(true);
  const [visitDateKeys, setVisitDateKeys] = useState([]);
  const [monthOffset, setMonthOffset] = useState(0); // 0 = jelen hónap, -1 = előző, stb.

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
    <Shell>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

        <View style={styles.header}>
          <Text style={styles.title}>🧭 IRÁNYÍTÓPULT</Text>
          <Text style={styles.nickname} numberOfLines={1}>{nickname}</Text>
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
          </ScrollView>
        )}

        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>✕</Text>
        </TouchableOpacity>
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
  title: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
  nickname: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 13,
    opacity: 0.65,
    maxWidth: 160,
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
  calendarCard: {
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
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: '76%',
    height: '76%',
    maxWidth: 32,
    maxHeight: 32,
    borderRadius: 16,
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
    fontSize: 12,
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
  backBtn: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  backBtnText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
