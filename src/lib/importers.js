// Если крадёте, то крадите ради реально хороших людей
import { FONTS } from './brand.js';

export const IMPORT_ACCEPT = '.psd,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/vnd.adobe.photoshop';
const MAX_SIDE = 2400;

export function importKind(file) {
  const n = (file?.name || '').toLowerCase();
  if (n.endsWith('.psd') || file?.type === 'image/vnd.adobe.photoshop') return 'psd';
  if (n.endsWith('.pdf') || file?.type === 'application/pdf') return 'pdf';
  if (n.endsWith('.docx') || /wordprocessingml/.test(file?.type || '')) return 'docx';
  return null;
}

const hex2 = (v) => Math.max(0, Math.min(255, Math.round(v || 0))).toString(16).padStart(2, '0');
const colorOf = (c) => (c && 'r' in c ? `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}` : '#111111');

function matchFont(name = '') {
  const n = name.replace(/[-_]?(Bold|Regular|Italic|Light|Medium|Black|Semi.*|Extra.*|MT|PS)$/gi, '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().trim();
  return FONTS.find((f) => f.toLowerCase() === n) || FONTS.find((f) => n && (n.includes(f.toLowerCase()) || f.toLowerCase().includes(n))) || 'Inter';
}

function canvasUrl(cv) {
  let src = cv;
  const k = Math.min(1, MAX_SIDE / Math.max(cv.width, cv.height));
  if (k < 1) {
    src = document.createElement('canvas'); src.width = Math.round(cv.width * k); src.height = Math.round(cv.height * k);
    const ctx = src.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(cv, 0, 0, src.width, src.height);
  }
  return src.toDataURL('image/png');
}

function isEmpty(cv) {
  try {
    const s = 32; const t = document.createElement('canvas'); t.width = s; t.height = s;
    const ctx = t.getContext('2d'); ctx.drawImage(cv, 0, 0, s, s);
    const d = ctx.getImageData(0, 0, s, s).data;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 4) return false;
    return true;
  } catch { return false; }
}

export async function readPsd(file, { editableText = true } = {}) {
  const { readPsd: parse } = await import('ag-psd');
  const buf = await file.arrayBuffer();
  const psd = parse(buf, { skipThumbnail: true });
  const els = [];
  let skipped = 0;
  const walk = (layers, parentOpacity = 1, parentHidden = false) => {
    for (const l of layers || []) {
      const hidden = parentHidden || l.hidden;
      const op = parentOpacity * (l.opacity ?? 1);
      if (l.children) { walk(l.children, op, hidden); continue; }
      if (hidden) continue;
      const blend = l.blendMode && !['normal', 'pass through'].includes(l.blendMode) ? l.blendMode.replace(/ /g, '-') : undefined;
      if (editableText && l.text?.text) {
        const st = l.text.style || {};
        const sc = Math.abs(l.text.transform?.[3] || 1);
        const size = Math.max(6, Math.round((st.fontSize || 24) * sc));
        const bold = st.fauxBold || /bold|black|heavy/i.test(st.font?.name || '');
        const italic = st.fauxItalic || /italic|oblique/i.test(st.font?.name || '');
        const align = l.text.paragraphStyle?.justification;
        els.push({
          type: 'text', name: l.name, text: l.text.text.replace(/\r/g, '\n'),
          x: l.left || 0, y: l.top || 0, width: Math.max(40, (l.right || 0) - (l.left || 0) + size * 0.4),
          fontFamily: matchFont(st.font?.name), fontSize: size, fill: colorOf(st.fillColor),
          fontStyle: [italic && 'italic', bold && 'bold'].filter(Boolean).join(' ') || 'normal',
          align: align === 'center' ? 'center' : align === 'right' ? 'right' : 'left', lineHeight: 1.2, opacity: op, blend,
        });
        continue;
      }
      const cv = l.canvas;
      if (!cv || !cv.width || !cv.height) continue;
      if (isEmpty(cv)) { skipped++; continue; }
      if (els.length >= 250) { skipped++; continue; }
      els.push({ type: 'image', name: l.name, src: canvasUrl(cv), x: l.left || 0, y: l.top || 0, width: cv.width, height: cv.height, opacity: op, blend });
    }
  };
  walk(psd.children);
  if (!els.length && psd.canvas) els.push({ type: 'image', name: file.name, src: canvasUrl(psd.canvas), x: 0, y: 0, width: psd.width, height: psd.height, opacity: 1 });
  return { kind: 'psd', name: file.name.replace(/\.psd$/i, ''), width: psd.width, height: psd.height, elements: els, skipped };
}

let pdfLib = null;
async function pdfjs() {
  if (pdfLib) return pdfLib;
  const lib = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  lib.GlobalWorkerOptions.workerSrc = worker.default;
  pdfLib = lib;
  return lib;
}

export async function openPdf(file) {
  const lib = await pdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await lib.getDocument({ data, isEvalSupported: false }).promise;
  return { pdf, pages: pdf.numPages, name: file.name.replace(/\.pdf$/i, '') };
}

async function renderPage(page, maxSide) {
  const v1 = page.getViewport({ scale: 1 });
  const scale = maxSide / Math.max(v1.width, v1.height);
  const vp = page.getViewport({ scale });
  const cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
  const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  return { cv, v1 };
}

export async function pdfThumb(pdf, n) {
  const page = await pdf.getPage(n);
  const { cv } = await renderPage(page, 220);
  return cv.toDataURL('image/jpeg', 0.75);
}

export async function readPdfPage(pdf, n, { withText = false } = {}) {
  const page = await pdf.getPage(n);
  const { cv, v1 } = await renderPage(page, MAX_SIDE);
  const w = Math.round(v1.width), h = Math.round(v1.height);
  const els = [{ type: 'image', name: `PDF, страница ${n}`, src: cv.toDataURL('image/jpeg', 0.92), x: 0, y: 0, width: w, height: h, opacity: 1 }];
  if (withText) {
    const tc = await page.getTextContent();
    const text = tc.items.map((it) => (it.str || '') + (it.hasEOL ? '\n' : ' ')).join('').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    if (text) els.push({ type: 'text', name: 'Текст из PDF', text, x: Math.round(w * 0.06), y: Math.round(h * 0.06), width: Math.round(w * 0.88), fontFamily: 'PT Serif', fontSize: Math.max(12, Math.round(w / 48)), fill: '#111111', align: 'left', lineHeight: 1.3, fontStyle: 'normal', opacity: 1 });
  }
  return { kind: 'pdf', width: w, height: h, elements: els };
}

const DOCX_STYLE = {
  h1: { fontFamily: 'Montserrat', k: 2.3, bold: true, gap: 0.6 },
  h2: { fontFamily: 'Montserrat', k: 1.75, bold: true, gap: 0.5 },
  h3: { fontFamily: 'Inter', k: 1.4, bold: true, gap: 0.4 },
  p: { fontFamily: 'PT Serif', k: 1, bold: false, gap: 0.7 },
};

function measureLines(text, font, size, width) {
  const ctx = measureLines.ctx || (measureLines.ctx = document.createElement('canvas').getContext('2d'));
  ctx.font = `${size}px "${font}"`;
  let n = 0;
  for (const para of text.split('\n')) {
    let line = ''; n++;
    for (const w of para.split(' ')) { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width > width && line) { n++; line = w; } else line = t; }
  }
  return n;
}

export async function readDocx(file, { docW = 1080 } = {}) {
  const mod = await import('mammoth');
  const mammoth = mod.default || mod;
  const res = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
  const html = new DOMParser().parseFromString(res.value, 'text/html');
  const margin = Math.round(docW * 0.07); const colW = docW - margin * 2;
  const base = Math.max(18, Math.round(docW / 38));
  const blocks = [];
  const pushText = (tag, text) => {
    text = text.replace(/\s+\n/g, '\n').trim(); if (!text) return;
    const last = blocks[blocks.length - 1];
    if (tag === 'p' && last?.tag === 'p') last.text += `\n\n${text}`; else blocks.push({ tag, text });
  };
  const textOf = (n) => [...n.childNodes].map((c) => (c.nodeName === 'BR' ? '\n' : c.nodeName === 'IMG' ? '' : c.textContent)).join('');
  const visit = (node) => {
    for (const n of node.children) {
      const t = n.tagName.toLowerCase();
      n.querySelectorAll?.('img').forEach((img) => blocks.push({ tag: 'img', src: img.getAttribute('src') }));
      if (/^h[1-6]$/.test(t)) pushText(t <= 'h3' ? t : 'h3', textOf(n));
      else if (t === 'p') pushText('p', textOf(n));
      else if (t === 'ul' || t === 'ol') pushText('p', [...n.querySelectorAll(':scope > li')].map((li, i) => `${t === 'ol' ? `${i + 1}.` : '•'} ${li.textContent.trim()}`).join('\n'));
      else if (t === 'table') pushText('p', [...n.querySelectorAll('tr')].map((tr) => [...tr.children].map((c) => c.textContent.trim()).join('  |  ')).join('\n'));
      else if (n.children.length) visit(n);
    }
  };
  visit(html.body);
  const els = []; let y = margin;
  for (const b of blocks) {
    if (b.tag === 'img') {
      if (!b.src) continue;
      try {
        const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = b.src; });
        const k = Math.min(1, colW / img.width, 900 / img.height);
        const w = Math.round(img.width * k), h = Math.round(img.height * k);
        els.push({ type: 'image', name: 'Картинка из DOCX', src: b.src, x: margin + Math.round((colW - w) / 2), y, width: w, height: h, opacity: 1 });
        y += h + base;
      } catch {}
      continue;
    }
    const s = DOCX_STYLE[b.tag] || DOCX_STYLE.p;
    const size = Math.round(base * s.k);
    const lh = b.tag === 'p' ? 1.35 : 1.15;
    els.push({ type: 'text', text: b.text, x: margin, y, width: colW, fontFamily: s.fontFamily, fontSize: size, fontStyle: s.bold ? 'bold' : 'normal', fill: '#111111', align: 'left', lineHeight: lh, opacity: 1 });
    y += Math.ceil(measureLines(b.text, s.fontFamily, size, colW) * size * lh + size * s.gap);
  }
  return { kind: 'docx', name: file.name.replace(/\.docx$/i, ''), width: docW, height: Math.max(y + margin, 100), elements: els, flow: true, warnings: res.messages?.length || 0 };
}
