// CollectionFilterSidebar — a vendég-nézetű Gyűjtemény bal oldali szűrő
// panelje (facts.app encyclopédia mintájára). 7 kategória, mindegyik
// többször-választható (checkbox-lista), kategóriák között ÉS-kapcsolat —
// üres kategória = nincs megszorítás. A logikát (opciók levezetése,
// szűrés) a CollectionScreen.js végzi, ez a komponens csak megjelenít.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RADIUS, FONTS } from '../constants/theme';
import { useT } from '../i18n';

function capitalize(text) {
  const s = String(text || '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function FilterSection({ title, options, selectedSet, onToggle, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const selectedCount = selectedSet.size;

  if (options.length === 0) return null;

  return (
    <View style={styles.section}>
      <Pressable style={styles.sectionHeader} onPress={() => setExpanded((e) => !e)}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {selectedCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{selectedCount}</Text>
            </View>
          )}
        </View>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={COLORS.cream}
        />
      </Pressable>

      {expanded && (
        <View style={styles.optionList}>
          {options.map(({ value, count }) => {
            const checked = selectedSet.has(value);
            return (
              <Pressable
                key={value}
                style={styles.optionRow}
                onPress={() => onToggle(value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
              >
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked && <MaterialCommunityIcons name="check" size={12} color={COLORS.bgDark} />}
                </View>
                <Text style={styles.optionLabel} numberOfLines={1}>{capitalize(value)}</Text>
                <Text style={styles.optionCount}>{count}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

// Numerikus tartomány-szűrő (testhossz, méterben) — nem checkbox-lista, mint
// a többi kategória, hanem két szám-mező (min/max), ezért külön komponens.
function LengthRangeSection({ range, onChange, defaultExpanded = false }) {
  const { t } = useT();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const active = range.min !== '' || range.max !== '';

  return (
    <View style={styles.section}>
      <Pressable style={styles.sectionHeader} onPress={() => setExpanded((e) => !e)}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionTitle}>{t('collection.length')}</Text>
          {active && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>1</Text>
            </View>
          )}
        </View>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={COLORS.cream}
        />
      </Pressable>

      {expanded && (
        <View style={styles.lengthRangeCol}>
          <Text style={styles.lengthFieldLabel}>{t('collection.length_min')}</Text>
          <TextInput
            style={styles.lengthInput}
            value={range.min}
            onChangeText={(v) => onChange('min', v.replace(/[^0-9.]/g, ''))}
            placeholder={t('collection.length_ph_min')}
            placeholderTextColor="rgba(254,250,224,0.35)"
            keyboardType="decimal-pad"
          />
          <Text style={styles.lengthFieldLabel}>{t('collection.length_max')}</Text>
          <TextInput
            style={styles.lengthInput}
            value={range.max}
            onChangeText={(v) => onChange('max', v.replace(/[^0-9.]/g, ''))}
            placeholder={t('collection.length_ph_max')}
            placeholderTextColor="rgba(254,250,224,0.35)"
            keyboardType="decimal-pad"
          />
        </View>
      )}
    </View>
  );
}

// `categories`: [{ key, title, options: [{value,count}] }], sorrend szerint.
// `selected`: { [key]: Set<string> }. `onToggle(key, value)`.
// `lengthRange`: { min, max } (string). `onLengthRangeChange(field, value)`.
export default function CollectionFilterSidebar({ categories, selected, onToggle, onClear, lengthRange, onLengthRangeChange, style }) {
  const { t } = useT();
  const totalSelected =
    Object.values(selected).reduce((sum, s) => sum + s.size, 0) +
    (lengthRange && (lengthRange.min !== '' || lengthRange.max !== '') ? 1 : 0);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('collection.filters')}</Text>
        {totalSelected > 0 && (
          <Pressable onPress={onClear}>
            <Text style={styles.clearText}>{t('collection.clear')}</Text>
          </Pressable>
        )}
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {categories.map((cat) => (
          <FilterSection
            key={cat.key}
            title={cat.title}
            options={cat.options}
            selectedSet={selected[cat.key] || new Set()}
            onToggle={(value) => onToggle(cat.key, value)}
          />
        ))}
        {lengthRange && (
          <LengthRangeSection range={lengthRange} onChange={onLengthRangeChange} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 240,
    borderRadius: RADIUS.card,
    backgroundColor: 'rgba(254,250,224,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.10)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(254,250,224,0.10)',
  },
  headerTitle: {
    color: COLORS.accent,
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    letterSpacing: 1.5,
  },
  clearText: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 12.5,
    opacity: 0.7,
    textDecorationLine: 'underline',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  scroll: {
    maxHeight: 560,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(254,250,224,0.06)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: COLORS.cream,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },
  countBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countBadgeText: {
    color: COLORS.bgDark,
    fontSize: 11,
    fontFamily: FONTS.bodyBold,
  },
  optionList: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 6,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(254,250,224,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  optionLabel: {
    flex: 1,
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 13.5,
    opacity: 0.9,
  },
  optionCount: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 12,
    opacity: 0.45,
  },
  lengthRangeCol: {
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  lengthFieldLabel: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 12,
    opacity: 0.6,
  },
  lengthInput: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 13.5,
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.2)',
    borderRadius: RADIUS.button,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
});
