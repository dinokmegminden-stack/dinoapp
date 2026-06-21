import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const START_MA = 252;
const END_MA = 66;
const TOTAL_DURATION = START_MA - END_MA; // 186

const TICKS = [252, 247, 237, 201, 174, 161, 143, 100, 66];

const TRIASSIC_WIDTH = ((252 - 201) / TOTAL_DURATION) * 100;
const JURASSIC_WIDTH = ((201 - 143) / TOTAL_DURATION) * 100;
const CRETACEOUS_WIDTH = ((143 - 66) / TOTAL_DURATION) * 100;

// "72-66" vagy "70" vagy "70 millió éve" -> numerikus Ma érték (átlag, ha tartomány)
function parseKorMillioev(value) {
  if (value === null || value === undefined) return null;
  const nums = String(value).match(/\d+(\.\d+)?/g);
  if (!nums || nums.length === 0) return null;
  const parsed = nums.map(Number);
  const avg = parsed.reduce((a, b) => a + b, 0) / parsed.length;
  return avg;
}

function clampPercent(p) {
  return Math.min(100, Math.max(0, p));
}

export default function PeriodTimeline({ korMillioev }) {
  const markerMa = parseKorMillioev(korMillioev);
  const markerPositionPercent =
    markerMa !== null ? clampPercent(((START_MA - markerMa) / TOTAL_DURATION) * 100) : null;

  return (
    <View style={styles.container}>
      {/* Korszak sávok */}
      <View style={styles.barRow}>
        <View style={[styles.barSegment, { width: `${TRIASSIC_WIDTH}%`, backgroundColor: '#9c66a6' }]}>
          <Text style={styles.barLabel}>Triász</Text>
        </View>
        <View style={[styles.barSegment, { width: `${JURASSIC_WIDTH}%`, backgroundColor: '#4ba3c3' }]}>
          <Text style={styles.barLabel}>Jura</Text>
        </View>
        <View style={[styles.barSegment, { width: `${CRETACEOUS_WIDTH}%`, backgroundColor: '#3caea3', borderRightWidth: 0 }]}>
          <Text style={styles.barLabel}>Kréta</Text>
        </View>
      </View>

      {/* Jelölő sáv */}
      <View style={styles.markerTrack}>
        <View style={styles.trackLine} />
        {TICKS.map((tick) => {
          const leftPos = ((START_MA - tick) / TOTAL_DURATION) * 100;
          return <View key={tick} style={[styles.tickMark, { left: `${leftPos}%` }]} />;
        })}
        {markerPositionPercent !== null && (
          <View style={[styles.markerWrap, { left: `${markerPositionPercent}%` }]}>
            <View style={styles.markerShield} />
          </View>
        )}
      </View>

      {/* Tengely számok */}
      <View style={styles.tickLabelRow}>
        {TICKS.map((tick) => {
          const leftPos = ((START_MA - tick) / TOTAL_DURATION) * 100;
          let translate = -50;
          if (tick === START_MA) translate = 0;
          if (tick === END_MA) translate = -100;
          return (
            <Text
              key={tick}
              style={[
                styles.tickLabel,
                { left: `${leftPos}%`, transform: [{ translateX: `${translate}%` }] },
              ]}
            >
              {tick}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  barRow: {
    flexDirection: 'row',
    height: 28,
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  barSegment: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.2)',
  },
  barLabel: { fontSize: 13, fontWeight: '700', color: '#000' },
  markerTrack: { width: '100%', height: 22, marginTop: 4, position: 'relative' },
  trackLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#6b7280',
  },
  tickMark: {
    position: 'absolute',
    top: 0,
    width: 1,
    height: 8,
    backgroundColor: '#9ca3af',
  },
  markerWrap: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    transform: [{ translateX: -8 }],
  },
  markerShield: {
    width: 16,
    height: 20,
    backgroundColor: '#78b159',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  tickLabelRow: { width: '100%', height: 14, marginTop: 2, position: 'relative' },
  tickLabel: {
    position: 'absolute',
    top: 0,
    fontSize: 10,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
});