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
import { COMPARISON_NAMES, COMPARISON_IMAGE_MAP, COMPARISON_HUMAN_IMAGE } from '../constants/comparisonDinos';
import { COLORS, RADIUS, FONTS } from '../constants/theme';
import { useT } from '../i18n';

const STAGE_HEIGHT = 260;
const MAX_FIGURE_FRACTION = 0.7; // a legmagasabb alak se lépje túl a színpad 70%-át
const HUMAN_HEIGHT_M = 1.8;
const DEFAULT_LEFT = 'Tyrannosaurus';
const DEFAULT_RIGHT = 'Velociraptor';

function isCollected(dino, progress) {
  return progress?.[dino?.edu]?.[dino?.csomag]?.quizPassed === true;
}

function formatWeight(kg) {
  if (kg == null) return '?';
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)} t` : `${kg} kg`;
}

// A sziluett-magasság a valódi méretösszehasonlításhoz: a dínó álló
// magassága, ennek híján a hossza (négylábú, alacsony testű fajoknál ez a
// jobb közelítés). Zárolt dínónál is a valós DB-értéket használjuk a
// léptékhez — csak a kiírt szám marad "???", a sziluett aránya valós marad.
function getScaleHeightM(dino) {
  return dino?.height_m_max ?? dino?.height_m_min ?? dino?.length_m_max ?? dino?.length_m_min ?? 2;
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

// Egy dínó a közös színpadon: a kép szélessége/magassága EGYSÉGESEN
// (torzítás nélkül) van felskálázva a kép saját natív arányából és a
// valós magasságból számolt közös pxPerMeter-ből — ezért ugyanazon a
// talajvonalon állva a hossz ÉS a magasság is valós arányban látszik.
// A natív arányt onLoad-ból olvassuk (Image.resolveAssetSource nem elérhető
// react-native-web-en) — betöltésig egy hosszúkás alapértelmezés van.
function StageFigure({ dino, progress, pxPerMeter }) {
  const [aspect, setAspect] = useState(2);
  if (!dino) return <View style={styles.stageColumn} />;
  const collected = isCollected(dino, progress);
  const heightM = getScaleHeightM(dino);
  const source = COMPARISON_IMAGE_MAP[dino.name_hu];
  const renderHeight = Math.max(20, heightM * pxPerMeter);
  const renderWidth = renderHeight * aspect;

  return (
    <View style={styles.stageColumn}>
      <Image
        source={source}
        style={[{ width: renderWidth, height: renderHeight }, !collected && styles.dinoImageLocked]}
        resizeMode="contain"
        onLoad={(e) => {
          const { width, height } = e.nativeEvent?.source || {};
          if (width && height) setAspect(width / height);
        }}
      />
      {!collected && (
        <MaterialCommunityIcons name="lock" size={20} color={COLORS.cream} style={styles.lockIcon} />
      )}
    </View>
  );
}

// A referencia emberalak — ugyanaz az onLoad-alapú arány-kiszámítás, mint
// a StageFigure-nél, csak fix 1.8 m magassággal és zárolás nélkül.
function HumanFigure({ pxPerMeter }) {
  const [aspect, setAspect] = useState(0.5);
  const renderHeight = Math.max(20, HUMAN_HEIGHT_M * pxPerMeter);
  const renderWidth = renderHeight * aspect;

  return (
    <View style={styles.stageColumn}>
      <Image
        source={COMPARISON_HUMAN_IMAGE}
        style={{ width: renderWidth, height: renderHeight, opacity: 0.7 }}
        resizeMode="contain"
        onLoad={(e) => {
          const { width, height } = e.nativeEvent?.source || {};
          if (width && height) setAspect(width / height);
        }}
      />
    </View>
  );
}

function DinoStats({ dino, progress, t }) {
  if (!dino) return <View style={styles.panel} />;
  const collected = isCollected(dino, progress);
  const lengthM = dino.length_m_max ?? dino.length_m_min;
  const heightM = dino.height_m_max ?? dino.height_m_min;
  const weightKg = dino.weight_kg_max ?? dino.weight_kg_min;
  const myaMax = dino.mya_max;
  const myaMin = dino.mya_min;

  return (
    <View style={styles.panel}>
      <Text style={styles.dinoName} numberOfLines={1}>
        {collected ? dino.name_hu : t('comparison.locked_name')}
      </Text>

      <View style={styles.statRow}>
        <Text style={styles.statLabel}>{t('comparison.stat_length')}</Text>
        <Text style={styles.statValue}>{collected ? (lengthM != null ? `${lengthM} m` : '—') : '???'}</Text>
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

  const leftHeightM = leftDino ? getScaleHeightM(leftDino) : 0;
  const rightHeightM = rightDino ? getScaleHeightM(rightDino) : 0;

  // Közös léptékszorzó: kizárólag a DB valós height_m adataiból, úgy hogy a
  // legmagasabb alak (a három közül: két dínó + 1.8 m ember) se lépje túl a
  // színpad magasságának MAX_FIGURE_FRACTION (70%) hányadát.
  const pxPerMeter = useMemo(() => {
    const maxH = Math.max(leftHeightM, rightHeightM, HUMAN_HEIGHT_M);
    return (STAGE_HEIGHT * MAX_FIGURE_FRACTION) / maxH;
  }, [leftHeightM, rightHeightM]);

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

        <View style={styles.stage}>
          <Text style={styles.humanCaption}>{t('comparison.human_reference', { m: HUMAN_HEIGHT_M })}</Text>
          <View style={styles.stageRow}>
            <StageFigure key={leftName || 'left'} dino={leftDino} progress={progress} pxPerMeter={pxPerMeter} />
            <HumanFigure pxPerMeter={pxPerMeter} />
            <StageFigure key={rightName || 'right'} dino={rightDino} progress={progress} pxPerMeter={pxPerMeter} />
          </View>
          <View style={styles.groundLine} />
        </View>

        <View style={styles.compareRow}>
          <DinoStats dino={leftDino} progress={progress} t={t} />
          <Text style={styles.vs}>VS</Text>
          <DinoStats dino={rightDino} progress={progress} t={t} />
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
  stage: {
    marginHorizontal: 20,
    marginTop: 8,
    paddingTop: 28,
    backgroundColor: 'rgba(16,14,12,0.6)',
    borderRadius: RADIUS.cardLarge,
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.10)',
    overflow: 'hidden',
  },
  humanCaption: {
    position: 'absolute',
    top: 8,
    left: 14,
    color: COLORS.cream,
    opacity: 0.5,
    fontFamily: FONTS.body,
    fontSize: 11,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: STAGE_HEIGHT,
  },
  // Ember + két dínó egyenlő szélességű oszlopban — egyik dínó se dominálja
  // vizuálisan a színpadot, mindegyik ugyanannyi vízszintes helyet kap.
  stageColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  groundLine: {
    height: 2,
    backgroundColor: COLORS.accent,
    opacity: 0.6,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  vs: {
    color: COLORS.accent,
    fontFamily: FONTS.heading,
    fontSize: 18,
    marginTop: 20,
  },
  panel: {
    flex: 1,
    maxWidth: 320,
    backgroundColor: 'rgba(16,14,12,0.6)',
    borderRadius: RADIUS.cardLarge,
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.10)',
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  dinoName: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 16,
    marginBottom: 10,
  },
  dinoImageLocked: {
    opacity: 0.25,
    tintColor: COLORS.bgDark,
  },
  lockIcon: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
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
