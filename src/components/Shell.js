import React from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedLandingBg from './AnimatedLandingBg';

// gradientColors: opcionális színlista — ha meg van adva, a teljes oldal
// háttere ez a (függőleges) átmenet lesz az egyszínű #283618 helyett.
// backgroundImage: opcionális kép — csak asztali (web, >=700px) nézetben jelenik
// meg teljes méretben a teljes oldal mögött, sötét overlay-jel a szöveg olvashatóságáért.
// contentMaxWidth: opcionális felülírás a belső tartalom max-szélességére
// (pl. a landing 1024px fölött 1120px-es két-oszlopos elrendezéshez) — a
// Shell külső (teljes szélességű) háttere és a többi képernyő 750px-es
// alap-korlátja ettől függetlenül változatlan marad.
export default function Shell({ children, wide = false, gradientColors = null, backgroundImage = null, contentMaxWidth = null }) {
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= 700;
  const showBackgroundImage = backgroundImage && isWideWeb;

  const inner = (
    <View style={[s.inner, (wide || isWideWeb) && s.innerWide, contentMaxWidth != null && { maxWidth: contentMaxWidth }]}>
      {children}
    </View>
  );

  if (showBackgroundImage) {
    return (
      <View style={s.outer}>
        <AnimatedLandingBg source={backgroundImage} />
        <LinearGradient
          colors={['rgba(0,18,25,0.55)', 'rgba(0,18,25,0.25)', 'rgba(0,18,25,0.8)']}
          style={s.bgOverlay}
        />
        {inner}
      </View>
    );
  }

  if (gradientColors) {
    return (
      <LinearGradient colors={gradientColors} style={s.outerGradient}>
        {inner}
      </LinearGradient>
    );
  }

  return <View style={s.outer}>{inner}</View>;
}

// Web-en a flex:1 lánc nem mindig nyúlik ki a teljes viewportig, ha a tartalom
// alacsonyabb nála (magas asztali ablakban a maradék hely a body alap #001219
// színét mutatja a háttérkép/gradient alatt) — 100vh minHeight ez ellen védi ki,
// mert a viewporthoz képest számolódik, nem az ős lánc flex-viselkedéséhez.
const webFullHeight = Platform.select({ web: { minHeight: '100vh' }, default: {} });

const s = StyleSheet.create({
  outer: { flex: 1, width: '100%', backgroundColor: '#001219', alignItems: 'center', justifyContent: 'center', ...webFullHeight },
  outerGradient: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', ...webFullHeight },
  bgOverlay: { ...StyleSheet.absoluteFillObject },
  inner: { flex: 1, width: '100%', maxWidth: 480 },
  innerWide: { maxWidth: 750, flexDirection: 'column', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 20 },
});
