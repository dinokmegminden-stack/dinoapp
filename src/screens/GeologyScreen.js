// GeologyScreen — a "Geológia" fül: a geológia atyjainak kígyózó idővonala.
// A Kutatók fül (KutatokScreen) vázát követi: Shell + HeaderBar + görgetett
// tartalom, itt egy statikus tartalmú GeologyTimeline-nal.
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Shell from '../components/Shell';
import HeaderBar from '../components/HeaderBar';
import GeologyTimeline from '../components/GeologyTimeline';
import { COLORS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { useT } from '../i18n';

export default function GeologyScreen({ nickname, progress, onNavigate, onBack }) {
  const { t } = useT();
  return (
    <Shell header={<HeaderBar currentView="geology" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityRole="button" accessibilityLabel={t('common.back')}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.cream} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('geology.title')}</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.intro}>{t('geology.intro')}</Text>
          <GeologyTimeline />
        </ScrollView>
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 999,
    backgroundColor: 'rgba(20,18,16,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    color: COLORS.accent,
    fontSize: 22,
    fontFamily: FONTS.heading,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scroll: { flex: 1, width: '100%' },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 60,
    gap: 24,
  },
  intro: {
    color: COLORS.cream,
    fontSize: 15,
    lineHeight: 23,
    fontFamily: FONTS.body,
    opacity: 0.8,
    maxWidth: 640,
    textAlign: 'center',
  },
});
