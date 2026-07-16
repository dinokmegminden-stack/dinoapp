// src/screens/NicknamePickerScreen.js
// Onboarding: a játékos 3 elemből (híres dínó, genus-szó a `creatures` tábla
// latin_name_ending mezőjéből, véletlen 3 jegyű szám) állítja össze az egyedi
// nicknamejét — nincs szabad szöveges bevitel, így nem lehet obszcén nevet
// beírni. A nickname a `players` táblában regisztrálva (unique constraint)
// lesz a játékos jövőbeli ranglista-azonosítója.
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Shell from '../components/Shell';
import OptionPicker from '../components/OptionPicker';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { NICKNAME_DINOS, getGenusOptions, generateNicknameNumber, randomFrom, buildNickname } from '../constants/nicknameParts';
import { isNicknameTaken, registerPlayer } from '../services/playersService';

export const NICKNAME_STORAGE_KEY = 'dino_player_nickname';

export default function NicknamePickerScreen({ allDinos, onNicknameChosen }) {
  const genusOptions = useMemo(() => getGenusOptions(allDinos), [allDinos]);

  const [dino, setDino] = useState(() => randomFrom(NICKNAME_DINOS));
  const [genus, setGenus] = useState('');
  const [number, setNumber] = useState(() => generateNicknameNumber());
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // A genus-lista a `creatures` betöltésétől függ (App.js preload) — amint
  // megérkezik, kisorsolunk belőle egy kezdőértéket.
  useEffect(() => {
    if (!genus && genusOptions.length > 0) {
      setGenus(randomFrom(genusOptions));
    }
  }, [genusOptions, genus]);

  const isReady = genus !== '';
  const nickname = isReady ? buildNickname(dino, genus, number) : '';

  const handleReroll = () => {
    setNumber(generateNicknameNumber());
    setErrorMessage('');
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setErrorMessage('');

    const taken = await isNicknameTaken(nickname);
    if (taken) {
      setErrorMessage('Ez a név már foglalt — próbálj másik számot!');
      setNumber(generateNicknameNumber());
      setSubmitting(false);
      return;
    }

    const result = await registerPlayer(nickname);
    if (result.taken) {
      setErrorMessage('Ez a név már foglalt — próbálj másik számot!');
      setNumber(generateNicknameNumber());
      setSubmitting(false);
      return;
    }
    if (result.error) {
      setErrorMessage('Hiba történt, próbáld újra.');
      setSubmitting(false);
      return;
    }

    await AsyncStorage.setItem(NICKNAME_STORAGE_KEY, nickname);
    setSubmitting(false);
    onNicknameChosen(nickname, result.player.id);
  };

  return (
    <Shell gradientColors={[COLORS.bgDark, COLORS.bgMid]}>
      <ScrollView contentContainerStyle={styles.centerContent}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
        <Text style={styles.title}>🦖 Válaszd ki a neved!</Text>
        <Text style={styles.subtitle}>Ez a neved jelenik majd meg a ranglistákon.</Text>

        <View style={styles.previewBox}>
          <Text style={styles.previewText}>{isReady ? nickname : 'Dínók betöltése…'}</Text>
        </View>

        <View style={styles.pickerGroup}>
          <OptionPicker label="Dínó" value={dino} options={NICKNAME_DINOS} onSelect={setDino} />
          {isReady && (
            <OptionPicker label="Genus" value={genus} options={genusOptions} onSelect={setGenus} />
          )}

          <TouchableOpacity style={styles.rerollField} onPress={handleReroll}>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Szám</Text>
              <Text style={styles.fieldValue}>{number}</Text>
            </View>
            <Text style={styles.rerollIcon}>🎲</Text>
          </TouchableOpacity>
        </View>

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        <TouchableOpacity
          style={[styles.confirmBtn, (submitting || !isReady) && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={submitting || !isReady}
        >
          <Text style={styles.confirmBtnText}>
            {submitting ? 'Egy pillanat…' : '✔ MEGERŐSÍTÉS'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Shell>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  title: {
    color: COLORS.accent,
    fontFamily: FONTS.bold,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(254,250,224,0.7)',
    fontFamily: FONTS.body,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  previewBox: {
    backgroundColor: 'rgba(221,161,94,0.12)',
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: RADIUS.cardLarge,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 24,
    width: '100%',
    maxWidth: 420,
  },
  previewText: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  pickerGroup: {
    width: '100%',
    maxWidth: 420,
    gap: 12,
    marginBottom: 8,
  },
  rerollField: {
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
    fontSize: 15,
    marginBottom: 2,
  },
  fieldValue: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '700',
  },
  rerollIcon: {
    fontSize: 20,
  },
  errorText: {
    color: '#F44336',
    fontFamily: FONTS.body,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 16,
  },
  confirmBtn: {
    marginTop: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    color: '#001219',
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
