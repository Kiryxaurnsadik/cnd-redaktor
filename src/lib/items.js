// Если крадёте, то крадите ради реально хороших людей
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const DEFAULT_ITEM = 'cnd_mic';
const BUILTIN_BB = { cnd_mic: './items/microphonehand_cnd.bbmodel' };

export const ITEMS = {
  none: 'Без предмета',
  cnd_mic: 'Микрофон CND',
  camera: 'Фотокамера',
  notebook: 'Блокнот',
  newspaper: 'Газета',
  phone: 'Телефон',
  coffee: 'Кофе',
  flag: 'Флаг CND',
  custom: 'Свой предмет: .bbmodel или PNG…',
};

export const ATTACH = { rightArm: 'Правая рука', leftArm: 'Левая рука', head: 'Голова' };

const DISPLAY_HANDHELD = {
  thirdperson_righthand: { rotation: [0, -90, 55], translation: [0, 4, 0.5], scale: [0.85, 0.85, 0.85] },
  head: { rotation: [0, 180, 0], translation: [0, 13, 7], scale: [1, 1, 1] },
};
const DISPLAY_GENERATED = {
  thirdperson_righthand: { rotation: [0, 0, 0], translation: [0, 3, 1], scale: [0.55, 0.55, 0.55] },
  head: { rotation: [0, 180, 0], translation: [0, 13, 7], scale: [1, 1, 1] },
};
const DISPLAY_SIMPLE = { head: { translation: [0, 10, 0], scale: [1, 1, 1] } };

const DEG = Math.PI / 180;
const MC_TO_VIEW = new THREE.Matrix4().makeScale(1, -1, -1);

function part(list, [w, h, d], [x, y, z], color) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x + 8, y + 8, z + 8);
  const c = new THREE.Color(color);
  const colors = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < colors.length; i += 3) { colors[i] = c.r; colors[i + 1] = c.g; colors[i + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  list.push(g);
}

const BUILD = {
  camera: (p) => {
    part(p, [6, 4, 3], [0, 2.4, 0.6], '#202329');
    part(p, [2.4, 2.4, 2.4], [0, 2.4, 2.8], '#2e333b');
    part(p, [1.8, 1.8, 0.4], [0, 2.4, 4.1], '#4aa3ff');
    part(p, [1.6, 1, 1.6], [-1.8, 4.9, 0.4], '#2e333b');
    part(p, [0.8, 0.8, 0.4], [2.2, 3.6, 2.1], '#d94242');
  },
  notebook: (p) => {
    part(p, [4.6, 6, 0.8], [0, 3, 0], '#0050BE');
    part(p, [4.2, 5.6, 0.5], [0.2, 3, 0.45], '#f3efe4');
    for (let i = 0; i < 5; i++) part(p, [0.4, 0.4, 1], [-2.4, 1 + i * 1.1, 0.1], '#c9ccd3');
  },
  newspaper: (p) => {
    part(p, [5, 7, 0.4], [0, 3.2, 0], '#ece6d6');
    part(p, [4, 0.8, 0.45], [0, 5.8, 0.05], '#2b2b2b');
    part(p, [1.8, 2, 0.45], [-1.1, 3.8, 0.05], '#9a9486');
    for (let i = 0; i < 4; i++) part(p, [1.8, 0.3, 0.45], [1.2, 4.6 - i * 0.7, 0.05], '#6d685d');
    for (let i = 0; i < 3; i++) part(p, [4, 0.3, 0.45], [0, 2 - i * 0.7, 0.05], '#6d685d');
  },
  phone: (p) => {
    part(p, [2.8, 5, 0.5], [0, 2.4, 0], '#15171b');
    part(p, [2.4, 4.2, 0.1], [0, 2.5, 0.3], '#3d8bfd');
  },
  coffee: (p) => {
    part(p, [2.8, 3.4, 2.8], [0, 1.8, 0], '#f2efe9');
    part(p, [2.9, 1.2, 2.9], [0, 1.8, 0], '#0B7CFC');
    part(p, [2.6, 0.3, 2.6], [0, 3.55, 0], '#5b3a22');
    part(p, [0.6, 1.8, 1.2], [1.8, 1.9, 0], '#f2efe9');
  },
  flag: (p) => {
    part(p, [0.6, 12, 0.6], [0, 4, 0], '#c9ccd3');
    part(p, [0.3, 4, 6], [0, 8, 3.2], '#0B7CFC');
    part(p, [0.35, 1.6, 2.2], [0, 8.2, 3.2], '#ffffff');
  },
};

const vcMaterial = () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0.05 });

async function loadImg(src) { const img = new Image(); img.src = src; await img.decode(); return img; }

async function buildFromPng(src) {
  const img = await loadImg(src);
  const n = Math.min(64, Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = n; c.height = n;
  const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false; ctx.drawImage(img, 0, 0, n, n);
  const d = ctx.getImageData(0, 0, n, n).data;
  const k = 16 / n; const list = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = (y * n + x) * 4; if (d[i + 3] < 128) continue;
    const g = new THREE.BoxGeometry(k, k, 1);
    g.translate((x + 0.5) * k, 16 - (y + 0.5) * k, 8);
    const cl = new THREE.Color(`rgb(${d[i]},${d[i + 1]},${d[i + 2]})`);
    const colors = new Float32Array(g.attributes.position.count * 3);
    for (let j = 0; j < colors.length; j += 3) { colors[j] = cl.r; colors[j + 1] = cl.g; colors[j + 2] = cl.b; }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    list.push(g);
  }
  if (!list.length) throw new Error('На картинке нет непрозрачных пикселей');
  return new THREE.Mesh(mergeGeometries(list), vcMaterial());
}

const FACE_CORNERS = {
  north: ([a, b, c], [x, y, z]) => [[x, y, c], [a, y, c], [a, b, c], [x, b, c]],
  south: ([a, b, c], [x, y, z]) => [[a, y, z], [x, y, z], [x, b, z], [a, b, z]],
  east: ([a, b, c], [x, y, z]) => [[x, y, z], [x, y, c], [x, b, c], [x, b, z]],
  west: ([a, b, c], [x, y, z]) => [[a, y, c], [a, y, z], [a, b, z], [a, b, c]],
  up: ([a, b, c], [x, y, z]) => [[a, y, c], [x, y, c], [x, y, z], [a, y, z]],
  down: ([a, b, c], [x, y, z]) => [[a, b, z], [x, b, z], [x, b, c], [a, b, c]],
};

function boxUv(el) {
  const [u, v] = el.uv_offset || [0, 0];
  const w = Math.abs(el.to[0] - el.from[0]), h = Math.abs(el.to[1] - el.from[1]), d = Math.abs(el.to[2] - el.from[2]);
  return {
    north: [u + d, v + d, u + d + w, v + d + h],
    east: [u, v + d, u + d, v + d + h],
    south: [u + 2 * d + w, v + d, u + 2 * d + 2 * w, v + d + h],
    west: [u + d + w, v + d, u + 2 * d + w, v + d + h],
    up: [u + d + w, v + d, u + d, v],
    down: [u + d + 2 * w, v, u + d + w, v + d],
  };
}

async function textureFrom(t) {
  const src = t?.source;
  if (!src || !src.startsWith('data:')) return null;
  const img = await loadImg(src);
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  c.getContext('2d').drawImage(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
  return tex;
}

export async function parseBBModel(json) {
  const bb = typeof json === 'string' ? JSON.parse(json) : json;
  if (!Array.isArray(bb?.elements)) throw new Error('В файле нет модели Blockbench');
  const resW = bb.resolution?.width || 16, resH = bb.resolution?.height || 16;
  const texList = bb.textures || [];
  const textures = await Promise.all(texList.map((t) => textureFrom(t).catch(() => null)));
  const buckets = new Map();
  const bucket = (i) => { if (!buckets.has(i)) buckets.set(i, { pos: [], uv: [], idx: [] }); return buckets.get(i); };
  const boxUvAll = !!bb.meta?.box_uv;

  for (const el of bb.elements) {
    if (!el.from || !el.to || el.visibility === false || (el.type && el.type !== 'cube')) continue;
    const inf = el.inflate || 0;
    const from = el.from.map((v, i) => Math.min(v, el.to[i]) - inf);
    const to = el.to.map((v, i) => Math.max(v, el.from[i]) + inf);
    const rot = el.rotation || [0, 0, 0];
    const o = new THREE.Vector3(...(el.origin || [8, 8, 8]));
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0] * DEG, rot[1] * DEG, rot[2] * DEG, 'ZYX'));
    const auto = el.box_uv ?? boxUvAll ? boxUv(el) : null;
    for (const [face, fn] of Object.entries(FACE_CORNERS)) {
      const f = el.faces?.[face];
      if (!f || f.texture === null || f.texture === undefined || f.texture === false) continue;
      const ti = typeof f.texture === 'number' ? f.texture : 0;
      const tex = texList[ti];
      const uw = tex?.uv_width || resW, uh = tex?.uv_height || resH;
      const [u1, v1, u2, v2] = auto ? auto[face] : (f.uv || [0, 0, uw, uh]);
      if (u1 === u2 && v1 === v2) continue;
      const uvs = [[u1, v1], [u2, v1], [u2, v2], [u1, v2]].map(([u, v]) => [u / uw, 1 - v / uh]);
      const k = ((f.rotation || 0) / 90) & 3;
      const corners = fn(from, to).map((p) => new THREE.Vector3(...p).sub(o).applyQuaternion(q).add(o));
      const b = bucket(ti); const base = b.pos.length / 3;
      corners.forEach((p, i) => { b.pos.push(p.x, p.y, p.z); b.uv.push(...uvs[(i - k + 4) % 4]); });
      b.idx.push(base, base + 3, base + 2, base, base + 2, base + 1);
    }
  }
  if (!buckets.size) throw new Error('У модели нет видимых граней');

  const group = new THREE.Group();
  for (const [ti, b] of buckets) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
    g.setIndex(b.idx); g.computeVertexNormals();
    const map = textures[ti];
    const mat = new THREE.MeshStandardMaterial(map
      ? { map, alphaTest: 0.1, side: THREE.DoubleSide, roughness: 0.8, metalness: 0.05 }
      : { color: '#9aa1ab', side: THREE.DoubleSide, roughness: 0.8 });
    group.add(new THREE.Mesh(g, mat));
  }

  let display = bb.display || null;
  if (bb.meta?.model_format && bb.meta.model_format !== 'java_block' && !display) {
    const box = new THREE.Box3().setFromObject(group);
    const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const s = Math.min(1, 16 / Math.max(size.x, size.y, size.z, 1));
    group.children.forEach((m) => m.geometry.translate(-c.x, -c.y, -c.z).scale(s, s, s).translate(8, 8, 8));
    display = DISPLAY_GENERATED;
  }
  return { object: group, display: display || {}, name: bb.name || 'Модель' };
}

const bbCache = new Map();
async function loadBuiltinBB(kind) {
  if (!bbCache.has(kind)) bbCache.set(kind, fetch(BUILTIN_BB[kind]).then((r) => { if (!r.ok) throw new Error('Не удалось загрузить модель'); return r.json(); }));
  return parseBBModel(await bbCache.get(kind));
}

function displayMatrix(tr, left) {
  const t = tr?.translation || [0, 0, 0], r = tr?.rotation || [0, 0, 0], s = tr?.scale || [1, 1, 1];
  const sx = left ? -1 : 1;
  const m = new THREE.Matrix4().makeTranslation(sx * t[0], t[1], t[2]);
  m.multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(r[0] * DEG, (left ? -r[1] : r[1]) * DEG, (left ? -r[2] : r[2]) * DEG, 'XYZ')));
  m.multiply(new THREE.Matrix4().makeScale(s[0], s[1], s[2]));
  return m;
}

function attachMatrix(display, where) {
  const center = new THREE.Matrix4().makeTranslation(-8, -8, -8);
  const m = MC_TO_VIEW.clone();
  if (where === 'head') {
    m.multiply(new THREE.Matrix4().makeTranslation(0, -4, 0));
    m.multiply(new THREE.Matrix4().makeRotationY(Math.PI));
    m.multiply(new THREE.Matrix4().makeScale(0.625, -0.625, -0.625));
    m.multiply(displayMatrix(display.head, false));
  } else {
    const left = where === 'leftArm';
    m.multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    m.multiply(new THREE.Matrix4().makeRotationY(Math.PI));
    m.multiply(new THREE.Matrix4().makeTranslation(left ? -1 : 1, 2, -10));
    const tr = left ? (display.thirdperson_lefthand || display.thirdperson_righthand) : display.thirdperson_righthand;
    m.multiply(displayMatrix(tr, left));
  }
  return m.multiply(center);
}

export const DEFAULT_TUNE = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1 };

export async function makeItem(kind, custom, where = 'rightArm', tune = DEFAULT_TUNE) {
  if (!kind || kind === 'none') return null;
  let object, display;
  if (BUILTIN_BB[kind]) ({ object, display } = await loadBuiltinBB(kind));
  else if (kind === 'custom') {
    if (!custom) return null;
    if (custom.type === 'bbmodel') ({ object, display } = await parseBBModel(custom.data));
    else { object = await buildFromPng(custom.data); display = custom.grip === 'generated' ? DISPLAY_GENERATED : DISPLAY_HANDHELD; }
  } else if (BUILD[kind]) {
    const list = []; BUILD[kind](list);
    object = new THREE.Mesh(mergeGeometries(list), vcMaterial()); display = DISPLAY_SIMPLE;
  } else return null;

  const inner = new THREE.Group();
  inner.add(object);
  inner.matrixAutoUpdate = false;
  const m = attachMatrix(display, where);
  const grip = new THREE.Vector3(8, 8, 8).applyMatrix4(m);
  inner.matrix.copy(new THREE.Matrix4().makeTranslation(-grip.x, -grip.y, -grip.z).multiply(m));
  const outer = new THREE.Group(); outer.name = 'cnd-item';
  outer.add(inner);
  outer.position.set(grip.x + tune.x, grip.y + tune.y, grip.z + tune.z);
  outer.rotation.set(tune.rx * DEG, tune.ry * DEG, tune.rz * DEG);
  outer.scale.setScalar(tune.s || 1);
  return outer;
}

export function disposeItem(g) {
  g?.traverse((o) => {
    o.geometry?.dispose?.();
    if (o.material) { o.material.map?.dispose?.(); o.material.dispose?.(); }
  });
}

export async function readItemFile(file) {
  const name = file.name.replace(/\.[^.]+$/, '');
  if (/\.bbmodel$/i.test(file.name) || file.type === 'application/json') {
    if (file.size > 8 * 1024 * 1024) throw new Error('Модель больше 8 МБ');
    const data = JSON.parse(await file.text());
    await parseBBModel(data);
    return { type: 'bbmodel', data, name };
  }
  if (/^image\//.test(file.type) || /\.png$/i.test(file.name)) {
    if (file.size > 2 * 1024 * 1024) throw new Error('Картинка больше 2 МБ');
    const data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
    return { type: 'png', data, name, grip: 'handheld' };
  }
  throw new Error('Нужен файл .bbmodel или PNG');
}
