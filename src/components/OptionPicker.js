// src/components/OptionPicker.js
// Újrafelhasználható "koppints és válassz listából" mező — natív Modal-lal
// (nincs hozzá új dependency). A mező maga PressableButton-stílust követ,
// a nyíló lista pedig a CharacterSelectScreen.js kártya-mintáját.
import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import PressableButton from './PressableButton';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';

export default function OptionPicker({ label, value, options, onSelect }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (option) => {
    onSelect(option);
    setOpen(false);
  };

  return (
    <>
      <PressableButton
        onPress={() => setOpen(true)}
        style={styles.field}
        shadowColor={COLORS.bgDark}
      >
        <View style={styles.fieldContent}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <Text style={styles.fieldValue}>{value}</Text>
        </View>
        <Text style={styles.chevron}>▾</Text>
      </PressableButton>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView style={styles.optionList} contentContainerStyle={styles.optionListContent}>
              {options.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => handleSelect(option)}
                  style={[styles.optionRow, option === value && styles.optionRowActive]}
                >
                  <Text style={[styles.optionText, option === value && styles.optionTextActive]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    borderRadius: RADIUS.button,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.bgMid,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    color: 'rgba(254,250,224,0.62)',
    fontFamily: FONTS.body,
    fontSize: 12,
    marginBottom: 2,
  },
  fieldValue: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '700',
  },
  chevron: {
    color: COLORS.cream,
    fontSize: 18,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '70%',
    backgroundColor: COLORS.bgDark,
    borderRadius: RADIUS.cardLarge,
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.14)',
    padding: 16,
  },
  sheetTitle: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  optionList: {
    maxHeight: 360,
  },
  optionListContent: {
    gap: 6,
  },
  optionRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.button,
    backgroundColor: 'rgba(254,250,224,0.05)',
  },
  optionRowActive: {
    backgroundColor: 'rgba(221,161,94,0.2)',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  optionText: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 15,
    textAlign: 'center',
  },
  optionTextActive: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: COLORS.accent,
  },
});
