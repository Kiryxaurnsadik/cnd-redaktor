// Если крадёте, то крадите ради реально хороших людей
import { useEffect } from 'react';
import { usePrefs } from './prefs.js';

export const UI_ACCENTS = [
  ['#0B7CFC', 'CND синий'], ['#7C3AED', 'Фиолетовый'], ['#E5484D', 'Красный'], ['#F76B15', 'Оранжевый'],
  ['#2FB36D', 'Зелёный'], ['#0EA5A4', 'Бирюзовый'], ['#D6409F', 'Розовый'], ['#4B5563', 'Графит'],
];
export const UI_FONTS = ['Inter', 'Manrope', 'Rubik', 'Montserrat', 'Nunito', 'Golos Text', 'Onest', 'Comfortaa', 'JetBrains Mono', 'Minecraft', 'Minecraft Ten'];
export const UI_BG_GRADIENTS = [
  'linear-gradient(135deg, #0b1f45, #0B7CFC)', 'linear-gradient(135deg, #1f1c2c, #928dab)', 'linear-gradient(135deg, #ff9a8b, #ff6a88 55%, #ff99ac)',
  'linear-gradient(135deg, #134e5e, #71b280)', 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', 'linear-gradient(135deg, #f7971e, #ffd200)',
];

const KEYS = ['--brand', '--brand-2', '--brand-soft', '--brand-text', '--topbar', '--topbar-2', '--rail', '--ui-bg'];

export function applyUi(p) {
  const r = document.documentElement;
  KEYS.forEach((k) => r.style.removeProperty(k));
  const a = p.uiAccent;
  if (a && /^#[0-9a-f]{6}$/i.test(a)) {
    r.style.setProperty('--brand', a);
    r.style.setProperty('--brand-2', `color-mix(in srgb, ${a} 80%, #000)`);
    r.style.setProperty('--brand-soft', `color-mix(in srgb, ${a} 14%, var(--panel))`);
    r.style.setProperty('--brand-text', `color-mix(in srgb, ${a} 78%, var(--text))`);
    r.style.setProperty('--topbar', `color-mix(in srgb, ${a} 38%, #050b16)`);
    r.style.setProperty('--topbar-2', `color-mix(in srgb, ${a} 26%, #070d1c)`);
    r.style.setProperty('--rail', `color-mix(in srgb, ${a} 18%, #050912)`);
  }
  r.style.fontFamily = p.uiFont && p.uiFont !== 'Inter' ? `'${p.uiFont}', Inter, system-ui, sans-serif` : '';
  const bg = p.uiBg;
  let css = '';
  if (bg?.type === 'color' && bg.value) css = bg.value;
  else if (bg?.type === 'gradient' && bg.value) css = bg.value;
  else if (bg?.type === 'image' && bg.value) {
    const d = Math.max(0, Math.min(0.85, bg.dim ?? 0.35));
    css = `linear-gradient(rgba(0,0,0,${d}), rgba(0,0,0,${d})), url("${bg.value}") center / cover no-repeat`;
  }
  r.classList.toggle('has-ui-bg', !!css);
  if (css) r.style.setProperty('--ui-bg', css);
}

export function useUiTheme() {
  const [p] = usePrefs();
  useEffect(() => { applyUi(p); }, [p.uiAccent, p.uiFont, p.uiBg]);
}
