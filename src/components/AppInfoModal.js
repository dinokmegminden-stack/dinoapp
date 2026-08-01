// AppInfoModal — az "info" ikon mögötti rövid, figyelemfelkeltő leírás az
// egész appról (mit lehet itt csinálni). Az OptionPicker.js Modal-mintáját
// követi: transparent + fade, backdrop-koppintásra zár.
import React from 'react';
import { Modal, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';

export default function AppInfoModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>🦕 Mi ez az app?</Text>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <Text style={styles.text}>
              A Dínó Expedíció izgalmas világában hat különböző régióból — a
              Kárpát-medencétől kezdve Afrikán, Ázsián és mindkét amerikán át —
              rengeteg dínó és őslény vár felfedezésre, ahol egyedi becenév
              megadásával azonnal elindulhat a gyűjtés. A tartalmak áttekinthető
              csomagokra bontva épülnek fel, amelyek végén egy-egy záró kvíz
              teljesítése, legalább nyolcvan százalékos eredménnyel, nyitja meg a
              következő szinteket. A megszerzett lényeket a hagyományos
              régió-csomag rács mellett egy különleges törzsfa idővonalon is
              böngészhetjük, ahol minden élőlény a saját földtörténeti kora és
              rokonsági szálai szerint kap helyet. A hat különböző játékmód — a
              három nehézségi fokozatú párok memóriajáték, a Ki vagyok én?
              tippelős kvíz, az ötmásodperces villámkvíz gyors képfelismeréssel,
              az egyre nehezedő XP Milliomos, az ügyességi dínófutam és az
              akasztófa szókitalálós játék — garantálja a változatos
              szórakozást. Minden helyes válasz és győzelem tapasztalati
              pontokat hoz, amelyekkel játékmódonként haladhatunk feljebb a
              ranglistákon, beleértve egy különleges sebességi versenyt is az
              ezer XP eléréséért, miközben az új rekordokat látványos tűzijáték
              ünnepli. Fedezd fel a múlt rejtélyeit, gyűjtsd össze az összes
              őslényt, és bizonyítsd be, hogy te vagy a legjobb dínó-tudós!
            </Text>
          </ScrollView>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Bezárás</Text>
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
