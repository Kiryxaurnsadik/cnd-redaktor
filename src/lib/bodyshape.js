// Если крадёте, то крадите ради реально хороших людей
import * as THREE from 'three';

const D = Math.PI / 180;

export const TORSO_TYPES = {
  neutral: { label: 'Нейтральная', shoulders: 1, chest: 1, waist: 1, hips: 1, depth: 1 },
  slim: { label: 'Стройная', shoulders: 0.94, chest: 0.92, waist: 0.82, hips: 0.9, depth: 0.92 },
  hourglass: { label: 'Песочные часы', shoulders: 1, chest: 1, waist: 0.78, hips: 1.06, depth: 1 },
  pear: { label: 'Груша', shoulders: 0.92, chest: 0.94, waist: 0.84, hips: 1.12, depth: 1 },
  athletic: { label: 'Атлетичная', shoulders: 1.1, chest: 1.06, waist: 0.92, hips: 0.94, depth: 1.04 },
  broad: { label: 'Крупная', shoulders: 1.14, chest: 1.12, waist: 1.08, hips: 1.06, depth: 1.12 },
};

export const DEFAULT_BODY = { bust: 0, separation: 0, height: 0, depth: 0, rotation: 0, torso: 'neutral', strength: 0.7, overlay: true };

function boxUVs(box, u, v, w, h, d) {
  const T = 64;
  const face = (x1, y1, x2, y2) => [[x1 / T, 1 - y2 / T], [x2 / T, 1 - y2 / T], [x2 / T, 1 - y1 / T], [x1 / T, 1 - y1 / T]];
  const top = face(u + d, v, u + w + d, v + d);
  const bottom = face(u + w + d, v, u + w * 2 + d, v + d);
  const left = face(u, v + d, u + d, v + d + h);
  const front = face(u + d, v + d, u + w + d, v + d + h);
  const right = face(u + w + d, v + d, u + w + d * 2, v + h + d);
  const back = face(u + w + d * 2, v + d, u + w * 2 + d * 2, v + h + d);
  const order = [
    [right[3], right[2], right[0], right[1]], [left[3], left[2], left[0], left[1]],
    [top[3], top[2], top[0], top[1]], [bottom[0], bottom[1], bottom[3], bottom[2]],
    [front[3], front[2], front[0], front[1]], [back[3], back[2], back[0], back[1]],
  ];
  box.attributes.uv.set(new Float32Array(order.flat(2)));
  box.attributes.uv.needsUpdate = true;
}

function subdivide(orig, seg) {
  const p = orig.parameters;
  const g = new THREE.BoxGeometry(p.width, p.height, p.depth, 1, seg, 1);
  const ou = orig.attributes.uv.array; const nu = g.attributes.uv.array;
  const faces = [[1, seg], [1, seg], [1, 1], [1, 1], [1, seg], [1, seg]];
  let n = 0;
  faces.forEach(([gx, gy], f) => {
    const c = (X, Y) => [ou[(4 * f + Y * 2 + X) * 2], ou[(4 * f + Y * 2 + X) * 2 + 1]];
    const c00 = c(0, 0), c10 = c(1, 0), c01 = c(0, 1), c11 = c(1, 1);
    for (let iy = 0; iy <= gy; iy++) for (let ix = 0; ix <= gx; ix++) {
      const s = ix / gx, t = iy / gy;
      for (let k = 0; k < 2; k++) {
        const a = c00[k] + (c10[k] - c00[k]) * s, b = c01[k] + (c11[k] - c01[k]) * s;
        nu[n * 2 + k] = a + (b - a) * t;
      }
      n++;
    }
  });
  g.attributes.uv.needsUpdate = true;
  g.userData.base = Float32Array.from(g.attributes.position.array);
  return g;
}

function profile(t, y, half) {
  const k = (y + half) / (2 * half);
  const pts = [[0, t.hips], [0.42, t.waist], [0.72, t.chest], [1, t.shoulders]];
  for (let i = 1; i < pts.length; i++) {
    if (k <= pts[i][0]) {
      const [x0, v0] = pts[i - 1], [x1, v1] = pts[i];
      const s = (k - x0) / (x1 - x0); const e = s * s * (3 - 2 * s);
      return v0 + (v1 - v0) * e;
    }
  }
  return t.shoulders;
}

function shapeGeometry(g, type, strength) {
  const pos = g.attributes.position.array; const base = g.userData.base;
  const half = g.parameters.height / 2;
  const mix = (v) => 1 + (v - 1) * strength;
  const dz = mix(type.depth);
  for (let i = 0; i < pos.length; i += 3) {
    const fx = mix(profile(type, base[i + 1], half));
    pos[i] = base[i] * fx; pos[i + 1] = base[i + 1]; pos[i + 2] = base[i + 2] * dz;
  }
  g.attributes.position.needsUpdate = true;
  g.computeBoundingSphere();
}

function makeBreast(skin, side) {
  const u = side < 0 ? 16 : 20;
  const inner = new THREE.BoxGeometry(4, 5, 4); boxUVs(inner, u, 17, 4, 5, 4); inner.translate(0, -2.5, -2);
  const outer = new THREE.BoxGeometry(4.5, 5.5, 4.5); boxUVs(outer, u, 33, 4, 5, 4); outer.translate(0, -2.5, -2);
  const g = new THREE.Group(); g.name = 'cnd-breast';
  const m1 = new THREE.Mesh(inner, skin.layer1Material);
  const m2 = new THREE.Mesh(outer, skin.layer2Material);
  m2.name = 'overlay';
  g.add(m1, m2);
  return g;
}

export function applyBody(skin, cfg = DEFAULT_BODY) {
  const body = skin.body; if (!body) return;
  const [inner, outer] = [body.innerLayer, body.outerLayer];
  for (const m of [inner, outer]) {
    if (!m.userData.cndShaped) {
      m.userData.orig = m.geometry;
      m.geometry = subdivide(m.geometry, 12);
      m.userData.cndShaped = true;
    }
  }
  const type = TORSO_TYPES[cfg.torso] || TORSO_TYPES.neutral;
  const strength = cfg.torso === 'neutral' ? 0 : cfg.strength;
  shapeGeometry(inner.geometry, type, strength);
  shapeGeometry(outer.geometry, type, strength);

  const sh = 1 + (type.shoulders - 1) * strength;
  const spread = (sh - 1) * 4;
  skin.rightArm.position.x = -5 - spread;
  skin.leftArm.position.x = 5 + spread;

  let pair = body.getObjectByName('cnd-breasts');
  if (!pair) {
    pair = new THREE.Group(); pair.name = 'cnd-breasts';
    pair.add(makeBreast(skin, -1), makeBreast(skin, 1));
    body.add(pair);
  }
  const size = Math.max(0, Math.min(1, cfg.bust));
  pair.visible = size > 0.01;
  const chestW = 1 + (type.chest - 1) * strength;
  const frontZ = 2 * (1 + (type.depth - 1) * strength);
  pair.children.forEach((b, i) => {
    const side = i === 0 ? -1 : 1;
    b.position.set(side * (2 * chestW + cfg.separation), 5 + cfg.height * -1, frontZ + cfg.depth);
    b.rotation.set(-(size * 38) * D, side * cfg.rotation * D, 0, 'YXZ');
    b.scale.set(chestW, 1, 1);
    b.getObjectByName('overlay').visible = cfg.overlay !== false;
  });
}

export function resetBody(skin) {
  const body = skin?.body; if (!body) return;
  for (const m of [body.innerLayer, body.outerLayer]) {
    if (m?.userData.cndShaped) { m.geometry.dispose(); m.geometry = m.userData.orig; m.userData.cndShaped = false; }
  }
  const pair = body.getObjectByName('cnd-breasts');
  if (pair) { pair.traverse((o) => o.geometry?.dispose?.()); body.remove(pair); }
}
