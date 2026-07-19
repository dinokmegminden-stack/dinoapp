// AnimatedLandingBg — a Shell statikus háttérkép+overlay párosát váltja ki a
// landing oldalon: lassú Ken Burns közelítés a képen, izzó tábortűz-fény
// pulzálás, felfelé szálló parázsszikrák és szentjánosbogarak vászon-alapú
// részecskeszimulációval, ködréteg-sodródás, és egérmozgásra reagáló enyhe
// parallax. Kizárólag asztali weben fut (lásd Shell.js showBackgroundImage
// feltétele), ezért itt nyers DOM elemeket (div/canvas/style) és a böngésző
// requestAnimationFrame/Canvas2D API-ját használjuk CSS-keyframe-ekkel — RN
// StyleSheet nem támogat kulcskocka-animációt vagy vászon-rajzolást.
import React, { useEffect, useRef } from 'react';
import { Platform, Image as RNImage } from 'react-native';

const SCENE_CSS = `
.dmm-scene-img { animation: dmm-kenburns 34s ease-in-out infinite; will-change: transform; }
.dmm-scene-fog1 { animation: dmm-fogdrift1 41s ease-in-out infinite alternate; }
.dmm-scene-fog2 { animation: dmm-fogdrift2 57s ease-in-out infinite alternate; }
@keyframes dmm-kenburns { 0%,100% { transform: scale(1.06) translate(0,0); } 50% { transform: scale(1.11) translate(-1.4%,-.8%); } }
@keyframes dmm-fogdrift1 { from { transform: translateX(-8%); } to { transform: translateX(8%); } }
@keyframes dmm-fogdrift2 { from { transform: translateX(6%); } to { transform: translateX(-6%); } }
@media (prefers-reduced-motion: reduce) {
  .dmm-scene-img, .dmm-scene-fog1, .dmm-scene-fog2 { animation: none !important; }
}
`;

function rand(a, b) {
  return a + Math.random() * (b - a);
}

export default function AnimatedLandingBg({ source }) {
  const sceneRef = useRef(null);
  const canvasRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;

    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    const glow = glowRef.current;
    if (!scene || !canvas || !glow) return undefined;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    const ctx = canvas.getContext('2d');
    let W = 0;
    let H = 0;
    let dpr = 1;
    let flies = [];
    let embers = [];

    const newFly = () => ({
      x: rand(0, W), y: rand(H * 0.55, H), t: rand(0, 6.28),
      spd: rand(0.008, 0.02), drift: rand(-0.15, 0.15), r: rand(0.8, 1.8), bp: rand(0, 6.28),
    });
    const newEmber = () => {
      const fx = W * 0.53;
      const fy = H * 0.5;
      return {
        x: fx + rand(-W * 0.06, W * 0.06), y: fy + rand(-H * 0.05, H * 0.06),
        vx: rand(-0.15, 0.35), vy: rand(-0.9, -0.35), r: rand(0.7, 2.1),
        life: 0, max: rand(90, 220), hue: rand(18, 42), ph: rand(0, 6.28),
      };
    };

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

    const handleMouseMove = (e) => {
      const mx = (e.clientX / window.innerWidth - 0.5) * 2;
      const my = (e.clientY / window.innerHeight - 0.5) * 2;
      scene.style.setProperty('--mx', mx.toFixed(3));
      scene.style.setProperty('--my', my.toFixed(3));
    };
    window.addEventListener('mousemove', handleMouseMove);

    let t = 0;
    const seed = rand(0, 100);
    let cancelled = false;
    let rafId = null;

    function loop() {
      if (cancelled) return;
      rafId = requestAnimationFrame(loop);
      t++;
      ctx.clearRect(0, 0, W, H);

      glow.style.opacity = Math.max(0, Math.min(1,
        0.5 + 0.13 * Math.sin(t * 0.09 + seed) + 0.09 * Math.sin(t * 0.23 + 1.7) + 0.05 * (Math.random() - 0.5)
      )).toFixed(3);

      if (Math.random() < 0.55) embers.push(newEmber());
      for (let i = embers.length - 1; i >= 0; i--) {
        const p = embers[i];
        p.life++;
        p.x += p.vx + Math.sin(p.life * 0.05 + p.ph) * 0.25;
        p.y += p.vy;
        p.vy *= 0.996;
        if (p.life > p.max) { embers.splice(i, 1); continue; }
        const lr = p.life / p.max;
        const a = (1 - lr) * (0.7 + 0.3 * Math.sin(p.life * 0.4 + p.ph));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fillStyle = `hsla(${p.hue},95%,${58 + lr * 12}%,${a})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `hsla(${p.hue},95%,55%,${a})`;
        ctx.fill();
      }
      ctx.shadowBlur = 0;

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
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  if (Platform.OS !== 'web') return null;

  return (
    <div ref={sceneRef} style={styles.scene}>
      <style>{SCENE_CSS}</style>
      <div style={styles.pan}>
        <div className="dmm-scene-img" style={styles.imgWrap}>
          <RNImage source={source} style={styles.imgFill} resizeMode="cover" />
        </div>
      </div>
      <div ref={glowRef} style={styles.glow} />
      <div className="dmm-scene-fog1" style={{ ...styles.fog, ...styles.fog1 }} />
      <div className="dmm-scene-fog2" style={{ ...styles.fog, ...styles.fog2 }} />
      <canvas ref={canvasRef} style={styles.canvas} />
      <div style={styles.vignette} />
    </div>
  );
}

const styles = {
  scene: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    overflow: 'hidden', background: '#05070c', pointerEvents: 'none',
  },
  pan: {
    position: 'absolute', inset: '-4%',
    transform: 'translate(calc(var(--mx, 0) * 10px), calc(var(--my, 0) * 7px))',
    transition: 'transform .25s ease-out', willChange: 'transform',
  },
  imgWrap: { position: 'absolute', inset: 0 },
  imgFill: { width: '100%', height: '100%' },
  glow: {
    position: 'absolute', left: '53%', top: '49%', width: '46%', height: '52%',
    transform: 'translate(-50%,-50%) translate(calc(var(--mx, 0) * 16px), calc(var(--my, 0) * 10px))',
    transition: 'transform .25s ease-out', mixBlendMode: 'screen', opacity: 0.6, pointerEvents: 'none',
    background: 'radial-gradient(ellipse 55% 60% at 50% 45%, rgba(255,150,40,.85) 0%, rgba(255,110,20,.45) 32%, rgba(200,60,10,.14) 60%, rgba(0,0,0,0) 78%)',
  },
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
