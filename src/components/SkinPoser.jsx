// Если крадёте, то крадите ради реально хороших людей
import { useEffect, useMemo, useRef, useState } from 'react';
import { SkinViewer } from 'skinview3d';
import * as THREE from 'three';
import { ATTACH, DEFAULT_ITEM, DEFAULT_TUNE, ITEMS, disposeItem, makeItem, readItemFile } from '../lib/items.js';
import { DEFAULT_BODY, TORSO_TYPES, applyBody, resetBody } from '../lib/bodyshape.js';
import { ADAMS_THANKS } from '../lib/brand.js';

const D = Math.PI / 180;
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

function applyPose(skin, p) {
  skin.head.rotation.set(p.head[0] * D, p.head[1] * D, p.head[2] * D);
  skin.rightArm.rotation.set(p.rArm[0] * D, p.rArm[1] * D, p.rArm[2] * D);
  skin.leftArm.rotation.set(p.lArm[0] * D, p.lArm[1] * D, p.lArm[2] * D);
  skin.rightLeg.rotation.set(p.rLeg[0] * D, p.rLeg[1] * D, p.rLeg[2] * D);
  skin.leftLeg.rotation.set(p.lLeg[0] * D, p.lLeg[1] * D, p.lLeg[2] * D);
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
  const [item, setItem] = useState(initialMode === 'head' ? 'none' : DEFAULT_ITEM);
  const [hand, setHand] = useState(initialMode === 'head' ? 'head' : 'rightArm');
  const [customItem, setCustomItem] = useState(null);
  const [tune, setTune] = useState(DEFAULT_TUNE);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [limb, setLimb] = useState('rArm');
  const itemRef = useRef(null);

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
    return () => { clearTimeout(raf); window.removeEventListener('pointerup', wake); resetBody(viewer.playerObject?.skin); viewer.dispose(); };
  }, []);
  const redraw = () => viewerRef.current?.wake?.();

  useEffect(() => {
    const v = viewerRef.current; if (!v) return;
    Promise.resolve(v.loadSkin(skin, { model })).then(() => { applyBody(v.playerObject.skin, body); redraw(); })
      .catch(() => setError('Не удалось загрузить скин'));
  }, [skin, model]);

  useEffect(() => { const v = viewerRef.current; if (v) { applyPose(v.playerObject.skin, pose); redraw(); } }, [pose]);
  useEffect(() => { const v = viewerRef.current; if (v) { applyBody(v.playerObject.skin, body); redraw(); } }, [body]);

  const where = mode === 'head' ? 'head' : hand;
  useEffect(() => {
    let alive = true;
    const v = viewerRef.current; if (!v) return undefined;
    makeItem(item, customItem, where, DEFAULT_TUNE).then((g) => {
      if (!alive) { disposeItem(g); return; }
      const old = itemRef.current;
      if (old) { old.parent?.remove(old); disposeItem(old); itemRef.current = null; }
      if (!g) { redraw(); return; }
      g.userData.base = g.position.clone();
      v.playerObject.skin[where].add(g); itemRef.current = g; setError('');
      applyTune(g, tune); redraw();
    }).catch((e) => setError(e.message || 'Не удалось собрать предмет'));
    return () => { alive = false; };
  }, [item, where, customItem, skin, model]);

  const applyTune = (g, t) => {
    if (!g) return;
    const b = g.userData.base;
    g.position.set(b.x + t.x, b.y + t.y, b.z + t.z);
    g.rotation.set(t.rx * D, t.ry * D, t.rz * D);
    g.scale.setScalar(t.s || 1);
  };
  useEffect(() => { applyTune(itemRef.current, tune); redraw(); }, [tune]);

  const pickItemFile = async (file) => {
    if (!file) return;
    try { const it = await readItemFile(file); setCustomItem(it); setItem('custom'); setTune(DEFAULT_TUNE); }
    catch (e) { setError(e.message || 'Не удалось прочитать предмет'); }
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
      if (e.code === 'Numpad0' || e.code === 'Home') { e.preventDefault(); resetView(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const pickLight = (k) => { setLight(k); setLcfg(lightCfg(k)); };
  useEffect(() => {
    const v = viewerRef.current; if (!v) return;
    lightsRef.current.forEach((l) => { v.scene.remove(l); l.dispose?.(); });
    lightsRef.current = [];
    v.globalLight.intensity = lcfg.ambient;
    v.cameraLight.intensity = lcfg.camera;
    [lcfg.key, lcfg.rim].filter((d) => d.i > 0).forEach((d) => {
      const dl = new THREE.DirectionalLight(d.c, d.i); dl.position.set(...dirPos(d)); v.scene.add(dl); lightsRef.current.push(dl);
    });
    redraw();
  }, [lcfg]);
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
    const cam = v.camera.clone(); cam.aspect = 1; cam.updateProjectionMatrix();
    r.render(v.scene, cam);
    v.scene.background = bg;
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
            <canvas ref={canvasRef} style={{ filter }} />
            <div className="views">
              {Object.entries(VIEWS).map(([k, [l]]) => <button key={k} className="small" onClick={() => setView(k)}>{l}</button>)}
              <button className="small" onClick={resetView}>Сброс</button>
            </div>
            <p className="small muted">Как в Blockbench: левая кнопка мыши крутит, правая или колёсико двигают, прокрутка приближает. Клавиши Num 1, 3, 7, 9 — виды спереди, сбоку, сверху, сзади.</p>
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
              <button className="small ghost" onClick={() => setPose((p) => ({ ...p, [curLimb]: [0, 0, 0] }))}>Сбросить «{LIMBS[curLimb]}»</button>
            </details>

            <details open className="pgroup">
              <summary>Предмет</summary>
              <select value={item} onChange={(e) => { const k = e.target.value; if (k === 'custom' && !customItem) document.getElementById('item-file').click(); setItem(k); setTune(DEFAULT_TUNE); }}>
                {Object.entries(ITEMS).map(([k, l]) => <option key={k} value={k}>{k === 'custom' && customItem ? `Свой: ${customItem.name}` : l}</option>)}
              </select>
              <input id="item-file" type="file" accept=".bbmodel,.png,image/png,application/json" hidden onChange={(e) => { pickItemFile(e.target.files[0]); e.target.value = ''; }} />
              {item === 'custom' && (
                <div className="row" style={{ marginTop: 6, gap: 6, flexWrap: 'wrap' }}>
                  <button className="small" onClick={() => document.getElementById('item-file').click()}>Загрузить другой…</button>
                  {customItem?.type === 'png' && (
                    <div className="seg">
                      <button className={customItem.grip !== 'generated' ? 'on' : ''} onClick={() => setCustomItem({ ...customItem, grip: 'handheld' })} title="Как меч или кирка">Инструмент</button>
                      <button className={customItem.grip === 'generated' ? 'on' : ''} onClick={() => setCustomItem({ ...customItem, grip: 'generated' })} title="Как яблоко или книга">Предмет</button>
                    </div>
                  )}
                </div>
              )}
              {item === 'custom' && <p className="small muted" style={{ margin: '4px 0 0' }}>Модель .bbmodel из Blockbench или PNG предмета из Minecraft (16×16).</p>}
              {item !== 'none' && mode === 'body' && (
                <div className="seg" style={{ marginTop: 6 }}>
                  {Object.entries(ATTACH).map(([k, l]) => <button key={k} className={hand === k ? 'on' : ''} onClick={() => { setHand(k); setTune(DEFAULT_TUNE); }}>{l}</button>)}
                </div>
              )}
              {item !== 'none' && (
                <details style={{ marginTop: 8 }}>
                  <summary>Положение предмета</summary>
                  <Range label="Вперёд / назад" value={tune.z} min={-12} max={12} step={0.5} unit=" px" onChange={(v) => setTune((t) => ({ ...t, z: v }))} />
                  <Range label="Вверх / вниз" value={tune.y} min={-12} max={12} step={0.5} unit=" px" onChange={(v) => setTune((t) => ({ ...t, y: v }))} />
                  <Range label="Влево / вправо" value={tune.x} min={-12} max={12} step={0.5} unit=" px" onChange={(v) => setTune((t) => ({ ...t, x: v }))} />
                  <Range label="Наклон" value={tune.rx} min={-180} max={180} step={5} unit="°" onChange={(v) => setTune((t) => ({ ...t, rx: v }))} />
                  <Range label="Поворот" value={tune.ry} min={-180} max={180} step={5} unit="°" onChange={(v) => setTune((t) => ({ ...t, ry: v }))} />
                  <Range label="Крен" value={tune.rz} min={-180} max={180} step={5} unit="°" onChange={(v) => setTune((t) => ({ ...t, rz: v }))} />
                  <Range label="Размер" value={tune.s} min={0.3} max={2.5} step={0.05} unit="×" onChange={(v) => setTune((t) => ({ ...t, s: v }))} />
                  <button className="small" onClick={() => setTune(DEFAULT_TUNE)}>Сбросить положение</button>
                </details>
              )}
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
