import { ImageBackground, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';

import Shell from '../components/Shell';
import MuteButton from '../components/MuteButton';
import { playSound } from '../audio/audioSystem';

const REGIONS = [
  { key: 1, label: 'Kárpát-medence' },
  { key: 2, label: 'Európa' },
  { key: 3, label: 'Afrika' },
  { key: 4, label: 'Ázsia' },
  { key: 5, label: 'Amerika' },
];

export default function LandingPage({ onEnterRegion }) {
  const handlePress = (eduLevel) => {
    playSound('click');
    onEnterRegion(eduLevel);
  };

  return (
    <Shell>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a06" />
      <ImageBackground
        source={require('../../assets/images/landing_menu_bg.png')}
        style={styles.background}
        resizeMode="cover"
      >
        {REGIONS.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={styles.band}
            activeOpacity={0.6}
            onPress={() => handlePress(r.key)}
          />
        ))}
      </ImageBackground>
      <MuteButton />
    </Shell>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  band: {
    flex: 1,
    width: '100%',
  },
});