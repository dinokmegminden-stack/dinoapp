// LandingPage.js
console.log("LANDING PAGE RENDER - WIDE HERO & COMPACT XP");


import Shell from '../components/Shell';
import HeroTop from '../components/HeroTop';
import LandingMenu from './LandingMenu';
import { playSound } from '../audio/audioSystem';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { View, Text, StatusBar, StyleSheet } from 'react-native';

const INTRO_TEXT = "A Dínó Tudós egy magyar nyelvű, ingyenes dínó-kártyagyűjtő és kvízjáték gyerekeknek és minden korosztálynak, ahol 5 kontinens (Kárpát-medence, Európa, Afrika, Ázsia, Amerika) őslényeit fedezheted fel. Minden régióban csomagokra bontva várnak a dínók: nézd meg a kártyájukat, tanuld meg a tényeket róluk, majd egy kvízzel zárd le a csomagot, hogy a következő kinyíljon. A kérdések a korszakról, a felfedezőről, a felfedezés évéről és a tudományos névről szólnak — így játék közben valódi paleontológiai tudást szerzel. A sikeresen teljesített csomagok dínói bekerülnek a személyes galériádba, ahol bármikor visszanézheted őket. XP-t gyűjtve fejlődsz \"professzor szintben\", miközben végigjárod a világ őskori élővilágát. Nincs bonyolult regisztráció: csak lépj be, válassz régiót, és kezdődhet a felfedezés.";

export default function LandingPage({ onEnterRegion, onOpenGallery }) {
  const handleSelectRegion = (eduLevel) => {
    playSound('click');
    onEnterRegion(eduLevel);
  };

  const handleOpenGallery = () => {
    playSound('click');
    onOpenGallery();
  };

  return (
    <Shell>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg || '#283618'} />

        <HeroTop />

        <View style={styles.mainContentRow}>

          <View style={styles.leftDashboardColumn}>
            <View style={styles.introWrap}>
              <Text style={styles.introText}>{INTRO_TEXT}</Text>
            </View>
          </View>

          <View style={styles.rightMenuColumn}>
            <LandingMenu onSelectRegion={handleSelectRegion} onOpenGallery={handleOpenGallery} />
          </View>

        </View>
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg || '#283618',
  },
  mainContentRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 28,
    paddingVertical: 20,
    paddingHorizontal: 28,
  },
  leftDashboardColumn: {
    flex: 5,
    justifyContent: 'center',
  },
  rightMenuColumn: {
    flex: 5,
    justifyContent: 'center',
  },
  introWrap: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.1)',
    backgroundColor: 'rgba(254,250,224,0.03)',
  },
  introText: {
    color: '#FEFAE0',
    fontFamily: FONTS.body,
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'left',
  },
});