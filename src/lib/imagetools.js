// Если крадёте, то крадите ради реально хороших людей
import { loadImage } from './util.js';

const MAX_SIDE = 3200;

async function toCanvas(src, maxSide = 2400) {
  const img = await loadImage(src);
  const k = Math.min(1, maxSide / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

function dist(d, i, r, g, b) {
  const dr = d[i] - r, dg = d[i + 1] - g, db = d[i + 2] - b;
  const rm = (d[i] + r) / 2;
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db) / 3;
}

function borderColors(d, w, h) {
  const bins = new Map();
  const add = (x, y) => {
    const i = (y * w + x) * 4; if (d[i + 3] < 16) return;
    const key = ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4);
    const b = bins.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    b.n++; b.r += d[i]; b.g += d[i + 1]; b.b += d[i + 2]; bins.set(key, b);
  };
  const step = Math.max(1, Math.floor((w + h) / 800));
  for (let x = 0; x < w; x += step) { add(x, 0); add(x, h - 1); }
  for (let y = 0; y < h; y += step) { add(0, y); add(w - 1, y); }
  const all = [...bins.values()].sort((a, b) => b.n - a.n);
  const total = all.reduce((s, b) => s + b.n, 0) || 1;
  const out = []; let acc = 0;
  for (const b of all) {
    if (b.n / total < 0.04 || out.length >= 6) break;
    out.push([b.r / b.n, b.g / b.n, b.b / b.n]); acc += b.n / total;
    if (acc > 0.9) break;
  }
  return out;
}

export async function removeBackground(src, { tolerance = 40, feather = 1, picks = [], everywhere = false, auto = true, islands = true } = {}) {
  const c = await toCanvas(src);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const w = c.width, h = c.height, N = w * h;
  const img = ctx.getImageData(0, 0, w, h); const d = img.data;
  const refs = [...(auto ? borderColors(d, w, h) : []), ...picks.map((p) => p.color)];
  if (!refs.length) return c.toDataURL('image/png');

  const near = (i, tol) => { for (const r of refs) if (dist(d, i * 4, r[0], r[1], r[2]) <= tol) return true; return false; };
  const bg = new Uint8Array(N);
  if (everywhere) {
    for (let i = 0; i < N; i++) if (d[i * 4 + 3] < 16 || near(i, tolerance)) bg[i] = 1;
  } else {
    const q = new Int32Array(N); let qh = 0, qt = 0;
    const push = (i) => { if (!bg[i]) { bg[i] = 1; q[qt++] = i; } };
    const seed = (i) => { if (d[i * 4 + 3] < 16 || near(i, tolerance)) push(i); };
    if (auto) {
      for (let x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
      for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
    }
    for (const p of picks) { const i = Math.min(N - 1, Math.max(0, Math.round(p.y * (h - 1)) * w + Math.round(p.x * (w - 1)))); push(i); }
    const soft = tolerance * 0.35, far = tolerance * 2.2;
    while (qh < qt) {
      const i = q[qh++]; const x = i % w, y = (i / w) | 0; const pi = i * 4;
      const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1];
      for (const j of nb) {
        if (j < 0 || bg[j]) continue;
        const pj = j * 4;
        if (d[pj + 3] < 16 || near(j, tolerance)) { push(j); continue; }
        if (dist(d, pj, d[pi], d[pi + 1], d[pi + 2]) <= soft && near(j, far)) push(j);
      }
    }
  }

  if (islands) {
    const lab = new Int32Array(N).fill(-1); const q = new Int32Array(N); const minSize = Math.max(16, N * 0.0015);
    for (let s = 0; s < N; s++) {
      if (bg[s] || lab[s] !== -1) continue;
      let qh = 0, qt = 0; q[qt++] = s; lab[s] = s;
      while (qh < qt) {
        const i = q[qh++]; const x = i % w;
        const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w];
        for (const j of nb) if (j >= 0 && j < N && !bg[j] && lab[j] === -1) { lab[j] = s; q[qt++] = j; }
      }
      if (qt < minSize) for (let k = 0; k < qt; k++) bg[q[k]] = 1;
    }
  }

  let alpha = new Float32Array(N);
  for (let i = 0; i < N; i++) alpha[i] = bg[i] ? 0 : d[i * 4 + 3] / 255;
  const r = Math.round(feather);
  if (r > 0) {
    const tmp = new Float32Array(N);
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < h; y++) {
        let s = 0; const row = y * w;
        for (let x = -r; x <= r; x++) s += alpha[row + Math.min(w - 1, Math.max(0, x))];
        for (let x = 0; x < w; x++) {
          tmp[row + x] = s / (2 * r + 1);
          s += alpha[row + Math.min(w - 1, x + r + 1)] - alpha[row + Math.max(0, x - r)];
        }
      }
      for (let x = 0; x < w; x++) {
        let s = 0;
        for (let y = -r; y <= r; y++) s += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
        for (let y = 0; y < h; y++) {
          alpha[y * w + x] = s / (2 * r + 1);
          s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
        }
      }
    }
    for (let i = 0; i < N; i++) {
      const t = Math.min(1, Math.max(0, (alpha[i] - 0.2) / 0.6));
      alpha[i] = Math.min(t * t * (3 - 2 * t), d[i * 4 + 3] / 255);
    }
  }

  const ref = refs[0];
  for (let i = 0; i < N; i++) {
    const a = Math.min(1, Math.max(0, alpha[i])); const p = i * 4;
    if (a > 0 && a < 1) {
      for (let k = 0; k < 3; k++) d[p + k] = Math.min(255, Math.max(0, (d[p + k] - (1 - a) * ref[k]) / a));
    }
    d[p + 3] = Math.round(a * 255);
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}

export async function pickColor(src, fx, fy) {
  const c = await toCanvas(src);
  const x = Math.round(fx * (c.width - 1)), y = Math.round(fy * (c.height - 1));
  const p = c.getContext('2d', { willReadFrequently: true }).getImageData(x, y, 1, 1).data;
  return [p[0], p[1], p[2]];
}

function scale2x(src) {
  const w = src.width, h = src.height;
  const s = new Uint32Array(src.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data.buffer);
  const o = document.createElement('canvas'); o.width = w * 2; o.height = h * 2;
  const octx = o.getContext('2d'); const out = octx.createImageData(w * 2, h * 2);
  const t = new Uint32Array(out.data.buffer); const W = w * 2;
  const at = (x, y) => s[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1);
    let e0 = P, e1 = P, e2 = P, e3 = P;
    if (A !== D && C !== B) {
      if (C === A) e0 = A; if (A === B) e1 = B; if (D === C) e2 = C; if (B === D) e3 = D;
    }
    const i = y * 2 * W + x * 2;
    t[i] = e0; t[i + 1] = e1; t[i + W] = e2; t[i + W + 1] = e3;
  }
  octx.putImageData(out, 0, 0);
  return o;
}

function unsharp(c, amount, radius) {
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const w = c.width, h = c.height;
  const img = ctx.getImageData(0, 0, w, h); const d = img.data;
  const b = document.createElement('canvas'); b.width = w; b.height = h;
  const bctx = b.getContext('2d', { willReadFrequently: true });
  bctx.filter = `blur(${radius}px)`; bctx.drawImage(c, 0, 0);
  const bl = bctx.getImageData(0, 0, w, h).data;
  for (let i = 0; i < d.length; i += 4) {
    for (let k = 0; k < 3; k++) {
      const diff = d[i + k] - bl[i + k];
      if (Math.abs(diff) > 2) d[i + k] = Math.min(255, Math.max(0, d[i + k] + diff * amount));
    }
  }
  ctx.putImageData(img, 0, 0);
}

export const UPSCALE_MODES = {
  photo: 'Фото и скриншоты + резкость',
  pixel: 'Пиксель-арт, чёткие пиксели',
  smooth: 'Пиксель-арт, сглаженные края',
};

export async function upscaleImage(src, factor = 2, mode = 'photo') {
  const img = await loadImage(src);
  const f = Math.max(1, Math.min(factor, MAX_SIDE / Math.max(img.width, img.height)));
  const W = Math.round(img.width * f), H = Math.round(img.height * f);
  let c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  c.getContext('2d').drawImage(img, 0, 0);
  if (mode === 'smooth') {
    while (c.width * 2 <= W + 1) c = scale2x(c);
  } else if (mode === 'photo') {
    while (c.width * 2 <= W) {
      const n = document.createElement('canvas'); n.width = c.width * 2; n.height = c.height * 2;
      const nctx = n.getContext('2d'); nctx.imageSmoothingEnabled = true; nctx.imageSmoothingQuality = 'high';
      nctx.drawImage(c, 0, 0, n.width, n.height); c = n;
    }
  }
  const o = document.createElement('canvas'); o.width = W; o.height = H;
  const octx = o.getContext('2d', { willReadFrequently: true });
  octx.imageSmoothingEnabled = mode === 'photo'; octx.imageSmoothingQuality = 'high';
  octx.drawImage(c, 0, 0, W, H);
  if (mode === 'photo') unsharp(o, 0.7, Math.max(0.8, f * 0.45));
  const opaque = !/^data:image\/(png|webp)/.test(src) && mode === 'photo';
  return { src: opaque ? o.toDataURL('image/jpeg', 0.92) : o.toDataURL('image/png'), width: W, height: H, factor: f };
}
