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

const GRID_PX_PER_METER = 50; // fix méter-rács: minden sávnak UGYANAZ a léptéke
const Y_AXIS_WIDTH = 26; // hely a bal oldali magasság-számoknak
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

// Méter-rács: minden sáv (két dínó + ember) ugyanazt a rácsot kapja —
// azonos GRID_PX_PER_METER lépték, azonos oszlop-/sorszám, azonos stílus —
// hogy a hossz és a magasság közvetlenül, vonalzóként leolvasható legyen
// egymáshoz képest is. gridCols/gridRows a teljes összehasonlításra közösen
// számolt, hogy mindhárom sáv rácsa egyformán széles/magas legyen.
function GridBackground({ gridCols, gridRows }) {
  const w = gridCols * GRID_PX_PER_METER;
  const h = gridRows * GRID_PX_PER_METER;
  return (
    <View style={[styles.gridBg, { width: w, height: h }]} pointerEvents="none">
      {Array.from({ length: gridCols + 1 }).map((_, i) => (
        <View key={`v${i}`} style={[styles.gridLineV, { left: i * GRID_PX_PER_METER }]} />
      ))}
      {Array.from({ length: gridRows + 1 }).map((_, i) => (
        <View key={`h${i}`} style={[styles.gridLineH, { top: h - i * GRID_PX_PER_METER }]} />
      ))}
    </View>
  );
}

function XAxisNumbers({ gridCols }) {
  return (
    <View style={[styles.xAxisRow, { width: gridCols * GRID_PX_PER_METER, marginLeft: Y_AXIS_WIDTH }]}>
      {Array.from({ length: gridCols }).map((_, i) => (
        <Text key={i} style={[styles.axisLabel, { position: 'absolute', left: i * GRID_PX_PER_METER + 2, width: GRID_PX_PER_METER }]}>
          {i + 1}
        </Text>
      ))}
    </View>
  );
}

// Folytonos Y-tengely: NEM sávonként újrakezdődő 1..gridRows, hanem egy
// darab számsor a teljes (3 alak magas) rács aljától a tetejéig.
function YAxisNumbers({ totalRows }) {
  const h = totalRows * GRID_PX_PER_METER;
  return (
    <View style={[styles.yAxisCol, { width: Y_AXIS_WIDTH, height: h }]}>
      {Array.from({ length: totalRows }).map((_, i) => (
        <Text key={i} style={[styles.axisLabel, styles.axisLabelY, { position: 'absolute', top: h - (i + 1) * GRID_PX_PER_METER - 6 }]}>
          {i + 1}
        </Text>
      ))}
    </View>
  );
}

// Egy alak a KÖZÖS rácson belül: az orr / a kép bal széle mindig a rács
// x=0 pontján, a lábak a saját sávjának aljánál (bottomOffset), amit a
// hívó ad meg — nem önálló mini-rács, hanem egy pozíció a nagy, egyben
// megjelenő rácson. A szélesség a kép saját natív arányából jön, onLoad-ból
// olvasva (Image.resolveAssetSource nem elérhető react-native-web-en).
function Figure({ source, heightM, locked, bottomOffset }) {
  const [aspect, setAspect] = useState(2);
  const renderHeight = Math.max(20, heightM * GRID_PX_PER_METER);
  const renderWidth = renderHeight * aspect;

  return (
    <View style={[styles.figureAnchor, { bottom: bottomOffset }]}>
      <Image
        source={source}
        style={[{ width: renderWidth, height: renderHeight }, locked && styles.dinoImageLocked]}
        resizeMode="contain"
        onLoad={(e) => {
          const { width, height } = e.nativeEvent?.source || {};
          if (width && height) setAspect(width / height);
        }}
      />
      {locked && (
        <MaterialCommunityIcons name="lock" size={20} color={COLORS.cream} style={styles.lockIcon} />
      )}
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
  const leftLengthM = leftDino ? (leftDino.length_m_max ?? leftDino.length_m_min ?? leftHeightM) : 0;
  const rightLengthM = rightDino ? (rightDino.length_m_max ?? rightDino.length_m_min ?? rightHeightM) : 0;

  // Mindhárom sáv (2 dínó + ember) UGYANAZT a rácsméretet kapja — a
  // leghosszabb/legmagasabb alak adja a rács kiterjedését, +1 m ráhagyással,
  // hogy a vonalzó ne vágja le pont a tetején.
  const gridCols = Math.max(2, Math.ceil(Math.max(leftLengthM, rightLengthM, 1)) + 1);
  const gridRows = Math.max(2, Math.ceil(Math.max(leftHeightM, rightHeightM, HUMAN_HEIGHT_M)) + 1);

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
          <XAxisNumbers gridCols={gridCols} />
          <View style={styles.figureRow}>
            <YAxisNumbers totalRows={gridRows * 3} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ width: gridCols * GRID_PX_PER_METER, height: gridRows * 3 * GRID_PX_PER_METER }}>
                <GridBackground gridCols={gridCols} gridRows={gridRows * 3} />
                {rightDino && (
                  <Figure
                    key={rightName}
                    source={COMPARISON_IMAGE_MAP[rightDino.name_hu]}
                    heightM={rightHeightM}
                    locked={!isCollected(rightDino, progress)}
                    bottomOffset={0}
                  />
                )}
                <Figure
                  source={COMPARISON_HUMAN_IMAGE}
                  heightM={HUMAN_HEIGHT_M}
                  locked={false}
                  bottomOffset={gridRows * GRID_PX_PER_METER}
                />
                {leftDino && (
                  <Figure
                    key={leftName}
                    source={COMPARISON_IMAGE_MAP[leftDino.name_hu]}
                    heightM={leftHeightM}
                    locked={!isCollected(leftDino, progress)}
                    bottomOffset={gridRows * 2 * GRID_PX_PER_METER}
                  />
                )}
              </View>
            </ScrollView>
          </View>
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
    padding: 12,
    paddingTop: 34,
    backgroundColor: 'rgba(16,14,12,0.6)',
    borderRadius: RADIUS.cardLarge,
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.10)',
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
  // Mindhárom sáv (2 dínó + ember) ugyanazt a rácsot használja: a magasság
  // (Y) számok balra, a rács + a figura pedig egy vízszintesen görgethető
  // sávban — a hossz-tengely (X) számai a legfelső sávnál egyszer jelennek
  // meg, a rácsvonalak közösek, azonos GRID_PX_PER_METER léptékkel.
  xAxisRow: {
    height: 16,
    marginBottom: 2,
  },
  figureRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  yAxisCol: {
    position: 'relative',
  },
  axisLabel: {
    color: 'rgba(254,250,224,0.55)',
    fontFamily: FONTS.body,
    fontSize: 10,
    textAlign: 'center',
  },
  axisLabelY: {
    right: 6,
    width: Y_AXIS_WIDTH - 6,
    textAlign: 'right',
  },
  gridBg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(254,250,224,0.10)',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(254,250,224,0.10)',
  },
  // Az orr / a kép bal széle mindig a rács x=0-jánál, a lábak mindig a rács
  // y=0 (alsó) vonalánál — nem középre igazítva, mint korábban.
  figureAnchor: {
    position: 'absolute',
    left: 0,
    bottom: 0,
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
    opacity: 0.35,
    tintColor: COLORS.cream,
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
