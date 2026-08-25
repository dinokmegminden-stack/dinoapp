// GeologyTimeline — a "Geológia" fül kígyózó idővonala. A geológia 20
// meghatározó alakja születési év szerint sorba rendezve, egy fentről lefelé
// kanyargó (szerpentin) pályán. A pont színe = nemzetiség; hoverre (web) vagy
// koppintásra (mobil) buborék-tooltip mutatja a felfedezését. A pálya maga egy
// react-native-svg Path, Catmull-Rom simítással a pontok középpontjain át.
//
// A tudósadat itt, a komponensben él (statikus tartalom, nem DB): kétnyelvű
// leírással, a nemzetiség-nevek is kétnyelvűek — a UI-szövegek (cím/bevezető)
// viszont az i18n-katalógusból jönnek.
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS, RADIUS, FONTS } from '../constants/theme';
import { useT } from '../i18n';

// Nemzetiség -> szín (sötét háttéren olvasható) + kétnyelvű név.
const NAT = {
  Germany:  { c: '#d8b048', hu: 'Németország',    en: 'Germany' },
  Denmark:  { c: '#e86b66', hu: 'Dánia',          en: 'Denmark' },
  Scotland: { c: '#6b9be0', hu: 'Skócia',         en: 'Scotland' },
  France:   { c: '#a98ee0', hu: 'Franciaország',  en: 'France' },
  England:  { c: '#48c1a6', hu: 'Anglia',         en: 'England' },
  USA:      { c: '#e89550', hu: 'USA',            en: 'USA' },
  Finland:  { c: '#5cc4e0', hu: 'Finnország',     en: 'Finland' },
};

// Születési év szerint sorba rendezve.
const PEOPLE = [
  { n: 'Georgius Agricola', b: 1494, d: 1555, nat: 'Germany',
    hu: 'Az ásványtan atyja, akinek De re metallica könyve rendszerezte a bányászatot és az ércek tudományát.',
    en: 'Father of mineralogy; his De re metallica systematized mining and the study of minerals and ores.' },
  { n: 'Nicolaus Steno', b: 1638, d: 1686, nat: 'Denmark',
    hu: 'Lefektette a rétegtan alaptörvényeit: az alsó kőzetréteg mindig idősebb, mint a fölötte lévő.',
    en: 'Established the founding principles of stratigraphy, including the law of superposition.' },
  { n: 'James Hutton', b: 1726, d: 1797, nat: 'Scotland',
    hu: 'A modern geológia atyja, aki felismerte a „mélyidőt”: a Földet lassú folyamatok formálják sokmillió éven át, nem egyszeri katasztrófák.',
    en: 'Founded modern geology with uniformitarianism and deep time.' },
  { n: 'Sir James Hall', b: 1761, d: 1832, nat: 'Scotland',
    hu: 'A kísérleti geológia megalapítója, aki laborban olvasztott kőzeteket, hogy bizonyítsa: tűzből születtek.',
    en: 'Founder of experimental geology; melted and recrystallized rocks to prove their igneous origin.' },
  { n: 'Georges Cuvier', b: 1769, d: 1832, nat: 'France',
    hu: 'A gerinces-őslénytan megalapítója, aki elsőként bizonyította be, hogy a fajok tényleg kihalhatnak.',
    en: 'Founded vertebrate paleontology and proved that species extinction is real.' },
  { n: 'Henry Darcy', b: 1803, d: 1858, nat: 'France',
    hu: 'Megfogalmazta a Darcy-törvényt, amely leírja, hogyan áramlik a víz a porózus kőzetekben — ez a hidrogeológia alapja.',
    en: "Formulated Darcy's law of fluid flow through porous media, the basis of hydrogeology." },
  { n: 'Henry C. Sorby', b: 1826, d: 1908, nat: 'England',
    hu: 'Elsőként vizsgált kőzeteket mikroszkóp alatt, vékonycsiszolatokkal, és így megalapította a modern kőzettant.',
    en: 'Pioneered the microscopic study of rocks with thin sections, founding modern petrography.' },
  { n: 'Grove Karl Gilbert', b: 1843, d: 1918, nat: 'USA',
    hu: 'A folyamatelvű geomorfológia atyja, aki az eróziót és a folyók munkáját vizsgálva értette meg, hogyan formálódik a táj.',
    en: 'Founded process geomorphology through studies of erosion and river dynamics.' },
  { n: 'Frank W. Clarke', b: 1847, d: 1931, nat: 'USA',
    hu: 'A geokémia atyja, aki elsőként határozta meg a földkéreg átlagos kémiai összetételét.',
    en: "Father of geochemistry; determined the average chemical composition of Earth's crust." },
  { n: 'William O. Crosby', b: 1850, d: 1925, nat: 'USA',
    hu: 'A mérnökgeológia úttörője, aki a geológiát gátak és építkezések alapozására alkalmazta.',
    en: 'Pioneer of engineering geology; applied geology to dam foundations and construction sites.' },
  { n: 'Emil Wiechert', b: 1861, d: 1928, nat: 'Germany',
    hu: 'A geofizika és szeizmológia megalapítója, aki megépítette az első jól műszerezett szeizmográfot, és feltárta a Föld magját.',
    en: "Founder of geophysics and seismology; built the inverted-pendulum seismograph and modeled Earth's core." },
  { n: 'Alfred Wegener', b: 1880, d: 1930, nat: 'Germany',
    hu: 'A kontinensvándorlás elméletének megalkotója — ebből nőtt ki a mai lemeztektonika.',
    en: 'Proposed continental drift, the foundational idea behind plate tectonics.' },
  { n: 'Pentti Eskola', b: 1883, d: 1964, nat: 'Finland',
    hu: 'Kidolgozta a metamorf fáciesek elméletét: az ásványokból leolvasható, milyen nyomás és hőmérséklet gyűrte át a kőzetet.',
    en: 'Developed the metamorphic facies concept relating minerals to pressure and temperature.' },
  { n: 'Norman L. Bowen', b: 1887, d: 1956, nat: 'USA',
    hu: 'Megalkotta a Bowen-sort, amely megmutatja, milyen sorrendben kristályosodnak ki az ásványok a hűlő magmából.',
    en: "Formulated Bowen's reaction series for mineral crystallization in cooling magma." },
  { n: 'Arthur Holmes', b: 1890, d: 1965, nat: 'England',
    hu: 'A radiometrikus kormeghatározás úttörője, aki elsőként adott számszerű kort a földtörténeti időskálának.',
    en: 'Pioneered radiometric dating and produced the first quantitative geological time scale.' },
  { n: 'A. I. Levorsen', b: 1894, d: 1965, nat: 'USA',
    hu: 'Kőolajgeológus, aki a „rétegtani csapdák” fogalmával mutatta meg, hol gyűlik össze a földalatti olaj és gáz.',
    en: 'Petroleum geologist; developed the concept of stratigraphic traps for oil and gas.' },
  { n: 'F. P. Shepard', b: 1897, d: 1985, nat: 'USA',
    hu: 'A tengeri geológia atyja, aki feltérképezte a tengeralatti kanyonokat, és megfejtette a tengerfenék születését.',
    en: 'Father of marine geology; mapped and explained submarine canyons and the seafloor.' },
  { n: 'F. J. Pettijohn', b: 1904, d: 1999, nat: 'USA',
    hu: 'Az üledékes kőzettan nagymestere, akinek tankönyvei ma is meghatározzák az üledékek osztályozását.',
    en: 'Leading figure of sedimentary petrology; his textbooks defined sedimentary rock classification.' },
  { n: 'John Ramsay', b: 1931, d: 2021, nat: 'Scotland',
    hu: 'A szerkezeti földtant a kőzetgyűrődés és a deformációs feszültség pontos elemzésével emelte új szintre.',
    en: 'Advanced structural geology through rigorous analysis of rock folding and strain.' },
  { n: 'N. Shackleton', b: 1937, d: 2006, nat: 'England',
    hu: 'Oxigén-izotópokból olvasta ki a múlt éghajlatát, és bizonyította be, hogy a jégkorszakokat a Föld pályaingásai vezénylik.',
    en: 'Used oxygen isotopes to reconstruct past climate and confirm the orbital theory of ice ages.' },
];

const DOT = 20;
const COL_W = 132;
const ROW_H = 150;
const PAD_TOP = 30;
const PAD_BOTTOM = 60;

// Catmull-Rom -> cubic bezier: sima kígyó a pontok középpontjain át.
function buildPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || pts[i + 1];
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function GeologyTimeline() {
  const { t, lang } = useT();
  const { width: winWidth } = useWindowDimensions();
  // A sáv szélessége: a képernyő szélessége mínusz a képernyő oldalpaddingja,
  // 900-nál kupolázva (wrap maxWidth). Ablakból számoljuk, nem onLayout-ból —
  // az RN-web az align-center konténerben 0-t adott vissza.
  const width = Math.max(280, Math.min(winWidth - 40, 900));
  const [activeId, setActiveId] = useState(null); // hover (web) / koppintás (mobil)

  const now = new Date();
  const pad = (x) => String(x).padStart(2, '0');
  const todayStr = `${now.getFullYear()}. ${pad(now.getMonth() + 1)}. ${pad(now.getDate())}.`;

  // "Ma" pontot is beletesszük a folyamba, hogy a kígyó vége a jobb alsó
  // sarokban, a mai dátumon záruljon.
  const items = useMemo(
    () => [...PEOPLE, { today: true, n: t('geology.today'), yr: todayStr, nat: null }],
    [lang]
  );

  const cols = width >= 880 ? 3 : 2;
  const layout = useMemo(() => {
    if (!width) return null;
    const padX = Math.min(70, width * 0.11);
    const cellW = (width - padX * 2) / cols;
    const pts = items.map((it, i) => {
      const row = Math.floor(i / cols);
      let col = i % cols;
      if (row % 2 === 1) col = cols - 1 - col; // szerpentin: páratlan sor visszafelé
      const x = padX + col * cellW + cellW / 2;
      const y = PAD_TOP + row * ROW_H;
      return { x, y, row };
    });
    const rows = Math.ceil(items.length / cols);
    const height = PAD_TOP + (rows - 1) * ROW_H + PAD_BOTTOM;
    return { pts, height, d: buildPath(pts), rows };
  }, [width, cols, items]);

  const active = activeId != null ? PEOPLE[activeId] : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.legend}>
        {Object.entries(NAT).map(([k, v]) => (
          <View key={k} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: v.c }]} />
            <Text style={styles.legendText}>{lang === 'en' ? v.en : v.hu}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.track, { width }]}>
        {layout && (
          <>
            <Svg width={width} height={layout.height} style={StyleSheet.absoluteFill}>
              <Path d={layout.d} stroke="rgba(254,250,224,0.16)" strokeWidth={2.5} fill="none" strokeLinecap="round" />
              <Path d={layout.d} stroke={COLORS.accent} strokeOpacity={0.4} strokeWidth={2.5} strokeDasharray="2 12" fill="none" strokeLinecap="round" />
            </Svg>

            <View style={{ height: layout.height }}>
              {items.map((it, i) => {
                const p = layout.pts[i];
                const col = it.today ? COLORS.cream : NAT[it.nat].c;
                const isActive = activeId === i;
                return (
                  <Pressable
                    key={i}
                    onPress={() => !it.today && setActiveId(isActive ? null : i)}
                    onHoverIn={() => !it.today && setActiveId(i)}
                    onHoverOut={() => !it.today && setActiveId((cur) => (cur === i ? null : cur))}
                    style={[styles.node, { left: p.x - COL_W / 2, top: p.y - DOT / 2, width: COL_W }]}
                    accessibilityRole="button"
                    accessibilityLabel={it.n}
                  >
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: col, borderColor: COLORS.bgDark },
                        it.today && styles.dotToday,
                        isActive && styles.dotActive,
                      ]}
                    />
                    <Text style={[styles.name, it.today && styles.nameToday]} numberOfLines={2}>
                      {it.today ? it.n : it.n}
                    </Text>
                    <Text style={styles.year}>{it.today ? it.yr : `${it.b}–${it.d}`}</Text>
                  </Pressable>
                );
              })}

              {active && (
                <Tooltip
                  person={active}
                  lang={lang}
                  pt={layout.pts[activeId]}
                  width={width}
                  isLastRow={layout.pts[activeId].row >= layout.rows - 1}
                />
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function Tooltip({ person, lang, pt, width, isLastRow }) {
  const tipW = Math.min(300, width - 24);
  let left = pt.x - tipW / 2;
  left = Math.max(8, Math.min(left, width - tipW - 8));
  const col = NAT[person.nat].c;
  // Alul lévő sornál a buborék fölé, egyébként alá.
  const style = isLastRow
    ? { left, bottom: undefined, top: pt.y - 8 - 150 }
    : { left, top: pt.y + 40 };
  return (
    <View style={[styles.tip, { width: tipW, borderTopColor: col }, style]} pointerEvents="none">
      <View style={styles.tipHead}>
        <Text style={styles.tipName}>{person.n}</Text>
        <Text style={styles.tipYears}>{person.b}–{person.d}</Text>
      </View>
      <View style={styles.tipNat}>
        <View style={[styles.legendDot, { backgroundColor: col }]} />
        <Text style={[styles.tipNatText, { color: col }]}>
          {lang === 'en' ? NAT[person.nat].en : NAT[person.nat].hu}
        </Text>
      </View>
      <Text style={styles.tipDesc}>{lang === 'en' ? person.en : person.hu}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', maxWidth: 900, alignSelf: 'stretch' },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    justifyContent: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: COLORS.cream, fontSize: 12, fontFamily: FONTS.body, opacity: 0.75 },

  track: { width: '100%', position: 'relative' },
  node: {
    position: 'absolute',
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 3,
    ...Platform.select({ web: { transitionProperty: 'transform', transitionDuration: '150ms' } }),
  },
  dotActive: { transform: [{ scale: 1.3 }] },
  dotToday: { width: 16, height: 16, borderRadius: 8 },
  name: {
    color: COLORS.cream,
    fontSize: 13.5,
    fontFamily: FONTS.heading,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  nameToday: {
    color: COLORS.accent,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  year: {
    color: COLORS.cream,
    fontSize: 11,
    fontFamily: FONTS.body,
    opacity: 0.6,
    marginTop: 2,
  },
  tip: {
    position: 'absolute',
    backgroundColor: 'rgba(16,14,12,0.97)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.12)',
    borderTopWidth: 3,
    padding: 16,
    zIndex: 10,
    ...Platform.select({ web: { boxShadow: '0 14px 40px rgba(0,0,0,0.5)' } }),
  },
  tipHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  tipName: { color: COLORS.cream, fontSize: 17, fontFamily: FONTS.heading, flexShrink: 1 },
  tipYears: { color: COLORS.cream, fontSize: 12, fontFamily: FONTS.body, opacity: 0.6 },
  tipNat: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 8 },
  tipNatText: { fontSize: 11, fontFamily: FONTS.bodyBold, letterSpacing: 0.6, textTransform: 'uppercase' },
  tipDesc: { color: COLORS.cream, fontSize: 13.5, lineHeight: 20, fontFamily: FONTS.body, opacity: 0.9 },
});
