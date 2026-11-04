// Быстрое превью документа без Konva (для карточек шаблонов)
import { loadImage } from './util.js';

const cache = new Map();

export async function docThumb(doc, key, maxSide = 360) {
  if (key && cache.has(key)) return cache.get(key);
  const k = maxSide / Math.max(doc.width, doc.height);
  const c = document.createElement('canvas');
  c.width = Math.round(doc.width * k); c.height = Math.round(doc.height * k);
  const ctx = c.getContext('2d');
  // Сначала догружаем шрифты шаблона, иначе превью нарисуется системным шрифтом
  const fonts = new Set(doc.elements.filter((e) => e.type === 'text').map((e) => `${(e.fontStyle || '').includes('italic') ? 'italic ' : ''}${(e.fontStyle || '').includes('bold') ? '700' : '400'} 32px "${e.fontFamily}"`));
  await Promise.all([...fonts].map((f) => document.fonts?.load(f, 'АаЯя Aa').catch(() => {})));
  ctx.scale(k, k);
  ctx.fillStyle = doc.background || '#fff'; ctx.fillRect(0, 0, doc.width, doc.height);
  for (const e of doc.elements) {
    if (e.visible === false) continue;
    ctx.save(); ctx.globalAlpha = e.opacity ?? 1;
    ctx.translate(e.x, e.y); ctx.rotate(((e.rotation || 0) * Math.PI) / 180);
    if (e.type === 'rect' || e.type === 'placeholder') {
      ctx.fillStyle = e.fill; ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(0, 0, e.width, e.height, e.cornerRadius || 0); else ctx.rect(0, 0, e.width, e.height);
      ctx.fill();
      if (e.stroke && e.strokeWidth) { ctx.strokeStyle = e.stroke; ctx.lineWidth = e.strokeWidth; ctx.stroke(); }
    } else if (e.type === 'ellipse') {
      ctx.fillStyle = e.fill; ctx.beginPath(); ctx.ellipse(e.width / 2, e.height / 2, e.width / 2, e.height / 2, 0, 0, Math.PI * 2); ctx.fill();
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
      lines.forEach((ln, i) => ctx.fillText(ln, ax, e.fontSize * (0.9 + i * (e.lineHeight || 1.2))));
    } else if (e.type === 'image' && e.src) {
      try { const img = await loadImage(e.src); ctx.drawImage(img, 0, 0, e.width, e.height); } catch { /* пропуск */ }
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
