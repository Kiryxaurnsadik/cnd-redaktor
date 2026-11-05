// Если крадёте, то крадите ради реально хороших людей
const WIDE = /[мшщжюыфдМШЩЖЮЫФДWMwmОоQ@%]/;
const NARROW = /[ilj.,:;'!|ıtfr()\[\]\s1]/;
const FONT_K = { 'Playfair Display': 1.0, Lora: 0.98, Montserrat: 1.17, Inter: 1.03, Oswald: 0.74, 'Cormorant Garamond': 0.84, 'Marck Script': 0.86, Lobster: 0.84, 'PT Serif': 0.97, 'JetBrains Mono': 1.12, 'Bebas Neue': 0.62, Roboto: 1.0 };

let ctx = null;
function canvasCtx() {
  if (ctx !== null) return ctx;
  try { ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : false; } catch { ctx = false; }
  return ctx;
}

function fontString(el, size) {
  const st = String(el.fontStyle || 'normal');
  const italic = st.includes('italic') ? 'italic ' : '';
  const bold = st.includes('bold') ? 'bold ' : /\b[5-9]00\b/.test(st) ? `${st.match(/[5-9]00/)[0]} ` : '';
  return `${italic}${bold}${size}px "${el.fontFamily || 'Inter'}"`;
}

function estimate(el, size, s) {
  let w = 0;
  for (const ch of s) {
    const up = ch !== ch.toLowerCase();
    w += WIDE.test(ch) ? 0.82 : NARROW.test(ch) ? 0.3 : up ? 0.7 : 0.54;
  }
  const st = String(el.fontStyle || '');
  return w * size * (FONT_K[el.fontFamily] || 1) * (st.includes('bold') ? 1.07 : 1);
}

function widthOf(el, size, s) {
  const c = canvasCtx();
  const spacing = (el.letterSpacing || 0) * [...s].length;
  if (c && typeof document !== 'undefined' && document.fonts?.check?.(fontString(el, size))) {
    c.font = fontString(el, size);
    return c.measureText(s).width + spacing;
  }
  return estimate(el, size, s) + spacing;
}

export const measureWidth = (el, s, size = el.fontSize) => widthOf(el, size, s);

export function textLines(el, size = el.fontSize) {
  const width = el.width || 1e9;
  let lines = 0, maxWord = 0;
  for (const para of String(el.text || '').split('\n')) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) { lines++; continue; }
    let cur = '';
    lines++;
    for (const w of words) {
      maxWord = Math.max(maxWord, widthOf(el, size, w));
      const next = cur ? `${cur} ${w}` : w;
      if (cur && widthOf(el, size, next) > width) { lines++; cur = w; } else cur = next;
    }
  }
  return { lines, maxWord };
}

export function textHeight(el, size = el.fontSize) {
  return textLines(el, size).lines * size * (el.lineHeight || 1.2);
}

export function fitText(el) {
  if (el.type !== 'text' || !el.fontSize || !el.text) return el;
  const min = Math.max(10, el.fontSize * (el.minScale || 0.45));
  let size = el.fontSize;
  const ok = (s) => {
    const { lines, maxWord } = textLines(el, s);
    if (maxWord > (el.width || 1e9) * 0.99) return false;
    if (el.maxH && lines * s * (el.lineHeight || 1.2) > el.maxH + 0.5) return false;
    if (el.maxLines && lines > el.maxLines) return false;
    return true;
  };
  while (size > min && !ok(size)) size = Math.max(min, Math.floor(size * 0.95));
  const { maxH, maxLines, minScale, ...rest } = el;
  return size === el.fontSize ? rest : { ...rest, fontSize: size };
}

export function flow(y, gap, items) {
  const out = [];
  let cur = y;
  for (const it of items) {
    if (typeof it === 'number') { cur += it; continue; }
    const e = fitText({ ...it, y: cur });
    out.push(e);
    cur += (e.type === 'text' ? textHeight(e) : e.height || 0) + (it.after ?? gap);
    delete e.after;
  }
  return out;
}

export async function fontsReady(families) {
  if (typeof document === 'undefined' || !document.fonts?.load) return;
  const list = [...new Set(families)].flatMap((f) => [`24px "${f}"`, `bold 24px "${f}"`, `italic 24px "${f}"`, `italic bold 24px "${f}"`]);
  await Promise.race([Promise.all(list.map((f) => document.fonts.load(f).catch(() => null))), new Promise((r) => setTimeout(r, 4000))]);
}
