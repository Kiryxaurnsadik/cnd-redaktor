// Если крадёте, то крадите ради реально хороших людей
import { cssFilter, scalePath } from './pathscale.js';
import { maskPath } from './elements.js';
import { loadImage } from './util.js';

function paint(ctx, e, w, h, ox = 0, oy = 0) {
  const g = e.gradient;
  if (!g) return e.fill;
  if (g.type === 'radial') {
    const gr = ctx.createRadialGradient(ox + w / 2, oy + h / 2, 0, ox + w / 2, oy + h / 2, Math.max(w, h) / 2);
    gr.addColorStop(0, g.from); gr.addColorStop(1, g.to); return gr;
  }
  const a = ((g.angle || 0) * Math.PI) / 180; const dx = Math.cos(a), dy = Math.sin(a);
  const L = Math.abs((w / 2) * dx) + Math.abs((h / 2) * dy);
  const gr = ctx.createLinearGradient(ox + w / 2 - dx * L, oy + h / 2 - dy * L, ox + w / 2 + dx * L, oy + h / 2 + dy * L);
  gr.addColorStop(0, g.from); gr.addColorStop(1, g.to); return gr;
}

function shadow(ctx, s) {
  if (!s) return;
  const o = s === true ? { color: '#000', blur: 12, x: 0, y: 0, opacity: 0.6 } : s;
  ctx.shadowColor = o.color || '#000'; ctx.shadowBlur = o.blur ?? 12; ctx.shadowOffsetX = o.x || 0; ctx.shadowOffsetY = o.y || 0;
}

function frameD(e) {
  if (e.clipPath) return scalePath(e.clipPath, e.clipVb, e.width, e.height);
  const d = maskPath(e.mask);
  return d ? scalePath(d, [0, 0, 100, 100], e.width, e.height) : null;
}

function frameBorder(ctx, e) {
  if (!e.frameStroke || !e.frameStrokeWidth) return;
  ctx.save(); ctx.strokeStyle = e.frameStroke; ctx.lineWidth = e.frameStrokeWidth;
  const d = frameD(e);
  if (d) ctx.stroke(new Path2D(d));
  else { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(0, 0, e.width, e.height, e.cornerRadius || 0); else ctx.rect(0, 0, e.width, e.height); ctx.stroke(); }
  ctx.restore();
}

const cache = new Map();

const SAMPLES = { city: './samples/city.jpg', street: './samples/street.jpg', event: './samples/event.jpg', shop: './samples/shop.jpg' };
function sampleFor(e) {
  if (e.sample) return e.sample;
  const l = (e.label || '').toLowerCase();
  const hero = /персонаж|героя|голова/.test(l);
  const bg = /мероприят|афиш/.test(l) ? 'event' : /бизнес|товар/.test(l) ? 'shop' : /экран|разворот/.test(l) ? 'street' : 'city';
  return { bg: SAMPLES[bg], hero };
}
async function drawCover(ctx, src, w, h) {
  const img = await loadImage(src);
  const k = Math.max(w / img.width, h / img.height);
  const dw = img.width * k, dh = img.height * k;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}
async function drawSample(ctx, e) {
  const s = sampleFor(e);
  ctx.save(); ctx.beginPath();
  const d = frameD(e);
  if (d) ctx.clip(new Path2D(d), 'evenodd');
  else { if (ctx.roundRect) ctx.roundRect(0, 0, e.width, e.height, e.cornerRadius || 0); else ctx.rect(0, 0, e.width, e.height); ctx.clip(); }
  try {
    const f = cssFilter(e.fx); if (f && 'filter' in ctx) ctx.filter = f;
    await drawCover(ctx, s.bg, e.width, e.height);
    if (s.hero) {
      const img = await loadImage('./samples/reporter.png');
      const k = Math.min(e.width / img.width, (e.height * 0.92) / img.height);
      ctx.drawImage(img, (e.width - img.width * k) / 2, e.height - img.height * k, img.width * k, img.height * k);
    }
  } catch { ctx.fillStyle = e.fill; ctx.fill(); }
  ctx.restore();
}

export async function docThumb(doc, key, maxSide = 360) {
  if (key && cache.has(key)) return cache.get(key);
  const k = maxSide / Math.max(doc.width, doc.height);
  const c = document.createElement('canvas');
  c.width = Math.round(doc.width * k); c.height = Math.round(doc.height * k);
  const ctx = c.getContext('2d');
  const fonts = new Set(doc.elements.filter((e) => e.type === 'text').map((e) => `${(e.fontStyle || '').includes('italic') ? 'italic ' : ''}${(e.fontStyle || '').includes('bold') ? '700' : '400'} 32px "${e.fontFamily}"`));
  await Promise.all([...fonts].map((f) => document.fonts?.load(f, 'АаЯя Aa').catch(() => {})));
  ctx.scale(k, k);
  ctx.fillStyle = doc.background || '#fff'; ctx.fillRect(0, 0, doc.width, doc.height);
  for (const e of doc.elements) {
    if (e.visible === false) continue;
    ctx.save(); ctx.globalAlpha = e.opacity ?? 1;
    ctx.translate(e.x, e.y); ctx.rotate(((e.rotation || 0) * Math.PI) / 180);
    if (e.type === 'placeholder') {
      await drawSample(ctx, e);
      frameBorder(ctx, e);
    } else if (e.type === 'rect') {
      ctx.fillStyle = paint(ctx, e, e.width, e.height); ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(0, 0, e.width, e.height, e.cornerRadius || 0); else ctx.rect(0, 0, e.width, e.height);
      ctx.save(); shadow(ctx, e.shadow); ctx.fill(); ctx.restore();
      if (e.stroke && e.strokeWidth) { ctx.strokeStyle = e.stroke; ctx.lineWidth = e.strokeWidth; ctx.stroke(); }
    } else if (e.type === 'ellipse') {
      ctx.fillStyle = paint(ctx, e, e.width, e.height); ctx.beginPath(); ctx.ellipse(e.width / 2, e.height / 2, e.width / 2, e.height / 2, 0, 0, Math.PI * 2); ctx.fill();
      if (e.stroke && e.strokeWidth) { ctx.strokeStyle = e.stroke; ctx.lineWidth = e.strokeWidth; ctx.stroke(); }
    } else if (e.type === 'line') {
      ctx.strokeStyle = e.stroke; ctx.lineWidth = e.strokeWidth; ctx.beginPath(); ctx.moveTo(e.points[0], e.points[1]); ctx.lineTo(e.points[2], e.points[3]); ctx.stroke();
    } else if (e.type === 'text') {
      ctx.fillStyle = e.fill;
      const style = (e.fontStyle || '').includes('italic') ? 'italic ' : '';
      const weight = (e.fontStyle || '').includes('bold') ? '700 ' : '400 ';
      ctx.font = `${style}${weight}${e.fontSize}px "${e.fontFamily}"`;
      if ('letterSpacing' in ctx) ctx.letterSpacing = `${e.letterSpacing || 0}px`;
      ctx.textAlign = e.align === 'center' ? 'center' : e.align === 'right' ? 'right' : 'left';
      const ax = e.align === 'center' ? e.width / 2 : e.align === 'right' ? e.width : 0;
      const lines = wrap(ctx, e.text, e.width);
      shadow(ctx, e.shadow);
      if (e.textStroke) { ctx.strokeStyle = e.textStroke; ctx.lineWidth = (e.textStrokeWidth || 2) * 2; ctx.lineJoin = 'round'; lines.forEach((ln, i) => ctx.strokeText(ln, ax, e.fontSize * (0.9 + i * (e.lineHeight || 1.2)))); }
      lines.forEach((ln, i) => ctx.fillText(ln, ax, e.fontSize * (0.9 + i * (e.lineHeight || 1.2))));
    } else if (e.type === 'shape' && e.path && typeof Path2D !== 'undefined') {
      const p = new Path2D(scalePath(e.path, e.vb, e.width, e.height, e.flipX, e.flipY));
      if (e.outline) { ctx.strokeStyle = e.fill; ctx.lineWidth = e.strokeWidth || 4; ctx.lineCap = 'round'; ctx.stroke(p); }
      else { ctx.fillStyle = paint(ctx, e, e.width, e.height); ctx.save(); shadow(ctx, e.shadow); ctx.fill(p, 'evenodd'); ctx.restore(); if (e.strokeWidth) { ctx.strokeStyle = e.stroke || '#000'; ctx.lineWidth = e.strokeWidth; ctx.stroke(p); } }
    } else if (e.type === 'chart' && (e.kind === 'pie' || e.kind === 'donut')) {
      const R = Math.min(e.width, e.height) * 0.38; const cx = e.width / 2, cy = R + 4; const tot = (e.data || []).reduce((s, d) => s + (Number(d.value) || 0), 0) || 1;
      let a0 = -Math.PI / 2;
      (e.data || []).forEach((d, i) => { const a = ((Number(d.value) || 0) / tot) * Math.PI * 2; ctx.fillStyle = e.colors?.[i % e.colors.length] || '#0B7CFC'; ctx.beginPath(); if (e.kind === 'donut') { ctx.arc(cx, cy, R, a0, a0 + a); ctx.arc(cx, cy, R * 0.58, a0 + a, a0, true); } else { ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a0 + a); } ctx.closePath(); ctx.fill(); a0 += a; });
    } else if (e.type === 'chart' && e.kind === 'progress') {
      const v = Math.max(0, Math.min(100, Number(e.data?.[0]?.value) || 0)); const th = e.height * 0.42;
      ctx.fillStyle = e.gridColor || '#D8DEE8'; ctx.fillRect(0, e.height - th, e.width, th); ctx.fillStyle = e.colors?.[0] || '#0B7CFC'; ctx.fillRect(0, e.height - th, (e.width * v) / 100, th);
    } else if (e.type === 'chart' || e.type === 'table') {

      ctx.fillStyle = e.type === 'table' ? (e.alt || '#eef4ff') : 'rgba(11,124,252,.12)'; ctx.fillRect(0, 0, e.width, e.height);
      ctx.fillStyle = e.type === 'table' ? (e.head || '#0B7CFC') : (e.colors?.[0] || '#0B7CFC');
      if (e.type === 'table') ctx.fillRect(0, 0, e.width, e.height / Math.max(1, e.cells?.length || 1));
      else (e.data || []).forEach((d, i, a) => { const bw = e.width / a.length; const mx = Math.max(1, ...a.map((x) => Number(x.value) || 0)); const bh = (e.height * 0.9 * (Number(d.value) || 0)) / mx; ctx.fillRect(i * bw + bw * 0.2, e.height - bh, bw * 0.6, bh); });
    } else if (e.type === 'image' && e.src) {
      try { const img = await loadImage(e.src); ctx.drawImage(img, 0, 0, e.width, e.height); } catch {}
    }
    ctx.restore();
  }
  const url = c.toDataURL('image/jpeg', 0.8);
  if (key) cache.set(key, url);
  return url;
}

function wrap(ctx, text, width) {
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const w of para.split(' ')) {
      const t = line ? `${line} ${w}` : w;
      if (ctx.measureText(t).width > width && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}
