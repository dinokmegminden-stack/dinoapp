
import React, { useEffect, useRef } from 'react';
import { Platform, Image as RNImage } from 'react-native';

const SCENE_CSS = `
.dmm-scene-img { animation: dmm-kenburns 34s ease-in-out infinite; will-change: transform; }
.dmm-scene-fog1 { animation: dmm-fogdrift1 41s ease-in-out infinite alternate; }
.dmm-scene-fog2 { animation: dmm-fogdrift2 57s ease-in-out infinite alternate; }
@keyframes dmm-kenburns { 0%,100% { transform: scale(1.03) translate(0,0); } 50% { transform: scale(1.06) translate(-1.2%,-.6%); } }
@keyframes dmm-fogdrift1 { from { transform: translateX(-8%); } to { transform: translateX(8%); } }
@keyframes dmm-fogdrift2 { from { transform: translateX(6%); } to { transform: translateX(-6%); } }
@media (prefers-reduced-motion: reduce) {
  .dmm-scene-img, .dmm-scene-fog1, .dmm-scene-fog2 { animation: none !important; }
}
`;

function rand(a, b) {
  return a + Math.random() * (b - a);
}

export default function AnimatedLandingBg({ source, dim = false }) {
  const sceneRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;

    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    if (!scene || !canvas) return undefined;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    const ctx = canvas.getContext('2d');
    let W = 0;
    let H = 0;
    let dpr = 1;
    let flies = [];

    const newFly = () => ({
      x: rand(0, W), y: rand(H * 0.55, H), t: rand(0, 6.28),
      spd: rand(0.008, 0.02), drift: rand(-0.15, 0.15), r: rand(0.8, 1.8), bp: rand(0, 6.28),
    });

    function resize() {
      const r = scene.getBoundingClientRect();
      W = r.width;
      H = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(W / 26);
      while (flies.length < target) flies.push(newFly());
      flies.length = target;
    }
    window.addEventListener('resize', resize);
    resize();

    let t = 0;
    let cancelled = false;
    let rafId = null;

    function loop() {
      if (cancelled) return;
      rafId = requestAnimationFrame(loop);
      t++;
      ctx.clearRect(0, 0, W, H);

      for (const f of flies) {
        f.t += f.spd;
        f.x += Math.cos(f.t) * 0.4 + f.drift;
        f.y += Math.sin(f.t * 1.3) * 0.3;
        if (f.x < -20) f.x = W + 20;
        if (f.x > W + 20) f.x = -20;
        if (f.y < H * 0.3) f.y = H * 0.3;
        if (f.y > H) f.y = H;
        const blink = 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(f.t * 2.2 + f.bp));
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, 6.283);
        ctx.fillStyle = `hsla(72,90%,68%,${blink})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'hsla(72,90%,60%,.9)';
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
    loop();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  if (Platform.OS !== 'web') return null;

  return (
    <div ref={sceneRef} style={styles.scene}>
      <style>{SCENE_CSS}</style>
      <div style={styles.pan}>
        <div className="dmm-scene-img" style={dim ? { ...styles.imgWrap, filter: 'saturate(0.72) contrast(0.9) brightness(0.92)' } : styles.imgWrap}>
          <RNImage source={source} style={styles.imgFill} resizeMode="cover" />
        </div>
      </div>
      <div className="dmm-scene-fog1" style={{ ...styles.fog, ...styles.fog1 }} />
      <div className="dmm-scene-fog2" style={{ ...styles.fog, ...styles.fog2 }} />
      <canvas ref={canvasRef} style={styles.canvas} />
      <div style={styles.vignette} />
    </div>
  );
}

const styles = {
  scene: {
    // Viewporthoz kötve (fixed 100vh) — NEM a teljes, görgethető oldal-
    // magasságra. Különben a magas landing-tartalmon a `cover` egy 16:9 képet
    // a több ezer px magas konténerre húzva óriásira zoomol, és levágja a
    // dínó szemét. Fixed + 100vh: a 16:9 kép ~kifér, a szem látszik, és
    // finom parallaxot ad görgetéskor.
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    overflow: 'hidden', background: '#05070c', pointerEvents: 'none',
  },
  pan: {
    position: 'absolute', inset: '-4%',
  },
  imgWrap: { position: 'absolute', inset: 0 },
  // objectPosition a szemre húzza a fókuszt (jobb-felső harmad), hogy más
  // képarányú kijelzőn (pl. ultrawide) a levágás se vegye ki a szemet.
  imgFill: { width: '100%', height: '100%', objectPosition: '65% 30%' },
  fog: { position: 'absolute', left: '-10%', right: '-10%', mixBlendMode: 'screen', pointerEvents: 'none' },
  fog1: {
    bottom: 0, height: '56%', filter: 'blur(14px)',
    background: 'radial-gradient(ellipse 40% 60% at 20% 80%, rgba(150,175,200,.16), rgba(0,0,0,0) 60%), radial-gradient(ellipse 45% 55% at 60% 90%, rgba(140,165,195,.14), rgba(0,0,0,0) 62%)',
  },
  fog2: {
    bottom: '4%', height: '44%', filter: 'blur(20px)',
    background: 'radial-gradient(ellipse 50% 55% at 35% 85%, rgba(120,150,185,.13), rgba(0,0,0,0) 60%)',
  },
  canvas: { position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' },
  vignette: {
    position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 200px 60px rgba(0,0,0,.55)',
    background: 'radial-gradient(ellipse 90% 90% at 50% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,.4) 100%)',
  },
};
