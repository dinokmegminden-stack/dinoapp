// RankModal — az "info" ikon mögötti rang-áttekintő: a játékos aktuális rangja,
// haladás a következő rangig, és a teljes XP-lépcső. Az AppInfoModal Modal-mintáját
// követi (transparent + fade, backdrop-koppintásra zár).
import React from 'react';
import { Modal, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { RANKS, rankForXP } from '../utils/ranks';
import { useT } from '../i18n';

export default function RankModal({ visible, onClose, xp = 0 }) {
  const { t } = useT();
  const { index, rank, next, toNext, progress } = rankForXP(xp);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{t('rankModal.title')}</Text>

          {/* Aktuális rang + haladás a következőig */}
          <View style={styles.current}>
            <Text style={styles.currentIcon}>{rank.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.currentName}>{rank.name}</Text>
              <Text style={styles.currentXp}>{xp} XP</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
              <Text style={styles.nextInfo}>
                {next ? t('rankModal.next', { xp: toNext, name: next.name }) : t('rankModal.max_rank')}
              </Text>
            </View>
          </View>

          {/* Teljes lépcső */}
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {RANKS.map((r, i) => {
              const reached = xp >= r.min;
              const isCurrent = i === index;
              return (
                <View key={r.min} style={[styles.row, isCurrent && styles.rowCurrent]}>
                  <Text style={[styles.rowIcon, !reached && styles.dim]}>{r.icon}</Text>
                  <Text style={[styles.rowName, !reached && styles.dim]} numberOfLines={1}>{r.name}</Text>
                  <Text style={[styles.rowXp, !reached && styles.dim]}>{r.min.toLocaleString('hu-HU')} XP</Text>
                </View>
              );
            })}
          </ScrollView>

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{t('info.close')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '85%',
    backgroundColor: COLORS.bgDark,
    borderRadius: RADIUS.cardLarge,
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.14)',
    padding: 20,
  },
  title: {
    color: COLORS.accent,
    fontFamily: FONTS.heading,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 1,
  },
  current: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: RADIUS.card,
    backgroundColor: 'rgba(20,18,16,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.10)',
    marginBottom: 14,
  },
  currentIcon: { fontSize: 34 },
  currentName: { color: COLORS.cream, fontFamily: FONTS.heading, fontSize: 18 },
  currentXp: { color: COLORS.accent, fontFamily: FONTS.bold, fontSize: 13, marginTop: 2, opacity: 0.9 },
  track: {
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(254,250,224,0.12)',
    overflow: 'hidden',
    marginTop: 8,
  },
  fill: { height: '100%', borderRadius: 999, backgroundColor: COLORS.accent },
  nextInfo: { color: COLORS.cream, fontFamily: FONTS.body, fontSize: 12, opacity: 0.7, marginTop: 6 },
  body: { maxHeight: 300 },
  bodyContent: { gap: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  rowCurrent: {
    backgroundColor: 'rgba(238,155,0,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(238,155,0,0.4)',
  },
  rowIcon: { fontSize: 20, width: 26, textAlign: 'center' },
  rowName: { flex: 1, color: COLORS.cream, fontFamily: FONTS.bold, fontSize: 14 },
  rowXp: { color: COLORS.cream, fontFamily: FONTS.body, fontSize: 13, opacity: 0.8 },
  dim: { opacity: 0.4 },
  closeBtn: {
    marginTop: 16,
    alignSelf: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  closeBtnText: { color: COLORS.bgDark, fontFamily: FONTS.bold, fontSize: 15 },
});
