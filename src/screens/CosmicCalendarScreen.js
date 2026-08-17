// CosmicCalendarScreen — a Föld ~4540 millió éves történetét egyetlen
// (nem szökő-) évre vetíti: 1 nap = 4540/365 millió év. Január 1. a
// Föld keletkezése, december 31. a jelen. Az EVENTS lista (esemény, mya,
// leírás) az evolucio_foldtortenet_esemenyek.csv adatait tükrözi — a naptári
// nap ebből számolódik vissza (dayForAge), nem kézzel írt dátumból, így ha a
// millió éves adat változik, a dátum is automatikusan követi. Egy napra több
// esemény is eshet (kerekítés miatt) — ilyenkor a hover-tooltip mindet
// felsorolja.
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Shell from '../components/Shell';
import HeaderBar from '../components/HeaderBar';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { useT } from '../i18n';

const DAY_MYA = 4540 / 365; // 1 naptári nap ennyi millió évet reprezentál
const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_NAMES = [
  'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
  'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December',
];

// A nap végén "hány millió éve" járunk — december 31. = 0 (jelen).
function ageAtDayEnd(dayIndex) {
  return (365 - dayIndex) * DAY_MYA;
}

// Egy adott millió éves esemény melyik naptári napra esik.
function dayForAge(mya) {
  return Math.min(365, Math.max(1, Math.round(365 - mya / DAY_MYA)));
}

// forrás: evolucio_foldtortenet_esemenyek.csv
const EVENTS = [
  { title: 'Föld kialakulása', mya: 4540.0, desc: 'A Naprendszer és a Föld kialakulása.' },
  { title: 'Első óceánok', mya: 4400.0, desc: 'A felszín lehűlésével tartós folyékony víz jelent meg.' },
  { title: 'Első élet', mya: 3800.0, desc: 'A legkorábbi ismert életre utaló nyomok.' },
  { title: 'Első fotoszintézis', mya: 3500.0, desc: 'Megjelenik a fotoszintetizáló mikrobiális élet.' },
  { title: 'Cianobaktériumok', mya: 3500.0, desc: 'Oxigéntermelő fotoszintézis terjedése.' },
  { title: 'Nagy oxidáció', mya: 2400.0, desc: 'A légkör oxigéntartalma tartósan megemelkedik.' },
  { title: 'Első eukarióták', mya: 1800.0, desc: 'Megjelennek a sejtmagvas sejtek.' },
  { title: 'Többsejtű élet', mya: 1200.0, desc: 'Elterjednek az egyszerű többsejtű szervezetek.' },
  { title: 'Ediakara-bióta', mya: 575.0, desc: 'Korai nagyobb, összetett élőlényközösségek.' },
  { title: 'Kambriumi robbanás', mya: 539.0, desc: 'Gyors diverzifikáció és sok állati testfelépítés megjelenése.' },
  { title: 'Első gerinchúrosok', mya: 525.0, desc: 'Megjelennek a korai gerinchúros állatok.' },
  { title: 'Első ízeltlábúak', mya: 520.0, desc: 'Elterjednek a korai ízeltlábúak.' },
  { title: 'Első halak', mya: 520.0, desc: 'Megjelennek a korai állkapocs nélküli halak.' },
  { title: 'Első szárazföldi növények', mya: 470.0, desc: 'Egyszerű növények megjelennek a szárazföldön.' },
  { title: 'Ordoviciumi kihalás', mya: 444.0, desc: 'Nagy tengeri kihalási esemény.' },
  { title: 'Első állkapcsos halak', mya: 430.0, desc: 'Megjelennek az állkapoccsal rendelkező halak.' },
  { title: 'Első szárazföldi állatok', mya: 430.0, desc: 'Ízeltlábúak megjelennek a szárazföldön.' },
  { title: 'Első erdők', mya: 385.0, desc: 'Megjelennek az első valódi erdők.' },
  { title: 'Első négylábúak', mya: 375.0, desc: 'A halakból származó korai tetrapodák megjelennek.' },
  { title: 'Devoni kihalás', mya: 372.0, desc: 'Több hullámban súlyos tengeri kihalás zajlik.' },
  { title: 'Első magvas növények', mya: 365.0, desc: 'Megjelennek a magvas növények korai képviselői.' },
  { title: 'Karbonerdők', mya: 320.0, desc: 'Hatalmas mocsári erdők uralják a szárazföldet.' },
  { title: 'Első amnióták', mya: 315.0, desc: 'A szárazföldhöz jobban alkalmazkodó amnióták megjelennek.' },
  { title: 'Permi kihalás', mya: 252.0, desc: 'A Föld történetének legsúlyosabb ismert tömeges kihalása.' },
  { title: 'Első pteroszauruszok', mya: 228.0, desc: 'Megjelennek az első ismert repülő gerincesek e csoportban.' },
  { title: 'Első dinoszauruszok', mya: 235.0, desc: 'Megjelennek az első dinoszauruszok.', icon: '🦖' },
  { title: 'Első emlősök', mya: 225.0, desc: 'Megjelennek a korai emlősszerű és emlős állatok.' },
  { title: 'Triász–jura kihalás', mya: 201.0, desc: 'Nagy kihalás nyitja meg a dinoszauruszok további terjedését.' },
  { title: 'Első madárszerű dinoszauruszok', mya: 160.0, desc: 'Megjelennek a korai madárszerű theropodák.' },
  { title: 'Első valódi madarak', mya: 150.0, desc: 'A madarak korai képviselői megjelennek.' },
  { title: 'Első virágos növények', mya: 140.0, desc: 'Megjelennek a korai zárvatermők.' },
  { title: 'Első főemlősök', mya: 66.0, desc: 'A főemlősök korai képviselői megjelennek.' },
  { title: 'Kréta–paleogén kihalás', mya: 66.0, desc: 'A nem madár dinoszauruszok és sok más csoport kihal.', icon: '☄️' },
  { title: 'Első füvek', mya: 66.0, desc: 'Megjelennek a korai pázsitfűfélék.' },
  { title: 'Emlősök gyors terjedése', mya: 65.0, desc: 'Az emlősök sok új ökológiai szerepet foglalnak el.' },
  { title: 'Első emberszabásúak', mya: 25.0, desc: 'Megjelennek a korai emberszabású főemlősök.' },
  { title: 'Ausztralopitekuszok', mya: 4.0, desc: 'Megjelennek a korai két lábon járó homininák.' },
  { title: 'Homo nemzetség', mya: 2.8, desc: 'Megjelenik a Homo nemzetség.' },
  { title: 'Homo erectus', mya: 1.9, desc: 'Megjelenik a korai Homo erectus.' },
  { title: 'Tűzhasználat', mya: 1.0, desc: 'A tűz rendszeres használatának korai bizonyítékai.' },
  { title: 'Homo sapiens', mya: 0.3, desc: 'Megjelenik fajunk, a Homo sapiens.' },
  { title: 'Kivándorlás Afrikából', mya: 0.07, desc: 'A modern emberek nagyobb hullámban elterjednek Afrikán kívül.' },
  { title: 'Mezőgazdaság', mya: 0.012, desc: 'Megkezdődik a növénytermesztés és állattenyésztés.' },
  { title: 'Civilizációk', mya: 0.006, desc: 'Megjelennek az első városias, összetett társadalmak.' },
];

// Földtörténeti időszakok kezdete — a fixelt geologic_time_scale.csv (ICS)
// bázis-értékei (a periódus első stádiuma). Ezeket a naptárban a nap teteje
// fölé húzott, színes vonal jelöli, nem pont — más vizuális nyelv, mint az
// EVENTS.
const PERIODS = [
  { name: 'Kambrium kezdete', mya: 541.0, color: '#ffb703' },
  { name: 'Ordovicium kezdete', mya: 485.4, color: '#8ecae6' },
  { name: 'Szilur kezdete', mya: 443.8, color: '#ff006e' },
  { name: 'Devon kezdete', mya: 419.2, color: '#4cc9f0' },
  { name: 'Karbon kezdete', mya: 358.9, color: '#606c38' },
  { name: 'Perm kezdete', mya: 298.9, color: '#bc6c25' },
  { name: 'Triász kezdete', mya: 251.9, color: '#f72585' },
  { name: 'Jura kezdete', mya: 201.3, color: '#7bd389' },
  { name: 'Kréta kezdete', mya: 145.0, color: '#a78bfa' },
];

function formatAge(mya) {
  if (mya <= 0) return 'ma';
  if (mya < 1) return `kb. ${Math.round(mya * 1000)} ezer éve`;
  return `kb. ${mya} millió éve`;
}

function buildCalendar() {
  const eventsByDay = new Map();
  for (const ev of EVENTS) {
    const day = dayForAge(ev.mya);
    if (!eventsByDay.has(day)) eventsByDay.set(day, []);
    eventsByDay.get(day).push(ev);
  }

  const periodByDay = new Map();
  for (const p of PERIODS) {
    periodByDay.set(dayForAge(p.mya), p);
  }

  const months = [];
  let dayCounter = 0;
  for (let m = 0; m < 12; m++) {
    const days = [];
    for (let d = 1; d <= MONTH_LENGTHS[m]; d++) {
      dayCounter += 1;
      days.push({
        dayIndex: dayCounter,
        dayOfMonth: d,
        events: eventsByDay.get(dayCounter) || [],
        period: periodByDay.get(dayCounter) || null,
        ageMya: ageAtDayEnd(dayCounter),
      });
    }
    months.push({ name: MONTH_NAMES[m], days });
  }
  return months;
}

function DayCell({ day }) {
  const [hovered, setHovered] = useState(false);
  const highlighted = day.events.length > 0;
  const hasPeriod = !!day.period;
  const iconEvent = day.events.find((ev) => ev.icon);
  const labelParts = [
    ...day.events.map((ev) => `${ev.title}: ${ev.desc} (${formatAge(ev.mya)})`),
    ...(hasPeriod ? [`${day.period.name} (${formatAge(day.period.mya)})`] : []),
  ];

  return (
    <Pressable
      style={[
        styles.dayCell,
        highlighted && styles.dayCellHighlighted,
        hasPeriod && { borderTopWidth: 3, borderTopColor: day.period.color },
      ]}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityLabel={
        labelParts.length > 0
          ? labelParts.join(' · ')
          : `${day.dayOfMonth}. nap, kb. ${Math.round(day.ageMya)} millió éve`
      }
    >
      {iconEvent ? (
        <Text style={styles.dayCellIcon}>{iconEvent.icon}</Text>
      ) : highlighted ? (
        <Text style={styles.dayCellDot}>●</Text>
      ) : (
        <Text style={styles.dayCellNum}>{day.dayOfMonth}</Text>
      )}

      {(highlighted || hasPeriod) && hovered && (
        <View style={styles.tooltip} pointerEvents="none">
          {day.events.map((ev) => (
            <View key={ev.title} style={styles.tooltipRow}>
              <Text style={styles.tooltipTitle}>{ev.icon ? `${ev.icon} ` : ''}{ev.title} · {formatAge(ev.mya)}</Text>
              <Text style={styles.tooltipDesc}>{ev.desc}</Text>
            </View>
          ))}
          {hasPeriod && (
            <View style={styles.tooltipRow}>
              <Text style={[styles.tooltipTitle, { color: day.period.color }]}>
                {day.period.name} · {formatAge(day.period.mya)}
              </Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

export default function CosmicCalendarScreen({ nickname, progress, onNavigate, onBack }) {
  const { t } = useT();
  const months = useMemo(buildCalendar, []);

  return (
    <Shell header={<HeaderBar currentView="calendar" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityRole="button" accessibilityLabel={t('common.back')}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.cream} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>A Föld éve</Text>
            <Text style={styles.subtitle}>
              A ~4540 millió éves Föld-történet egyetlen évbe sűrítve — 1 nap = 4540/365 ≈ 12,44 millió év.
              Vidd az egeret egy kiemelt napra a részletekért.
            </Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.legend}>
            {PERIODS.map((p) => (
              <View key={p.name} style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: p.color }]} />
                <Text style={styles.legendText}>{p.name}</Text>
              </View>
            ))}
            <View style={styles.legendItem}>
              <Text style={styles.legendIcon}>🦖</Text>
              <Text style={styles.legendText}>Első dinoszauruszok</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendIcon}>☄️</Text>
              <Text style={styles.legendText}>Dinoszauruszok kihalása</Text>
            </View>
          </View>

          <View style={styles.calendar}>
            {months.map((month) => (
              <View key={month.name} style={styles.monthBlock}>
                <Text style={styles.monthLabel}>{month.name}</Text>
                <View style={styles.monthGrid}>
                  {month.days.map((day) => (
                    <DayCell key={day.dayIndex} day={day} />
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 999,
    backgroundColor: 'rgba(20,18,16,0.7)',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  title: {
    color: COLORS.accent,
    fontSize: 22,
    fontFamily: FONTS.heading,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: COLORS.cream,
    fontSize: 13,
    fontFamily: FONTS.body,
    opacity: 0.7,
    marginTop: 4,
    maxWidth: 560,
  },
  scroll: { flex: 1, width: '100%' },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  legend: {
    width: '100%',
    maxWidth: 820,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 16,
    height: 4,
    borderRadius: 2,
  },
  legendIcon: {
    fontSize: 14,
  },
  legendText: {
    color: COLORS.cream,
    fontSize: 12,
    fontFamily: FONTS.body,
    opacity: 0.8,
  },
  calendar: {
    width: '100%',
    maxWidth: 820,
    gap: 16,
  },
  monthBlock: { gap: 6 },
  monthLabel: {
    color: COLORS.cream,
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
    opacity: 0.85,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dayCell: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: 'rgba(254,250,224,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayCellHighlighted: {
    width: 20,
    height: 20,
    backgroundColor: COLORS.accent,
    zIndex: 1,
  },
  dayCellNum: {
    color: COLORS.cream,
    fontSize: 8,
    fontFamily: FONTS.body,
    opacity: 0.35,
  },
  dayCellDot: {
    color: COLORS.bgDark,
    fontSize: 10,
  },
  dayCellIcon: {
    fontSize: 13,
  },
  tooltip: {
    position: 'absolute',
    bottom: '130%',
    left: -90,
    width: 220,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(238,155,0,0.4)',
    borderRadius: RADIUS.card,
    padding: 10,
    gap: 8,
    zIndex: 50,
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(0,0,0,0.6)' },
    }),
  },
  tooltipRow: { gap: 2 },
  tooltipTitle: {
    color: COLORS.accent,
    fontSize: 12.5,
    fontFamily: FONTS.bodyBold,
  },
  tooltipDesc: {
    color: COLORS.cream,
    fontSize: 12,
    fontFamily: FONTS.body,
    opacity: 0.85,
  },
});
