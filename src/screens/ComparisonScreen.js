// ComparisonScreen — "Méretösszehasonlító": két dínó egymás mellett, valós
// hosszarányban méretezett képpel (lásd COMPARISON_NAMES / comparisonDinos.js).
// Zárolt (még nem gyűjtött) dínó is választható — a sziluett és a hosszarány
// látszik, de a számadatok "???"-ként jelennek meg (felfedezős csali a
// Gyűjtemény felé), ugyanaz a quizPassed-alapú unlock-logika, mint a
// Collection/Album képernyőn (regionProgress.js).
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Shell from '../components/Shell';
import HeaderBar from '../components/HeaderBar';
import { COMPARISON_NAMES, COMPARISON_IMAGE_MAP } from '../constants/comparisonDinos';
import { COLORS, RADIUS, FONTS } from '../constants/theme';
import { useT } from '../i18n';

const MAX_IMAGE_WIDTH = 220;
const IMAGE_HEIGHT = 160;
const DEFAULT_LEFT = 'Tyrannosaurus';
const DEFAULT_RIGHT = 'Velociraptor';

function isCollected(dino, progress) {
  return progress?.[dino?.edu]?.[dino?.csomag]?.quizPassed === true;
}

function formatWeight(kg) {
  if (kg == null) return '?';
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)} t` : `${kg} kg`;
}

function DinoPicker({ names, byName, activeName, onPick, otherName }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
      {names.map((name) => {
        const dino = byName.get(name);
        if (!dino) return null;
        const selected = name === activeName;
        const disabled = name === otherName;
        return (
          <Pressable
            key={name}
            disabled={disabled}
            onPress={() => onPick(name)}
            style={[styles.chip, selected && styles.chipSelected, disabled && styles.chipDisabled]}
          >
            <Image source={COMPARISON_IMAGE_MAP[name]} style={styles.chipImage} resizeMode="contain" />
            <Text style={styles.chipLabel} numberOfLines={1}>{name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function DinoPanel({ dino, progress, pxPerMeter, t }) {
  if (!dino) return <View style={styles.panel} />;
  const collected = isCollected(dino, progress);
  const lengthM = dino.length_m_max ?? dino.length_m_min ?? 0;
  const renderWidth = Math.max(28, lengthM * pxPerMeter);
  const heightM = dino.height_m_max ?? dino.height_m_min;
  const weightKg = dino.weight_kg_max ?? dino.weight_kg_min;
  const myaMax = dino.mya_max;
  const myaMin = dino.mya_min;

  return (
    <View style={styles.panel}>
      <Text style={styles.dinoName} numberOfLines={1}>
        {collected ? dino.name_hu : t('comparison.locked_name')}
      </Text>

      <View style={styles.imageWell}>
        <Image
          source={COMPARISON_IMAGE_MAP[dino.name_hu]}
          style={[
            styles.dinoImage,
            { width: renderWidth, height: IMAGE_HEIGHT },
            !collected && styles.dinoImageLocked,
          ]}
          resizeMode="contain"
        />
        {!collected && (
          <MaterialCommunityIcons name="lock" size={22} color={COLORS.cream} style={styles.lockIcon} />
        )}
      </View>

      <View style={[styles.scaleBar, { width: renderWidth }]}>
        <View style={styles.scaleTick} />
        <Text style={styles.scaleLabel}>{collected ? `${lengthM} m` : '?'}</Text>
        <View style={styles.scaleTick} />
      </View>

      <View style={styles.statRow}>
        <Text style={styles.statLabel}>{t('comparison.stat_height')}</Text>
        <Text style={styles.statValue}>{collected ? (heightM != null ? `${heightM} m` : '—') : '???'}</Text>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>{t('comparison.stat_weight')}</Text>
        <Text style={styles.statValue}>{collected ? formatWeight(weightKg) : '???'}</Text>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>{t('comparison.stat_era')}</Text>
        <Text style={styles.statValue}>
          {!collected ? '???' : myaMax ? t('comparison.mya', { mya: myaMin && myaMin !== myaMax ? `${myaMax}–${myaMin}` : myaMax }) : '—'}
        </Text>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>{t('comparison.stat_diet')}</Text>
        <Text style={styles.statValue}>{collected ? (dino.diet_hu || '—') : '???'}</Text>
      </View>

      {!collected && <Text style={styles.lockedHint}>{t('comparison.locked_hint')}</Text>}
    </View>
  );
}

export default function ComparisonScreen({ nickname, progress, allDinos, onNavigate, onBack }) {
  const { t } = useT();

  const byName = useMemo(() => {
    const map = new Map();
    (allDinos || []).forEach((d) => {
      if (COMPARISON_NAMES.includes(d.name_hu)) map.set(d.name_hu, d);
    });
    return map;
  }, [allDinos]);

  const availableNames = useMemo(
    () => COMPARISON_NAMES.filter((n) => byName.has(n)),
    [byName]
  );

  const [leftName, setLeftName] = useState(null);
  const [rightName, setRightName] = useState(null);

  // allDinos loads async (Supabase fetch) — it can still be empty on first
  // render, so the default pair is set here once real data shows up, not in
  // useState's initializer (which only ever runs once, before data arrives).
  useEffect(() => {
    if (availableNames.length === 0) return;
    setLeftName((cur) => (cur && availableNames.includes(cur) ? cur : (availableNames.includes(DEFAULT_LEFT) ? DEFAULT_LEFT : availableNames[0])));
    setRightName((cur) => (cur && availableNames.includes(cur) ? cur : (availableNames.includes(DEFAULT_RIGHT) ? DEFAULT_RIGHT : availableNames[1])));
  }, [availableNames]);

  const leftDino = byName.get(leftName);
  const rightDino = byName.get(rightName);

  const pxPerMeter = useMemo(() => {
    const leftLen = leftDino ? (leftDino.length_m_max ?? leftDino.length_m_min ?? 0) : 0;
    const rightLen = rightDino ? (rightDino.length_m_max ?? rightDino.length_m_min ?? 0) : 0;
    const maxLen = Math.max(leftLen, rightLen, 1);
    return MAX_IMAGE_WIDTH / maxLen;
  }, [leftDino, rightDino]);

  const handleRandom = () => {
    if (availableNames.length < 2) return;
    const a = availableNames[Math.floor(Math.random() * availableNames.length)];
    let b = availableNames[Math.floor(Math.random() * availableNames.length)];
    while (b === a) b = availableNames[Math.floor(Math.random() * availableNames.length)];
    setLeftName(a);
    setRightName(b);
  };

  return (
    <Shell header={<HeaderBar currentView="comparison" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={onBack} accessibilityRole="button" accessibilityLabel={t('common.back')}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.cream} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t('comparison.title')}</Text>
            <Text style={styles.hint}>{t('comparison.hint')}</Text>
          </View>
          <Pressable style={styles.randomBtn} onPress={handleRandom} accessibilityRole="button">
            <MaterialCommunityIcons name="shuffle-variant" size={18} color={COLORS.bgDark} />
            <Text style={styles.randomBtnText}>{t('comparison.random')}</Text>
          </Pressable>
        </View>

        <View style={styles.compareRow}>
          <DinoPanel dino={leftDino} progress={progress} pxPerMeter={pxPerMeter} t={t} />
          <Text style={styles.vs}>VS</Text>
          <DinoPanel dino={rightDino} progress={progress} pxPerMeter={pxPerMeter} t={t} />
        </View>

        <View style={styles.pickers}>
          <DinoPicker names={availableNames} byName={byName} activeName={leftName} otherName={rightName} onPick={setLeftName} />
          <DinoPicker names={availableNames} byName={byName} activeName={rightName} otherName={leftName} onPick={setRightName} />
        </View>
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
  hint: {
    color: COLORS.cream,
    opacity: 0.6,
    fontFamily: FONTS.body,
    fontSize: 13,
    marginTop: 4,
  },
  randomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  randomBtnText: {
    color: COLORS.bgDark,
    fontFamily: FONTS.bold,
    fontSize: 13,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  vs: {
    color: COLORS.accent,
    fontFamily: FONTS.heading,
    fontSize: 18,
    marginBottom: 60,
  },
  panel: {
    flex: 1,
    maxWidth: 320,
    alignItems: 'center',
    backgroundColor: 'rgba(16,14,12,0.6)',
    borderRadius: RADIUS.cardLarge,
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.10)',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  dinoName: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 16,
    marginBottom: 10,
  },
  imageWell: {
    height: IMAGE_HEIGHT,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  dinoImage: {
    alignSelf: 'center',
  },
  dinoImageLocked: {
    opacity: 0.25,
    tintColor: COLORS.bgDark,
  },
  lockIcon: {
    position: 'absolute',
    top: 4,
    alignSelf: 'center',
  },
  scaleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: COLORS.accent,
    marginTop: 6,
    paddingTop: 4,
  },
  scaleTick: {
    width: 2,
    height: 8,
    backgroundColor: COLORS.accent,
  },
  scaleLabel: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
    fontSize: 13,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  statLabel: {
    color: COLORS.cream,
    opacity: 0.6,
    fontFamily: FONTS.body,
    fontSize: 12,
  },
  statValue: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  lockedHint: {
    color: COLORS.accent,
    opacity: 0.8,
    fontFamily: FONTS.body,
    fontSize: 11,
    marginTop: 10,
    textAlign: 'center',
  },
  pickers: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 10,
  },
  pickerRow: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    width: 68,
    alignItems: 'center',
    backgroundColor: 'rgba(254,250,224,0.06)',
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.10)',
    padding: 6,
  },
  chipSelected: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(238,155,0,0.15)',
  },
  chipDisabled: {
    opacity: 0.3,
  },
  chipImage: {
    width: 48,
    height: 34,
  },
  chipLabel: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
  },
});
