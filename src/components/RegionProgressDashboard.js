// RegionProgressDashboard — a landing térkép alatti előrehaladás-panel: régiónként
// egy kártya (régiónév + "kinyitott / összes faj" + narancs haladás-sáv), mutatva
// hány kártyát nyitott már ki a játékos az adott régióból.
import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { COLORS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { EDU_LABELS, REGION_ORDER, regionCollectionStats } from '../utils/regionProgress';

function RegionCard({ name, collected, total, width }) {
  const ratio = total > 0 ? collected / total : 0;
  return (
    <View style={[styles.card, { width }]}>
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
      <Text style={styles.count}>{collected} / {total} faj</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%` }]} />
      </View>
    </View>
  );
}

export default function RegionProgressDashboard({ allDinos, progress }) {
  const { width } = useWindowDimensions();
  const stats = regionCollectionStats(allDinos, progress);

  // Reszponzív oszlopszám: mobil 1, tablet 2, széles 3. A gap-et beleszámítva a
  // százalékos szélesség kicsivel 100/cols alatt marad, hogy ne törjön sort.
  const cols = width >= 1024 ? 3 : width >= 700 ? 2 : 1;
  const GAP = 12;
  const cardWidth = cols === 3 ? '31.8%' : cols === 2 ? '48.5%' : '100%';

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>GYŰJTÉSI ELŐREHALADÁS</Text>
      <View style={[styles.grid, { gap: GAP }]}>
        {REGION_ORDER.map((edu) => (
          <RegionCard
            key={edu}
            name={EDU_LABELS[edu]}
            collected={stats[edu]?.collected || 0}
            total={stats[edu]?.total || 0}
            width={cardWidth}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginTop: 20,
  },
  heading: {
    color: COLORS.accent,
    fontSize: 15,
    fontFamily: FONTS.heading,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    opacity: 0.9,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: 'rgba(20,18,16,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.10)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  name: {
    color: COLORS.cream,
    fontSize: 18,
    fontFamily: FONTS.heading,
    marginBottom: 6,
  },
  count: {
    color: COLORS.cream,
    fontSize: 13,
    fontFamily: FONTS.body,
    opacity: 0.6,
    marginBottom: 12,
  },
  track: {
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(254,250,224,0.10)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.accentDark,
  },
});
