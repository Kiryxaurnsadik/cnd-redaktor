// Если крадёте, то крадите ради реально хороших людей
import { BRAND } from './brand.js';
import { loadImage } from './util.js';

function luminanceAt(ctx, x, y, w, h) {
  const d = ctx.getImageData(Math.max(0, x), Math.max(0, y), Math.max(1, w), Math.max(1, h)).data;
  let sum = 0, n = 0;
  for (let i = 0; i < d.length; i += 16) { sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; n++; }
  return n ? sum / n : 255;
}

export const WATERMARK_STYLES = {
  corner: 'Логотип в углу',
  signature: 'Логотип + подпись автора',
  band: 'Фирменная полоса снизу',
  stamp: 'Штамп «MADE IN CND»',
  tile: 'Узор из логотипов по всему фону',
  center: 'Крупный логотип по центру',
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
}

export async function applyWatermark(canvas, {
  draft = false, author = '', exportId = '', opacity = 0.85, corner = 'br', avoid = [], style = 'corner',
} = {}) {
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const W = canvas.width, H = canvas.height;
  const S = Math.min(W, H);
  const size = Math.round(S * 0.09);
  const margin = Math.round(size * 0.35);
  const left = corner.includes('l'), top = corner.includes('t');
  const x = left ? margin : W - size - margin;
  const y = top ? margin : H - size - margin;
  const dark = luminanceAt(ctx, x, y, size, size) < 110;
  const [icon, iconWhite] = await Promise.all([loadImage(BRAND.icon), loadImage(BRAND.iconWhite)]);
  const logo = dark ? iconWhite : icon;
  const covered = avoid.some((b) => b.width * b.height >= size * size * 0.5
    && x < b.x + b.width + margin && x + size + margin > b.x && y < b.y + b.height + margin && y + size + margin > b.y);
  const date = new Date().toLocaleDateString('ru-RU');
  const hits = (bx, by, bw, bh) => avoid.some((b) => bx < b.x + b.width && bx + bw > b.x && by < b.y + b.height && by + bh > b.y);
  const side = (bw, bh) => {
    let l = left;
    const at = (lf) => [lf ? margin : W - bw - margin, top ? margin : H - bh - margin];
    if (hits(...at(l), bw, bh) && !hits(...at(!l), bw, bh)) l = !l;
    return at(l);
  };

  ctx.save();
  ctx.globalAlpha = opacity;
  if (style === 'corner' && !covered) {
    ctx.drawImage(logo, x, y, size, size);
  } else if (style === 'signature') {
    const fs = Math.round(size * 0.28);
    ctx.font = `700 ${fs}px Inter, sans-serif`;
    const l1 = 'California NewsDay';
    const l2 = author ? `Автор: ${author}` : date;
    ctx.font = `700 ${fs}px Inter, sans-serif`; const w1 = ctx.measureText(l1).width;
    ctx.font = `400 ${fs * 0.85}px Inter, sans-serif`; const w2 = ctx.measureText(l2).width;
    const ls = size * 0.7, pad = size * 0.18;
    const bw = ls + pad * 3 + Math.max(w1, w2), bh = ls + pad * 2;
    const [bx, by] = side(bw, bh);
    ctx.fillStyle = 'rgba(3, 49, 111, 0.82)';
    roundRect(ctx, bx, by, bw, bh, bh / 2); ctx.fill();
    ctx.drawImage(iconWhite, bx + pad, by + pad, ls, ls);
    ctx.fillStyle = '#ffffff'; ctx.textBaseline = 'alphabetic';
    ctx.font = `700 ${fs}px Inter, sans-serif`; ctx.fillText(l1, bx + pad * 2 + ls, by + bh / 2 - fs * 0.12);
    ctx.font = `400 ${fs * 0.85}px Inter, sans-serif`; ctx.fillStyle = '#C9D8F0'; ctx.fillText(l2, bx + pad * 2 + ls, by + bh / 2 + fs * 0.95);
  } else if (style === 'band') {
    const bh = Math.max(36, Math.round(S * 0.065));
    const by = top ? 0 : H - bh;
    ctx.globalAlpha = Math.min(1, opacity + 0.05);
    ctx.fillStyle = '#03316F'; ctx.fillRect(0, by, W, bh);
    ctx.fillStyle = '#0B7CFC'; ctx.fillRect(0, top ? by + bh - bh * 0.08 : by, W, bh * 0.08);
    const ls = bh * 0.66;
    ctx.drawImage(iconWhite, bh * 0.3, by + (bh - ls) / 2, ls, ls);
    const fs = Math.round(bh * 0.36);
    ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${fs}px Montserrat, Inter, sans-serif`;
    ctx.fillText('CALIFORNIA NEWSDAY', bh * 0.45 + ls, by + bh / 2);
    ctx.font = `400 ${fs * 0.9}px Inter, sans-serif`; ctx.fillStyle = '#C9D8F0'; ctx.textAlign = 'right';
    ctx.fillText([author && `Автор: ${author}`, date].filter(Boolean).join(' · '), W - bh * 0.4, by + bh / 2);
  } else if (style === 'stamp') {
    const fs = Math.round(size * 0.3);
    ctx.font = `800 ${fs}px Montserrat, Inter, sans-serif`;
    const text = 'MADE IN CND';
    const tw = ctx.measureText(text).width;
    const bw = tw + size * 1.1, bh = size * 0.78;
    const [bx, by] = side(bw, bh);
    ctx.translate(bx + bw / 2, by + bh / 2); ctx.rotate(-6 * Math.PI / 180);
    const col = dark ? '#ffffff' : '#0B7CFC';
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, size * 0.05);
    roundRect(ctx, -bw / 2, -bh / 2, bw, bh, bh * 0.2); ctx.stroke();
    ctx.lineWidth = Math.max(1, size * 0.02);
    roundRect(ctx, -bw / 2 + size * 0.08, -bh / 2 + size * 0.08, bw - size * 0.16, bh - size * 0.16, bh * 0.14); ctx.stroke();
    const ls = bh * 0.55;
    ctx.drawImage(dark ? iconWhite : icon, -bw / 2 + size * 0.22, -ls / 2, ls, ls);
    ctx.fillStyle = col; ctx.textBaseline = 'middle';
    ctx.fillText(text, -bw / 2 + size * 0.3 + ls, 2);
  } else if (style === 'tile') {
    ctx.globalAlpha = 0.07 + opacity * 0.06;
    const step = size * 2.2, ls = size * 0.8;
    ctx.translate(W / 2, H / 2); ctx.rotate(-Math.PI / 8);
    const diag = Math.hypot(W, H);
    let row = 0;
    for (let yy = -diag / 2; yy < diag / 2; yy += step, row++) {
      for (let xx = -diag / 2 + (row % 2 ? step / 2 : 0); xx < diag / 2; xx += step) ctx.drawImage(logo, xx, yy, ls, ls);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = opacity;
    if (!covered) ctx.drawImage(logo, x, y, size, size);
  } else if (style === 'center') {
    const ls = S * 0.42;
    const cdark = luminanceAt(ctx, W / 2 - ls / 2, H / 2 - ls / 2, ls, ls) < 110;
    ctx.globalAlpha = 0.1 + opacity * 0.08;
    ctx.drawImage(cdark ? iconWhite : icon, (W - ls) / 2, (H - ls) / 2, ls, ls);
  }
  ctx.restore();

  if (draft) {
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = dark ? '#ffffff' : '#000000';
    const fs = Math.round(S * 0.06);
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
