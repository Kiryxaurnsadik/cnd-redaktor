// Если крадёте, то крадите ради реально хороших людей
import { useEffect, useMemo, useRef, useState } from 'react';
import { SkinViewer } from 'skinview3d';
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { ATTACH, DEFAULT_ITEM, DEFAULT_TUNE, ITEMS, disposeItem, makeItem, poseModel, readItemFile } from '../lib/items.js';
import { ARMOR_SETS, ARMOR_SLOTS, DEFAULT_ARMOR, buildArmor, readArmorFile, removeArmor } from '../lib/armor.js';
import { DEFAULT_BODY, TORSO_TYPES, applyBody, resetBody } from '../lib/bodyshape.js';
import { ADAMS_THANKS } from '../lib/brand.js';

const D = Math.PI / 180;
const LIMBS_ALL = ['head', 'rArm', 'lArm', 'rLeg', 'lLeg'];
const P = (head, rArm, lArm, rLeg, lLeg) => ({ head, rArm, lArm, rLeg, lLeg });
export const POSES = {
  stand: { label: 'Стоит', ...P([0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]) },
  mic: { label: 'С микрофоном', ...P([-5, 10, 0], [-80, 0, 15], [0, 0, -5], [0, 0, 0], [0, 0, 0]) },
  point: { label: 'Указывает', ...P([0, -20, 0], [-90, 0, 0], [5, 0, -5], [0, 0, 0], [0, 0, 0]) },
  wave: { label: 'Машет', ...P([-5, -10, 0], [0, 0, 150], [0, 0, -5], [0, 0, 0], [0, 0, 0]) },
  walk: { label: 'Идёт', ...P([0, 0, 0], [30, 0, 0], [-30, 0, 0], [-30, 0, 0], [30, 0, 0]) },
  run: { label: 'Бежит', ...P([10, 0, 0], [70, 0, 0], [-70, 0, 0], [-60, 0, 0], [60, 0, 0]) },
  cross: { label: 'Скрестил руки', ...P([0, 0, 0], [-60, 0, -55], [-60, 0, 55], [0, 0, 0], [0, 0, 0]) },
  up: { label: 'Руки вверх', ...P([-15, 0, 0], [0, 0, 165], [0, 0, -165], [0, 0, 0], [0, 0, 0]) },
  sit: { label: 'Сидит', ...P([5, 0, 0], [-40, 0, 5], [-40, 0, -5], [-90, 0, 10], [-90, 0, -10]) },
  think: { label: 'Думает', ...P([10, -15, 5], [-130, 0, 25], [-40, 0, -35], [0, 0, 0], [0, 0, 0]) },
  hips: { label: 'Руки в боки', ...P([0, 10, 0], [-10, 0, -35], [-10, 0, 35], [0, 0, 5], [0, 0, -5]) },
};

const L = (ambient, camera, key, rim) => ({ ambient, camera, key, rim });
export const LIGHTS = {
  blockbench: { label: 'Blockbench (ровный)', ...L(3, 0.6, null, null) },
  studio: { label: 'Студия', ...L(1.4, 0.2, { c: '#ffffff', i: 1.6, a: 35, h: 35 }, { c: '#cfe2ff', i: 1.2, a: 215, h: 20 }) },
  rim: { label: 'Контровой', ...L(0.8, 0.1, { c: '#ffffff', i: 0.6, a: 15, h: 15 }, { c: '#7fb8ff', i: 3, a: 180, h: 20 }) },
  sunset: { label: 'Закат', ...L(1.2, 0.1, { c: '#ffb46b', i: 2.2, a: -55, h: 18 }, { c: '#ff5e9c', i: 1.4, a: 125, h: 12 }) },
  neon: { label: 'Ночь / неон', ...L(0.6, 0, { c: '#3fa7ff', i: 2.4, a: -55, h: 12 }, { c: '#ff2fd1', i: 2.4, a: 105, h: 12 }) },
  noir: { label: 'Нуар', ...L(0.35, 0, { c: '#ffffff', i: 2.8, a: 80, h: 22 }, null) },
};
const NO_LIGHT = { c: '#ffffff', i: 0, a: 0, h: 20 };
const lightCfg = (k) => { const l = LIGHTS[k]; return { ambient: l.ambient, camera: l.camera, key: { ...(l.key || NO_LIGHT) }, rim: { ...(l.rim || NO_LIGHT) } }; };
const dirPos = ({ a, h }) => { const r = 60; return [Math.sin(a * D) * Math.cos(h * D) * r, Math.sin(h * D) * r, Math.cos(a * D) * Math.cos(h * D) * r]; };

const PART = { head: 'head', rArm: 'rightArm', lArm: 'leftArm', rLeg: 'rightLeg', lLeg: 'leftLeg' };
function applyPose(skin, p) {
  for (const [k, part] of Object.entries(PART)) {
    const o = skin[part]; if (!o) continue;
    o.userData.limb = k;
    if (!o.userData.basePos) o.userData.basePos = o.position.clone();
    o.rotation.set(p[k][0] * D, p[k][1] * D, p[k][2] * D);
    const off = p.pos?.[k] || [0, 0, 0];
    o.position.set(o.userData.basePos.x + off[0], o.userData.basePos.y + off[1], o.userData.basePos.z + off[2]);
  }
}

function Range({ label, value, min, max, step = 1, unit = '', onChange }) {
  return (
    <div className="rng">
      <label>{label}<span>{Math.round(value * 100) / 100}{unit}</span></label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export default function SkinPoser({ skin, onInsert, onClose, mode: initialMode = 'body' }) {
  const canvasRef = useRef(null);
  const viewerRef = useRef(null);
  const lightsRef = useRef([]);
  const [pose, setPose] = useState(structuredClone(POSES.stand));
  const [light, setLight] = useState('studio');
  const [lcfg, setLcfg] = useState(lightCfg('studio'));
  const [look, setLook] = useState({ brightness: 1, contrast: 1, saturate: 1 });
  const [model, setModel] = useState('auto-detect');
  const [error, setError] = useState('');
  const [mode, setMode] = useState(initialMode);
  const [items, setItems] = useState(() => (initialMode === 'head' ? [] : [newItem(DEFAULT_ITEM, 'rightArm')]));
  const [active, setActive] = useState(0);
  const [info, setInfo] = useState({});
  const [playing, setPlaying] = useState(false);
  const [armor, setArmor] = useState(DEFAULT_ARMOR);
  const objs = useRef(new Map());
  const clock = useRef(0);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [limb, setLimb] = useState('rArm');
  const [tool, setTool] = useState('rotate');
  const [space, setSpace] = useState('local');
  const [shading, setShading] = useState('material');
  const tcRef = useRef(null);

  useEffect(() => {
    const viewer = new SkinViewer({
      canvas: canvasRef.current, width: 520, height: 520, preserveDrawingBuffer: true,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
    });
    viewer.zoom = 0.85;
    viewer.fov = 40;
    viewer.camera.position.set(25, 12, 50);
    viewer.controls.enableZoom = true;
    viewer.controls.enableDamping = false;
    viewer.controls.enablePan = true;
    viewer.controls.screenSpacePanning = true;
    viewer.controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN };
    viewer.controls.rotateSpeed = 0.9;
    canvasRef.current.addEventListener('contextmenu', (e) => e.preventDefault());
    viewerRef.current = viewer;
    let raf = 0;
    const pause = () => { viewer.renderPaused = true; };
    const wake = () => { viewer.renderPaused = false; clearTimeout(raf); raf = setTimeout(pause, 400); };
    viewerRef.current.wake = wake;
    canvasRef.current.addEventListener('pointerdown', () => { viewer.renderPaused = false; clearTimeout(raf); });
    window.addEventListener('pointerup', wake);
    canvasRef.current.addEventListener('wheel', wake, { passive: true });
    wake();
    const mk = (m) => {
      const tc = new TransformControls(viewer.camera, canvasRef.current);
      tc.setMode(m); tc.size = 0.9;
      tc.addEventListener('dragging-changed', (e) => { viewer.controls.enabled = !e.value; viewer.renderPaused = false; if (!e.value) wake(); });
      tc.addEventListener('change', () => { viewer.renderPaused = false; clearTimeout(raf); raf = setTimeout(pause, 400); });
      tc.addEventListener('objectChange', () => {
        const o = tc.object; const k = o?.userData?.limb; if (!k) return;
        const r1 = (x) => Math.round(x * 10) / 10;
        const rot = [r1(o.rotation.x / D), r1(o.rotation.y / D), r1(o.rotation.z / D)];
        const b = o.userData.basePos;
        const off = [r1(o.position.x - b.x), r1(o.position.y - b.y), r1(o.position.z - b.z)];
        setPose((p) => ({ ...p, [k]: rot, pos: { ...(p.pos || {}), [k]: off } }));
      });
      viewer.scene.add(tc);
      return tc;
    };
    tcRef.current = { rotate: mk('rotate'), move: mk('translate') };
    const ray = new THREE.Raycaster(); let down = null;
    const onDown = (e) => { down = [e.clientX, e.clientY]; };
    const onUp = (e) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 4) return;
      const tcs = tcRef.current; if (tcs.rotate.dragging || tcs.move.dragging || tcs.rotate.axis || tcs.move.axis) return;
      const r = canvasRef.current.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), viewer.camera);
      const hit = ray.intersectObject(viewer.playerObject, true).find((h) => h.object.visible);
      let o = hit?.object; while (o && !o.userData?.limb) o = o.parent;
      if (o) setLimb(o.userData.limb);
    };
    canvasRef.current.addEventListener('pointerdown', onDown);
    canvasRef.current.addEventListener('pointerup', onUp);
    return () => { clearTimeout(raf); Object.values(tcRef.current || {}).forEach((tc) => { tc.detach(); tc.dispose(); }); window.removeEventListener('pointerup', wake); resetBody(viewer.playerObject?.skin); viewer.dispose(); };
  }, []);
  const redraw = () => viewerRef.current?.wake?.();

  useEffect(() => {
    const v = viewerRef.current; if (!v) return;
    Promise.resolve(v.loadSkin(skin, { model })).then(() => { applyBody(v.playerObject.skin, body); redraw(); })
      .catch(() => setError('Не удалось загрузить скин'));
  }, [skin, model]);

  useEffect(() => { const v = viewerRef.current; if (v) { applyPose(v.playerObject.skin, pose); redraw(); } }, [pose]);
  useEffect(() => { const v = viewerRef.current; if (v) { applyBody(v.playerObject.skin, body); redraw(); } }, [body]);

  useEffect(() => {
    const v = viewerRef.current; const tcs = tcRef.current; if (!v || !tcs) return;
    const part = v.playerObject?.skin?.[PART[LIMBS_ALL.includes(limb) && (mode === 'body' || limb === 'head') ? limb : 'head']];
    const want = { rotate: tool === 'rotate' || tool === 'transform', move: tool === 'move' || tool === 'transform' };
    for (const [k, tc] of Object.entries(tcs)) {
      tc.setSpace(space === 'global' ? 'world' : 'local');
      if (want[k] && part) { if (tc.object !== part) tc.attach(part); tc.visible = true; tc.enabled = true; } else { tc.detach(); }
      if (k === 'rotate') tc.size = tool === 'transform' ? 1.15 : 0.9;
    }
    redraw();
  }, [tool, space, limb, mode, skin, model]);

  const applyLights = (cfg) => {
    const v = viewerRef.current; if (!v) return;
    lightsRef.current.forEach((l) => { v.scene.remove(l); l.dispose?.(); });
    lightsRef.current = [];
    v.globalLight.intensity = cfg.ambient;
    v.cameraLight.intensity = cfg.camera;
    [cfg.key, cfg.rim].filter((d) => d && d.i > 0).forEach((d) => {
      const dl = new THREE.DirectionalLight(d.c, d.i); dl.position.set(...dirPos(d)); v.scene.add(dl); lightsRef.current.push(dl);
    });
  };
  const setWire = (on) => {
    const v = viewerRef.current; if (!v) return;
    v.playerObject.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { m.wireframe = on; }); });
  };
  const shadeLights = (sh, cfg) => (sh === 'wire' || sh === 'solid' ? { ambient: 3, camera: 0.6, key: null, rim: null } : cfg);
  useEffect(() => {
    const v = viewerRef.current; if (!v) return;
    applyLights(shadeLights(shading, lcfg));
    setWire(shading === 'wire');
    const pr = shading === 'rendered' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    if (v.renderer.getPixelRatio() !== pr) { v.renderer.setPixelRatio(pr); v.renderer.setSize(v.width, v.height, false); }
    redraw();
  }, [lcfg, shading, skin, model, items, armor]);

  const whereOf = (it) => (mode === 'head' ? 'head' : it.where);
  const keyOf = (it) => `${it.kind}|${it.custom?.uid || ''}|${it.custom?.grip || ''}|${whereOf(it)}`;

  const applyTune = (g, t) => {
    if (!g) return;
    const b = g.userData.base;
    g.position.set(b.x + t.x, b.y + t.y, b.z + t.z);
    g.rotation.set(t.rx * D, t.ry * D, t.rz * D);
    g.scale.setScalar(t.s || 1);
  };

  useEffect(() => {
    const v = viewerRef.current; if (!v) return;
    const map = objs.current;
    const ids = new Set(items.map((it) => it.id));
    for (const [id, o] of map) {
      if (!ids.has(id)) { o.g?.parent?.remove(o.g); disposeItem(o.g); map.delete(id); }
    }
    items.forEach((it) => {
      const key = keyOf(it);
      const o = map.get(it.id);
      if (o && o.key === key) {
        if (o.g) { applyTune(o.g, it.tune); if (!playing) poseModel(o.g.userData.model, it.anim, it.time); }
        return;
      }
      if (o?.g) { o.g.parent?.remove(o.g); disposeItem(o.g); }
      map.set(it.id, { key, g: null });
      makeItem(it.kind, it.custom, whereOf(it), DEFAULT_TUNE).then((g) => {
        const cur = map.get(it.id);
        if (!cur || cur.key !== key) { disposeItem(g); return; }
        if (!g) { redraw(); return; }
        g.userData.base = g.position.clone();
        v.playerObject.skin[whereOf(it)].add(g);
        cur.g = g; setError('');
        const latest = itemsRef.current.find((x) => x.id === it.id) || it;
        applyTune(g, latest.tune);
        const m = g.userData.model;
        poseModel(m, latest.anim, latest.time);
        setInfo((inf) => ({ ...inf, [it.id]: { anims: (m?.animations || []).map((a) => ({ name: a.name, length: a.length })), animTex: !!m?.animTextures?.length } }));
        redraw();
      }).catch((e) => { const cur = map.get(it.id); if (cur && cur.key === key) map.delete(it.id); setError(e.message || 'Не удалось собрать предмет'); });
    });
    redraw();
  }, [items, mode, skin, model]);
  const itemsRef = useRef(items); itemsRef.current = items;
  useEffect(() => () => { objs.current.forEach((o) => disposeItem(o.g)); objs.current.clear(); }, []);

  useEffect(() => {
    if (!playing) return undefined;
    const v = viewerRef.current; if (!v) return undefined;
    let raf = 0; const start = performance.now() - clock.current * 1000;
    const tick = () => {
      const t = (performance.now() - start) / 1000; clock.current = t;
      itemsRef.current.forEach((it) => { const o = objs.current.get(it.id); if (o?.g) poseModel(o.g.userData.model, it.anim, t); });
      v.renderPaused = false;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); redraw(); };
  }, [playing]);
  const togglePlay = () => {
    if (playing) { const t = clock.current; setItems((l) => l.map((it) => ({ ...it, time: t }))); }
    else clock.current = items[active]?.time || 0;
    setPlaying((p) => !p);
  };

  useEffect(() => {
    const v = viewerRef.current; if (!v) return undefined;
    let alive = true;
    buildArmor(v.playerObject.skin, armor).then(() => alive && redraw()).catch((e) => setError(e.message || 'Не удалось надеть броню'));
    return () => { alive = false; };
  }, [armor, skin, model]);
  useEffect(() => () => removeArmor(viewerRef.current?.playerObject?.skin), []);

  const cur = items[active] || null;
  const patchCur = (p) => setItems((l) => l.map((it, i) => (i === active ? { ...it, ...(typeof p === 'function' ? p(it) : p) } : it)));
  const setTune = (fn) => patchCur((it) => ({ tune: typeof fn === 'function' ? fn(it.tune) : fn }));
  const tune = cur?.tune || DEFAULT_TUNE;
  const addItem = () => { setItems((l) => [...l, newItem('camera', mode === 'head' ? 'head' : (l.some((x) => x.where === 'rightArm') ? 'leftArm' : 'rightArm'))]); setActive(items.length); };
  const removeItem = (i) => { setItems((l) => l.filter((_, j) => j !== i)); setActive((a) => Math.max(0, a >= i ? a - 1 : a)); };

  const pickItemFile = async (file) => {
    if (!file) return;
    try {
      const it = await readItemFile(file);
      it.uid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      if (!items.length) { setItems([{ ...newItem('custom', mode === 'head' ? 'head' : 'rightArm'), custom: it }]); setActive(0); }
      else patchCur({ kind: 'custom', custom: it, tune: { ...DEFAULT_TUNE }, anim: -1, time: 0 });
      setError('');
    } catch (e) { setError(e.message || 'Не удалось прочитать предмет'); }
  };
  const pickArmorFile = async (file, layer) => {
    if (!file) return;
    try { const url = await readArmorFile(file); setArmor((a) => ({ ...a, [layer === 2 ? 'custom2' : 'custom1']: url })); setError(''); }
    catch (e) { setError(e.message || 'Не удалось прочитать текстуру'); }
  };

  useEffect(() => {
    const v = viewerRef.current; if (!v) return;
    const head = mode === 'head';
    const sk = v.playerObject.skin;
    ['body', 'rightArm', 'leftArm', 'rightLeg', 'leftLeg'].forEach((k) => { if (sk[k]) sk[k].visible = !head; });
    ['cape', 'elytra', 'ears'].forEach((k) => { if (v.playerObject[k]) v.playerObject[k].visible = false; });
    v.playerObject.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(head ? sk.head : v.playerObject);
    const c = box.getCenter(new THREE.Vector3());
    v.controls.target.copy(c);
    if (head) v.camera.position.set(c.x + 14, c.y + 8, c.z + 20);
    else v.camera.position.set(25, 12, 50);
    v.controls.update(); redraw();
  }, [mode, skin, model]);

  const VIEWS = { front: ['Спереди', 0, 0], side: ['Сбоку', 90, 0], back: ['Сзади', 180, 0], top: ['Сверху', 0, 89], tq: ['3/4', 35, 15] };
  const setView = (k) => {
    const v = viewerRef.current; if (!v) return;
    const [, az, el] = VIEWS[k];
    const t = v.controls.target; const r = v.camera.position.distanceTo(t);
    v.camera.position.set(t.x + Math.sin(az * D) * Math.cos(el * D) * r, t.y + Math.sin(el * D) * r, t.z + Math.cos(az * D) * Math.cos(el * D) * r);
    v.controls.update(); redraw();
  };
  const resetView = () => {
    const v = viewerRef.current; if (!v) return;
    const box = new THREE.Box3().setFromObject(mode === 'head' ? v.playerObject.skin.head : v.playerObject);
    const c = box.getCenter(new THREE.Vector3()); v.controls.target.copy(c);
    if (mode === 'head') v.camera.position.set(c.x + 14, c.y + 8, c.z + 20); else v.camera.position.set(25, 12, 50);
    v.controls.update(); redraw();
  };
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const map = { Numpad1: 'front', Numpad3: 'side', Numpad7: 'top', Numpad9: 'back', Numpad5: 'tq' };
      if (map[e.code]) { e.preventDefault(); setView(map[e.code]); }
      const tk = { KeyG: 'move', KeyR: 'rotate', KeyT: 'transform', KeyQ: 'none' }[e.code];
      if (tk && !e.ctrlKey && !e.metaKey) { e.preventDefault(); setTool(tk); }
      if (e.code === 'KeyZ' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); setShading((x) => ({ wire: 'solid', solid: 'material', material: 'rendered', rendered: 'wire' }[x])); }
      if (e.code === 'Numpad0' || e.code === 'Home') { e.preventDefault(); resetView(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const pickLight = (k) => { setLight(k); setLcfg(lightCfg(k)); };
  const setL = (part, key, val) => setLcfg((c) => (part ? { ...c, [part]: { ...c[part], [key]: val } } : { ...c, [key]: val }));

  const filter = useMemo(() => `brightness(${look.brightness}) contrast(${look.contrast}) saturate(${look.saturate})`, [look]);

  const set = (part, i, val) => setPose((p) => ({ ...p, [part]: p[part].map((x, j) => (j === i ? Number(val) : x)) }));

  const render = () => {
    const v = viewerRef.current;
    const size = 1200;
    const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1); r.setSize(size, size, false); r.setClearColor(0x000000, 0);
    r.outputColorSpace = THREE.LinearSRGBColorSpace;
    const bg = v.scene.background; v.scene.background = null;
    const tcs = Object.values(tcRef.current || {}); const vis = tcs.map((t) => t.visible); tcs.forEach((t) => { t.visible = false; });
    applyLights(lcfg); setWire(false);
    const cam = v.camera.clone(); cam.aspect = 1; cam.updateProjectionMatrix();
    r.render(v.scene, cam);
    v.scene.background = bg;
    tcs.forEach((t, i) => { t.visible = vis[i]; });
    applyLights(shadeLights(shading, lcfg)); setWire(shading === 'wire'); redraw();
    const url = trim(r.domElement, filter);
    r.dispose();
    onInsert(url, mode);
  };

  const LIMBS = mode === 'head' ? { head: 'Голова' } : { head: 'Голова', rArm: 'Правая рука', lArm: 'Левая рука', rLeg: 'Правая нога', lLeg: 'Левая нога' };
  const curLimb = LIMBS[limb] ? limb : 'head';
  const axes = curLimb === 'head'
    ? [['Вверх / вниз', 0, -80, 80], ['Влево / вправо', 1, -90, 90], ['Наклон набок', 2, -45, 45]]
    : [['Вперёд / назад', 0, -180, 180], ['В сторону', 2, -180, 180], ['Вращение', 1, -180, 180]];
  const sb = (k, v) => setBody((b) => ({ ...b, [k]: v }));

  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal poser-modal">
        <div className="row" style={{ marginBottom: 10 }}>
          <h2 className="grow" style={{ margin: 0 }}>{mode === 'head' ? '3D-голова' : '3D-персонаж'}: поза и свет</h2>
          <div className="seg">
            <button className={mode === 'body' ? 'on' : ''} onClick={() => setMode('body')}>Персонаж</button>
            <button className={mode === 'head' ? 'on' : ''} onClick={() => setMode('head')}>Только голова</button>
          </div>
          <button onClick={onClose}>Закрыть</button>
        </div>
        <div className="poser">
          <div className="poser-view">
            <div className="bl-bar">
              <div className="seg" title="Инструмент (G — перемещение, R — поворот, T — оба)">
                {[['none', '⬚', 'Выбор'], ['move', '✥', 'Move'], ['rotate', '⟳', 'Rotate'], ['transform', '✥⟳', 'Transform']].map(([k, ic, l]) => (
                  <button key={k} className={tool === k ? 'on' : ''} onClick={() => setTool(k)} title={l}>{ic} <span className="lbl">{l}</span></button>
                ))}
              </div>
              <label className="bl-sel" title="Ориентация преобразования">
                <span className="small muted">Ориентация</span>
                <select value={space} onChange={(e) => setSpace(e.target.value)}>
                  <option value="global">Global</option>
                  <option value="local">Local</option>
                </select>
              </label>
              <div className="seg bl-shade" title="Viewport Shading (Z)">
                {[['wire', '◌', 'Wireframe'], ['solid', '●', 'Solid'], ['material', '◐', 'Material Preview'], ['rendered', '◉', 'Rendered']].map(([k, ic, l]) => (
                  <button key={k} className={shading === k ? 'on' : ''} onClick={() => setShading(k)} title={l}>{ic}</button>
                ))}
              </div>
            </div>
            <canvas ref={canvasRef} style={{ filter: shading === 'rendered' || shading === 'material' ? filter : 'none' }} />
            <div className="views">
              {Object.entries(VIEWS).map(([k, [l]]) => <button key={k} className="small" onClick={() => setView(k)}>{l}</button>)}
              <button className="small" onClick={resetView}>Сброс</button>
            </div>
            <p className="small muted">Как в Blender: щёлкните по части тела, чтобы выбрать её. Тяните стрелки, чтобы двигать, и цветные дуги, чтобы вращать; белый круг вращает относительно экрана. G, R, T меняют инструмент, Z — режим отображения. Solid и Wireframe легче для видеокарты, картинка всё равно сохраняется в полном качестве. Как в Blockbench: левая кнопка мыши крутит, правая или колёсико двигают, прокрутка приближает. Клавиши Num 1, 3, 7, 9 — виды спереди, сбоку, сверху, сзади.</p>
            <p className="small muted thanks">{ADAMS_THANKS}</p>
          </div>
          <div className="poser-side">
            <details open className="pgroup">
              <summary>Поза</summary>
              {mode === 'body' && (
                <select onChange={(e) => setPose(structuredClone(POSES[e.target.value]))} defaultValue="stand">
                  {Object.entries(POSES).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
                </select>
              )}
              <div className="chips">
                {Object.entries(LIMBS).map(([k, l]) => <button key={k} className={curLimb === k ? 'on' : ''} onClick={() => setLimb(k)}>{l}</button>)}
              </div>
              {axes.map(([label, i, min, max]) => (
                <Range key={`${curLimb}${i}`} label={label} value={pose[curLimb][i]} min={min} max={max} unit="°" onChange={(v) => set(curLimb, i, v)} />
              ))}
              <button className="small ghost" onClick={() => setPose((p) => ({ ...p, [curLimb]: [0, 0, 0], pos: { ...(p.pos || {}), [curLimb]: [0, 0, 0] } }))}>Сбросить «{LIMBS[curLimb]}»</button>
            </details>

            <details open className="pgroup">
              <summary>Предметы</summary>
              <div className="chips item-chips">
                {items.map((it, i) => (
                  <span key={it.id} className={`item-chip ${i === active ? 'on' : ''}`}>
                    <button onClick={() => setActive(i)}>{it.kind === 'custom' ? (it.custom?.name || 'Свой') : ITEMS[it.kind]}</button>
                    <button className="x" aria-label="Убрать предмет" title="Убрать" onClick={() => removeItem(i)}>×</button>
                  </span>
                ))}
                <button onClick={addItem}>+ Предмет</button>
              </div>
              {!items.length && <p className="small muted" style={{ margin: '4px 0 0' }}>Предметов нет. Нажмите «+ Предмет», можно добавить несколько: в обе руки и на голову.</p>}
              <input id="item-file" type="file" accept=".bbmodel,.png,image/png,application/json" hidden onChange={(e) => { pickItemFile(e.target.files[0]); e.target.value = ''; }} />
              {cur && (<>
                <select value={cur.kind} onChange={(e) => { const k = e.target.value; if (k === 'custom' && !cur.custom) { document.getElementById('item-file').click(); return; } patchCur({ kind: k, tune: { ...DEFAULT_TUNE }, anim: -1, time: 0 }); }}>
                  {Object.entries(ITEMS).filter(([k]) => k !== 'none').map(([k, l]) => <option key={k} value={k}>{k === 'custom' && cur.custom ? `Свой: ${cur.custom.name}` : l}</option>)}
                </select>
                {cur.kind === 'custom' && (
                  <div className="row" style={{ marginTop: 6, gap: 6, flexWrap: 'wrap' }}>
                    <button className="small" onClick={() => document.getElementById('item-file').click()}>Загрузить другой…</button>
                    {cur.custom?.type === 'png' && (
                      <div className="seg">
                        <button className={cur.custom.grip !== 'generated' ? 'on' : ''} onClick={() => patchCur({ custom: { ...cur.custom, grip: 'handheld' } })} title="Как меч или кирка">Инструмент</button>
                        <button className={cur.custom.grip === 'generated' ? 'on' : ''} onClick={() => patchCur({ custom: { ...cur.custom, grip: 'generated' } })} title="Как яблоко или книга">Предмет</button>
                      </div>
                    )}
                  </div>
                )}
                {cur.kind === 'custom' && <p className="small muted" style={{ margin: '4px 0 0' }}>Модель .bbmodel из Blockbench (с группами, анимациями и несколькими текстурами) или PNG предмета (16×16).</p>}
                {mode === 'body' && (
                  <div className="seg" style={{ marginTop: 6 }}>
                    {Object.entries(ATTACH).map(([k, l]) => <button key={k} className={cur.where === k ? 'on' : ''} onClick={() => patchCur({ where: k, tune: { ...DEFAULT_TUNE } })}>{l}</button>)}
                  </div>
                )}
                {(!!info[cur.id]?.anims?.length || info[cur.id]?.animTex) && (
                  <div className="anim-box">
                    {!!info[cur.id]?.anims?.length && (<>
                      <label>Анимация из Blockbench</label>
                      <select value={cur.anim} onChange={(e) => patchCur({ anim: Number(e.target.value), time: 0 })}>
                        <option value={-1}>Без анимации (как в модели)</option>
                        {info[cur.id].anims.map((a, i) => <option key={i} value={i}>{a.name}</option>)}
                      </select>
                      {cur.anim >= 0 && !playing && <Range label="Кадр анимации" value={cur.time} min={0} max={info[cur.id].anims[cur.anim]?.length || 1} step={0.05} unit=" с" onChange={(t) => patchCur({ time: t })} />}
                    </>)}
                    <button className="small" onClick={togglePlay}>{playing ? '❚❚ Стоп (запомнить кадр)' : '▶ Проиграть'}</button>
                    {info[cur.id]?.animTex && <span className="small muted"> Анимированная текстура тоже двигается.</span>}
                  </div>
                )}
                <details style={{ marginTop: 8 }}>
                  <summary>Положение предмета</summary>
                  <Range label="Вперёд / назад" value={tune.z} min={-12} max={12} step={0.5} unit=" px" onChange={(v) => setTune((t) => ({ ...t, z: v }))} />
                  <Range label="Вверх / вниз" value={tune.y} min={-12} max={12} step={0.5} unit=" px" onChange={(v) => setTune((t) => ({ ...t, y: v }))} />
                  <Range label="Влево / вправо" value={tune.x} min={-12} max={12} step={0.5} unit=" px" onChange={(v) => setTune((t) => ({ ...t, x: v }))} />
                  <Range label="Наклон" value={tune.rx} min={-180} max={180} step={5} unit="°" onChange={(v) => setTune((t) => ({ ...t, rx: v }))} />
                  <Range label="Поворот" value={tune.ry} min={-180} max={180} step={5} unit="°" onChange={(v) => setTune((t) => ({ ...t, ry: v }))} />
                  <Range label="Крен" value={tune.rz} min={-180} max={180} step={5} unit="°" onChange={(v) => setTune((t) => ({ ...t, rz: v }))} />
                  <Range label="Размер" value={tune.s} min={0.3} max={2.5} step={0.05} unit="×" onChange={(v) => setTune((t) => ({ ...t, s: v }))} />
                  <button className="small" onClick={() => setTune({ ...DEFAULT_TUNE })}>Сбросить положение</button>
                </details>
              </>)}
            </details>

            <details className="pgroup">
              <summary>Броня</summary>
              {Object.entries(ARMOR_SLOTS).filter(([k]) => mode === 'body' || k === 'helmet').map(([slot, label]) => (
                <div key={slot} className="armor-row">
                  <span>{label}</span>
                  <select value={armor[slot]} onChange={(e) => setArmor((a) => ({ ...a, [slot]: e.target.value }))}>
                    {Object.entries(ARMOR_SETS).map(([k, st]) => <option key={k} value={k}>{st.label}</option>)}
                  </select>
                </div>
              ))}
              <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                <button className="small" onClick={() => setArmor((a) => ({ ...a, ...Object.fromEntries(Object.keys(ARMOR_SLOTS).map((k) => [k, 'iron'])) }))}>Весь комплект: железо</button>
                <button className="small" onClick={() => setArmor((a) => ({ ...a, ...Object.fromEntries(Object.keys(ARMOR_SLOTS).map((k) => [k, 'none'])) }))}>Снять всё</button>
              </div>
              {Object.keys(ARMOR_SLOTS).some((k) => armor[k] === 'leather') && (
                <div className="light-row"><b>Цвет кожи</b><input type="color" value={armor.color} onChange={(e) => setArmor((a) => ({ ...a, color: e.target.value }))} /></div>
              )}
              {Object.keys(ARMOR_SLOTS).some((k) => armor[k] === 'custom') && (<>
                <p className="small muted" style={{ margin: '6px 0 0' }}>Текстуры как в ресурспаке Minecraft: слой 1 (layer_1) — шлем, нагрудник и ботинки; слой 2 (layer_2) — поножи. Размер 64×32 или больше.</p>
                <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  <button className="small" onClick={() => document.getElementById('armor-1').click()}>{armor.custom1 ? 'Слой 1 ✓' : 'Загрузить слой 1…'}</button>
                  <button className="small" onClick={() => document.getElementById('armor-2').click()}>{armor.custom2 ? 'Слой 2 ✓' : 'Загрузить слой 2…'}</button>
                </div>
                <input id="armor-1" type="file" accept="image/png" hidden onChange={(e) => { pickArmorFile(e.target.files[0], 1); e.target.value = ''; }} />
                <input id="armor-2" type="file" accept="image/png" hidden onChange={(e) => { pickArmorFile(e.target.files[0], 2); e.target.value = ''; }} />
              </>)}
            </details>

            {mode === 'body' && (
              <details className="pgroup">
                <summary>Тело: грудь и торс</summary>
                <p className="small muted" style={{ marginTop: 0 }}>Как в Puberty Gender Mod. Грудь берёт текстуру с груди скина.</p>
                <Range label="Размер груди" value={Math.round(body.bust * 100)} min={0} max={100} unit="%" onChange={(v) => sb('bust', v / 100)} />
                {body.bust > 0 && <>
                  <Range label="Расстояние" value={body.separation} min={-1} max={1} step={0.05} onChange={(v) => sb('separation', v)} />
                  <Range label="Высота" value={body.height} min={-1} max={1} step={0.05} onChange={(v) => sb('height', v)} />
                  <Range label="Глубина" value={body.depth} min={-1} max={1} step={0.05} onChange={(v) => sb('depth', v)} />
                  <Range label="Поворот" value={body.rotation} min={0} max={25} unit="°" onChange={(v) => sb('rotation', v)} />
                  <label className="row" style={{ gap: 8 }}><input type="checkbox" style={{ width: 'auto' }} checked={body.overlay} onChange={(e) => sb('overlay', e.target.checked)} /> Второй слой скина (куртка)</label>
                </>}
                <label>Форма тела</label>
                <select value={body.torso} onChange={(e) => sb('torso', e.target.value)}>
                  {Object.entries(TORSO_TYPES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
                </select>
                {body.torso !== 'neutral' && <Range label="Сила формы" value={Math.round(body.strength * 100)} min={0} max={100} unit="%" onChange={(v) => sb('strength', v / 100)} />}
                <button className="small ghost" onClick={() => setBody(DEFAULT_BODY)}>Обычное тело</button>
              </details>
            )}

            <details open className="pgroup">
              <summary>Свет и картинка</summary>
              <select value={light} onChange={(e) => pickLight(e.target.value)}>
                {Object.entries(LIGHTS).map(([k, l]) => <option key={k} value={k}>{l.label}</option>)}
              </select>
              <Range label="Яркость" value={look.brightness} min={0.4} max={1.8} step={0.05} unit="×" onChange={(v) => setLook((l) => ({ ...l, brightness: v }))} />
              <Range label="Контраст" value={look.contrast} min={0.4} max={1.8} step={0.05} unit="×" onChange={(v) => setLook((l) => ({ ...l, contrast: v }))} />
              <Range label="Насыщенность" value={look.saturate} min={0} max={2} step={0.05} unit="×" onChange={(v) => setLook((l) => ({ ...l, saturate: v }))} />
              <details style={{ marginTop: 6 }}>
                <summary>Настройка света студии</summary>
                <Range label="Общий свет" value={lcfg.ambient} min={0} max={4} step={0.05} onChange={(v) => setL(null, 'ambient', v)} />
                <Range label="Свет от камеры" value={lcfg.camera} min={0} max={2} step={0.05} onChange={(v) => setL(null, 'camera', v)} />
                <div className="light-row"><b>Основной</b><input type="color" value={lcfg.key.c} onChange={(e) => setL('key', 'c', e.target.value)} /></div>
                <Range label="Сила" value={lcfg.key.i} min={0} max={5} step={0.05} onChange={(v) => setL('key', 'i', v)} />
                <Range label="С какой стороны" value={lcfg.key.a} min={-180} max={180} step={5} unit="°" onChange={(v) => setL('key', 'a', v)} />
                <Range label="Высота" value={lcfg.key.h} min={-60} max={89} step={1} unit="°" onChange={(v) => setL('key', 'h', v)} />
                <div className="light-row"><b>Контровой</b><input type="color" value={lcfg.rim.c} onChange={(e) => setL('rim', 'c', e.target.value)} /></div>
                <Range label="Сила" value={lcfg.rim.i} min={0} max={5} step={0.05} onChange={(v) => setL('rim', 'i', v)} />
                <Range label="С какой стороны" value={lcfg.rim.a} min={-180} max={180} step={5} unit="°" onChange={(v) => setL('rim', 'a', v)} />
                <Range label="Высота" value={lcfg.rim.h} min={-60} max={89} step={1} unit="°" onChange={(v) => setL('rim', 'h', v)} />
              </details>
              <label>Модель рук</label>
              <select value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="auto-detect">Определить автоматически</option>
                <option value="default">Классические (Steve)</option>
                <option value="slim">Тонкие (Alex)</option>
              </select>
            </details>
            {error && <div className="error">{error}</div>}
            <button className="primary poser-insert" onClick={render}>Вставить на холст</button>
          </div>
        </div>
      </div>
    </div>
  );
}

let itemSeq = 0;
function newItem(kind, where) {
  itemSeq += 1;
  return { id: `it${Date.now().toString(36)}${itemSeq}`, kind, custom: null, where, tune: { ...DEFAULT_TUNE }, anim: -1, time: 0 };
}

function trim(src, filter) {
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (filter) ctx.filter = filter;
  ctx.drawImage(src, 0, 0); ctx.filter = 'none';
  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
  let x0 = width, y0 = height, x1 = 0, y1 = 0;
  for (let y = 0; y < height; y += 2) for (let x = 0; x < width; x += 2) {
    if (data[(y * width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
  }
  if (x1 <= x0) return c.toDataURL('image/png');
  const pad = 8; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(width, x1 + pad); y1 = Math.min(height, y1 + pad);
  const o = document.createElement('canvas'); o.width = x1 - x0; o.height = y1 - y0;
  o.getContext('2d').drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
  return o.toDataURL('image/png');
}
