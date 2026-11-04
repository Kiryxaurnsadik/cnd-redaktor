// Водяной знак ставится на готовую картинку при каждом экспорте и копировании.
// Стажёрам и неодобренным работам — крупная плитка «ЧЕРНОВИК CND».
import { BRAND } from './brand.js';
import { loadImage } from './util.js';

function luminanceAt(ctx, x, y, w, h) {
  const d = ctx.getImageData(Math.max(0, x), Math.max(0, y), Math.max(1, w), Math.max(1, h)).data;
  let sum = 0, n = 0;
  for (let i = 0; i < d.length; i += 16) { sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; n++; }
  return n ? sum / n : 255;
}

export async function applyWatermark(canvas, { draft = false, author = '', exportId = '', opacity = 0.85, corner = 'br', avoid = [] } = {}) {
  const ctx = canvas.getContext('2d');
  // Konva отдаёт холст с уже применённым масштабом — сбрасываем, чтобы рисовать в реальных пикселях
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const W = canvas.width, H = canvas.height;
  const size = Math.round(Math.min(W, H) * 0.09);
  const margin = Math.round(size * 0.35);
  // Если в этом углу уже стоит логотип CND из шаблона (не меньше самого знака) — второй знак не ставим
  const x = corner.includes('l') ? margin : W - size - margin;
  const y = corner.includes('t') ? margin : H - size - margin;
  const covered = avoid.some((b) => b.width * b.height >= size * size * 0.5
    && x < b.x + b.width + margin && x + size + margin > b.x && y < b.y + b.height + margin && y + size + margin > b.y);
  const dark = luminanceAt(ctx, x, y, size, size) < 110;
  if (!covered) {
    const logo = await loadImage(dark ? BRAND.iconWhite : BRAND.icon);
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.drawImage(logo, x, y, size, size);
    ctx.restore();
  }

  if (draft) {
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = dark ? '#ffffff' : '#000000';
    const fs = Math.round(Math.min(W, H) * 0.06);
    ctx.font = `800 ${fs}px Inter, sans-serif`;
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.PI / 6);
    const text = 'ЧЕРНОВИК CND';
    const tw = ctx.measureText(text).width + fs * 2;
    const diag = Math.hypot(W, H);
    for (let yy = -diag; yy < diag; yy += fs * 3) {
      for (let xx = -diag; xx < diag; xx += tw) ctx.fillText(text, xx + ((yy / (fs * 3)) % 2 ? tw / 2 : 0), yy);
    }
    ctx.restore();
  }

  // Невидимая метка: автор и номер экспорта зашиты в младшие биты синего канала первой строки
  if (exportId) embedMark(ctx, W, `CND|${author}|${exportId}`);
  return canvas;
}

function embedMark(ctx, W, text) {
  const bytes = new TextEncoder().encode(text.slice(0, 120));
  const bits = [];
  const len = bytes.length;
  for (let i = 7; i >= 0; i--) bits.push((len >> i) & 1);
  bytes.forEach((b) => { for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1); });
  const n = Math.min(bits.length, W);
  const img = ctx.getImageData(0, 0, n, 1);
  for (let i = 0; i < n; i++) img.data[i * 4 + 2] = (img.data[i * 4 + 2] & 0xfe) | bits[i];
  ctx.putImageData(img, 0, 0);
}

// Прочитать метку из картинки (для админки «Чья это работа?»). Работает только с PNG без пересжатия.
export async function readMark(src) {
  const img = await loadImage(src);
  const c = document.createElement('canvas'); c.width = img.width; c.height = 1;
  const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, img.width, 1).data;
  const bit = (i) => d[i * 4 + 2] & 1;
  let len = 0; for (let i = 0; i < 8; i++) len = (len << 1) | bit(i);
  const bytes = [];
  for (let b = 0; b < len; b++) { let v = 0; for (let i = 0; i < 8; i++) v = (v << 1) | bit(8 + b * 8 + i); bytes.push(v); }
  const text = new TextDecoder().decode(new Uint8Array(bytes));
  if (!text.startsWith('CND|')) return null;
  const [, author, exportId] = text.split('|');
  return { author, exportId };
}
