import { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { getSoundMuted, setSoundMuted } from '../audio/audioSystem';

export default function MuteButton({ style }) {
  const [localMuted, setLocalMuted] = useState(getSoundMuted());

  const toggle = () => {
    const next = !getSoundMuted();
    setSoundMuted(next);
    setLocalMuted(next);
  };

  return (
    <TouchableOpacity onPress={toggle} style={[styles.muteButton, style]} activeOpacity={0.7}>
      <Text style={styles.muteButtonText}>{localMuted ? '🔇' : '🔊'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  muteButton: {
    position: 'absolute',
    top: 44,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    borderWidth: 0.5,
    borderColor: 'rgba(254,250,224,0.2)',
  },
  muteButtonText: { fontSize: 16 },
});
