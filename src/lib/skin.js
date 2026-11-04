// Работа со скинами Minecraft: загрузка по нику или файлом, 2D-голова и плоский персонаж.
import { loadImage } from './util.js';

export const SKIN_SOURCES = {
  mojang: { label: 'Лицензия (Mojang)', url: (n) => `https://mc-heads.net/skin/${encodeURIComponent(n)}` },
  ely: { label: 'Ely.by', url: (n) => `https://skinsystem.ely.by/skins/${encodeURIComponent(n)}.png` },
};

// Скачивает скин по нику и возвращает dataURL (чтобы холст можно было экспортировать)
export async function fetchSkinByNick(nick, source = 'mojang') {
  const res = await fetch(SKIN_SOURCES[source].url(nick.trim()));
  if (!res.ok) throw new Error('Скин по этому нику не найден');
  const blob = await res.blob();
  return await new Promise((resolve) => {
    const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(blob);
  });
}

export async function validateSkin(dataUrl) {
  const img = await loadImage(dataUrl);
  if (img.width !== 64 || (img.height !== 64 && img.height !== 32)) {
    if (!(img.width % 64 === 0 && (img.height === img.width || img.height * 2 === img.width))) {
      throw new Error('Это не похоже на скин Minecraft (нужен PNG 64×64 или 64×32)');
    }
  }
  return img;
}

function pixelCanvas(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

// Голова 8×8 + слой шляпы, увеличенная без размытия
export async function renderHead(skinUrl, size = 512, { overlay = true } = {}) {
  const img = await validateSkin(skinUrl);
  const k = img.width / 64;
  const [c, ctx] = pixelCanvas(size, size);
  const pad = overlay ? size / 18 : 0;
  ctx.drawImage(img, 8 * k, 8 * k, 8 * k, 8 * k, pad, pad, size - 2 * pad, size - 2 * pad);
  if (overlay) ctx.drawImage(img, 40 * k, 8 * k, 8 * k, 8 * k, 0, 0, size, size);
  return c.toDataURL('image/png');
}

// Плоский персонаж спереди (как на аватарках): голова, тело, руки, ноги + верхние слои
export async function renderFlatBody(skinUrl, scale = 24) {
  const img = await validateSkin(skinUrl);
  const k = img.width / 64;
  const legacy = img.height * 2 === img.width; // старый формат 64×32
  // тонкие руки (Alex): в 64×64 пиксель на месте 4-й колонки руки прозрачный
  const [probe, pctx] = pixelCanvas(img.width, img.height);
  pctx.drawImage(img, 0, 0);
  const slim = !legacy && pctx.getImageData(54 * k, 20 * k, 1, 1).data[3] === 0;
  const aw = slim ? 3 : 4;
  const W = 16, H = 32;
  const [c, ctx] = pixelCanvas(W * scale, H * scale);
  const part = (sx, sy, sw, sh, dx, dy, flip = false) => {
    ctx.save();
    if (flip) { ctx.translate((dx + sw) * scale, dy * scale); ctx.scale(-1, 1); ctx.drawImage(img, sx * k, sy * k, sw * k, sh * k, 0, 0, sw * scale, sh * scale); }
    else ctx.drawImage(img, sx * k, sy * k, sw * k, sh * k, dx * scale, dy * scale, sw * scale, sh * scale);
    ctx.restore();
  };
  const ax = 4 - aw;
  // база
  part(8, 8, 8, 8, 4, 0);            // голова
  part(20, 20, 8, 12, 4, 8);         // тело
  part(44, 20, aw, 12, ax, 8);       // правая рука (слева на картинке)
  part(4, 20, 4, 12, 4, 20);         // правая нога
  if (legacy) { part(44, 20, aw, 12, 12, 8, true); part(4, 20, 4, 12, 8, 20, true); }
  else { part(36, 52, aw, 12, 12, 8); part(20, 52, 4, 12, 8, 20); }
  // верхние слои
  part(40, 8, 8, 8, 4, 0);
  if (!legacy) {
    part(20, 36, 8, 12, 4, 8);
    part(44, 36, aw, 12, ax, 8);
    part(52, 52, aw, 12, 12, 8);
    part(4, 36, 4, 12, 4, 20);
    part(4, 52, 4, 12, 8, 20);
  }
  return c.toDataURL('image/png');
}
