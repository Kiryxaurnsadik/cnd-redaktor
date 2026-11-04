// 3D-персонаж со скина: позы и свет (идея как в SkinPreview Maker / Blockbench), рендер в прозрачный PNG.
import { useEffect, useRef, useState } from 'react';
import { SkinViewer } from 'skinview3d';
import * as THREE from 'three';

const D = Math.PI / 180;
export const POSES = {
  stand: { label: 'Стоит', head: [0, 0], rArm: [0, 0, 0], lArm: [0, 0, 0], rLeg: [0, 0], lLeg: [0, 0] },
  mic: { label: 'С микрофоном', head: [-5, 10], rArm: [-80, 0, 15], lArm: [0, 0, -5], rLeg: [0, 0], lLeg: [0, 0] },
  point: { label: 'Указывает', head: [0, -20], rArm: [-90, 0, 0], lArm: [5, 0, -5], rLeg: [0, 0], lLeg: [0, 0] },
  wave: { label: 'Машет', head: [-5, -10], rArm: [0, 0, 150], lArm: [0, 0, -5], rLeg: [0, 0], lLeg: [0, 0] },
  walk: { label: 'Идёт', head: [0, 0], rArm: [30, 0, 0], lArm: [-30, 0, 0], rLeg: [-30, 0], lLeg: [30, 0] },
  run: { label: 'Бежит', head: [10, 0], rArm: [70, 0, 0], lArm: [-70, 0, 0], rLeg: [-60, 0], lLeg: [60, 0] },
  cross: { label: 'Скрестил руки', head: [0, 0], rArm: [-60, 0, -55], lArm: [-60, 0, 55], rLeg: [0, 0], lLeg: [0, 0] },
  up: { label: 'Руки вверх', head: [-15, 0], rArm: [0, 0, 165], lArm: [0, 0, -165], rLeg: [0, 0], lLeg: [0, 0] },
  sit: { label: 'Сидит', head: [5, 0], rArm: [-40, 0, 5], lArm: [-40, 0, -5], rLeg: [-90, 10], lLeg: [-90, -10] },
};

export const LIGHTS = {
  blockbench: { label: 'Blockbench (ровный)', ambient: 3, camera: 0.6, key: null, rim: null },
  studio: { label: 'Студия', ambient: 1.4, camera: 0.2, key: { c: '#ffffff', i: 1.6, p: [20, 30, 40] }, rim: { c: '#cfe2ff', i: 1.2, p: [-30, 20, -40] } },
  rim: { label: 'Контровой', ambient: 0.8, camera: 0.1, key: { c: '#ffffff', i: 0.6, p: [10, 10, 40] }, rim: { c: '#7fb8ff', i: 3, p: [0, 20, -50] } },
  sunset: { label: 'Закат', ambient: 1.2, camera: 0.1, key: { c: '#ffb46b', i: 2.2, p: [-40, 15, 30] }, rim: { c: '#ff5e9c', i: 1.4, p: [40, 10, -30] } },
  neon: { label: 'Ночь / неон', ambient: 0.6, camera: 0, key: { c: '#3fa7ff', i: 2.4, p: [-40, 10, 30] }, rim: { c: '#ff2fd1', i: 2.4, p: [40, 10, -10] } },
  noir: { label: 'Нуар', ambient: 0.35, camera: 0, key: { c: '#ffffff', i: 2.8, p: [50, 20, 10] }, rim: null },
};

function applyPose(skin, p) {
  skin.head.rotation.set(p.head[0] * D, p.head[1] * D, 0);
  skin.rightArm.rotation.set(p.rArm[0] * D, p.rArm[1] * D, p.rArm[2] * D);
  skin.leftArm.rotation.set(p.lArm[0] * D, p.lArm[1] * D, p.lArm[2] * D);
  skin.rightLeg.rotation.set(p.rLeg[0] * D, 0, p.rLeg[1] * D);
  skin.leftLeg.rotation.set(p.lLeg[0] * D, 0, p.lLeg[1] * D);
}

export default function SkinPoser({ skin, onInsert, onClose }) {
  const canvasRef = useRef(null);
  const viewerRef = useRef(null);
  const lightsRef = useRef([]);
  const [pose, setPose] = useState(structuredClone(POSES.stand));
  const [light, setLight] = useState('studio');
  const [model, setModel] = useState('auto-detect');
  const [error, setError] = useState('');

  useEffect(() => {
    const viewer = new SkinViewer({ canvas: canvasRef.current, width: 520, height: 520, preserveDrawingBuffer: true });
    viewer.zoom = 0.85;
    viewer.fov = 40;
    viewer.camera.position.set(25, 12, 50);
    viewer.controls.enableZoom = true;
    viewerRef.current = viewer;
    return () => viewer.dispose();
  }, []);

  useEffect(() => {
    viewerRef.current?.loadSkin(skin, { model }).catch?.(() => setError('Не удалось загрузить скин'));
  }, [skin, model]);

  useEffect(() => { const v = viewerRef.current; if (v) applyPose(v.playerObject.skin, pose); }, [pose]);

  useEffect(() => {
    const v = viewerRef.current; if (!v) return;
    const L = LIGHTS[light];
    lightsRef.current.forEach((l) => v.scene.remove(l));
    lightsRef.current = [];
    v.globalLight.intensity = L.ambient;
    v.cameraLight.intensity = L.camera;
    [L.key, L.rim].filter(Boolean).forEach((d) => {
      const dl = new THREE.DirectionalLight(d.c, d.i); dl.position.set(...d.p); v.scene.add(dl); lightsRef.current.push(dl);
    });
  }, [light]);

  const set = (part, i, val) => setPose((p) => { const n = structuredClone(p); n[part][i] = Number(val); return n; });

  // Отдельный рендерер с прозрачным фоном, 1200×1200
  const render = () => {
    const v = viewerRef.current;
    const size = 1200;
    const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1); r.setSize(size, size, false); r.setClearColor(0x000000, 0);
    const bg = v.scene.background; v.scene.background = null;
    const cam = v.camera.clone(); cam.aspect = 1; cam.updateProjectionMatrix();
    r.render(v.scene, cam);
    v.scene.background = bg;
    const url = trim(r.domElement);
    r.dispose();
    onInsert(url);
  };

  const slider = (label, part, i, min = -180, max = 180) => (
    <div key={`${part}${i}`}>
      <label>{label}: {pose[part][i]}°</label>
      <input type="range" min={min} max={max} value={pose[part][i]} onChange={(e) => set(part, i, e.target.value)} />
    </div>
  );

  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="row" style={{ marginBottom: 10 }}>
          <h2 className="grow" style={{ margin: 0 }}>3D-персонаж: поза и свет</h2>
          <button onClick={onClose}>Закрыть</button>
        </div>
        <div className="poser">
          <div>
            <canvas ref={canvasRef} />
            <p className="small muted">Крутите персонажа мышью, колесо — приближение.</p>
          </div>
          <div>
            <label>Готовая поза</label>
            <select onChange={(e) => setPose(structuredClone(POSES[e.target.value]))} defaultValue="stand">
              {Object.entries(POSES).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
            </select>
            <label>Свет</label>
            <select value={light} onChange={(e) => setLight(e.target.value)}>
              {Object.entries(LIGHTS).map(([k, l]) => <option key={k} value={k}>{l.label}</option>)}
            </select>
            <label>Модель рук</label>
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="auto-detect">Определить автоматически</option>
              <option value="default">Классические (Steve)</option>
              <option value="slim">Тонкие (Alex)</option>
            </select>
            <details open style={{ marginTop: 10 }}>
              <summary>Тонкая настройка</summary>
              {slider('Голова вверх/вниз', 'head', 0, -60, 60)}
              {slider('Голова влево/вправо', 'head', 1, -80, 80)}
              {slider('Правая рука вперёд', 'rArm', 0)}
              {slider('Правая рука в сторону', 'rArm', 2)}
              {slider('Левая рука вперёд', 'lArm', 0)}
              {slider('Левая рука в сторону', 'lArm', 2)}
              {slider('Правая нога', 'rLeg', 0, -100, 100)}
              {slider('Левая нога', 'lLeg', 0, -100, 100)}
            </details>
            {error && <div className="error">{error}</div>}
            <button className="primary" style={{ width: '100%', marginTop: 12 }} onClick={render}>Вставить на холст</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Обрезаем прозрачные поля, чтобы персонаж вставлялся без лишней рамки
function trim(src) {
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const ctx = c.getContext('2d'); ctx.drawImage(src, 0, 0);
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
