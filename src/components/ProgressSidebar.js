// ProgressSidebar — a landing jobb oldali sávja (3-oszlopos elrendezés,
// lásd LandingPage): bejelentkezve a játékos saját haladása (XP, napi
// sorozat, régiónkénti gyűjtési arány — utóbbi a világtérkép markerekkel
// és az alsó "Gyűjtési előrehaladás" kártyákkal hover-szinkronban), vendég
// módban egy regisztrációra ösztönző CTA-kártya.
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RADIUS, FONTS, TEXT_OPACITY } from '../constants/theme';
import { EDU_LABELS, REGION_ORDER } from '../utils/regionProgress';
import { useT } from '../i18n';

function RegionRow({ edu, ratio, count, highlighted, onHoverIn, onHoverOut, onPress }) {
  const pct = Math.round((ratio || 0) * 100);
  return (
    <Pressable
      style={[styles.regionRow, highlighted && styles.regionRowHighlighted]}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.regionRowHead}>
        <Text style={styles.regionName} numberOfLines={1}>{EDU_LABELS[edu]}</Text>
        <Text style={styles.regionPct}>{pct}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </Pressable>
  );
}

export default function ProgressSidebar({
  guest,
  xp,
  streak,
  regionRatios,
  regionCounts,
  overallRatio,
  hoveredRegion,
  onHoverRegion,
  onSelectRegion,
  onOpenJoin,
}) {
  const { t } = useT();
  const [ctaHovered, setCtaHovered] = useState(false);
  const overallPct = Math.round((overallRatio || 0) * 100);

  if (guest) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.heading}>{t('progress.heading')}</Text>
        <View style={styles.guestCard}>
          <MaterialCommunityIcons name="shield-star-outline" size={30} color={COLORS.accent} />
          <Text style={styles.guestTitle}>{t('progress.guest_title')}</Text>
          <Text style={styles.guestBody}>
            {t('progress.guest_body')}
          </Text>
          <Pressable
            style={[styles.ctaBtn, ctaHovered && styles.ctaBtnHovered]}
            onPress={onOpenJoin}
            onHoverIn={() => setCtaHovered(true)}
            onHoverOut={() => setCtaHovered(false)}
            accessibilityRole="button"
          >
            <Text style={styles.ctaBtnText}>{t('auth.join')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>{t('progress.heading')}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statPill}>
          <Text style={styles.statPillIcon}>🥚</Text>
          <Text style={styles.statPillText}>{xp} XP</Text>
        </View>
        {streak != null && (
          <View style={styles.statPill}>
            <MaterialCommunityIcons name="fire" size={15} color={COLORS.accent} />
            <Text style={styles.statPillText}>{t('header.streak', { days: streak })}</Text>
          </View>
        )}
      </View>

      <View style={styles.overallCard}>
        <Text style={styles.overallLabel}>{t('progress.overall_label')}</Text>
        <Text style={styles.overallPct}>{overallPct}%</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${overallPct}%` }]} />
        </View>
      </View>

      <Text style={[styles.heading, styles.headingSpaced]}>{t('progress.by_region')}</Text>
      <View style={styles.regionList}>
        {REGION_ORDER.map((edu) => (
          <RegionRow
            key={edu}
            edu={edu}
            ratio={regionRatios?.[edu]}
            count={regionCounts?.[edu]}
            highlighted={hoveredRegion === edu}
            onHoverIn={() => onHoverRegion?.(edu)}
            onHoverOut={() => onHoverRegion?.(null)}
            onPress={() => onSelectRegion?.(edu)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  heading: {
    color: COLORS.accent,
    fontSize: 14,
    fontFamily: FONTS.heading,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    opacity: 0.9,
    marginBottom: 10,
  },
  headingSpaced: { marginTop: 20 },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20,18,16,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.10)',
    borderRadius: RADIUS.pill,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  statPillIcon: { fontSize: 14 },
  statPillText: { color: COLORS.cream, fontSize: 13, fontFamily: FONTS.bodyBold },
  overallCard: {
    backgroundColor: 'rgba(20,18,16,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.08)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  overallLabel: {
    color: COLORS.cream,
    fontSize: 11,
    fontFamily: FONTS.bodyBold,
    letterSpacing: 1,
    opacity: TEXT_OPACITY.meta,
    marginBottom: 4,
  },
  overallPct: {
    color: COLORS.cream,
    fontSize: 24,
    fontFamily: FONTS.headingXBold,
    marginBottom: 8,
  },
  regionList: { gap: 10 },
  regionRow: {
    borderRadius: 12,
    padding: 10,
    backgroundColor: 'rgba(20,18,16,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.07)',
    ...Platform.select({
      web: { cursor: 'pointer', transitionProperty: 'border-color, background-color, transform', transitionDuration: '150ms' },
    }),
  },
  regionRowHighlighted: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(238,155,0,0.10)',
    transform: [{ translateX: -2 }],
  },
  regionRowHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  regionName: { color: COLORS.cream, fontSize: 13, fontFamily: FONTS.bodyBold, flex: 1 },
  regionPct: { color: COLORS.accent, fontSize: 12.5, fontFamily: FONTS.bodyBold, marginLeft: 6 },
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(254,250,224,0.10)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.accentDark,
  },
  guestCard: {
    backgroundColor: 'rgba(20,18,16,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(238,155,0,0.22)',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 8,
  },
  guestTitle: {
    color: COLORS.cream,
    fontSize: 15,
    fontFamily: FONTS.heading,
    textAlign: 'center',
    opacity: TEXT_OPACITY.primary,
  },
  guestBody: {
    color: COLORS.cream,
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: FONTS.body,
    textAlign: 'center',
    opacity: TEXT_OPACITY.secondary,
    marginBottom: 4,
  },
  ctaBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
    paddingVertical: 10,
    paddingHorizontal: 24,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 0 0 1px rgba(238,155,0,0.4), 0 4px 14px rgba(238,155,0,0.35)',
        transitionProperty: 'background-color, transform',
        transitionDuration: '120ms',
      },
    }),
  },
  ctaBtnHovered: {
    backgroundColor: COLORS.accentDark,
    transform: [{ scale: 1.03 }],
  },
  ctaBtnText: { color: COLORS.bgDark, fontSize: 14, fontFamily: FONTS.bodyBold },
});
