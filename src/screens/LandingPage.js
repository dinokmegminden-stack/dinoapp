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

title: {
  fontSize: 28,
  fontWeight: '800',
  fontFamily: Platform.select({
    web: "'Times New Roman', Georgia, serif",
    default: 'serif',
  }),
  color: '#ECEFF1',
  textAlign: 'center',
  marginBottom: 8,
},


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a06',
  },
});
