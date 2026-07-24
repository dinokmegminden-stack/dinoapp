// src/components/HeroTop.js — "DÍNÓ EXPEDÍCIÓ" logó-blokk (NatGeo expedíciós
// stílus, 2b variáns — lásd "Dínó Tudós logó.dc.html" tervezői munkamenet).
// Elrendezés: bal oldalon egy függőleges sárga sáv, mellette a kétsoros
// cím ("DÍNÓ" / "EXPEDÍCIÓ") — mindig balra rendezve (mobilon is). Az alcím
// alapból rejtve van, csak hoverre jelenik meg (lebegő overlay, mint a
// RegionWorldMap régiónév-tooltipje), hogy ne tolja el a lenti CTA gombot.
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import {
  useFonts as useCaprasimo,
  Caprasimo_400Regular,
} from '@expo-google-fonts/caprasimo';
import {
  useFonts as useFigtree,
  Figtree_600SemiBold,
} from '@expo-google-fonts/figtree';
import { COLORS } from '../constants/theme';

// Amíg az allDinos még nem töltött be (App.js preloadCreatures), ezt írjuk ki
// helyette — a `creatures` tábla jelenlegi tartalma szerinti tényleges szám
// (lásd data/111 db.csv). Ha allDinos betöltött, a valós hossza felülírja.
const TOTAL_CREATURES_FALLBACK = 111;

const YELLOW = COLORS.heroYellow;

export default function HeroTop({ isWide = false, totalCreatures }) {
  const { width } = useWindowDimensions();
  const [hovered, setHovered] = useState(false);

  const [caprasimoLoaded] = useCaprasimo({ Caprasimo_400Regular });
  const [figtreeLoaded] = useFigtree({ Figtree_600SemiBold });

  const titleFont = caprasimoLoaded ? 'Caprasimo_400Regular' : 'System';
  const subtitleFont = figtreeLoaded ? 'Figtree_600SemiBold' : 'System';
  // clamp(28px, 7vw, 38px) — RN-ben nincs clamp(), a vw-t a windowWidth-ből
  // számoljuk ki és Math.min/max-szal szorítjuk a 28–38px sávba.
  const titleSize = Math.min(38, Math.max(28, width * 0.07));
  const creatureCount = totalCreatures || TOTAL_CREATURES_FALLBACK;

  return (
    <View style={[styles.container, isWide && styles.containerWide]}>
      <View style={[styles.heroCard, isWide && styles.heroCardWide]}>
        <Pressable
          style={styles.logoRow}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
        >
          <View style={styles.bar} />
          <View style={styles.textCol}>
            <Text
              style={[
                styles.mainTitle,
                { fontSize: titleSize, lineHeight: titleSize * 0.9, fontFamily: titleFont },
              ]}
            >
              DÍNÓ{'\n'}LEXIKON
            </Text>
            {hovered && (
              <View style={styles.valuePropOverlay} pointerEvents="none">
                <Text style={[styles.valueProp, { fontFamily: subtitleFont }]}>
                  Fedezz fel {creatureCount} őslényt 6 kontinensről
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 2,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
    // A hover-overlay (lásd valuePropOverlay) a lenti CTA gomb fölé lóghat ki;
    // zIndex nélkül a DOM-ban utána következő PrimaryCTA fedné el.
    zIndex: 5,
  },
  containerWide: {
    paddingHorizontal: 0,
  },
  heroCard: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'flex-start',
    position: 'relative',
    paddingVertical: 4,
  },
  heroCardWide: {
    maxWidth: '100%',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 13,
  },
  bar: {
    width: 14,
    borderRadius: 3,
    backgroundColor: YELLOW,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  textCol: {
    justifyContent: 'center',
    position: 'relative',
  },
  mainTitle: {
    color: YELLOW,
    letterSpacing: 0.6,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  // Abszolút pozícionált, hogy megjelenéskor/eltűnéskor ne tolja el a lenti
  // CTA gombot (Napi Dínó kártyát) — a cím alatt lebeg.
  valuePropOverlay: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 4,
  },
  valueProp: {
    color: '#dfe7de',
    opacity: 0.85,
    fontSize: 11.5,
    letterSpacing: 0.4,
    backgroundColor: 'rgba(0,18,25,0.85)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
