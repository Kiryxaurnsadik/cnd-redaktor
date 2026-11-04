// Если крадёте, то крадите ради реально хороших людей
const ARGS = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };
const cache = new Map();

export function scalePath(d, vb, w, h, flipX = false, flipY = false) {
  const key = `${d}|${vb}|${w}|${h}|${flipX}|${flipY}`;
  const hit = cache.get(key); if (hit) return hit;
  const [vx, vy, vw, vh] = vb || [0, 0, 100, 100];
  const sx = (w / (vw || 1)) * (flipX ? -1 : 1), sy = (h / (vh || 1)) * (flipY ? -1 : 1);
  const tx = flipX ? w + vx * (w / vw) : -vx * sx, ty = flipY ? h + vy * (h / vh) : -vy * sy;
  const mirror = (sx < 0) !== (sy < 0);
  const tokens = String(d).match(/[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) || [];
  const out = []; let cmd = null; let i = 0;
  const r = (v) => Math.round(v * 100) / 100;
  while (i < tokens.length) {
    const t = tokens[i];
    if (/[a-zA-Z]/.test(t)) { cmd = t; i++; out.push(t); if (cmd.toLowerCase() === 'z') continue; }
    if (!cmd) { i++; continue; }
    const lc = cmd.toLowerCase(); const n = ARGS[lc]; const rel = cmd !== cmd.toUpperCase();
    if (!n) { i++; continue; }
    const a = tokens.slice(i, i + n).map(Number); i += n;
    if (a.length < n || a.some((v) => !Number.isFinite(v))) break;
    const X = (v) => r(v * sx + (rel ? 0 : tx)), Y = (v) => r(v * sy + (rel ? 0 : ty));
    switch (lc) {
      case 'h': out.push(X(a[0])); break;
      case 'v': out.push(Y(a[0])); break;
      case 'a': out.push(r(a[0] * Math.abs(sx)), r(a[1] * Math.abs(sy)), a[2], a[3], mirror ? 1 - a[4] : a[4], X(a[5]), Y(a[6])); break;
      default: for (let k = 0; k < n; k += 2) out.push(X(a[k]), Y(a[k + 1]));
    }
    if (lc === 'm') cmd = rel ? 'l' : 'L';
  }
  const res = out.join(' ');
  if (cache.size > 400) cache.clear();
  cache.set(key, res);
  return res;
}

export function gradientProps(g, w, h, centered = false) {
  if (!g) return {};
  const ox = centered ? -w / 2 : 0, oy = centered ? -h / 2 : 0;
  const stops = [0, g.from, 1, g.to];
  if (g.type === 'radial') {
    const c = { x: ox + w / 2, y: oy + h / 2 };
    return {
      fillPriority: 'radial-gradient', fillRadialGradientStartPoint: c, fillRadialGradientEndPoint: c,
      fillRadialGradientStartRadius: 0, fillRadialGradientEndRadius: Math.max(w, h) / 2, fillRadialGradientColorStops: stops,
    };
  }
  const a = ((g.angle || 0) * Math.PI) / 180; const dx = Math.cos(a), dy = Math.sin(a);
  const L = Math.abs((w / 2) * dx) + Math.abs((h / 2) * dy);
  const cx = ox + w / 2, cy = oy + h / 2;
  return {
    fillPriority: 'linear-gradient', fillLinearGradientStartPoint: { x: cx - dx * L, y: cy - dy * L },
    fillLinearGradientEndPoint: { x: cx + dx * L, y: cy + dy * L }, fillLinearGradientColorStops: stops,
  };
}

export function shadowProps(s) {
  if (!s) return {};
  const o = s === true ? { color: '#000000', blur: 12, x: 0, y: 0, opacity: 0.6 } : s;
  return { shadowColor: o.color || '#000000', shadowBlur: o.blur ?? 12, shadowOffsetX: o.x || 0, shadowOffsetY: o.y || 0, shadowOpacity: o.opacity ?? 0.6, shadowForStrokeEnabled: false };
}

export const FX_DEFAULT = { brightness: 100, contrast: 100, saturate: 100, hue: 0, blur: 0, grayscale: 0, sepia: 0, invert: 0 };

export function cssFilter(fx) {
  if (!fx) return '';
  const f = { ...FX_DEFAULT, ...fx }; const parts = [];
  if (f.brightness !== 100) parts.push(`brightness(${f.brightness / 100})`);
  if (f.contrast !== 100) parts.push(`contrast(${f.contrast / 100})`);
  if (f.saturate !== 100) parts.push(`saturate(${f.saturate / 100})`);
  if (f.hue) parts.push(`hue-rotate(${f.hue}deg)`);
  if (f.grayscale) parts.push(`grayscale(${f.grayscale / 100})`);
  if (f.sepia) parts.push(`sepia(${f.sepia / 100})`);
  if (f.invert) parts.push(`invert(${f.invert / 100})`);
  if (f.blur) parts.push(`blur(${f.blur}px)`);
  return parts.join(' ');
}

export const FX_PRESETS = [
  { id: 'none', name: 'Без фильтра', fx: {} },
  { id: 'bw', name: 'Ч/Б', fx: { grayscale: 100, contrast: 110 } },
  { id: 'noir', name: 'Нуар', fx: { grayscale: 100, contrast: 145, brightness: 90 } },
  { id: 'sepia', name: 'Сепия', fx: { sepia: 85, contrast: 105 } },
  { id: 'vintage', name: 'Винтаж', fx: { sepia: 40, saturate: 80, contrast: 90, brightness: 105 } },
  { id: 'warm', name: 'Тёплый', fx: { sepia: 22, saturate: 125, hue: -8 } },
  { id: 'cold', name: 'Холодный', fx: { saturate: 110, hue: 14, brightness: 102 } },
  { id: 'drama', name: 'Драма', fx: { contrast: 140, saturate: 120, brightness: 95 } },
  { id: 'fade', name: 'Выцветший', fx: { contrast: 80, saturate: 70, brightness: 112 } },
  { id: 'pop', name: 'Сочный', fx: { saturate: 170, contrast: 115 } },
];
