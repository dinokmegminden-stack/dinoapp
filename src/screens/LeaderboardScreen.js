// src/screens/LeaderboardScreen.js
// Ranglisták játékmódonként (csak hibátlan futások, lásd a 4 game screen
// submitLeaderboardEntry hívásait), plusz egy külön "1000 XP elérése" lista.
// Az idő-alapú listák percy:másodperc formátumban, növekvő sorrendben (leggyorsabb elöl).
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import Shell from '../components/Shell';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { getLeaderboard } from '../services/leaderboardService';
import { getXPMilestoneLeaderboard } from '../services/xpMilestonesService';

const XP_MILESTONE = 1000;

const TABS = [
  { key: 'memory_1', label: 'Párok · Kezdő' },
  { key: 'memory_2', label: 'Párok · Haladó' },
  { key: 'memory_3', label: 'Párok · Profi' },
  { key: 'whoami', label: 'Ki vagyok én?' },
  { key: 'lightning', label: '5mp Képkvíz' },
  { key: 'millionaire', label: 'XP Milliomos' },
  { key: 'xp1000', label: `${XP_MILESTONE} XP elérése` },
];

function formatMinSec(ms) {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatDuration(ms) {
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes} perc`;
  const totalHours = Math.floor(totalMinutes / 60);
  if (totalHours < 24) return `${totalHours} óra ${totalMinutes % 60} perc`;
  const days = Math.floor(totalHours / 24);
  return `${days} nap ${totalHours % 24} óra`;
}

export default function LeaderboardScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const [period, setPeriod] = useState('all'); // 'all' | 'week'
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async (tabKey, periodKey) => {
    setLoading(true);
    const rows = tabKey === 'xp1000'
      ? await getXPMilestoneLeaderboard(XP_MILESTONE, { period: periodKey })
      : await getLeaderboard(tabKey, { period: periodKey });
    setEntries(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEntries(activeTab, period);
  }, [activeTab, period, loadEntries]);

  return (
    <Shell>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

        <View style={styles.header}>
          <Text style={styles.title}>🏆 RANGLISTA</Text>
        </View>

        <View style={styles.periodToggle}>
          <TouchableOpacity
            style={[styles.periodBtn, period === 'all' && styles.periodBtnActive]}
            onPress={() => setPeriod('all')}
          >
            <Text style={[styles.periodBtnText, period === 'all' && styles.periodBtnTextActive]}>
              Összes idő
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodBtn, period === 'week' && styles.periodBtnActive]}
            onPress={() => setPeriod('week')}
          >
            <Text style={[styles.periodBtnText, period === 'week' && styles.periodBtnTextActive]}>
              Heti
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabBtnText, activeTab === tab.key && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.listWrapper}>
          {loading ? (
            <ActivityIndicator color={COLORS.accent} style={styles.loading} />
          ) : entries.length === 0 ? (
            <Text style={styles.emptyText}>
              Még senki nem került fel ide — legyél te az első hibátlan játékos!
            </Text>
          ) : (
            <ScrollView contentContainerStyle={styles.listContent}>
              {entries.map((entry, idx) => (
                <View key={entry.id} style={styles.row}>
                  <Text style={styles.rank}>{idx + 1}.</Text>
                  <Text style={styles.nickname} numberOfLines={1}>{entry.nickname}</Text>
                  <Text style={styles.time}>
                    {activeTab === 'xp1000' ? formatDuration(entry.elapsedMs) : formatMinSec(entry.completionTimeMs)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
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
  periodToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: 'rgba(254,250,224,0.06)',
    borderRadius: RADIUS.pill,
    padding: 3,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: COLORS.bgMid,
  },
  periodBtnText: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    opacity: 0.6,
  },
  periodBtnTextActive: {
    opacity: 1,
  },
  tabScroll: {
    marginTop: 10,
    flexGrow: 0,
  },
  tabRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(254,250,224,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.15)',
  },
  tabBtnActive: {
    backgroundColor: COLORS.bgMid,
    borderColor: COLORS.accent,
  },
  tabBtnText: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    opacity: 0.7,
  },
  tabBtnTextActive: {
    opacity: 1,
  },
  listWrapper: {
    flex: 1,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  loading: {
    marginTop: 40,
  },
  emptyText: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 40,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 80,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.card,
    backgroundColor: 'rgba(254,250,224,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.1)',
    marginBottom: 8,
    gap: 10,
  },
  rank: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '800',
    width: 32,
  },
  nickname: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  time: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 15,
    opacity: 0.85,
  },
  backBtn: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(244,67,54,0.6)',
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
