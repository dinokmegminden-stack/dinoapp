console.log("LANDING PAGE RENDER");

import { View, StatusBar, StyleSheet } from 'react-native';

import Shell from '../components/Shell';
import LandingMenu from './LandingMenu';
import { playSound } from '../audio/audioSystem';

export default function LandingPage({ onEnterRegion }) {
  const handleSelectRegion = (eduLevel) => {
    playSound('click');
    onEnterRegion(eduLevel);
  };

  return (
    <Shell>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a06" />
        <LandingMenu onSelectRegion={handleSelectRegion} />
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a06',
  },
});
