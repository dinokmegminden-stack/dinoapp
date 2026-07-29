import React from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedLandingBg from './AnimatedLandingBg';

// Alapértelmezett háttérkép — a landing hero mögötti kép, hogy MINDEN Shell-t
// használó képernyő (region-csomagok, kvízek, gyűjtemény, stb.) ugyanazt a
// hátteret kapja meg automatikusan, anélkül hogy minden hívóhelyen külön meg
// kellene adni. Explicit backgroundImage propgal felülírható; backgroundImage={null}
// paranccsal kikapcsolható, ha valamelyik képernyőnek mégsem kellene.
const DEFAULT_BACKGROUND = require('../../assets/images/new_bg.jpg');

// gradientColors: opcionális színlista — ha meg van adva, a teljes oldal
// háttere ez a (függőleges) átmenet lesz az egyszínű #283618 helyett.
// backgroundImage: opcionális kép — csak asztali (web, >=700px) nézetben jelenik
// meg teljes méretben a teljes oldal mögött, sötét overlay-jel a szöveg olvashatóságáért.
// contentMaxWidth: opcionális felülírás a belső tartalom max-szélességére
// (pl. a landing 1024px fölött 1120px-es két-oszlopos elrendezéshez) — a
// Shell külső (teljes szélességű) háttere és a többi képernyő 750px-es
// alap-korlátja ettől függetlenül változatlan marad.
// header: opcionális, a teljes böngésző-szélességben megjelenő fejléc-sáv, ami a
// belső (maxWidth-re szorított, középre igazított) tartalom FÖLÖTT, azon kívül
// renderel — így a fejléc végigér a viewporton, míg a body korlátozott marad.
export default function Shell({ children, header = null, wide = false, gradientColors = null, backgroundImage = DEFAULT_BACKGROUND, backgroundDim = false, contentMaxWidth = null, footer = null }) {
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= 700;
  const showBackgroundImage = backgroundImage && isWideWeb;

  const inner = (
    <View style={[s.inner, (wide || isWideWeb) && s.innerWide, contentMaxWidth != null && { maxWidth: contentMaxWidth }]}>
      {children}
    </View>
  );

  // A fejléc teljes szélességű sávja + alatta a korlátozott body — egy oszlopban,
  // felülről lefelé, hogy az inner flex:1-e a maradék helyet töltse ki.
  const footerBand = footer != null ? <View style={s.footerBand}>{footer}</View> : null;

  const body = header != null
    ? (<View style={s.stack}>{<View style={s.headerBand}>{header}</View>}{inner}{footerBand}</View>)
    : (<View style={s.stack}>{inner}{footerBand}</View>);

  if (showBackgroundImage) {
    return (
      <View style={s.outer}>
        <AnimatedLandingBg source={backgroundImage} dim={backgroundDim} />
        <LinearGradient
          colors={['rgba(0,18,25,0.55)', 'rgba(0,18,25,0.25)', 'rgba(0,18,25,0.8)']}
          style={s.bgOverlay}
        />
        {body}
      </View>
    );
  }

  if (gradientColors) {
    return (
      <LinearGradient colors={gradientColors} style={s.outerGradient}>
        {body}
      </LinearGradient>
    );
  }

  return <View style={s.outer}>{body}</View>;
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
  innerWide: { maxWidth: 1100, flexDirection: 'column', alignItems: 'center', paddingHorizontal: 40, paddingVertical: 20 },
  // Teljes szélességű oszlop a fejléc-sávnak + a body-nak.
  stack: { flex: 1, width: '100%', alignItems: 'center' },
  headerBand: { width: '100%' },
  footerBand: { width: '100%' },
});
