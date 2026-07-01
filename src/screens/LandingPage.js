import { useState } from 'react';
import { View, Text, Image, ScrollView, StatusBar, StyleSheet } from 'react-native';
import Shell from '../components/Shell';
import MuteButton from '../components/MuteButton';
import LaserBorderButton from '../components/LaserBorderButton';
import { playSound } from '../audio/audioSystem';

const LP_BG_RATIO = 768 / 1376; // height / width

const LANDING_NAV_BUTTONS = [
  { key: '1',  label: 'Kárpátok', centerY: 10, color: '#c7d39a' },
  { key: '2',  label: 'Európa',   centerY: 30, color: '#9fd17a' },
  { key: '3',  label: 'Afrika',   centerY: 50, color: '#3a3424' },
  { key: '4',  label: 'Ázsia',    centerY: 70, color: '#fff1d6' },
  { key: '5',  label: 'Amerika',  centerY: 90, color: '#ffe0b0' },
];

export default function LandingPage({ onEnterRegion }) {
  const [containerWidth, setContainerWidth] = useState(0);
  const stageWidth = containerWidth;
  const stageHeight = containerWidth / LP_BG_RATIO;

  const handlePress = (eduLevelInt) => {
    playSound('click');
    
    // Opcionális: Ha az Amerika (például 5-ös szint) még nincs kész az adatbázisban
    if (eduLevelInt === 5) {
      // Itt kezelheted, ha egy szint még fejlesztés alatt áll (pl. kiírsz egy üzenetet)
      return;
    }

    // Meghívjuk a központi régióbelepő függvényt, közvetlenül a számmal
    onEnterRegion(eduLevelInt);
  };

  return (
    <Shell>
      <View style={styles.landingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a06" />

        <ScrollView
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{ width: '100%' }}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
          >
            {stageWidth > 0 && (
              <View style={[styles.landingStage, { width: stageWidth, height: stageHeight, alignSelf: 'center' }]}>
                <Image
                  source={require('../../assets/images/landing_menu_bg.png')}
                  style={styles.absoluteBackground}
                  resizeMode="stretch"
                />
                {LANDING_NAV_BUTTONS.map((btn) => (
                  <LaserBorderButton
                    key={btn.key}
                    style={{
                      position: 'absolute',
                      right: '4%',
                      top: `${btn.centerY}%`,
                      width: 56,
                      height: 56,
                      marginTop: -28,
                      borderRadius: 28,
                      backgroundColor: 'rgba(10,10,8,0.35)',
                    }}
                    color={btn.color}
                    borderRadius={28}
                    onPress={() => handlePress(parseInt(btn.key, 10))}
                  >
                    <View style={styles.navArrowWrap} pointerEvents="none">
                      <Text style={styles.navArrowText}>›</Text>
                    </View>
                  </LaserBorderButton>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <MuteButton />
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  landingContainer: {
    flex: 1,
    backgroundColor: '#0a0a06',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  landingStage: { position: 'relative', overflow: 'hidden' },
  absoluteBackground: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%',
  },
  navArrowWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navArrowText: { fontSize: 30, fontWeight: '700', color: '#fff', marginTop: -3 },
});