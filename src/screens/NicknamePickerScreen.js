// src/screens/NicknamePickerScreen.js
// Onboarding: a játékos 3 elemből (egy jelző a rögzített listából, a `creatures`
// tábla magyar köznapi neve — common_name/name_hu —, és egy "00"-tól "99"-ig
// választható szám) állítja össze az egyedi nicknamejét — nincs szabad szöveges
// bevitel, így nem lehet obszcén nevet beírni. A nickname a `players` táblában
// regisztrálva (unique constraint) lesz a játékos jövőbeli ranglista-azonosítója.
//
// Eszközváltás után a régi profil a becenévvel + egy saját maga választotta
// 4 jegyű PIN-nel szerezhető vissza (lásd "Folytatás" mód) — a PIN-t a
// játékos adja meg regisztrációkor, nem a rendszer generálja, hogy könnyű
// legyen megjegyezni.
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Shell from '../components/Shell';
import OptionPicker from '../components/OptionPicker';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { NICKNAME_ADJECTIVES, getCommonNameOptions, NICKNAME_NUMBER_OPTIONS, randomFrom, buildNickname } from '../constants/nicknameParts';
import { isNicknameTaken, registerPlayer, resumePlayerWithPin } from '../services/playersService';
import { useT } from '../i18n';

const PIN_LENGTH = 4;

export const NICKNAME_STORAGE_KEY = 'dino_player_nickname';

export default function NicknamePickerScreen({ allDinos, onNicknameChosen, onGuestContinue, initialMode = 'new' }) {
  const { t } = useT();
  const commonNameOptions = useMemo(() => getCommonNameOptions(allDinos), [allDinos]);

  const [mode, setMode] = useState(initialMode); // 'new' | 'resume'

  const [adjective, setAdjective] = useState(() => randomFrom(NICKNAME_ADJECTIVES));
  const [commonName, setCommonName] = useState('');
  const [number, setNumber] = useState(() => randomFrom(NICKNAME_NUMBER_OPTIONS));
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [resumeNickname, setResumeNickname] = useState('');
  const [resumePin, setResumePin] = useState('');
  const [resumeSubmitting, setResumeSubmitting] = useState(false);
  const [resumeError, setResumeError] = useState('');

  // A névlista a `creatures` betöltésétől függ (App.js preload) — amint
  // megérkezik, kisorsolunk belőle egy kezdőértéket.
  useEffect(() => {
    if (!commonName && commonNameOptions.length > 0) {
      setCommonName(randomFrom(commonNameOptions));
    }
  }, [commonNameOptions, commonName]);

  const isReady = commonName !== '';
  const nickname = isReady ? buildNickname(adjective, commonName, number) : '';

  const handleConfirm = async () => {
    if (pin.length !== PIN_LENGTH) {
      setErrorMessage(t('onboarding.err_pin_length', { n: PIN_LENGTH }));
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    const taken = await isNicknameTaken(nickname);
    if (taken) {
      setErrorMessage(t('onboarding.err_taken'));
      setNumber(randomFrom(NICKNAME_NUMBER_OPTIONS));
      setSubmitting(false);
      return;
    }

    const result = await registerPlayer(nickname, pin, email);
    if (result.taken) {
      setErrorMessage(t('onboarding.err_taken'));
      setNumber(randomFrom(NICKNAME_NUMBER_OPTIONS));
      setSubmitting(false);
      return;
    }
    if (result.error?.code === 'too_many_registrations') {
      setErrorMessage(t('onboarding.err_too_many'));
      setSubmitting(false);
      return;
    }
    if (result.error) {
      setErrorMessage(t('onboarding.err_generic'));
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    await AsyncStorage.setItem(NICKNAME_STORAGE_KEY, nickname);
    onNicknameChosen(nickname, result.player.id);
  };

  const handleResume = async () => {
    const cleanNickname = resumeNickname.trim().toLowerCase();
    const cleanPin = resumePin.trim();
    if (!cleanNickname || !cleanPin) {
      setResumeError(t('onboarding.err_resume_empty'));
      return;
    }

    setResumeSubmitting(true);
    setResumeError('');

    const playerId = await resumePlayerWithPin(cleanNickname, cleanPin);
    setResumeSubmitting(false);

    if (!playerId) {
      setResumeError(t('onboarding.err_resume_mismatch'));
      return;
    }

    await AsyncStorage.setItem(NICKNAME_STORAGE_KEY, cleanNickname);
    onNicknameChosen(cleanNickname, playerId);
  };

  return (
    <Shell gradientColors={[COLORS.bgDark, COLORS.bgMid]}>
      <ScrollView contentContainerStyle={styles.centerContent}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
        <Text style={styles.title}>🦖 {mode === 'new' ? t('onboarding.title_new') : t('onboarding.title_resume')}</Text>
        <Text style={styles.subtitle}>
          {mode === 'new' ? t('onboarding.sub_new') : t('onboarding.sub_resume')}
        </Text>

        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeToggleBtn, mode === 'new' && styles.modeToggleBtnActive]}
            onPress={() => setMode('new')}
          >
            <Text style={[styles.modeToggleText, mode === 'new' && styles.modeToggleTextActive]}>{t('onboarding.tab_new')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeToggleBtn, mode === 'resume' && styles.modeToggleBtnActive]}
            onPress={() => setMode('resume')}
          >
            <Text style={[styles.modeToggleText, mode === 'resume' && styles.modeToggleTextActive]}>{t('onboarding.tab_resume')}</Text>
          </TouchableOpacity>
        </View>

        {mode === 'new' ? (
          <>
            <View style={styles.previewBox}>
              <Text style={styles.previewText}>{isReady ? nickname : t('onboarding.loading_dinos')}</Text>
            </View>

            <View style={styles.pickerGroup}>
              <OptionPicker label={t('onboarding.pick_adjective')} value={adjective} options={NICKNAME_ADJECTIVES} onSelect={setAdjective} />
              {isReady && (
                <OptionPicker label={t('onboarding.pick_dino')} value={commonName} options={commonNameOptions} onSelect={setCommonName} />
              )}

              <OptionPicker label={t('onboarding.pick_number')} value={number} options={NICKNAME_NUMBER_OPTIONS} onSelect={setNumber} />

              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>{t('onboarding.pin_label')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={pin}
                  onChangeText={(text) => setPin(text.replace(/[^0-9]/g, '').slice(0, PIN_LENGTH))}
                  placeholder={t('onboarding.pin_ph')}
                  placeholderTextColor="rgba(254,250,224,0.35)"
                  keyboardType="number-pad"
                  maxLength={PIN_LENGTH}
                />
              </View>
              <Text style={styles.pinHint}>
                {t('onboarding.pin_hint')}
              </Text>

              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>{t('onboarding.email_label')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('onboarding.email_ph')}
                  placeholderTextColor="rgba(254,250,224,0.35)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <Text style={styles.pinHint}>
                {t('onboarding.email_hint')}
              </Text>
            </View>

            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

            <TouchableOpacity
              style={[styles.confirmBtn, (submitting || !isReady || pin.length !== PIN_LENGTH) && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={submitting || !isReady || pin.length !== PIN_LENGTH}
            >
              <Text style={styles.confirmBtnText}>
                {submitting ? t('onboarding.submitting') : t('onboarding.confirm')}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.resumeForm}>
              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>{t('onboarding.nickname_label')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={resumeNickname}
                  onChangeText={setResumeNickname}
                  placeholder={t('onboarding.nickname_ph')}
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
                  onChangeText={(text) => setResumePin(text.replace(/[^0-9]/g, '').slice(0, PIN_LENGTH))}
                  placeholder={t('onboarding.resume_pin_ph')}
                  placeholderTextColor="rgba(254,250,224,0.35)"
                  keyboardType="number-pad"
                  maxLength={PIN_LENGTH}
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
                {resumeSubmitting ? t('onboarding.submitting') : t('onboarding.resume_confirm')}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.guestLink} onPress={onGuestContinue}>
          <Text style={styles.guestLinkText}>{t('onboarding.guest_link')}</Text>
        </TouchableOpacity>
        <Text style={styles.guestHint}>
          {t('onboarding.guest_hint')}
        </Text>
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
  fieldLabel: {
    color: 'rgba(254,250,224,0.62)',
    fontFamily: FONTS.body,
    fontSize: 15,
    marginBottom: 2,
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
  pinHint: {
    color: 'rgba(254,250,224,0.55)',
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 16,
  },
  guestLink: {
    marginTop: 28,
  },
  guestLinkText: {
    color: COLORS.cream,
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    opacity: 0.8,
    textAlign: 'center',
  },
  guestHint: {
    color: 'rgba(254,250,224,0.5)',
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 340,
  },
});
