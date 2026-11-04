// Свои шрифты фракции: хранятся в базе, подключаются в браузер через FontFace.
import { useEffect, useState } from 'react';
import { api } from '../api/index.js';
import { FONTS } from './brand.js';

let custom = [];          // [{ id, family, author }]
const loaded = new Set();

const emit = () => window.dispatchEvent(new Event('cnd-fonts'));

async function register(f) {
  if (loaded.has(f.family)) return;
  try {
    const face = new FontFace(f.family, `url(${f.data})`);
    await face.load();
    document.fonts.add(face);
    loaded.add(f.family);
  } catch { /* битый файл шрифта пропускаем */ }
}

export async function loadCustomFonts() {
  try {
    const list = await api.listFonts();
    await Promise.all(list.map(register));
    custom = list.map(({ data, ...meta }) => meta);
    emit();
  } catch { /* без своих шрифтов редактор тоже работает */ }
  return custom;
}

export const FONT_TYPES = '.ttf,.otf,.woff,.woff2';

export async function importFontFile(file, family) {
  if (!/\.(ttf|otf|woff2?)$/i.test(file.name)) throw new Error('Нужен файл шрифта: TTF, OTF, WOFF или WOFF2');
  if (file.size > 3 * 1024 * 1024) throw new Error('Файл больше 3 МБ');
  const name = (family || file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')).trim();
  const ext = file.name.split('.').pop().toLowerCase();
  const mime = { ttf: 'font/ttf', otf: 'font/otf', woff: 'font/woff', woff2: 'font/woff2' }[ext];
  const data = await new Promise((res, rej) => {
    const r = new FileReader(); r.onload = () => res(String(r.result).replace(/^data:[^;]*;/, `data:${mime};`)); r.onerror = rej; r.readAsDataURL(file);
  });
  // проверяем, что браузер вообще может прочитать этот шрифт
  try { await new FontFace(`check-${Date.now()}`, `url(${data})`).load(); } catch { throw new Error('Браузер не смог прочитать этот шрифт'); }
  const rec = await api.saveFont({ family: name, data });
  loaded.delete(name);
  await register({ family: name, data });
  custom = [{ id: rec.id, family: name, author: rec.author }, ...custom.filter((f) => f.family !== name)];
  emit();
  return name;
}

export async function deleteFont(id) {
  await api.deleteFont(id);
  custom = custom.filter((f) => f.id !== id);
  emit();
}

// Все шрифты: встроенные + свои
export function useFonts() {
  const [list, setList] = useState(custom);
  useEffect(() => {
    const on = () => setList([...custom]);
    window.addEventListener('cnd-fonts', on);
    return () => window.removeEventListener('cnd-fonts', on);
  }, []);
  return { all: [...FONTS, ...list.map((f) => f.family).filter((f) => !FONTS.includes(f))], custom: list };
}
