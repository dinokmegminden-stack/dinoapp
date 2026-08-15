// AppInfoModal — az "info" ikon mögötti rövid, figyelemfelkeltő leírás az
// egész appról (mit lehet itt csinálni). Az OptionPicker.js Modal-mintáját
// követi: transparent + fade, backdrop-koppintásra zár.
import React from 'react';
import { Modal, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { useT } from '../i18n';

export default function AppInfoModal({ visible, onClose }) {
  const { t } = useT();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{t('info.title')}</Text>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <Text style={styles.text}>
              {t('info.body')}
            </Text>
          </ScrollView>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{t('info.close')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
    backgroundColor: COLORS.bgDark,
    borderRadius: RADIUS.cardLarge,
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.14)',
    padding: 20,
  },
  title: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
  },
  body: {
    maxHeight: 420,
  },
  bodyContent: {
    paddingBottom: 4,
  },
  text: {
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
  },
  closeBtn: {
    marginTop: 16,
    alignSelf: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  closeBtnText: {
    color: COLORS.bgDark,
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
  },
});
