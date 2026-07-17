// src/screens/NicknamePickerScreen.js
// Onboarding: a játékos 3 elemből (híres dínó, genus-szó a `creatures` tábla
// latin_name_ending mezőjéből, véletlen 3 jegyű szám) állítja össze az egyedi
// nicknamejét — nincs szabad szöveges bevitel, így nem lehet obszcén nevet
// beírni. A nickname a `players` táblában regisztrálva (unique constraint)
// lesz a játékos jövőbeli ranglista-azonosítója.
//
// Eszközváltás után a régi profil a becenévvel + egy regisztrációkor kapott
// PIN-nel szerezhető vissza (lásd "Folytatás" mód) — a PIN csak egyszer, a
// regisztráció után jelenik meg, utána a szerver oldalon nem olvasható vissza.
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Shell from '../components/Shell';
import OptionPicker from '../components/OptionPicker';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { NICKNAME_DINOS, getGenusOptions, generateNicknameNumber, generatePin, randomFrom, buildNickname } from '../constants/nicknameParts';
import { isNicknameTaken, registerPlayer, resumePlayerWithPin } from '../services/playersService';

export const NICKNAME_STORAGE_KEY = 'dino_player_nickname';

export default function NicknamePickerScreen({ allDinos, onNicknameChosen }) {
  const genusOptions = useMemo(() => getGenusOptions(allDinos), [allDinos]);

  const [mode, setMode] = useState('new'); // 'new' | 'resume'

  const [dino, setDino] = useState(() => randomFrom(NICKNAME_DINOS));
  const [genus, setGenus] = useState('');
  const [number, setNumber] = useState(() => generateNicknameNumber());
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Regisztráció után ide kerül a friss { nickname, pin, playerId } — amíg ez
  // be van állítva, a PIN-megjelenítő nézet látszik a form helyett, mert a
  // PIN-t csak most, egyszer tudjuk megmutatni.
  const [pinReveal, setPinReveal] = useState(null);

  const [resumeNickname, setResumeNickname] = useState('');
  const [resumePin, setResumePin] = useState('');
  const [resumeSubmitting, setResumeSubmitting] = useState(false);
  const [resumeError, setResumeError] = useState('');

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

    const pin = generatePin();
    const result = await registerPlayer(nickname, pin);
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

    setSubmitting(false);
    setPinReveal({ nickname, pin, playerId: result.player.id });
  };

  const handlePinAcknowledged = async () => {
    await AsyncStorage.setItem(NICKNAME_STORAGE_KEY, pinReveal.nickname);
    onNicknameChosen(pinReveal.nickname, pinReveal.playerId);
  };

  const handleResume = async () => {
    const cleanNickname = resumeNickname.trim().toLowerCase();
    const cleanPin = resumePin.trim();
    if (!cleanNickname || !cleanPin) {
      setResumeError('Add meg a becenevet és a PIN-t is!');
      return;
    }

    setResumeSubmitting(true);
    setResumeError('');

    const playerId = await resumePlayerWithPin(cleanNickname, cleanPin);
    setResumeSubmitting(false);

    if (!playerId) {
      setResumeError('Nem egyezik a becenév és a PIN.');
      return;
    }

    await AsyncStorage.setItem(NICKNAME_STORAGE_KEY, cleanNickname);
    onNicknameChosen(cleanNickname, playerId);
  };

  if (pinReveal) {
    return (
      <Shell gradientColors={[COLORS.bgDark, COLORS.bgMid]}>
        <ScrollView contentContainerStyle={styles.centerContent}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
          <Text style={styles.title}>🔑 Jegyezd meg a PIN-kódod!</Text>
          <Text style={styles.subtitle}>
            Ha máshonnan (pl. másik telefonról) folytatnád, erre a PIN-re lesz szükséged a
            becenevedhez — később nem tudjuk újra megmutatni.
          </Text>

          <View style={styles.pinBox}>
            <Text style={styles.pinBoxLabel}>PIN-kódod</Text>
            <Text style={styles.pinBoxValue}>{pinReveal.pin}</Text>
          </View>

          <TouchableOpacity style={styles.confirmBtn} onPress={handlePinAcknowledged}>
            <Text style={styles.confirmBtnText}>✔ MEGJEGYEZTEM</Text>
          </TouchableOpacity>
        </ScrollView>
      </Shell>
    );
  }

  return (
    <Shell gradientColors={[COLORS.bgDark, COLORS.bgMid]}>
      <ScrollView contentContainerStyle={styles.centerContent}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
        <Text style={styles.title}>🦖 {mode === 'new' ? 'Válaszd ki a neved!' : 'Folytasd a profilod!'}</Text>
        <Text style={styles.subtitle}>
          {mode === 'new'
            ? 'Ez a neved jelenik majd meg a ranglistákon.'
            : 'Add meg a becenevedet és a regisztrációkor kapott PIN-t.'}
        </Text>

        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeToggleBtn, mode === 'new' && styles.modeToggleBtnActive]}
            onPress={() => setMode('new')}
          >
            <Text style={[styles.modeToggleText, mode === 'new' && styles.modeToggleTextActive]}>Új becenév</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeToggleBtn, mode === 'resume' && styles.modeToggleBtnActive]}
            onPress={() => setMode('resume')}
          >
            <Text style={[styles.modeToggleText, mode === 'resume' && styles.modeToggleTextActive]}>Folytatás</Text>
          </TouchableOpacity>
        </View>

        {mode === 'new' ? (
          <>
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
          </>
        ) : (
          <>
            <View style={styles.resumeForm}>
              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>Becenév</Text>
                <TextInput
                  style={styles.textInput}
                  value={resumeNickname}
                  onChangeText={setResumeNickname}
                  placeholder="pl. tyrannosaurus_eger_18"
                  placeholderTextColor="rgba(254,250,224,0.35)"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>PIN</Text>
                <TextInput
                  style={styles.textInput}
                  value={resumePin}
                  onChangeText={setResumePin}
                  placeholder="6 jegyű kód"
                  placeholderTextColor="rgba(254,250,224,0.35)"
                  keyboardType="number-pad"
                  maxLength={6}
                  secureTextEntry
                />
              </View>
            </View>

            {!!resumeError && <Text style={styles.errorText}>{resumeError}</Text>}

            <TouchableOpacity
              style={[styles.confirmBtn, resumeSubmitting && styles.confirmBtnDisabled]}
              onPress={handleResume}
              disabled={resumeSubmitting}
            >
              <Text style={styles.confirmBtnText}>
                {resumeSubmitting ? 'Egy pillanat…' : '✔ FOLYTATÁS'}
              </Text>
            </TouchableOpacity>
          </>
        )}
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
  modeToggle: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(254,250,224,0.06)',
    borderRadius: RADIUS.pill,
    padding: 3,
    marginBottom: 24,
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
  },
  modeToggleBtnActive: {
    backgroundColor: COLORS.bgMid,
  },
  modeToggleText: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    opacity: 0.6,
  },
  modeToggleTextActive: {
    opacity: 1,
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
  resumeForm: {
    width: '100%',
    maxWidth: 420,
    gap: 12,
    marginBottom: 8,
  },
  inputField: {
    borderRadius: RADIUS.button,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.bgMid,
  },
  textInput: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 4,
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
  pinBox: {
    backgroundColor: 'rgba(221,161,94,0.12)',
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: RADIUS.cardLarge,
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginBottom: 24,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  pinBoxLabel: {
    color: 'rgba(254,250,224,0.62)',
    fontFamily: FONTS.body,
    fontSize: 15,
    marginBottom: 8,
  },
  pinBoxValue: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 6,
  },
});
