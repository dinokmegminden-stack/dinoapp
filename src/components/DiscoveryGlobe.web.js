// DiscoveryGlobe (web) — a landing forgó földgömbje: minden lény a valódi
// lelőhelyén (creatures.discovery_lat/lng), étrend szerint színezett ponttal.
// Egér a ponton → megáll a forgás, és a lény DinoCard-ja jelenik meg mellette;
// érintőképernyőn koppintásra. Natívon (Android) nincs WebGL-gömb, ott a
// DiscoveryGlobe.js üres stubja fut, a landing változatlan.
import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import DinoCard, { dietIconName, dietColor } from './DinoCard';
import { FONTS } from '../constants/theme';
import { useT } from '../i18n';

// A three.js ~600 KB — külön chunkba, hogy a landing többi része ne várjon rá.
const Globe = lazy(() => import('react-globe.gl'));

const CARD_W = 280;
const CARD_H = 330; // a DinoCard (leírás nélkül) hozzávetőleges magassága
const SPREAD_DEG = 1.2; // azonos lelőhelyű lények gyűrűbe húzva

const LEGEND = [
  ['globe_meat', dietColor('food-drumstick')],
  ['globe_plant', dietColor('leaf')],
  ['globe_other', dietColor('dna')],
];

// Azonos (2 tizedesre kerekített) lelőhelyű lényeket kis körbe szórjuk,
// hogy a pontok ne fedjék egymást.
function toMarkers(dinos) {
  const groups = new Map();
  for (const d of dinos) {
    if (!Number.isFinite(d.discovery_lat) || !Number.isFinite(d.discovery_lng)) continue;
    const key = `${d.discovery_lat.toFixed(2)},${d.discovery_lng.toFixed(2)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(d);
  }
  const out = [];
  for (const g of groups.values()) {
    g.forEach((dino, i) => {
      const a = (2 * Math.PI * i) / g.length;
      const r = g.length > 1 ? SPREAD_DEG : 0;
      out.push({ dino, lat: dino.discovery_lat + r * Math.sin(a), lng: dino.discovery_lng + r * Math.cos(a) });
    });
  }
  return out;
}

// ── Címke-elhelyezés ─────────────────────────────────────────────────────────
// Képkockánként, mohó módon: minden látható címke az előző oldalát, majd a pont
// jobb/bal/fölső/alsó oldalát próbálja, és az első olyat kapja, ami nem fed
// más címkét vagy pontot. Ha nincs hely, a címke elrejtve (a pont hoverje marad).
// ponytail: mohó, O(n²) ~110 pontra; sok száz pontnál erő-alapú elhelyező kell.
const SIDES = ['right', 'left', 'top', 'bottom'];
const GAP = 8;
const PAD = 2;
const TRANSFORM = {
  right: `translate(${GAP}px, -50%)`,
  left: `translate(calc(-100% - ${GAP}px), -50%)`,
  top: `translate(-50%, calc(-100% - ${GAP}px))`,
  bottom: `translate(-50%, ${GAP}px)`,
};
const hits = (a, b) =>
  a.x < b.x + b.w + PAD && b.x < a.x + a.w + PAD && a.y < b.y + b.h + PAD && b.y < a.y + a.h + PAD;

function labelBox(side, cx, cy, w, h) {
  if (side === 'right') return { x: cx + GAP, y: cy - h / 2, w, h };
  if (side === 'left') return { x: cx - GAP - w, y: cy - h / 2, w, h };
  if (side === 'top') return { x: cx - w / 2, y: cy - GAP - h, w, h };
  return { x: cx - w / 2, y: cy + GAP, w, h };
}

function layoutLabels(root) {
  // Előbb minden mérés, aztán minden írás → képkockánként egy layout.
  const items = [...root.querySelectorAll('[data-dino]')]
    .map((el) => {
      const r = el.getBoundingClientRect();
      const label = el.lastElementChild;
      return { label, cx: r.x + r.width / 2, cy: r.y + r.height / 2, dot: r, w: label.offsetWidth, h: label.offsetHeight };
    })
    .filter((it) => it.dot.width > 0); // a gömb túloldalán (elrejtve)
  const placed = items.map((it) => ({ x: it.dot.x, y: it.dot.y, w: it.dot.width, h: it.dot.height }));
  const sides = items.map((it, i) => {
    const prev = it.label.dataset.side;
    for (const side of prev ? [prev, ...SIDES] : SIDES) {
      const box = labelBox(side, it.cx, it.cy, it.w, it.h);
      if (!placed.some((p, j) => j !== i && hits(box, p))) {
        placed.push(box);
        return side;
      }
    }
    return null;
  });
  items.forEach(({ label }, i) => {
    const side = sides[i];
    label.style.opacity = side ? '1' : '0';
    label.style.pointerEvents = side ? 'auto' : 'none';
    if (side) {
      label.dataset.side = side;
      label.style.transform = TRANSFORM[side];
    }
  });
}

// Sima DOM-marker (a globe.gl pozicionálja): az elem maga a pont, így a pont
// közepe esik a koordinátára; a címke abszolút pozícióval lóg mellette.
function makeMarker(m) {
  const color = dietColor(dietIconName(m.dino));
  const el = document.createElement('div');
  el.dataset.dino = String(m.dino.id);
  Object.assign(el.style, { position: 'relative', width: '10px', height: '10px', cursor: 'pointer', pointerEvents: 'auto' });
  el.innerHTML = `
    <span style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:.55;animation:dmm-globe-ping 2s cubic-bezier(0,0,.2,1) infinite"></span>
    <span style="position:absolute;inset:0;border-radius:50%;background:${color};box-shadow:0 0 8px 2px ${color}"></span>
    <span class="dmm-globe-label" style="position:absolute;top:50%;left:50%;opacity:0"></span>`;
  el.lastElementChild.textContent = m.dino.name_hu;
  return el;
}

const GLOBAL_CSS = `
@keyframes dmm-globe-ping { 75%, 100% { transform: scale(2.2); opacity: 0; } }
.dmm-globe-label { white-space: nowrap; padding: 2px 6px; border-radius: 4px; font: 600 11px ${FONTS.body}, system-ui, sans-serif;
  color: #FEFAE0; background: rgba(20,18,16,.75); transition: opacity .2s, background-color .15s, color .15s; user-select: none; }
[data-dino]:hover .dmm-globe-label { background: #DDA15E; color: #283618; }
`;

export default function DiscoveryGlobe({ dinos }) {
  const { t } = useT();
  const { height: winH } = useWindowDimensions();
  const globeRef = useRef();
  const rootRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState(null); // { dino, x, y }
  const coarse = useMemo(() => window.matchMedia?.('(pointer: coarse)').matches ?? false, []);

  const markers = useMemo(() => toMarkers(dinos || []), [dinos]);
  const byId = useMemo(() => new Map(markers.map((m) => [String(m.dino.id), m.dino])), [markers]);
  const height = Math.round(Math.min(Math.max(winH - 140, 420), 820));

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const setRotating = (on) => {
      const controls = globeRef.current?.controls();
      if (controls) controls.autoRotate = on;
    };
    // A hover-állapotot a kurzor alatti elemből számoljuk: a markerenkénti
    // mouseleave megbízhatatlan, mert a gömb mozgatja/elrejti a pontokat.
    const onPointer = (e) => {
      const id = root.contains(e.target) ? e.target.closest?.('[data-dino]')?.dataset.dino : undefined;
      const dino = id ? byId.get(id) : undefined;
      setRotating(!dino);
      setHover(dino ? { dino, x: e.clientX, y: e.clientY } : null);
    };
    // Képernyőn kívül a gömb és a címke-ciklus is áll (görgetett landing).
    let raf = 0;
    let visible = true;
    const tick = () => {
      layoutLabels(root);
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) {
        globeRef.current?.resumeAnimation();
        raf = requestAnimationFrame(tick);
      } else {
        globeRef.current?.pauseAnimation();
        setHover(null);
      }
    });
    io.observe(root);
    window.addEventListener('pointermove', onPointer);
    window.addEventListener('pointerdown', onPointer); // érintés: koppintás = hover
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [byId]);

  const onReady = () => {
    const g = globeRef.current;
    const controls = g.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    // A gömb a görgethető landing része: a görgő a lapot görgesse, ne zoomoljon.
    controls.enableZoom = false;
    if (coarse) {
      // Érintésen a húzás a lapot görgesse (különben a gömb "elnyeli" a landinget).
      controls.enableRotate = false;
      g.renderer().domElement.style.touchAction = 'pan-y';
    }
    g.pointOfView({ lat: 35, lng: 10, altitude: 2.3 });
  };

  const cardLeft = hover && (hover.x + 18 + CARD_W > window.innerWidth ? hover.x - 18 - CARD_W : hover.x + 18);
  const cardTop = hover && Math.min(Math.max(12, hover.y - CARD_H / 2), window.innerHeight - CARD_H - 12);

  return (
    <View style={[styles.wrap, { height }]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <style>{GLOBAL_CSS}</style>
      {/* isolation: a markerek z-indexe a hover-kártya alatt marad */}
      <div ref={rootRef} style={{ position: 'absolute', inset: 0, isolation: 'isolate' }}>
        {width > 0 && (
          <Suspense fallback={null}>
            <Globe
              ref={globeRef}
              width={width}
              height={height}
              onGlobeReady={onReady}
              globeImageUrl="/globe/earth-blue-marble.jpg"
              bumpImageUrl="/globe/earth-topology.png"
              backgroundImageUrl="/globe/night-sky.png"
              showAtmosphere
              atmosphereColor="#DDA15E"
              atmosphereAltitude={0.16}
              htmlElementsData={markers}
              htmlAltitude={0.01}
              htmlElement={makeMarker}
              htmlTransitionDuration={0}
            />
          </Suspense>
        )}
      </div>

      <View style={styles.overlay} pointerEvents="none">
        <Text style={styles.eyebrow}>{t('landing.globe_eyebrow')}</Text>
        <Text style={styles.title}>{t('landing.globe_title')}</Text>
        <Text style={styles.hint}>{t(coarse ? 'landing.globe_hint_touch' : 'landing.globe_hint', { count: markers.length })}</Text>
        <View style={styles.legend}>
          {LEGEND.map(([key, color]) => (
            <View key={key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color, boxShadow: `0 0 6px ${color}` }]} />
              <Text style={styles.legendText}>{t(`landing.${key}`)}</Text>
            </View>
          ))}
        </View>
      </View>

      {hover && (
        <div role="tooltip" style={{ position: 'fixed', left: cardLeft, top: cardTop, zIndex: 50, pointerEvents: 'none' }}>
          <DinoCard dino={hover.dino} />
        </div>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: '#05070d',
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top: 24,
    left: 24,
    right: 24,
  },
  eyebrow: {
    color: '#DDA15E',
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FEFAE0',
    fontFamily: FONTS.bold,
    fontSize: 28,
    marginTop: 4,
  },
  hint: {
    color: 'rgba(254,250,224,0.7)',
    fontFamily: FONTS.body,
    fontSize: 13,
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: 'rgba(254,250,224,0.85)',
    fontFamily: FONTS.body,
    fontSize: 12,
  },
});
