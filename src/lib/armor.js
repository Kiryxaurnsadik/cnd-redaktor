// Если крадёте, то крадите ради реально хороших людей
import * as THREE from 'three';

export const ARMOR_SLOTS = { helmet: 'Шлем', chest: 'Нагрудник', legs: 'Поножи', boots: 'Ботинки' };

export const ARMOR_SETS = {
  none: { label: 'Нет' },
  leather: { label: 'Кожа (свой цвет)', base: '#b8b8b8', light: '#e4e4e4', dark: '#7d7d7d', tint: true },
  chain: { label: 'Кольчуга', base: '#9aa0a8', light: '#d3d7dc', dark: '#575c63', holes: true },
  iron: { label: 'Железо', base: '#c9ced4', light: '#f4f6f8', dark: '#878d95' },
  gold: { label: 'Золото', base: '#e9c540', light: '#fff3a2', dark: '#a8831b' },
  diamond: { label: 'Алмаз', base: '#46d2cf', light: '#b9fbf6', dark: '#1d8f93', sparkle: true },
  netherite: { label: 'Незерит', base: '#4a4547', light: '#76706f', dark: '#2a2627' },
  cnd: { label: 'CND (синяя)', base: '#0B7CFC', light: '#7ec0ff', dark: '#03316F', stripe: '#ffffff' },
  custom: { label: 'Своя текстура…' },
};

export const DEFAULT_ARMOR = {
  helmet: 'none', chest: 'none', legs: 'none', boots: 'none',
  color: '#a0663a', custom1: null, custom2: null,
};

const PARTS = {
  head: { u: 0, v: 0, w: 8, h: 8, d: 8 },
  body: { u: 16, v: 16, w: 8, h: 12, d: 4 },
  arm: { u: 40, v: 16, w: 4, h: 12, d: 4 },
  leg: { u: 0, v: 16, w: 4, h: 12, d: 4 },
};

function rng(seed) { let x = seed || 1; return () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; }; }
const hex = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

function paintPart(img, part, rows, mat, rand, opt = {}) {
  const { u, v, w, h, d } = part;
  const [y0, y1] = rows;
  const B = hex(mat.base), Lt = hex(mat.light), Dk = hex(mat.dark);
  const put = (x, y, c, a = 255) => {
    if (x < 0 || y < 0 || x >= 64 || y >= 32) return;
    const i = (y * 64 + x) * 4; const j = (rand() - 0.5) * 18;
    img[i] = Math.max(0, Math.min(255, c[0] + j)); img[i + 1] = Math.max(0, Math.min(255, c[1] + j)); img[i + 2] = Math.max(0, Math.min(255, c[2] + j)); img[i + 3] = a;
  };
  const side = (fx, fy, fw, isFront) => {
    for (let y = y0; y < y1; y++) for (let x = 0; x < fw; x++) {
      if (opt.visor && isFront && y >= 3 && y <= 6 && x >= 1 && x < fw - 1) continue;
      if (mat.holes && (x + y) % 3 === 0 && y > y0 && y < y1 - 1) continue;
      let c = B;
      if (y === y0) c = Lt; else if (y === y1 - 1) c = Dk; else if (x === 0 || x === fw - 1) c = Dk;
      if (mat.sparkle && rand() < 0.08) c = Lt;
      if (mat.stripe && isFront && opt.stripe && x >= Math.floor(fw / 2) - 1 && x <= Math.floor(fw / 2) && y > y0 && y < y1 - 1) c = hex(mat.stripe);
      put(fx + x, fy + y, c);
    }
  };
  side(u, v + d, d, false);
  side(u + d, v + d, w, true);
  side(u + d + w, v + d, d, false);
  side(u + 2 * d + w, v + d, w, false);
  const cap = (fx, fy) => { for (let y = 0; y < d; y++) for (let x = 0; x < w; x++) put(fx + x, fy + y, x === 0 || y === 0 || x === w - 1 || y === d - 1 ? Dk : B); };
  if (y0 === 0) cap(u + d, v);
  if (y1 === h) cap(u + d + w, v);
}

const texCache = new Map();
function makeLayer(setKey, layer) {
  const key = `${setKey}:${layer}`;
  if (texCache.has(key)) return texCache.get(key);
  const mat = ARMOR_SETS[setKey];
  const c = document.createElement('canvas'); c.width = 64; c.height = 32;
  const ctx = c.getContext('2d'); const id = ctx.createImageData(64, 32);
  const rand = rng(setKey.length * 977 + layer * 31);
  if (layer === 1) {
    paintPart(id.data, PARTS.head, [0, 8], mat, rand, { visor: true });
    paintPart(id.data, PARTS.body, [0, 12], mat, rand, { stripe: true });
    paintPart(id.data, PARTS.arm, [0, 8], mat, rand);
    paintPart(id.data, PARTS.leg, [8, 12], mat, rand);
  } else {
    paintPart(id.data, PARTS.body, [7, 12], mat, rand);
    paintPart(id.data, PARTS.leg, [0, 10], mat, rand);
  }
  ctx.putImageData(id, 0, 0);
  const url = c.toDataURL('image/png');
  texCache.set(key, url);
  return url;
}

function setUVs(geo, { u, v, w, h, d }, tw, th) {
  const f = (x1, y1, x2, y2) => [[x1 / tw, 1 - y2 / th], [x2 / tw, 1 - y2 / th], [x2 / tw, 1 - y1 / th], [x1 / tw, 1 - y1 / th]];
  const top = f(u + d, v, u + w + d, v + d);
  const bottom = f(u + w + d, v, u + w * 2 + d, v + d);
  const left = f(u, v + d, u + d, v + d + h);
  const front = f(u + d, v + d, u + w + d, v + d + h);
  const right = f(u + w + d, v + d, u + w + d * 2, v + h + d);
  const back = f(u + w + d * 2, v + d, u + w * 2 + d * 2, v + h + d);
  const o = (a, order) => order.map((i) => a[i]);
  const all = [o(right, [3, 2, 0, 1]), o(left, [3, 2, 0, 1]), o(top, [3, 2, 0, 1]), o(bottom, [0, 1, 3, 2]), o(front, [3, 2, 0, 1]), o(back, [3, 2, 0, 1])].flat(2);
  geo.attributes.uv.set(new Float32Array(all)); geo.attributes.uv.needsUpdate = true;
}

const loader = new THREE.TextureLoader();
function loadTex(url) {
  return new Promise((res, rej) => loader.load(url, (t) => { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; res(t); }, undefined, rej));
}

function box(part, inflate, mat, tw, th) {
  const g = new THREE.BoxGeometry(part.w + inflate * 2, part.h + inflate * 2, part.d + inflate * 2);
  setUVs(g, part, tw, th);
  return new THREE.Mesh(g, mat);
}

export async function buildArmor(skin, cfg) {
  removeArmor(skin);
  const want = Object.keys(ARMOR_SLOTS).filter((k) => cfg[k] && cfg[k] !== 'none');
  if (!want.length) return;
  const mats = new Map();
  const material = async (setKey, layer) => {
    const key = `${setKey}:${layer}`;
    if (mats.has(key)) return mats.get(key);
    let url;
    if (setKey === 'custom') url = layer === 1 ? cfg.custom1 : (cfg.custom2 || cfg.custom1);
    else url = makeLayer(setKey, layer);
    if (!url) return null;
    const tex = await loadTex(url);
    const tw = tex.image.width, th = tex.image.height;
    const m = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide, roughness: setKey === 'leather' ? 0.9 : 0.45, metalness: ['iron', 'gold', 'netherite', 'chain'].includes(setKey) ? 0.35 : 0.05, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    if (ARMOR_SETS[setKey]?.tint) m.color = new THREE.Color(cfg.color || '#a0663a');
    const out = { m, tw: 64, th: th === tw ? 64 : 32 };
    mats.set(key, out);
    return out;
  };
  const add = (parent, mesh, pos) => { mesh.name = 'cnd-armor'; mesh.position.set(...pos); parent.add(mesh); };
  if (cfg.helmet !== 'none') {
    const m = await material(cfg.helmet, 1);
    if (m) add(skin.head, box(PARTS.head, 1, m.m, m.tw, m.th), [0, 4, 0]);
  }
  if (cfg.chest !== 'none') {
    const m = await material(cfg.chest, 1);
    if (m) {
      add(skin.body, box(PARTS.body, 1, m.m, m.tw, m.th), [0, 0, 0]);
      add(skin.rightArm, box(PARTS.arm, 1, m.m, m.tw, m.th), [-1, -4, 0]);
      const la = box(PARTS.arm, 1, m.m, m.tw, m.th); la.scale.x = -1; add(skin.leftArm, la, [1, -4, 0]);
    }
  }
  if (cfg.legs !== 'none') {
    const m = await material(cfg.legs, 2);
    if (m) {
      add(skin.body, box(PARTS.body, 0.5, m.m, m.tw, m.th), [0, 0, 0]);
      add(skin.rightLeg, box(PARTS.leg, 0.5, m.m, m.tw, m.th), [0, -6, 0]);
      const ll = box(PARTS.leg, 0.5, m.m, m.tw, m.th); ll.scale.x = -1; add(skin.leftLeg, ll, [0, -6, 0]);
    }
  }
  if (cfg.boots !== 'none') {
    const m = await material(cfg.boots, 1);
    if (m) {
      add(skin.rightLeg, box(PARTS.leg, 1, m.m, m.tw, m.th), [0, -6, 0]);
      const lb = box(PARTS.leg, 1, m.m, m.tw, m.th); lb.scale.x = -1; add(skin.leftLeg, lb, [0, -6, 0]);
    }
  }
}

export function removeArmor(skin) {
  if (!skin) return;
  const list = [];
  skin.traverse((o) => { if (o.name === 'cnd-armor') list.push(o); });
  list.forEach((o) => { o.parent?.remove(o); o.geometry?.dispose(); });
}

export async function readArmorFile(file) {
  if (!/^image\/png$/.test(file.type) && !/\.png$/i.test(file.name)) throw new Error('Нужна PNG-текстура брони');
  if (file.size > 1024 * 1024) throw new Error('Текстура больше 1 МБ');
  const url = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
  const img = new Image(); img.src = url; await img.decode();
  if (img.width !== img.height * 2 && img.width !== img.height) throw new Error('Текстура брони должна быть 64×32 (как layer_1 / layer_2) или квадратной');
  return url;
}
