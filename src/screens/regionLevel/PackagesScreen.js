import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { COLORS } from '../../constants/colors';
import { isPackUnlocked, PASS_THRESHOLD, EDU_LABELS, BONUS_PACK } from '../../utils/regionProgress';
import { csomagToPackId } from '../../utils/regionHelpers';
import LevelShell from './LevelShell';
import HeaderBar from '../../components/HeaderBar';
import { s } from './RegionLevel.styles';
import { useT } from '../../i18n';

export default function PackagesScreen({ eduLevel, progress, packages, onOpenPackage, onBack, nickname, onNavigate }) {
  const { t } = useT();
  return (
    <LevelShell header={<HeaderBar currentView="region" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView style={s.packagesScrollFlex} contentContainerStyle={s.packagesScroll}>
        <Text style={s.levelTitle}>{t('packages.title')}</Text>
        <Text style={s.levelSubtitle}>{EDU_LABELS[eduLevel] || eduLevel}</Text>
        <Text style={s.levelDesc}>
          {t('packages.desc', { pct: Math.round(PASS_THRESHOLD * 100) })}
        </Text>

        {packages.map(({ csomag, dinos }) => {
          const packId = csomagToPackId(eduLevel, csomag);
          const unlocked = isPackUnlocked(eduLevel, packId, progress);
          const passed = !!progress?.[eduLevel]?.[packId]?.quizPassed;

          return (
            <TouchableOpacity
              key={csomag}
              disabled={!unlocked}
              onPress={() => onOpenPackage(csomag)}
              style={[s.packageCard, !unlocked && s.packageCardLocked]}
            >
              <View style={s.packageIconWrap}>
                <Text style={s.packageIcon}>{unlocked ? (passed ? '✅' : '🦴') : '🔒'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.packageName}>{csomag === BONUS_PACK ? t('packages.bonus_pack') : t('card.pack_label', { n: csomag })}</Text>
                <Text style={s.packageMeta}>
                  {t('packages.meta', { count: dinos.length, names: dinos.map((d) => d.nev_koznapi).join(', ') })}
                </Text>
                {!unlocked && (
                  <Text style={s.packageLockedHint}>
                    {csomag === BONUS_PACK
                      ? t('packages.locked_bonus_hint')
                      : t('packages.locked_hint')}
                  </Text>
                )}
                {passed && <Text style={s.packagePassedHint}>{t('packages.passed_hint')}</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity onPress={onBack} style={s.bottomBackLink}>
        <Text style={s.backLinkText}>{t('packages.back_home')}</Text>
      </TouchableOpacity>
    </LevelShell>
  );
}