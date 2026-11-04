// Предметы в руке 3D-персонажа (как в SkinPreview Maker): собраны из блоков в стиле Minecraft.
// Система координат предмета: начало — точка хвата (кисть), +Y — «вверх» по предмету, +Z — от персонажа.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

function part(list, [w, h, d], [x, y, z], color, rot) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (rot) g.rotateX(rot[0] || 0).rotateY(rot[1] || 0).rotateZ(rot[2] || 0);
  g.translate(x, y, z);
  const c = new THREE.Color(color);
  const colors = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < colors.length; i += 3) { colors[i] = c.r; colors[i + 1] = c.g; colors[i + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  list.push(g);
}

const BUILD = {
  mic: (p) => {
    part(p, [1.4, 6, 1.4], [0, 1.5, 0], '#1d1f24');
    part(p, [1.8, 0.6, 1.8], [0, 4.6, 0], '#4a4f59');
    part(p, [2.6, 2.6, 2.6], [0, 6.2, 0], '#8d939e');
    part(p, [2.8, 0.5, 2.8], [0, 6.2, 0], '#5a606b');
    part(p, [3.2, 2, 0.5], [0, 3, 0.95], '#0B7CFC'); // табличка CND на микрофоне
  },
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
  sword: (p) => {
    part(p, [0.9, 3, 0.9], [0, 0.5, 0], '#5b3a22');
    part(p, [4, 0.8, 1], [0, 2.3, 0], '#2f2f2f');
    part(p, [1.3, 8, 0.5], [0, 6.7, 0], '#d9dde3');
    part(p, [0.5, 8, 0.55], [0.25, 6.7, 0], '#aeb4bd');
    part(p, [0.8, 0.8, 0.5], [0, 11, 0], '#d9dde3');
  },
  pickaxe: (p) => {
    part(p, [0.9, 10, 0.9], [0, 3, 0], '#7a5230');
    part(p, [7, 1.2, 1], [0, 8, 0], '#8fd3e0');
    part(p, [1.2, 1.2, 1], [-3.6, 7.4, 0], '#8fd3e0');
    part(p, [1.2, 1.2, 1], [3.6, 7.4, 0], '#8fd3e0');
  },
  flag: (p) => {
    part(p, [0.6, 12, 0.6], [0, 4, 0], '#c9ccd3');
    part(p, [0.3, 4, 6], [0, 8, 3.2], '#0B7CFC');
    part(p, [0.35, 1.6, 2.2], [0, 8.2, 3.2], '#ffffff');
  },
};

export const ITEMS = {
  none: 'Без предмета',
  mic: 'Микрофон',
  camera: 'Фотокамера',
  notebook: 'Блокнот',
  newspaper: 'Газета',
  phone: 'Телефон',
  coffee: 'Кофе',
  sword: 'Меч',
  pickaxe: 'Кирка',
  flag: 'Флаг CND',
  custom: 'Свой предмет (PNG 16×16)…',
};

const MATERIAL = () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0.05 });

// Свой предмет: каждый пиксель картинки превращается в блок (как предметы в Minecraft)
async function buildFromImage(src) {
  const img = new Image(); img.src = src; await img.decode();
  const n = Math.min(32, Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = n; c.height = n;
  const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false; ctx.drawImage(img, 0, 0, n, n);
  const d = ctx.getImageData(0, 0, n, n).data;
  const k = 12 / n; const list = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = (y * n + x) * 4; if (d[i + 3] < 128) continue;
    const hex = `#${[d[i], d[i + 1], d[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    // хват в левом нижнем углу картинки, как у предметов Minecraft
    part(list, [k, k, k], [(x - n * 0.2) * k, (n - y - n * 0.2) * k, 0], hex);
  }
  return list;
}

export async function makeItem(kind, customSrc) {
  if (!kind || kind === 'none') return null;
  let list = [];
  if (kind === 'custom') { if (!customSrc) return null; list = await buildFromImage(customSrc); }
  else BUILD[kind]?.(list);
  if (!list.length) return null;
  const mesh = new THREE.Mesh(mergeGeometries(list), MATERIAL());
  const g = new THREE.Group(); g.add(mesh); g.name = 'cnd-item';
  // в кисти: чуть ниже конца руки, предмет смотрит вперёд и немного вверх
  g.position.set(0, -9.5, 0.5);
  g.rotation.set(THREE.MathUtils.degToRad(kind === 'custom' || kind === 'sword' || kind === 'pickaxe' ? 60 : 80), 0, 0);
  if (kind === 'custom' || kind === 'sword' || kind === 'pickaxe') g.rotation.y = -Math.PI / 2;
  return g;
}

export function disposeItem(g) {
  g?.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
}
