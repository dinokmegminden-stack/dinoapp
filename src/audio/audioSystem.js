import { Audio } from 'expo-av';

export const SOUNDS = {
  click: 'https://actions.google.com/sounds/v1/ui/click_on_furniture.ogg',
};

export const QUIZ_SOUND_FILES = {
  correct: require('../../assets/sounds/correct_answer.mp3'),
  wrong: require('../../assets/sounds/wrong_answer.mp3'),
  finalAnswer: require('../../assets/sounds/final_answer.mp3'),
  next: require('../../assets/sounds/next.mp3'),
  lifeline: require('../../assets/sounds/lifelines.mp3'),
  resign: require('../../assets/sounds/resign.mp3'),
  letsPlay: require('../../assets/sounds/lets_play.mp3'),
  mainTheme: require('../../assets/sounds/main_theme.mp3'),
  easy: require('../../assets/sounds/easy.mp3'),
  medium: require('../../assets/sounds/medium.mp3'),
  hard: require('../../assets/sounds/hard.mp3'),
  hardMillion: require('../../assets/sounds/hard_million.mp3'),
  winningTheme: require('../../assets/sounds/winning_theme.mp3'),
};

// --- Némítás (globális) ---
let isSoundMuted = false;

export function getSoundMuted() {
  return isSoundMuted;
}

export function setSoundMuted(muted) {
  isSoundMuted = muted;
  if (bgMusicSound) {
    if (muted) bgMusicSound.pauseAsync().catch(() => {});
    else bgMusicSound.playAsync().catch(() => {});
  }
}

// --- Egyszerű UI kattanás ---
const loadedSounds = {};

export async function playSound(soundKey) {
  if (isSoundMuted) return;
  try {
    if (loadedSounds[soundKey]) {
      await loadedSounds[soundKey].replayAsync();
      return;
    }
    const { sound } = await Audio.Sound.createAsync(
      { uri: SOUNDS[soundKey] },
      { shouldPlay: true }
    );
    loadedSounds[soundKey] = sound;
  } catch (error) {
    console.warn(`Nem sikerült a hang lejátszása: ${soundKey}`, error);
  }
}

// --- Rövid kvíz effektek ---
const loadedQuizSfx = {};

export async function playQuizSfx(key) {
  if (isSoundMuted) return;
  try {
    if (loadedQuizSfx[key]) {
      await loadedQuizSfx[key].setPositionAsync(0);
      await loadedQuizSfx[key].playAsync();
      return;
    }
    const { sound } = await Audio.Sound.createAsync(QUIZ_SOUND_FILES[key], { shouldPlay: true });
    loadedQuizSfx[key] = sound;
  } catch (error) {
    console.warn(`Nem sikerült a kvíz hang lejátszása: ${key}`, error);
  }
}

// --- Háttérzene (hurkolt) ---
let bgMusicSound = null;
let bgMusicKey = null;

export async function playQuizBgMusic(key, { loop = true, volume = 0.45 } = {}) {
  if (isSoundMuted) return;
  try {
    if (bgMusicKey === key && bgMusicSound) return;
    if (bgMusicSound) {
      await bgMusicSound.stopAsync().catch(() => {});
      await bgMusicSound.unloadAsync().catch(() => {});
      bgMusicSound = null;
      bgMusicKey = null;
    }
    const { sound } = await Audio.Sound.createAsync(
      QUIZ_SOUND_FILES[key],
      { shouldPlay: true, isLooping: loop, volume }
    );
    bgMusicSound = sound;
    bgMusicKey = key;
  } catch (error) {
    console.warn(`Nem sikerült a háttérzene lejátszása: ${key}`, error);
  }
}

export async function stopQuizBgMusic() {
  try {
    if (bgMusicSound) {
      await bgMusicSound.stopAsync().catch(() => {});
      await bgMusicSound.unloadAsync().catch(() => {});
    }
  } catch (_) {
  } finally {
    bgMusicSound = null;
    bgMusicKey = null;
  }
}

export function getTierMusicKey(level) {
  if (level <= 5) return 'easy';
  if (level <= 10) return 'medium';
  if (level <= 14) return 'hard';
  return 'hardMillion';
}
