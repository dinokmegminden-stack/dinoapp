// src/screens/WordSearchScreen.js
// "Dínó Szókereső" — 20×20 véletlen betűrácsban 3 dínó KÖZNAPI nevét kell
// megtalálni. Kijelölés: koppints a szó ELSŐ, majd UTOLSÓ betűjére (előre és
// hátra is jó). Minden szó +XP; ha mind a 3 megvan, a kör lezárul.
// A rácslogika a tiszta ../utils/wordSearch.js-ben él (node-nal ellenőrzött).
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, useWindowDimensions } from 'react-native';
import Shell from '../components/Shell';
import HeaderBar from '../components/HeaderBar';
import { COLORS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { playSound, playQuizSfx } from '../audio/audioSystem';
import { addXP } from '../components/XPBar';
import { claimDailyChallengeBonus } from '../utils/dailyChallenge';
import GameTitleTag from '../components/GameTitleTag';
import { useT } from '../i18n';
import { generateWordSearch, matchSelection, normalizeWord } from '../utils/wordSearch';

const landingBg = require('../../assets/images/new_bg.jpg');

const GRID_SIZE = 20;
const WORDS_PER_ROUND = 3;
const XP_PER_WORD = 5;
const ROUND_SECONDS = 120; // 2 perc visszaszámláló

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// Kiválaszt WORDS_PER_ROUND lényt, akiknek a köznapi neve normalizálva 3..GRID_SIZE
// betű — a normalizált szó a rácsba kerül, a megjelenítés az eredeti nevet mutatja.
function pickWords(allDinos) {
  const pool = (allDinos || [])
    .map((d) => ({ display: String(d?.name_hu || '').trim(), norm: normalizeWord(d?.name_hu) }))
    .filter((w) => w.display && w.norm.length >= 3 && w.norm.length <= GRID_SIZE);
  const seen = new Set();
  const uniq = pool.filter((w) => (seen.has(w.norm) ? false : seen.add(w.norm)));
  for (let i = uniq.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [uniq[i], uniq[j]] = [uniq[j], uniq[i]];
  }
  return uniq.slice(0, WORDS_PER_ROUND);
}

function buildRound(allDinos) {
  const chosen = pickWords(allDinos);
  if (chosen.length < WORDS_PER_ROUND) return null;
  const { grid, placements } = generateWordSearch(chosen.map((w) => w.norm), GRID_SIZE);
  if (placements.length < WORDS_PER_ROUND) return null; // ritka: nem fért el mind
  // A megjelenített nevet a normalizált alakhoz kötjük (placement.word szerint).
  const labelByWord = Object.fromEntries(chosen.map((w) => [w.norm, w.display]));
  return { grid, placements, labelByWord };
}

export default function WordSearchScreen({ allDinos, nickname, progress, onNavigate, onBack }) {
  const { t } = useT();
  const { width } = useWindowDimensions();
  const cell = Math.max(14, Math.min(30, Math.floor((Math.min(width, 640) - 40) / GRID_SIZE)));

  const [round, setRound] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'playing' | 'won' | 'lost'
  const [foundIdx, setFoundIdx] = useState([]); // placement indexek
  const [path, setPath] = useState([]); // sorban megkoppintott cellák [[r,c]...]
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);

  // Visszaszámláló: másodpercenként csökken; 0-nál a kör elveszett (a addig
  // megtalált szavakért járó XP megmarad, mert menet közben íródott jóvá).
  useEffect(() => {
    if (status !== 'playing') return undefined;
    if (timeLeft <= 0) {
      setStatus('lost');
      playQuizSfx('wrong');
      return undefined;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [status, timeLeft]);

  const foundCellKeys = useMemo(() => {
    if (!round) return new Set();
    const s = new Set();
    foundIdx.forEach((i) => round.placements[i].cells.forEach(([r, c]) => s.add(`${r},${c}`)));
    return s;
  }, [round, foundIdx]);

  const startGame = () => {
    const r = buildRound(allDinos);
    if (!r) return;
    setRound(r);
    setFoundIdx([]);
    setPath([]);
    setTimeLeft(ROUND_SECONDS);
    setStatus('playing');
    playQuizSfx('letsPlay');
  };

  // A [r,c] koppintás folytatja-e szabályosan az eddigi utat? Az út mindig egy
  // összefüggő, egyenes vonal: az első két cella adja az irányt, minden további
  // koppintásnak pontosan a következő lépésnek kell lennie ebben az irányban.
  function continues(cur, [r, c]) {
    if (cur.length === 0) return true;
    const last = cur[cur.length - 1];
    if (cur.some(([pr, pc]) => pr === r && pc === c)) return false; // már benne van
    if (cur.length === 1) {
      const dr = Math.abs(r - last[0]);
      const dc = Math.abs(c - last[1]);
      return Math.max(dr, dc) === 1; // 8-szomszéd
    }
    const dr = Math.sign(cur[1][0] - cur[0][0]);
    const dc = Math.sign(cur[1][1] - cur[0][1]);
    return r === last[0] + dr && c === last[1] + dc; // pont a következő lépés
  }

  const handleCellPress = useCallback(
    (r, c) => {
      if (status !== 'playing') return;

      // Szabálytalan koppintás → új út innen indul.
      const nextPath = continues(path, [r, c]) ? [...path, [r, c]] : [[r, c]];
      const idx = matchSelection(nextPath, round.placements);

      if (idx >= 0 && !foundIdx.includes(idx)) {
        setPath([]);
        const nextFound = [...foundIdx, idx];
        setFoundIdx(nextFound);
        addXP(XP_PER_WORD);
        playQuizSfx('correct');
        if (nextFound.length === round.placements.length) {
          setStatus('won');
          const total = round.placements.length * XP_PER_WORD;
          claimDailyChallengeBonus('wordsearch', total);
          playQuizSfx('winningTheme');
        }
        return;
      }

      setPath(nextPath);
      playSound('click');
    },
    [status, path, round, foundIdx]
  );

  // --- Kezdő képernyő -------------------------------------------------------
  if (status === 'idle') {
    const available = pickWords(allDinos).length >= WORDS_PER_ROUND;
    return (
      <Shell backgroundImage={landingBg} header={<HeaderBar currentView="gaming" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
          <ScrollView contentContainerStyle={styles.centerContent}>
            <Text style={styles.title}>{t('games.wordsearch.title')}</Text>
            <View style={styles.rulesBox}>
              <RuleRow text={t('games.wordsearch.rule_grid', { size: GRID_SIZE, count: WORDS_PER_ROUND })} />
              <RuleRow text={t('games.wordsearch.rule_select')} />
              <RuleRow text={t('games.wordsearch.rule_dirs')} />
              <RuleRow text={t('games.wordsearch.rule_timer')} />
              <RuleRow text={t('games.wordsearch.rule_xp', { xp: XP_PER_WORD })} />
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, !available && styles.primaryBtnDisabled]}
              onPress={startGame}
              disabled={!available}
            >
              <Text style={styles.primaryBtnText}>
                {available ? t('games.wordsearch.start') : t('games.wordsearch.load_fail')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backLink} onPress={onBack}>
              <Text style={styles.backLinkText}>{t('games.wordsearch.back_menu')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Shell>
    );
  }

  // --- Eredmény -------------------------------------------------------------
  if (status === 'won' || status === 'lost') {
    const won = status === 'won';
    return (
      <Shell backgroundImage={landingBg} header={<HeaderBar currentView="gaming" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
          <ScrollView contentContainerStyle={styles.centerContent}>
            <Text style={styles.badgeEmoji}>{won ? '🏆' : '⏱️'}</Text>
            <Text style={styles.title}>{won ? t('games.wordsearch.won') : t('games.wordsearch.lost')}</Text>
            <View style={styles.statsBox}>
              <Text style={styles.statLabel}>{t('games.wordsearch.earned_xp')}</Text>
              <Text style={styles.statValue}>{foundIdx.length * XP_PER_WORD} XP</Text>
            </View>
            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.primaryBtn} onPress={startGame}>
                <Text style={styles.primaryBtnText}>{t('games.wordsearch.again')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exitBtn} onPress={onBack}>
                <Text style={styles.exitBtnText}>{t('games.wordsearch.exit')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Shell>
    );
  }

  // --- Játék ----------------------------------------------------------------
  return (
    <Shell backgroundImage={landingBg} header={<HeaderBar currentView="gaming" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
        <GameTitleTag title={t('games.mode_wordsearch')} />

        <View style={styles.header}>
          <Text style={styles.headerCount}>{t('games.wordsearch.found', { count: foundIdx.length, total: round.placements.length })}</Text>
          <Text style={[styles.headerTimer, timeLeft <= 15 && styles.headerTimerLow]}>⏱️ {fmtTime(timeLeft)}</Text>
          <TouchableOpacity onPress={() => { playSound('click'); onBack(); }}>
            <Text style={styles.backLinkText}>{t('games.wordsearch.quit')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.playContent}>
          <View style={styles.wordList}>
            {round.placements.map((p, i) => {
              const done = foundIdx.includes(i);
              return (
                <View key={p.word} style={[styles.wordChip, done && styles.wordChipDone]}>
                  <Text style={[styles.wordChipText, done && styles.wordChipTextDone]}>
                    {done ? '✓ ' : ''}{round.labelByWord[p.word] || p.word}
                  </Text>
                </View>
              );
            })}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gridScroll}>
            <View style={styles.grid}>
              {round.grid.map((row, r) => (
                <View key={r} style={styles.gridRow}>
                  {row.map((ch, c) => {
                    const isFound = foundCellKeys.has(`${r},${c}`);
                    const isInPath = path.some(([pr, pc]) => pr === r && pc === c);
                    return (
                      <TouchableOpacity
                        key={c}
                        activeOpacity={0.6}
                        onPress={() => handleCellPress(r, c)}
                        style={[
                          styles.cellBox,
                          { width: cell, height: cell },
                          isFound && styles.cellFound,
                          isInPath && styles.cellAnchor,
                        ]}
                      >
                        <Text style={[styles.cellText, { fontSize: Math.floor(cell * 0.55) }, isFound && styles.cellTextFound]}>
                          {ch}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      </View>
    </Shell>
  );
}

function RuleRow({ text }) {
  return (
    <View style={styles.ruleRow}>
      <Text style={styles.ruleDot}>•</Text>
      <Text style={styles.ruleText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', paddingBottom: 20 },
  centerContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  title: { color: COLORS.gold, fontFamily: FONTS.bold, fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  rulesBox: {
    backgroundColor: 'rgba(221,161,94,0.1)', borderWidth: 1, borderColor: 'rgba(221,161,94,0.3)',
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 18, gap: 8, marginBottom: 24, width: '100%', maxWidth: 420,
  },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ruleDot: { color: COLORS.gold, fontSize: 16, fontWeight: 'bold' },
  ruleText: { color: '#FEFAE0', fontFamily: FONTS.body, fontSize: 15, lineHeight: 21, flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 },
  headerCount: { color: COLORS.gold, fontFamily: FONTS.bold, fontSize: 15, fontWeight: '700' },
  headerTimer: { color: '#FEFAE0', fontFamily: FONTS.bold, fontSize: 15, fontWeight: '700' },
  headerTimerLow: { color: '#F44336' },
  playContent: { alignItems: 'center', paddingHorizontal: 12, paddingBottom: 30, gap: 16 },
  wordList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, maxWidth: 520 },
  wordChip: {
    backgroundColor: 'rgba(254,250,224,0.05)', borderWidth: 2, borderColor: COLORS.olive,
    borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12,
  },
  wordChipDone: { backgroundColor: 'rgba(76,175,80,0.25)', borderColor: '#4CAF50' },
  wordChipText: { color: '#FEFAE0', fontFamily: FONTS.bold, fontSize: 14, fontWeight: '700' },
  wordChipTextDone: { color: '#CDEBCE', textDecorationLine: 'line-through' },
  gridScroll: { paddingHorizontal: 4 },
  grid: { borderWidth: 1, borderColor: 'rgba(221,161,94,0.25)', borderRadius: 6, overflow: 'hidden' },
  gridRow: { flexDirection: 'row' },
  cellBox: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(254,250,224,0.08)',
  },
  cellFound: { backgroundColor: 'rgba(76,175,80,0.35)' },
  cellAnchor: { backgroundColor: 'rgba(221,161,94,0.5)' },
  cellText: { color: '#FEFAE0', fontFamily: FONTS.bold, fontWeight: '700' },
  cellTextFound: { color: '#FFFFFF' },
  badgeEmoji: { fontSize: 64, marginBottom: 12 },
  statsBox: {
    backgroundColor: 'rgba(221,161,94,0.1)', borderWidth: 2, borderColor: COLORS.gold, borderRadius: 16,
    paddingVertical: 20, paddingHorizontal: 24, marginBottom: 28, alignItems: 'center', gap: 6,
  },
  statLabel: { color: '#FEFAE0', fontFamily: FONTS.body, fontSize: 15 },
  statValue: { color: COLORS.gold, fontFamily: FONTS.bold, fontSize: 22, fontWeight: '700' },
  buttonGroup: { gap: 12, width: '100%', maxWidth: 300 },
  primaryBtn: {
    paddingVertical: 14, paddingHorizontal: 28, backgroundColor: 'rgba(221,161,94,0.15)',
    borderWidth: 2, borderColor: COLORS.gold, borderRadius: 12, alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: COLORS.gold, fontFamily: FONTS.bold, fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  exitBtn: {
    paddingVertical: 14, paddingHorizontal: 28, backgroundColor: 'rgba(254,250,224,0.05)',
    borderWidth: 2, borderColor: 'rgba(254,250,224,0.25)', borderRadius: 12, alignItems: 'center',
  },
  exitBtnText: { color: '#FEFAE0', fontFamily: FONTS.bold, fontSize: 16, fontWeight: '700' },
  backLink: { alignSelf: 'center', marginTop: 20, paddingVertical: 8, paddingHorizontal: 12 },
  backLinkText: { color: 'rgba(254,250,224,0.6)', fontFamily: FONTS.body, fontSize: 15 },
});
