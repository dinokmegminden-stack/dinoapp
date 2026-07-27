import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { COLORS } from '../../constants/colors';
import { isPackUnlocked, PASS_THRESHOLD, EDU_LABELS } from '../../utils/regionProgress';
import { csomagToPackId } from '../../utils/regionHelpers';
import LevelShell from './LevelShell';
import HeaderBar from '../../components/HeaderBar';
import { s } from './RegionLevel.styles';

export default function PackagesScreen({ eduLevel, progress, packages, onOpenPackage, onBack, nickname, onNavigate }) {
  return (
    <LevelShell header={<HeaderBar currentView="region" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView style={s.packagesScrollFlex} contentContainerStyle={s.packagesScroll}>
        <Text style={s.levelTitle}>FELFEDEZÉS</Text>
        <Text style={s.levelSubtitle}>{EDU_LABELS[eduLevel] || eduLevel}</Text>
        <Text style={s.levelDesc}>
          Minden csomag végén teszt vár — legalább {Math.round(PASS_THRESHOLD * 100)}%-os eredmény kell a következő csomag kinyitásához.
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
                <Text style={s.packageName}>{csomag}. csomag</Text>
                <Text style={s.packageMeta}>
                  {dinos.length} dínó · {dinos.map((d) => d.nev_koznapi).join(', ')}
                </Text>
                {!unlocked && (
                  <Text style={s.packageLockedHint}>
                    Nyitáshoz teljesítsd az előző csomag tesztjét
                  </Text>
                )}
                {passed && <Text style={s.packagePassedHint}>Teszt teljesítve ✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity onPress={onBack} style={s.bottomBackLink}>
        <Text style={s.backLinkText}>← FŐMENÜ</Text>
      </TouchableOpacity>
    </LevelShell>
  );
}