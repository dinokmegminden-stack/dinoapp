// RegionWorldMap — a landing menü "RÉGIÓK" blokkjának interaktív világtérkép
// változata (a korábbi 2×3 gombrács helyett, lásd terv.png). A térképet a
// react-native-svg SvgXml komponensével rajzoljuk (natív + web egyaránt), a
// hat régió fajszámát pedig abszolút pozícionált, kattintható narancssárga
// számokként rétegezzük fölé. A számok pontosan ugyanazt az onSelectRegion(edu)
// eseményt hívják, mint a régi régiógombok.
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { WORLD_MAP_SVG } from '../constants/worldMapSvg';
import { COLORS, FONTS } from '../constants/theme';

// A SVG viewBox-a: "30.767 241.591 784.077 458.627" — a marker-pozíciókat a
// térkép saját koordinátarendszerében adjuk meg, majd %-ra váltjuk, hogy a
// méretezéstől (reszponzivitás) függetlenül mindig a helyükön maradjanak.
const VIEWBOX = { x: 30.767, y: 241.591, w: 784.077, h: 458.627 };
const ASPECT = VIEWBOX.w / VIEWBOX.h; // ~1.71

function toPct(x, y) {
  return {
    left: `${((x - VIEWBOX.x) / VIEWBOX.w) * 100}%`,
    top: `${((y - VIEWBOX.y) / VIEWBOX.h) * 100}%`,
  };
}

// edu → a kontinens fölé eső horgonypont a SVG koordinátarendszerében.
// A sorrend/hozzárendelés a terv.png alapján: 25 Észak-Amerika, 21 Dél-Amerika,
// 20 Európa + 15 Kárpát-medence (közép-Európa), 10 Afrika, 20 Ázsia.
const MARKERS = [
  { edu: 6, label: 'Észak-Amerika', ...toPct(195, 400) },
  { edu: 5, label: 'Dél-Amerika', ...toPct(272, 588) },
  { edu: 2, label: 'Európa', ...toPct(415, 388) },
  { edu: 1, label: 'Kárpát-medence', ...toPct(458, 405) },
  { edu: 3, label: 'Afrika', ...toPct(468, 512) },
  { edu: 4, label: 'Ázsia', ...toPct(620, 415) },
];

// Áttetsző térkép, narancs kontinens-körvonallal, országhatárok nélkül.
// A SVG per-ország path-okból áll, ezért egy szűrővel oldjuk meg: minden
// országot ÁTLÁTSZATLANUL kitöltünk (a fill színe lényegtelen, csak az alfa/
// sziluett kell), majd egy feMorphology-alapú szűrő a KÖZÖS sziluett külső élét
// rajzolja narancssárgával (dilate mínusz az eredeti alfa = gyűrű). Így egy
// kontinensen belül az országhatárok eltűnnek (a belső él a sziluetten belül
// van), a kontinens belseje átlátszó marad, csak a partvonal kap narancs vonalat.
const OUTLINE_COLOR = COLORS.accent; // #ee9b00
const OUTLINE_RADIUS = 2; // a körvonal vastagsága a SVG koordinátáiban
const CLOSE_RADIUS = 1.2; // morfológiai "zárás" — ekkora rést tömünk be az országok között
// A szűrő két lépésben dolgozik:
// 1) ZÁRÁS (dilate → erode ugyanakkora sugárral): betömi az ország-path-ok közti
//    apró réseket, hogy egy kontinens egyetlen, lyukmentes sziluett legyen — így
//    a belső országhatárok eltűnnek, a sziluett külső mérete nem nő számottevően.
// 2) KÖRVONAL: a zárt sziluettet kicsit felnagyítjuk, kivonjuk belőle önmagát
//    (= gyűrű), és narancssárgával töltjük — csak a partvonal marad.
const OUTLINE_FILTER =
  '<defs><filter id="continentOutline" x="-3%" y="-3%" width="106%" height="106%">' +
  `<feMorphology in="SourceAlpha" operator="dilate" radius="${CLOSE_RADIUS}" result="cd"/>` +
  `<feMorphology in="cd" operator="erode" radius="${CLOSE_RADIUS}" result="closed"/>` +
  `<feMorphology in="closed" operator="dilate" radius="${OUTLINE_RADIUS}" result="thick"/>` +
  '<feComposite in="thick" in2="closed" operator="out" result="ring"/>' +
  `<feFlood flood-color="${OUTLINE_COLOR}"/>` +
  '<feComposite in2="ring" operator="in"/>' +
  '</filter></defs>';

const STYLED_SVG = WORLD_MAP_SVG
  // minden ország átlátszatlan kitöltése (a szűrő SourceAlpha-jához)
  .replace(/<path /g, '<path fill="#000" ')
  // a szűrő-definíció beszúrása a gyökér <svg> elejére; preserveAspectRatio="none"
  // hogy a térkép kitöltse az (alacsonyabbra vett) konténert, ne pedig letterbox-oljon
  .replace('id="world-map">', 'id="world-map" preserveAspectRatio="none">' + OUTLINE_FILTER)
  // a szűrő rákötése a legfelső (bare) <g>-re, ami az összes országot tartalmazza
  .replace('<g>', '<g filter="url(#continentOutline)">');

export default function RegionWorldMap({ onSelectRegion, regionCounts }) {
  // Amíg az allDinos (App.js) még nem töltött be, regionCounts üres — ilyenkor
  // "…"-t írunk 0 helyett (ugyanaz a logika, mint a régi gomboknál).
  const countsLoading = !regionCounts || Object.keys(regionCounts).length === 0;

  // Hover-állapot (csak weben van értelme): melyik régió számán áll az egér.
  const [hoveredEdu, setHoveredEdu] = useState(null);
  // Fókusz-állapot (Tab-bal navigálva) — webes billentyűzet-fókusz gyűrűhöz.
  const [focusedEdu, setFocusedEdu] = useState(null);

  return (
    <View style={styles.wrap}>
      <SvgXml xml={STYLED_SVG} width="100%" height="100%" />

      {MARKERS.map((m) => {
        const isHovered = hoveredEdu === m.edu;
        const isFocused = focusedEdu === m.edu;
        return (
          <Pressable
            key={m.edu}
            onPress={() => onSelectRegion(m.edu)}
            onHoverIn={() => setHoveredEdu(m.edu)}
            onHoverOut={() => setHoveredEdu((prev) => (prev === m.edu ? null : prev))}
            onFocus={() => setFocusedEdu(m.edu)}
            onBlur={() => setFocusedEdu((prev) => (prev === m.edu ? null : prev))}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`${m.label} régió`}
            style={[
              styles.marker,
              { left: m.left, top: m.top },
              (isHovered || isFocused) && styles.markerHover,
              isFocused && styles.markerFocused,
            ]}
          >
            {(isHovered || isFocused) && (
              <View style={styles.tooltip} pointerEvents="none">
                <Text style={styles.tooltipText} numberOfLines={1}>
                  {m.label}
                </Text>
              </View>
            )}
            <Text style={[styles.markerText, (isHovered || isFocused) && styles.markerTextHover]}>
              {countsLoading ? '…' : regionCounts[m.edu] || 0}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const MARKER_W = 34;
const MARKER_H = 26;
const TOOLTIP_W = 130; // a hover-tooltip fix szélessége (a marker fölött középre igazítva)

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: ASPECT,
    position: 'relative',
    marginVertical: 6,
  },
  marker: {
    position: 'absolute',
    width: MARKER_W,
    height: MARKER_H,
    // A left/top a horgonypont; negatív margóval a szám KÖZEPE kerül a pontra.
    marginLeft: -MARKER_W / 2,
    marginTop: -MARKER_H / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerText: {
    color: COLORS.accent,
    fontFamily: FONTS.bodyBold,
    fontSize: 19,
    letterSpacing: 0.5,
    // Barnás pill-háttér a szám mögött (a landing streak-pilljével azonos tónus),
    // hogy a szám minden kontinens/óceán fölött jól olvasható legyen.
    backgroundColor: 'rgba(139,86,48,0.55)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 2,
    overflow: 'hidden',
    // Sötét körvonal a jó olvashatóságért világos kontinensen és óceán fölött is.
    textShadowColor: 'rgba(0,18,25,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // Hover: a megcélzott marker a többi fölé kerüljön (tooltip + nagyítás miatt).
  markerHover: {
    zIndex: 10,
  },
  // Billentyűzetes navigációhoz (Tab) látható fókusz-gyűrű webes nézetben.
  markerFocused: {
    ...Platform.select({
      web: {
        outlineStyle: 'solid',
        outlineWidth: 2,
        outlineColor: COLORS.cream,
        outlineOffset: 3,
        borderRadius: 4,
      },
    }),
  },
  markerTextHover: {
    // Kiemelkedik: nagyobb, világosabb, narancs ragyogással.
    color: COLORS.cream,
    transform: [{ scale: 1.35 }],
    textShadowColor: COLORS.accent,
    textShadowRadius: 8,
  },
  // A régió neve a szám fölött, hoverkor.
  tooltip: {
    position: 'absolute',
    bottom: MARKER_H,
    left: (MARKER_W - TOOLTIP_W) / 2,
    width: TOOLTIP_W,
    alignItems: 'center',
  },
  tooltipText: {
    color: COLORS.cream,
    backgroundColor: 'rgba(0,18,25,0.92)',
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
    overflow: 'hidden',
  },
});
