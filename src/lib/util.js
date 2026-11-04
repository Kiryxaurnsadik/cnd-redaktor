export const TOKEN_HOURS = 42;

export const ROLES = {
  intern: { label: 'Стажёр', rank: 1 },
  journalist: { label: 'Журналист', rank: 2 },
  editor: { label: 'Редактор', rank: 3 },
  admin: { label: 'Главный редактор / админ', rank: 4 },
};

export const roleLabel = (r) => ROLES[r]?.label || r;
export const canManage = (role) => (ROLES[role]?.rank || 0) >= 3;
export const isAdmin = (role) => role === 'admin';

// Ник сравниваем без учёта регистра, пробелов, «_», «-» и ё/е
export function normalizeNick(s) {
  return (s || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[\s_\-.]+/g, '');
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function generateTokenCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
  return `CND-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

export function normalizeTokenCode(s) {
  const raw = (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const body = raw.startsWith('CND') ? raw.slice(3) : raw;
  return `CND-${body.slice(0, 4)}-${body.slice(4, 8)}`;
}

export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

export function formatLeft(ms) {
  if (ms <= 0) return 'истёк';
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return d ? `${d} д ${h} ч ${String(m).padStart(2, '0')} мин` : `${h} ч ${String(m).padStart(2, '0')} мин`;
}

// Таймер с секундами: «2 д 04:15:09» или «04:15:09»
export function formatTimer(ms) {
  if (ms <= 0) return '00:00:00';
  const d = Math.floor(ms / 86400000);
  const rest = Math.floor((ms % 86400000) / 1000);
  const hh = String(Math.floor(rest / 3600)).padStart(2, '0');
  const mm = String(Math.floor((rest % 3600) / 60)).padStart(2, '0');
  const ss = String(rest % 60).padStart(2, '0');
  return `${d ? `${d} д ` : ''}${hh}:${mm}:${ss}`;
}

// Длительность в часах словами: 42 → «42 ч», 72 → «3 д», 30 → «1 д 6 ч»
export function formatHours(hours) {
  const d = Math.floor(hours / 24), h = hours % 24;
  if (!d || (hours < 48 && h)) return `${hours} ч`;
  return h ? `${d} д ${h} ч` : `${d} д`;
}

export const DURATION_PRESETS = [42, 24, 72, 168, 336, 720];
export const MAX_TOKEN_HOURS = 90 * 24;

export function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// Сжимает картинку (File/Blob/dataURL) до JPEG dataURL нужного размера
export async function compressImage(src, maxSide = 900, quality = 0.82, type = 'image/jpeg') {
  const url = typeof src === 'string' ? src : URL.createObjectURL(src);
  const img = await loadImage(url);
  const k = Math.min(1, maxSide / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  const ctx = c.getContext('2d');
  if (type === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
  ctx.drawImage(img, 0, 0, c.width, c.height);
  if (typeof src !== 'string') URL.revokeObjectURL(url);
  return c.toDataURL(type, quality);
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (/^https?:/.test(src)) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Не удалось загрузить картинку'));
    img.src = src;
  });
}

export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
