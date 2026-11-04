// Если крадёте, то крадите ради реально хороших людей
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SkinViewer } from 'skinview3d';

const PHRASES = ['*Осматривается*', '*Ищет баги в этом вайбкодинге*', '*Думает о смысле религии*'];
const PHASE = 4.6;
const APPEAR = 1.4;
const W = 230;
const H = 440;

const ease = (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const lerp = (a, b, k) => a + (b - a) * k;

function pose(phase, t) {
  const p = { hx: 0, hy: 0, hz: 0, by: 0, rax: 0, raz: 0.06, lax: 0, laz: -0.06 };
  if (phase === 0) {
    const s = t < 0.6 ? 0 : t < 1.7 ? 0.95 : t < 2.4 ? 0.95 : t < 3.4 ? -0.95 : 0;
    p.hy = s; p.by = s * 0.22; p.hx = -0.08;
  } else if (phase === 1) {
    p.hx = 0.55; p.hy = Math.sin(t * 3.1) * 0.45; p.hz = 0.12;
    p.rax = -1.15; p.raz = -0.25; p.by = Math.sin(t * 3.1) * 0.08;
  } else {
    p.hx = -0.5; p.hy = 0.25 + Math.sin(t * 0.9) * 0.12; p.hz = -0.1;
    p.lax = -1.5; p.laz = 0.55; p.rax = 0.15;
  }
  return p;
}

export default function HelpBuddy() {
  const ref = useRef(null);
  const [idx, setIdx] = useState(-1);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let viewer; let renderer; let raf = 0; let alive = true;
    try {
      viewer = new SkinViewer({ canvas: document.createElement('canvas'), width: 2, height: 2, renderPaused: true });
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch { return undefined; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H, false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    ['cape', 'elytra', 'ears'].forEach((k) => { if (viewer.playerObject[k]) viewer.playerObject[k].visible = false; });
    const cam = new THREE.PerspectiveCamera(34, W / H, 1, 400);
    cam.position.set(16, 6, 62);
    cam.lookAt(0, -1, 0);
    viewer.globalLight.intensity = 3;
    viewer.cameraLight.intensity = 0.6;
    cam.add(viewer.cameraLight);
    viewer.scene.add(cam);

    const sk = viewer.playerObject.skin;
    const wrap = viewer.playerWrapper;
    const cur = pose(0, 0);
    const start = performance.now();
    let shown = -1;
    viewer.loadSkin('./skins/cnd-guide.png', { model: 'default' });

    const frame = () => {
      if (!alive) return;
      const t = (performance.now() - start) / 1000;
      const a = reduce ? 1 : clamp01(t / APPEAR);
      const e = ease(a);
      wrap.position.y = lerp(-34, 0, e);
      wrap.rotation.y = lerp(-Math.PI * 1.5, 0, reduce ? 1 : clamp01(t / (APPEAR * 0.9)) ** 0.6) - 0.25;
      wrap.scale.setScalar(lerp(0.55, 1, clamp01(e)));

      const lt = Math.max(0, t - APPEAR - 0.2);
      const phase = Math.floor(lt / PHASE) % 3;
      const pt = lt % PHASE;
      const want = t > APPEAR ? pose(phase, pt) : pose(0, 0);
      const k = 0.08;
      Object.keys(cur).forEach((key) => { cur[key] = lerp(cur[key], want[key], k); });
      const breath = Math.sin(t * 2.2);
      sk.head.rotation.set(cur.hx, cur.hy, cur.hz);
      sk.body.rotation.y = cur.by;
      sk.rightArm.rotation.set(cur.rax + breath * 0.03, 0, cur.raz + breath * 0.03);
      sk.leftArm.rotation.set(cur.lax - breath * 0.03, 0, cur.laz - breath * 0.03);
      sk.rightLeg.rotation.set(0, 0, 0.02);
      sk.leftLeg.rotation.set(0, 0, -0.02);
      wrap.position.y += breath * 0.15;

      const next = t > APPEAR + 0.2 ? phase : -1;
      if (next !== shown) { shown = next; setIdx(next); }
      renderer.render(viewer.scene, cam);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { alive = false; cancelAnimationFrame(raf); renderer.dispose(); renderer.forceContextLoss?.(); viewer.dispose(); };
  }, []);

  return (
    <div className="buddy">
      <div className="buddy-say" aria-hidden="true">
        {PHRASES.map((p, i) => <span key={p} className={i === idx ? 'on' : ''}>{p}</span>)}
      </div>
      <canvas ref={ref} className="buddy-canvas" width={W} height={H} />
    </div>
  );
}
