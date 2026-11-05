// Если крадёте, то крадите ради реально хороших людей
import { BRAND } from './brand.js';
import { uid } from './util.js';
import { withPages } from './pages.js';
import { fitText, textHeight } from './textfit.js';

const base = { opacity: 1, rotation: 0 };
const T = (o) => fitText({ type: 'text', fontFamily: 'PT Serif', fontSize: 30, fill: '#14181F', align: 'left', fontStyle: 'normal', lineHeight: 1.5, letterSpacing: 0, ...base, ...o });
const R = (o) => ({ type: 'rect', fill: '#0B7CFC', cornerRadius: 0, ...base, ...o });
const I = (o) => ({ type: 'image', ...base, ...o });
const P = (o) => ({ type: 'placeholder', fill: '#C9D3E0', label: 'Фото к статье', ...base, ...o });
const photoEl = (src, x, y, w, h, o = {}) => (src ? I({ src, x, y, width: w, height: h, crop: { x: 0.5, y: 0.5, zoom: 1 }, name: 'Фото', ...o }) : P({ x, y, width: w, height: h, ...o }));

export const GEN_FORMATS = {
  paper: { label: 'Газетная полоса A4', w: 1414, h: 2000 },
  post: { label: 'Карусель постов 4:5', w: 1080, h: 1350 },
  wide: { label: 'Слайды 16:9', w: 1920, h: 1080 },
};
export const GEN_THEMES = {
  cnd: { label: 'CND синий', bg: '#FFFFFF', ink: '#14181F', head: '#03316F', acc: '#0B7CFC', band: '#03316F', muted: '#56657A' },
  dark: { label: 'Тёмный', bg: '#0C1420', ink: '#E6EDF7', head: '#FFFFFF', acc: '#4DA3FF', band: '#03316F', muted: '#9DB0CC' },
  red: { label: 'Срочно (красный)', bg: '#FFFFFF', ink: '#14181F', head: '#111111', acc: '#D32F2F', band: '#B71C1C', muted: '#5E5E5E' },
};

export function parseArticle(raw, title = '') {
  const text = String(raw || '').replace(/\r/g, '').trim();
  const paras = text.split(/\n\s*\n|\n(?=\s*[-—•])/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
  let head = title.trim();
  if (!head && paras.length) {
    const first = paras[0];
    if (first.length <= 120 && paras.length > 1) { head = first; paras.shift(); } else {
      const m = first.match(/^(.{20,110}?[.!?])\s/); head = m ? m[1].replace(/[.]$/, '') : first.slice(0, 90);
    }
  }
  const quote = (text.match(/[«"]([^»"]{25,220})[»"]/) || [])[1] || '';
  const lead = paras.length ? paras.shift() : '';
  const words = text.split(/\s+/).length;
  return { head: head || 'Заголовок статьи', lead, body: paras, quote, minutes: Math.max(1, Math.round(words / 180)) };
}

function columnsFill(paras, colW, colH, font) {
  const cols = []; let cur = [];
  const h = (arr) => textHeight({ type: 'text', text: arr.join('\n\n'), width: colW, ...font });
  const queue = [...paras];
  while (queue.length) {
    const p = queue.shift();
    if (h([...cur, p]) <= colH) { cur.push(p); continue; }
    const words = p.split(' '); let lo = 0, hi = words.length;
    while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (h([...cur, words.slice(0, mid).join(' ')]) <= colH) lo = mid; else hi = mid - 1; }
    if (lo > 0) { cur.push(words.slice(0, lo).join(' ')); queue.unshift(words.slice(lo).join(' ')); }
    else if (!cur.length) { cur.push(p); } else queue.unshift(p);
    cols.push(cur); cur = [];
  }
  if (cur.length) cols.push(cur);
  return cols.map((c) => c.join('\n\n'));
}

export function generateArticle({ text, title, author, rubric, format = 'paper', theme = 'cnd', photos = [] }) {
  const a = parseArticle(text, title);
  const F = GEN_FORMATS[format] || GEN_FORMATS.paper; const C = GEN_THEMES[theme] || GEN_THEMES.cnd;
  const W = F.w, H = F.h;
  const date = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const ph = [...photos];
  const pages = [];
  const footer = (M) => [
    R({ x: M, y: H - 92, width: W - M * 2, height: 2, fill: C.muted, opacity: 0.35, keep: true, name: 'Подвал: линия' }),
    T({ x: M, y: H - 70, width: W - M * 2 - 160, text: `California NewsDay · ${author || 'редакция CND'}`, fontFamily: 'Montserrat', fontStyle: 'bold', fontSize: 20, letterSpacing: 2, fill: C.muted, keep: true, name: 'Подвал: выпуск' }),
    { ...T({ x: W - M - 150, y: H - 70, width: 150, text: '{n} / {total}', fontFamily: 'Montserrat', fontStyle: 'bold', fontSize: 20, fill: C.acc, align: 'right' }), auto: true, keep: true, name: 'Номер страницы' },
  ];
  const bodyFont = { fontFamily: 'PT Serif', fontSize: format === 'paper' ? 28 : 34, lineHeight: 1.55 };

  if (format === 'paper') {
    const M = 100, cw = (W - M * 2 - 50) / 2;
    const top = [
      R({ x: 0, y: 0, width: W, height: 150, fill: C.band, name: 'Шапка' }),
      I({ x: M, y: 30, width: 90, height: 90, src: BRAND.iconWhite, locked: true, name: 'Логотип CND' }),
      T({ x: M + 112, y: 46, width: 700, text: 'California NewsDay', fontFamily: 'Montserrat', fontStyle: 'bold', fontSize: 44, fill: '#FFFFFF', lineHeight: 1.1, maxLines: 1 }),
      T({ x: W - M - 500, y: 62, width: 500, text: date, fontFamily: 'Inter', fontSize: 24, fill: '#C9D8F0', align: 'right' }),
      T({ x: M, y: 200, width: W - M * 2, text: (rubric || 'Новости штата').toUpperCase(), fontFamily: 'Montserrat', fontStyle: 'bold', fontSize: 24, letterSpacing: 6, fill: C.acc }),
    ];
    const headEl = T({ x: M, y: 246, width: W - M * 2, text: a.head, fontFamily: 'Merriweather', fontStyle: 'bold', fontSize: 72, fill: C.head, lineHeight: 1.15, maxLines: 3, name: 'Заголовок' });
    let y = 246 + textHeight(headEl) + 30;
    const leadEl = a.lead ? T({ x: M, y, width: W - M * 2, text: a.lead, fontFamily: 'PT Serif', fontStyle: 'italic', fontSize: 34, fill: C.muted, lineHeight: 1.45, maxLines: 5, name: 'Лид' }) : null;
    if (leadEl) y += textHeight(leadEl) + 36;
    const photoH = Math.min(760, H - y - 600);
    const els = [...top, headEl, ...(leadEl ? [leadEl] : []), photoEl(ph.shift(), M, y, W - M * 2, photoH)];
    y += photoH + 14;
    els.push(T({ x: M, y, width: W - M * 2, text: `Фото: ${author || 'CND'} · ${a.minutes} мин чтения`, fontFamily: 'Inter', fontSize: 20, fill: C.muted }));
    y += 56;
    const bottom = H - 120;
    const firstH = bottom - y;
    const body = a.body.length ? a.body : ['Текст статьи появится здесь.'];
    let cols = columnsFill(body, cw, firstH, bodyFont);
    const firstCols = cols.slice(0, 2); cols = cols.slice(2);
    firstCols.forEach((t, i) => els.push(T({ x: M + i * (cw + 50), y, width: cw, text: t, ...bodyFont, fill: C.ink, align: 'justify', name: `Колонка ${i + 1}` })));
    pages.push({ elements: [...els, ...footer(M)] });
    const rest = cols.join('\n\n');
    if (rest) {
      const restCols = columnsFill(rest.split('\n\n'), cw, H - 220 - 140 - (a.quote ? 260 : 0), bodyFont);
      for (let i = 0; i < restCols.length; i += 2) {
        const pe = [R({ x: 0, y: 0, width: W, height: 16, fill: C.band }), T({ x: M, y: 70, width: W - M * 2, text: a.head, fontFamily: 'Merriweather', fontStyle: 'bold', fontSize: 30, fill: C.head, maxLines: 1, name: 'Колонтитул' })];
        let yy = 160;
        if (i === 0 && a.quote) {
          pe.push(R({ x: M, y: yy, width: 10, height: 200, fill: C.acc }), T({ x: M + 40, y: yy, width: W - M * 2 - 40, text: `«${a.quote}»`, fontFamily: 'Merriweather', fontStyle: 'italic', fontSize: 44, fill: C.head, lineHeight: 1.3, maxH: 200, name: 'Цитата' }));
          yy += 260;
        }
        if (ph.length && i === 0) {
          const im = ph.shift();
          pe.push(photoEl(im, M + cw + 50, yy, cw, 520));
          restCols.splice(i + 1, 0, '');
        }
        [restCols[i], restCols[i + 1]].forEach((t, k) => t && pe.push(T({ x: M + k * (cw + 50), y: yy, width: cw, text: t, ...bodyFont, fill: C.ink, align: 'justify', name: `Колонка ${k + 1}` })));
        pages.push({ elements: [...pe, ...footer(M)] });
      }
    }
  } else {
    const M = format === 'wide' ? 100 : 80;
    const wide = format === 'wide';
    const cover = [];
    if (wide) {
      cover.push(photoEl(ph.shift(), W / 2, 0, W / 2, H), R({ x: 0, y: 0, width: W / 2, height: H, fill: C.bg }));
    } else {
      cover.push(photoEl(ph.shift(), 0, 0, W, H * 0.58), R({ x: 0, y: H * 0.36, width: W, height: H * 0.22, fill: C.bg, gradient: { type: 'linear', from: 'rgba(0,0,0,0)', to: C.bg, angle: 90 } }));
    }
    const cx = M, cwid = wide ? W / 2 - M * 2 : W - M * 2;
    let y = wide ? 140 : H * 0.56;
    cover.push(R({ x: cx, y: wide ? 70 : y - 50, width: 260, height: 50, cornerRadius: 25, fill: C.acc }),
      T({ x: cx, y: (wide ? 70 : y - 50) + 12, width: 260, text: (rubric || 'Новости').toUpperCase().slice(0, 18), fontFamily: 'Montserrat', fontStyle: 'bold', fontSize: 22, letterSpacing: 3, fill: '#FFFFFF', align: 'center', lineHeight: 1.1, maxLines: 1 }));
    y += 20;
    const hd = T({ x: cx, y, width: cwid, text: a.head, fontFamily: 'Montserrat', fontStyle: 'bold', fontSize: wide ? 76 : 64, fill: C.head, lineHeight: 1.1, maxLines: 4, name: 'Заголовок' });
    cover.push(hd); y += textHeight(hd) + 28;
    if (a.lead) cover.push(T({ x: cx, y, width: cwid, text: a.lead, fontFamily: 'PT Serif', fontSize: 32, fill: C.muted, lineHeight: 1.45, maxH: H - y - 140, name: 'Лид' }));
    if (C.bg !== '#FFFFFF') cover.push(I({ x: W - M - 80, y: H - 190, width: 80, height: 80, src: BRAND.iconWhite, locked: true, name: 'Логотип CND' }));
    pages.push({ elements: [...cover, ...footer(M)] });
    const colW = wide ? (W - M * 2 - 60) / 2 : W - M * 2;
    const colH = H - 200 - 140;
    const cols = columnsFill(a.body, colW, colH, bodyFont);
    for (let i = 0; i < cols.length; i += wide ? 2 : 1) {
      const pe = [T({ x: M, y: 80, width: W - M * 2, text: a.head, fontFamily: 'Montserrat', fontStyle: 'bold', fontSize: 28, fill: C.acc, maxLines: 1 })];
      (wide ? [cols[i], cols[i + 1]] : [cols[i]]).forEach((t, k) => t && pe.push(T({ x: M + k * (colW + 60), y: 170, width: colW, text: t, ...bodyFont, fill: C.ink, name: 'Текст' })));
      pages.push({ elements: [...pe, ...footer(M)] });
    }
    if (a.quote) pages.push({ elements: [R({ x: M, y: H / 2 - 160, width: 12, height: 320, fill: C.acc }), T({ x: M + 50, y: H / 2 - 160, width: W - M * 2 - 50, text: `«${a.quote}»`, fontFamily: 'Merriweather', fontStyle: 'italic', fontSize: wide ? 64 : 54, fill: C.head, lineHeight: 1.3, maxH: 330, name: 'Цитата' }), ...footer(M)] });
  }
  const out = pages.map((p) => ({ id: uid(), background: C.bg, elements: p.elements.map((e) => ({ ...fitText(e), id: uid() })) }));
  return withPages({ width: W, height: H, elements: [] }, out, 0);
}
