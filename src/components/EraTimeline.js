// EraTimeline — a TradingCard "alt" nézetében eredetileg MesoTimeline néven élő,
// vízszintes geológiai idővonal-sáv általánosított, újrafelhasználható változata.
// A hívó adja meg a skála végpontjait (millió évben) és a korszak-/időszaksávokat,
// így ugyanez a vizuális nyelv használható a dínókártyán (250M–66M, Mezozoikum)
// és egy teljes, máig tartó idővonalon is (pl. az irányítópulton).
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';

const EPOCH_MIN_LABEL_PCT = 5;

// ICS (International Chronostratigraphic Chart) pontos korszakhatárok, millió
// évben — a dínókártyán használt Mezozoikum-skála (250M–66M) sávjai és finom
// korszakai. A Kora-triász kezdete valójában 251.9M, de a skála kerek 250M-en
// indul (ez a Kora-triász elejéről levág kb. 2M-et, elhanyagolható, alig
// észrevehető csík lenne úgyis).
export const MESOZOIC_ERAS = [
  { start: 250, end: 201.3, color: '#8fb28a' },
  { start: 201.3, end: 145.0, color: '#7fa9c9' },
  { start: 145.0, end: 66.0, color: '#cf9a5c' },
];

export const MESOZOIC_EPOCH_STAGES = [
  { label: 'Kora-triász', start: 250, end: 247.2 },
  { label: 'Közép-triász', start: 247.2, end: 237.0 },
  { label: 'Késő-triász', start: 237.0, end: 201.3 },
  { label: 'Kora-jura', start: 201.3, end: 174.1 },
  { label: 'Közép-jura', start: 174.1, end: 163.5 },
  { label: 'Késő-jura', start: 163.5, end: 145.0 },
  { label: 'Kora-kréta', start: 145.0, end: 100.5 },
  { label: 'Késő-kréta', start: 100.5, end: 66.0 },
];

// A kréta végétől (66M) máig tartó kainozoikumi időszakok, szintén ICS-pontos
// határokkal. A Negyedidőszak (2,58M–ma) a teljes 250M-es skálán valójában
// alig 1%-nyi sáv lenne, a Neogén utolsó 10M éve is csak töredéknyi — ezek
// láthatatlanná/kibogozhatatlanná tennék a jelenkorhoz közeli részt, ezért a
// Neogén itt két, azonos színű darabra van bontva (a felirat/tick-logika ezt
// nem látja, csak a színsáv-renderelés — lásd buildAdjustedScale), és a
// legutolsó 10M évnek megfelelő két darab (Neogén vége + Negyedidőszak)
// `minPct`-tel mesterséges minimum-szélességet kap, hogy jobban kibontva,
// olvashatóan látszódjon a jelenkorhoz közeli rész (a többi sáv ezért picit
// keskenyebb lesz, mint a szigorúan vett arány).
export const CENOZOIC_ERAS = [
  { start: 66.0, end: 23.03, color: '#c98a4b' },
  { start: 23.03, end: 10, color: '#8a9a4e' },
  { start: 10, end: 2.58, color: '#8a9a4e', minPct: 9 },
  { start: 2.58, end: 0, color: '#8fa3b0', minPct: 11 },
];

export const CENOZOIC_EPOCH_STAGES = [
  { label: 'Paleogén', start: 66.0, end: 23.03 },
  { label: 'Neogén', start: 23.03, end: 2.58 },
  { label: 'Negyedidőszak', start: 2.58, end: 0 },
];

function pctFor(mya, scaleStart, scaleEnd) {
  return ((scaleStart - mya) / (scaleStart - scaleEnd)) * 100;
}

// Az `eras` sávok szélessége alapból a valós időtartammal arányos, de egy-egy
// nagyon rövid szakasz (pl. Negyedidőszak, 2,58M) `minPct`-tel kikényszerített
// minimum-szélességet kaphat, hogy egyáltalán látszódjon. Ha ez megnöveli egy
// sáv szélességét, a többinek arányosan keskenyednie kell, különben a végösszeg
// túllógna 100%-on, és a korszakfeliratok átfednék egymást — ezt csinálja ez a
// függvény: a flexbox-logikát előre lemodellezve egy közös, torzított skálát ad
// vissza, amit az era-sávok ÉS a korszakfeliratok pozicionálása is egyaránt
// használ, így a kettő mindig fedésben marad, átfedés nélkül.
function buildAdjustedScale(eras, scaleStart, scaleEnd) {
  const trueWidths = eras.map(
    (era) => pctFor(era.end, scaleStart, scaleEnd) - pctFor(era.start, scaleStart, scaleEnd)
  );
  const flexWidths = eras.map((era, i) => Math.max(trueWidths[i], era.minPct || 0));
  const sumFlex = flexWidths.reduce((a, b) => a + b, 0) || 1;

  let cursor = 0;
  return eras.map((era, i) => {
    const width = (flexWidths[i] / sumFlex) * 100;
    const left = cursor;
    cursor += width;
    return { start: era.start, end: era.end, left, width };
  });
}

// A `segments` (buildAdjustedScale eredménye) alapján egy tetszőleges millió
// éves időpontot vetít a torzított 0–100%-os megjelenítési skálára — a hozzá
// tartozó era-szegmensen belül lineárisan interpolálva.
function adjustedPctFor(mya, segments) {
  const seg =
    segments.find((s) => mya <= s.start + 1e-9 && mya >= s.end - 1e-9) || segments[segments.length - 1];
  const span = seg.start - seg.end;
  const frac = span > 0 ? (seg.start - mya) / span : 0;
  return seg.left + frac * seg.width;
}

function formatAgeRange(a, b) {
  if (a == null && b == null) return '—';
  if (a != null && b != null && a !== b) {
    return `${Math.max(a, b)}–${Math.min(a, b)}M`;
  }
  return `${a ?? b}M`;
}

export default function EraTimeline({
  scaleStart,
  scaleEnd,
  eras,
  epochStages,
  myaMin,
  myaMax,
  boldFont,
  bodyFont,
  large,
  xlarge,
  startLabel,
  endLabel,
  showRange = true,
}) {
  const segments = buildAdjustedScale(eras, scaleStart, scaleEnd);
  const pct = (mya) => adjustedPctFor(mya, segments);

  const pctMin = myaMin != null ? pct(myaMin) : null;
  const pctMax = myaMax != null ? pct(myaMax) : null;
  const rangePcts = [pctMin, pctMax].filter((p) => p != null);

  const rawLeftPct = rangePcts.length ? Math.min(...rangePcts) : null;
  const rawRightPct = rangePcts.length ? Math.max(...rangePcts) : null;
  const rawMidPct = rangePcts.length ? (rawLeftPct + rawRightPct) / 2 : null;

  const displayRange = showRange && rawMidPct != null && rawMidPct >= -3 && rawMidPct <= 103;
  const leftPct = displayRange ? Math.max(0, Math.min(100, rawLeftPct)) : null;
  const rightPct = displayRange ? Math.max(0, Math.min(100, rawRightPct)) : null;
  const midPct = displayRange ? Math.max(0, Math.min(100, rawMidPct)) : null;

  const epochInteriorBoundaries = epochStages.slice(1).map((e) => e.start);

  return (
    <LinearGradient colors={[COLORS.action, COLORS.accentDark]} style={[s.timeline, large && s.timelineLarge, xlarge && s.timelineXLarge]}>
      <View style={s.timelineLabelRow}>
        <Text style={[s.timelineLabelText, large && s.timelineLabelTextLarge, xlarge && s.timelineLabelTextXLarge, { fontFamily: boldFont }]}>{startLabel}</Text>
        <Text style={[s.timelineLabelText, large && s.timelineLabelTextLarge, xlarge && s.timelineLabelTextXLarge, { fontFamily: boldFont }]}>{endLabel}</Text>
      </View>

      <View style={[s.timelineEras, xlarge && s.timelineErasXLarge]}>
        {segments.map((seg) => (
          <View
            key={`${seg.start}-${seg.end}`}
            style={[s.era, { flex: seg.width, backgroundColor: eras.find((e) => e.start === seg.start).color }]}
          />
        ))}
      </View>

      <View style={[s.epochLabelRow, xlarge && s.epochLabelRowXLarge]}>
        {epochStages.map((epoch) => {
          const leftP = pct(epoch.start);
          const widthP = pct(epoch.end) - leftP;
          if (widthP < EPOCH_MIN_LABEL_PCT) return null;
          return (
            <View key={epoch.label} style={[s.epochLabelWrap, { left: `${leftP}%`, width: `${widthP}%` }]}>
              <Text
                style={[s.epochLabelText, large && s.epochLabelTextLarge, xlarge && s.epochLabelTextXLarge, { fontFamily: bodyFont }]}
                numberOfLines={1}
              >
                {epoch.label}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={s.timelineTrack}>
        <View style={s.timelineBaseline} />
        {epochInteriorBoundaries.map((boundary) => (
          <View
            key={boundary}
            style={[s.eraBoundaryTick, large && s.eraBoundaryTickLarge, xlarge && s.eraBoundaryTickXLarge, { left: `${pct(boundary)}%` }]}
          />
        ))}
        {displayRange && (
          <View
            style={[
              s.rangeBar,
              large && s.rangeBarLarge,
              { left: `${leftPct}%`, width: `${rightPct - leftPct}%` },
            ]}
          />
        )}
        {displayRange && (myaMin != null || myaMax != null) && (
          <View style={[s.marker, { left: `${midPct}%` }]}>
            <View style={[s.markerFlag, large && s.markerFlagLarge]}>
              <Text style={[s.markerFlagText, large && s.markerFlagTextLarge, { fontFamily: boldFont }]}>
                {formatAgeRange(myaMax, myaMin)}
              </Text>
            </View>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  timeline: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
  },
  timelineLarge: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
  },
  timelineXLarge: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
  },
  timelineLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timelineLabelText: {
    color: '#3c2c17',
    fontSize: 7.5,
    letterSpacing: 0.3,
  },
  timelineLabelTextLarge: {
    fontSize: 10,
  },
  timelineLabelTextXLarge: {
    fontSize: 15,
  },
  timelineEras: {
    flexDirection: 'row',
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 3,
  },
  timelineErasXLarge: {
    height: 10,
    borderRadius: 5,
    marginBottom: 6,
  },
  era: { height: '100%' },
  epochLabelRow: {
    height: 9,
    marginBottom: 8,
    position: 'relative',
  },
  epochLabelRowXLarge: {
    height: 18,
    marginBottom: 10,
  },
  epochLabelWrap: {
    position: 'absolute',
    top: 0,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  epochLabelText: {
    color: 'rgba(60,44,23,0.75)',
    fontSize: 5.5,
    letterSpacing: 0.1,
  },
  epochLabelTextLarge: {
    fontSize: 7,
  },
  epochLabelTextXLarge: {
    fontSize: 13,
    color: 'rgba(60,44,23,0.85)',
  },
  timelineTrack: {
    height: 4,
    justifyContent: 'center',
  },
  timelineBaseline: {
    height: 1.5,
    backgroundColor: 'rgba(60,44,23,0.35)',
    borderRadius: 1,
  },
  rangeBar: {
    position: 'absolute',
    top: '50%',
    height: 6,
    minWidth: 6,
    marginTop: -3,
    borderRadius: 3,
    backgroundColor: '#9b2b20',
    borderWidth: 1,
    borderColor: 'rgba(253,243,231,0.7)',
  },
  rangeBarLarge: {
    height: 9,
    marginTop: -4.5,
    borderRadius: 4.5,
  },
  eraBoundaryTick: {
    position: 'absolute',
    top: -4,
    width: 1,
    height: 10,
    backgroundColor: 'rgba(60,44,23,0.55)',
  },
  // xlarge módban a színsáv és a korszakfelirat-sor is jóval magasabb (lásd
  // timelineErasXLarge/epochLabelRowXLarge) — a pálcikának ugyanezt a
  // magasságot kell átívelnie, különben rövidke, "lebegő" vonalkaként ülne a
  // sáv alján, nem érve fel a színsáv aljáig (ez okozta, hogy a színek és a
  // pálcikák nem passzoltak egymáshoz).
  eraBoundaryTickXLarge: {
    top: -44,
    height: 48,
    width: 1.5,
  },
  eraBoundaryTickLarge: {
    top: -6,
    height: 15,
  },
  marker: {
    position: 'absolute',
    top: -6,
    width: 1,
    marginLeft: 0,
    alignItems: 'center',
  },
  markerFlag: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: 'rgba(155,43,32,0.55)',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 4,
    minWidth: 54,
    alignItems: 'center',
  },
  markerFlagLarge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 76,
  },
  markerFlagText: {
    color: '#fdf3e7',
    fontSize: 7.5,
  },
  markerFlagTextLarge: {
    fontSize: 10,
  },
});
