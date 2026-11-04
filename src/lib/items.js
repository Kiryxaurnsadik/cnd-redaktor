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
  const m = boxUvRaw(u, v, w, h, d);
  if (!el.mirror_uv) return m;
  const fl = ([a, b, c, e]) => [c, b, a, e];
  return { north: fl(m.north), south: fl(m.south), up: fl(m.up), down: fl(m.down), east: fl(m.west), west: fl(m.east) };
}

function boxUvRaw(u, v, w, h, d) {
  return {
    north: [u + d, v + d, u + d + w, v + d + h],
    east: [u, v + d, u + d, v + d + h],
    south: [u + 2 * d + w, v + d, u + 2 * d + 2 * w, v + d + h],
    west: [u + d + w, v + d, u + 2 * d + w, v + d + h],
    up: [u + d + w, v + d, u + d, v],
    down: [u + d + 2 * w, v, u + d + w, v + d],
  };
}

async function textureFrom(t, resW, resH) {
  const src = t?.source;
  if (!src || !src.startsWith('data:')) return null;
  const img = await loadImg(src);
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  c.getContext('2d').drawImage(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
  const uw = t.uv_width || resW, uh = t.uv_height || resH;
  const frames = Math.max(1, Math.round((img.height / img.width) / (uh / uw)));
  if (frames > 1) { tex.repeat.set(1, 1 / frames); tex.offset.set(0, 1 - 1 / frames); }
  tex.userData = { frames, frameTime: Math.max(1, t.frame_time || 1), order: parseOrder(t.frame_order, frames), interpolate: false };
  return tex;
}

function parseOrder(str, frames) {
  if (!str || typeof str !== 'string') return null;
  const list = str.split(/[\s,]+/).map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < frames);
  return list.length ? list : null;
}

export function setTextureFrame(tex, timeSec) {
  const u = tex?.userData; if (!u || u.frames <= 1) return;
  const tick = Math.floor(timeSec * 20 / u.frameTime);
  const seq = u.order || null;
  const f = seq ? seq[tick % seq.length] : tick % u.frames;
  tex.offset.y = 1 - (f + 1) / u.frames;
}

function sortQuad(pts) {
  if (pts.length !== 4) return [0, 1, 2];
  const c = pts.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(0.25);
  const n = new THREE.Vector3().subVectors(pts[1], pts[0]).cross(new THREE.Vector3().subVectors(pts[2], pts[0]));
  if (n.lengthSq() < 1e-9) n.subVectors(pts[2], pts[0]).cross(new THREE.Vector3().subVectors(pts[3], pts[0]));
  n.normalize();
  const ax = new THREE.Vector3().subVectors(pts[0], c).normalize();
  const ay = new THREE.Vector3().crossVectors(n, ax);
  return [0, 1, 2, 3].map((i) => { const d = new THREE.Vector3().subVectors(pts[i], c); return [i, Math.atan2(d.dot(ay), d.dot(ax))]; })
    .sort((a, b) => a[1] - b[1]).map((x) => x[0]);
}

const eulerOf = (r) => new THREE.Euler((r?.[0] || 0) * DEG, (r?.[1] || 0) * DEG, (r?.[2] || 0) * DEG, 'ZYX');

function num(v) {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v ?? '').trim());
  return Number.isFinite(n) ? n : 0;
}

export async function parseBBModel(json) {
  const bb = typeof json === 'string' ? JSON.parse(json) : json;
  if (!Array.isArray(bb?.elements)) throw new Error('В файле нет модели Blockbench');
  const resW = bb.resolution?.width || 16, resH = bb.resolution?.height || 16;
  const texList = bb.textures || [];
  const textures = await Promise.all(texList.map((t) => textureFrom(t, resW, resH).catch(() => null)));
  const texIndex = (f) => {
    if (typeof f.texture === 'number') return f.texture;
    if (typeof f.texture === 'string') { const i = texList.findIndex((t) => t.uuid === f.texture || t.id === f.texture); return i >= 0 ? i : 0; }
    return 0;
  };
  const materials = new Map();
  const matFor = (ti) => {
    if (!materials.has(ti)) {
      const map = textures[ti];
      materials.set(ti, new THREE.MeshStandardMaterial(map
        ? { map, alphaTest: 0.1, transparent: false, side: THREE.DoubleSide, roughness: 0.8, metalness: 0.05 }
        : { color: '#9aa1ab', side: THREE.DoubleSide, roughness: 0.8 }));
    }
    return materials.get(ti);
  };
  const boxUvAll = !!bb.meta?.box_uv;
  const uvSize = (ti) => [texList[ti]?.uv_width || resW, texList[ti]?.uv_height || resH];

  const cubeFaces = (el, pivot, put) => {
    const inf = el.inflate || 0;
    const from = el.from.map((v, i) => Math.min(v, el.to[i]) - inf);
    const to = el.to.map((v, i) => Math.max(v, el.from[i]) + inf);
    const o = new THREE.Vector3(...(el.origin || [8, 8, 8]));
    const q = new THREE.Quaternion().setFromEuler(eulerOf(el.rotation));
    const auto = (el.box_uv ?? boxUvAll) ? boxUv(el) : null;
    for (const [face, fn] of Object.entries(FACE_CORNERS)) {
      const f = el.faces?.[face];
      if (!f || f.texture === null || f.texture === undefined || f.texture === false) continue;
      const ti = texIndex(f);
      const [uw, uh] = uvSize(ti);
      const [u1, v1, u2, v2] = auto ? auto[face] : (f.uv || [0, 0, uw, uh]);
      if (u1 === u2 && v1 === v2) continue;
      const uvs = [[u1, v1], [u2, v1], [u2, v2], [u1, v2]].map(([u, v]) => [u / uw, 1 - v / uh]);
      const k = ((f.rotation || 0) / 90) & 3;
      const corners = fn(from, to).map((p) => new THREE.Vector3(...p).sub(o).applyQuaternion(q).add(o).sub(pivot));
      put(ti, corners, corners.map((_, i) => uvs[(i - k + 4) % 4]));
    }
  };

  const meshFaces = (el, pivot, put) => {
    const o = new THREE.Vector3(...(el.origin || [0, 0, 0]));
    const q = new THREE.Quaternion().setFromEuler(eulerOf(el.rotation));
    const V = el.vertices || {};
    for (const f of Object.values(el.faces || {})) {
      if (!Array.isArray(f.vertices) || f.vertices.length < 3 || f.texture === null || f.texture === false) continue;
      const ti = texIndex(f);
      const [uw, uh] = uvSize(ti);
      const keys = f.vertices.filter((k) => V[k]);
      if (keys.length < 3) continue;
      const pts = keys.map((k) => new THREE.Vector3(...V[k]).applyQuaternion(q).add(o).sub(pivot));
      const uvs = keys.map((k) => { const uv = f.uv?.[k] || [0, 0]; return [uv[0] / uw, 1 - uv[1] / uh]; });
      const order = keys.length === 4 ? sortQuad(pts) : [0, 1, 2];
      put(ti, order.map((i) => pts[i]), order.map((i) => uvs[i]));
    }
  };

  const byUuid = new Map(bb.elements.map((e) => [e.uuid, e]));
  const groupData = new Map((bb.groups || []).map((g) => [g.uuid, g]));
  const bones = new Map();
  const used = new Set();

  const buildGeometry = (elements, pivot, parent) => {
    const buckets = new Map();
    const put = (ti, pts, uvs) => {
      if (!buckets.has(ti)) buckets.set(ti, { pos: [], uv: [], idx: [] });
      const b = buckets.get(ti); const base = b.pos.length / 3;
      pts.forEach((p, i) => { b.pos.push(p.x, p.y, p.z); b.uv.push(uvs[i][0], uvs[i][1]); });
      if (pts.length === 4) b.idx.push(base, base + 3, base + 2, base, base + 2, base + 1);
      else b.idx.push(base, base + 2, base + 1);
    };
    for (const el of elements) {
      if (el.visibility === false || el.export === false) continue;
      if ((!el.type || el.type === 'cube') && el.from && el.to) cubeFaces(el, pivot, put);
      else if (el.type === 'mesh') meshFaces(el, pivot, put);
    }
    for (const [ti, b] of buckets) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
      g.setIndex(b.idx); g.computeVertexNormals();
      parent.add(new THREE.Mesh(g, matFor(ti)));
    }
  };

  const walk = (nodes, parentObj, parentOrigin) => {
    const loose = [];
    for (const n of nodes || []) {
      if (typeof n === 'string') { const el = byUuid.get(n); if (el) { loose.push(el); used.add(n); } continue; }
      if (!n || typeof n !== 'object') continue;
      const gd = { ...(groupData.get(n.uuid) || {}), ...n };
      if (gd.visibility === false || gd.export === false) { (n.children || []).forEach((c) => typeof c === 'string' && used.add(c)); continue; }
      const origin = new THREE.Vector3(...(gd.origin || [0, 0, 0]));
      const bone = new THREE.Group();
      bone.name = gd.name || 'bone';
      bone.position.copy(origin).sub(parentOrigin);
      bone.rotation.copy(eulerOf(gd.rotation));
      bone.userData.base = { p: bone.position.clone(), r: bone.rotation.clone() };
      parentObj.add(bone);
      if (gd.uuid) bones.set(gd.uuid, bone);
      if (gd.name && !bones.has(`name:${gd.name}`)) bones.set(`name:${gd.name}`, bone);
      walk(n.children, bone, origin);
    }
    buildGeometry(loose, parentOrigin, parentObj);
  };

  const root = new THREE.Group();
  const zero = new THREE.Vector3();
  if (Array.isArray(bb.outliner) && bb.outliner.length) walk(bb.outliner, root, zero);
  const rest = bb.elements.filter((e) => !used.has(e.uuid));
  if (rest.length) buildGeometry(rest, zero, root);
  let faces = 0; root.traverse((o) => { if (o.isMesh) faces++; });
  if (!faces) throw new Error('У модели нет видимых граней');

  const object = new THREE.Group();
  object.add(root);
  let display = bb.display || null;
  if (bb.meta?.model_format && bb.meta.model_format !== 'java_block' && !display) {
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const sc = Math.min(1, 16 / Math.max(size.x, size.y, size.z, 1));
    root.scale.setScalar(sc);
    root.position.set(8 - c.x * sc, 8 - c.y * sc, 8 - c.z * sc);
    display = DISPLAY_GENERATED;
  }

  const animations = (bb.animations || []).map((a) => ({
    name: a.name || 'Анимация', length: Math.max(0.05, Number(a.length) || 1), loop: a.loop !== 'once',
    tracks: Object.entries(a.animators || {}).filter(([, an]) => !an.type || an.type === 'bone').map(([uuid, an]) => {
      const bone = bones.get(uuid) || bones.get(`name:${an.name}`);
      const ch = {};
      for (const kf of an.keyframes || []) {
        const dp = kf.data_points?.[0] || {};
        (ch[kf.channel] ||= []).push({ t: Number(kf.time) || 0, v: [num(dp.x), num(dp.y), num(dp.z)], step: kf.interpolation === 'step' });
      }
      Object.values(ch).forEach((l) => l.sort((x, y) => x.t - y.t));
      return bone ? { bone, ch } : null;
    }).filter(Boolean),
  })).filter((a) => a.tracks.length);
  const animTextures = textures.filter((t) => t?.userData?.frames > 1);
  return { object, display: display || {}, name: bb.name || 'Модель', animations, animTextures, bones };
}

function sample(list, t, def) {
  if (!list?.length) return def;
  if (t <= list[0].t) return list[0].v;
  const last = list[list.length - 1];
  if (t >= last.t) return last.v;
  for (let i = 0; i < list.length - 1; i++) {
    const a = list[i], b = list[i + 1];
    if (t >= a.t && t <= b.t) {
      if (a.step) return a.v;
      const k = (t - a.t) / Math.max(1e-6, b.t - a.t);
      return a.v.map((x, j) => x + (b.v[j] - x) * k);
    }
  }
  return last.v;
}

export function poseModel(model, animIndex, time) {
  if (!model) return;
  model.bones?.forEach((b) => { const base = b.userData.base; if (base) { b.position.copy(base.p); b.rotation.copy(base.r); b.scale.set(1, 1, 1); } });
  const a = model.animations?.[animIndex];
  if (a) {
    const t = a.loop ? ((time % a.length) + a.length) % a.length : Math.min(time, a.length);
    for (const { bone, ch } of a.tracks) {
      const r = sample(ch.rotation, t, [0, 0, 0]);
      const p = sample(ch.position, t, [0, 0, 0]);
      const s = sample(ch.scale, t, [1, 1, 1]);
      bone.rotation.x -= r[0] * DEG; bone.rotation.y -= r[1] * DEG; bone.rotation.z += r[2] * DEG;
      bone.position.x -= p[0]; bone.position.y += p[1]; bone.position.z += p[2];
      bone.scale.set(s[0] || 1, s[1] || 1, s[2] || 1);
    }
  }
  model.animTextures?.forEach((tx) => setTextureFrame(tx, time));
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
  let object, display, model = null;
  if (BUILTIN_BB[kind]) { model = await loadBuiltinBB(kind); ({ object, display } = model); }
  else if (kind === 'custom') {
    if (!custom) return null;
    if (custom.type === 'bbmodel') { model = await parseBBModel(custom.data); ({ object, display } = model); }
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
  outer.userData.model = model;
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
