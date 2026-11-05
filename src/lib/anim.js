// Если крадёте, то крадите ради реально хороших людей
export const ANIMS = {
  none: { label: 'Без анимации' },
  fade: { label: 'Появление', enter: true },
  up: { label: 'Выезд снизу', enter: true },
  down: { label: 'Выезд сверху', enter: true },
  left: { label: 'Выезд справа', enter: true },
  right: { label: 'Выезд слева', enter: true },
  zoom: { label: 'Приближение', enter: true },
  pop: { label: 'Пружинка', enter: true },
  type: { label: 'Печатная машинка (текст)', enter: true },
  pulse: { label: 'Пульс (повтор)', loop: true },
  blink: { label: 'Мигание (повтор)', loop: true },
  shake: { label: 'Тряска (повтор)', loop: true },
  spin: { label: 'Вращение (повтор)', loop: true },
  float: { label: 'Покачивание (повтор)', loop: true },
};

export const DEFAULT_ANIM = { type: 'fade', delay: 0, dur: 0.6 };
export const DEFAULT_TIMING = { dur: 4, fps: 12 };
export const timingOf = (doc) => ({ ...DEFAULT_TIMING, ...(doc.anim || {}) });
export const hasAnims = (doc) => doc.elements.some((e) => e.anim && e.anim.type && e.anim.type !== 'none');

const easeOut = (x) => 1 - (1 - x) ** 3;
const back = (x) => { const c = 1.9; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };

export function animState(el, t) {
  const a = el.anim; const st = { op: 1, dx: 0, dy: 0, s: 1, r: 0, frac: 1 };
  if (!a || !a.type || a.type === 'none') return st;
  const def = ANIMS[a.type]; if (!def) return st;
  const delay = a.delay || 0, dur = Math.max(0.05, a.dur || 0.6);
  if (def.enter) {
    if (t < delay) return { ...st, op: 0, frac: 0 };
    const p = Math.min(1, (t - delay) / dur); const e = easeOut(p);
    const dist = 140;
    switch (a.type) {
      case 'fade': return { ...st, op: e };
      case 'up': return { ...st, op: e, dy: (1 - e) * dist };
      case 'down': return { ...st, op: e, dy: -(1 - e) * dist };
      case 'left': return { ...st, op: e, dx: (1 - e) * dist };
      case 'right': return { ...st, op: e, dx: -(1 - e) * dist };
      case 'zoom': return { ...st, op: e, s: 0.6 + 0.4 * e };
      case 'pop': return { ...st, op: Math.min(1, p * 3), s: Math.max(0.01, back(p)) };
      case 'type': return { ...st, frac: p };
      default: return st;
    }
  }
  if (t < delay) return st;
  const ph = ((t - delay) / dur) * Math.PI * 2;
  switch (a.type) {
    case 'pulse': return { ...st, s: 1 + 0.06 * Math.sin(ph) };
    case 'blink': return { ...st, op: Math.sin(ph) > -0.3 ? 1 : 0.15 };
    case 'shake': return { ...st, dx: Math.sin(ph * 3) * 8, r: Math.sin(ph * 3) * 2 };
    case 'spin': return { ...st, r: (((t - delay) / dur) * 360) % 360 };
    case 'float': return { ...st, dy: Math.sin(ph) * 12 };
    default: return st;
  }
}

export function makeAnimator(stage, doc) {
  const layer = stage.getLayers()[0];
  const items = doc.elements.filter((e) => e.anim && e.anim.type !== 'none' && e.visible !== false).map((el) => {
    const n = stage.findOne(`#${el.id}`); if (!n) return null;
    const box = n.getClientRect({ relativeTo: layer, skipShadow: true });
    return { el, n, base: { x: n.x(), y: n.y(), op: n.opacity(), sx: n.scaleX(), sy: n.scaleY(), r: n.rotation(), text: n.className === 'Text' ? n.text() : null }, c: { x: box.x + box.width / 2, y: box.y + box.height / 2 } };
  }).filter(Boolean);
  const apply = (t) => {
    for (const it of items) {
      const s = animState(it.el, t); const b = it.base;
      it.n.opacity(b.op * s.op);
      it.n.scaleX(b.sx * s.s); it.n.scaleY(b.sy * s.s);
      it.n.x(it.c.x + (b.x - it.c.x) * s.s + s.dx); it.n.y(it.c.y + (b.y - it.c.y) * s.s + s.dy);
      if (s.r) {
        const rad = (s.r * Math.PI) / 180; const ox = it.n.x() - it.c.x - s.dx, oy = it.n.y() - it.c.y - s.dy;
        it.n.x(it.c.x + s.dx + ox * Math.cos(rad) - oy * Math.sin(rad)); it.n.y(it.c.y + s.dy + ox * Math.sin(rad) + oy * Math.cos(rad));
      }
      it.n.rotation(b.r + s.r);
      if (b.text != null) it.n.text(s.frac >= 1 ? b.text : b.text.slice(0, Math.round(b.text.length * s.frac)));
    }
    layer.batchDraw();
  };
  const restore = () => {
    for (const it of items) { const b = it.base; it.n.setAttrs({ x: b.x, y: b.y, opacity: b.op, scaleX: b.sx, scaleY: b.sy, rotation: b.r }); if (b.text != null) it.n.text(b.text); }
    layer.batchDraw();
  };
  return { apply, restore, count: items.length };
}

export async function encodeGif(frames, w, h, delayMs) {
  const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
  const gif = GIFEncoder();
  for (const f of frames) {
    const data = f.getContext('2d').getImageData(0, 0, w, h).data;
    const palette = quantize(data, 256, { format: 'rgb565' });
    const index = applyPalette(data, palette, 'rgb565');
    gif.writeFrame(index, w, h, { palette, delay: delayMs });
    await new Promise((r) => setTimeout(r, 0));
  }
  gif.finish();
  return new Blob([gif.bytes()], { type: 'image/gif' });
}

export async function encodeVideo(frames, w, h, fps) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
  const type = types.find((t) => window.MediaRecorder?.isTypeSupported?.(t));
  if (!type) throw new Error('Браузер не умеет записывать видео, скачайте GIF');
  x.drawImage(frames[0], 0, 0);
  const stream = c.captureStream(fps);
  const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 6e6 });
  const chunks = []; rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise((r) => { rec.onstop = r; });
  rec.start();
  for (const f of frames) { x.drawImage(f, 0, 0); await new Promise((r) => setTimeout(r, 1000 / fps)); }
  rec.stop(); await done;
  return { blob: new Blob(chunks, { type: type.split(';')[0] }), ext: type.includes('mp4') ? 'mp4' : 'webm' };
}
