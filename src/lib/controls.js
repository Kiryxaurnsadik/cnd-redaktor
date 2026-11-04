// Если крадёте, то крадите ради реально хороших людей
import { usePrefs } from './prefs.js';

export const CONTROL_MODES = {
  canva: { label: 'Как в Canva', hint: 'Просто и понятно: основные кнопки, клавиши T, R, C, L, Ctrl+D' },
  photoshop: { label: 'Как в Photoshop', hint: 'Все фильтры, режимы наложения, Ctrl+J, Ctrl+[ ], цифры — прозрачность' },
  figma: { label: 'Как в Figma', hint: 'Автораскладка, выравнивание Alt+A/D/W/S, цвета дизайна, Shift+1, R, O, L' },
  all: { label: 'Всё сразу', hint: 'Все инструменты и все горячие клавиши из трёх программ' },
};

const FEATURES = {
  canva: ['distribute'],
  photoshop: ['fxFull', 'blend', 'distribute', 'opacityKeys'],
  figma: ['blend', 'distribute', 'autoLayout', 'tidy', 'selColors', 'opacityKeys'],
};

export function hasFeature(mode, f) {
  if (mode === 'all') return true;
  return (FEATURES[mode] || FEATURES.canva).includes(f);
}

const K = (key, o = {}) => ({ key, ctrl: !!o.c, shift: !!o.s, alt: !!o.a });

export const KEYMAPS = {
  canva: [
    ['addText', K('t'), 'T — текст'], ['addRect', K('r'), 'R — прямоугольник'], ['addEllipse', K('c'), 'C — круг'], ['addLine', K('l'), 'L — линия'],
    ['duplicate', K('d', { c: 1 }), 'Ctrl+D — дублировать'], ['group', K('g', { c: 1 }), 'Ctrl+G — сгруппировать'], ['ungroup', K('g', { c: 1, s: 1 }), 'Ctrl+Shift+G — разгруппировать'],
    ['forward', K(']', { c: 1 }), 'Ctrl+] — выше'], ['backward', K('[', { c: 1 }), 'Ctrl+[ — ниже'], ['front', K(']', { c: 1, a: 1 }), 'Ctrl+Alt+] — наверх'], ['back', K('[', { c: 1, a: 1 }), 'Ctrl+Alt+[ — вниз'],
    ['lock', K('l', { a: 1, s: 1 }), 'Alt+Shift+L — закрепить'], ['selectAll', K('a', { c: 1 }), 'Ctrl+A — выбрать всё'],
    ['copyStyle', K('c', { c: 1, a: 1 }), 'Ctrl+Alt+C — копировать стиль'], ['pasteStyle', K('v', { c: 1, a: 1 }), 'Ctrl+Alt+V — вставить стиль'],
    ['zoomIn', K('=', { c: 1 }), 'Ctrl+= — приблизить'], ['zoomOut', K('-', { c: 1 }), 'Ctrl+− — отдалить'], ['zoomFit', K('0', { c: 1, a: 1 }), 'Ctrl+Alt+0 — по размеру экрана'],
  ],
  photoshop: [
    ['addText', K('t'), 'T — текст'], ['addRect', K('u'), 'U — прямоугольник'], ['addEllipse', K('u', { s: 1 }), 'Shift+U — эллипс'], ['addLine', K('u', { a: 1 }), 'Alt+U — линия'],
    ['duplicate', K('j', { c: 1 }), 'Ctrl+J — дублировать слой'], ['group', K('g', { c: 1 }), 'Ctrl+G — группа'], ['ungroup', K('g', { c: 1, s: 1 }), 'Ctrl+Shift+G — разгруппировать'],
    ['forward', K(']', { c: 1 }), 'Ctrl+] — слой выше'], ['backward', K('[', { c: 1 }), 'Ctrl+[ — слой ниже'], ['front', K(']', { c: 1, s: 1 }), 'Ctrl+Shift+] — на передний план'], ['back', K('[', { c: 1, s: 1 }), 'Ctrl+Shift+[ — на задний план'],
    ['lock', K('/', { c: 1 }), 'Ctrl+/ — закрепить слой'], ['hide', K(',', { c: 1 }), 'Ctrl+, — скрыть слой'], ['selectAll', K('a', { c: 1 }), 'Ctrl+A — выбрать всё'],
    ['copyStyle', K('c', { c: 1, a: 1 }), 'Ctrl+Alt+C — копировать стиль слоя'], ['pasteStyle', K('v', { c: 1, a: 1 }), 'Ctrl+Alt+V — вставить стиль слоя'],
    ['zoomIn', K('=', { c: 1 }), 'Ctrl++ — приблизить'], ['zoomOut', K('-', { c: 1 }), 'Ctrl+− — отдалить'], ['zoomFit', K('0', { c: 1 }), 'Ctrl+0 — показать целиком'], ['zoom100', K('1', { c: 1 }), 'Ctrl+1 — 100%'],
    ['opacity', null, '1…0 — прозрачность 10…100%'],
  ],
  figma: [
    ['addText', K('t'), 'T — текст'], ['addRect', K('r'), 'R — прямоугольник'], ['addEllipse', K('o'), 'O — эллипс'], ['addLine', K('l'), 'L — линия'],
    ['duplicate', K('d', { c: 1 }), 'Ctrl+D — дублировать'], ['group', K('g', { c: 1 }), 'Ctrl+G — группа'], ['ungroup', K('g', { c: 1, s: 1 }), 'Ctrl+Shift+G — разгруппировать'],
    ['forward', K(']', { c: 1 }), 'Ctrl+] — выше'], ['backward', K('[', { c: 1 }), 'Ctrl+[ — ниже'], ['front', K(']', { c: 1, s: 1 }), 'Ctrl+Shift+] — наверх'], ['back', K('[', { c: 1, s: 1 }), 'Ctrl+Shift+[ — вниз'],
    ['hide', K('h', { c: 1, s: 1 }), 'Ctrl+Shift+H — скрыть'], ['lock', K('l', { c: 1, s: 1 }), 'Ctrl+Shift+L — закрепить'], ['selectAll', K('a', { c: 1 }), 'Ctrl+A — выбрать всё'],
    ['copyStyle', K('c', { c: 1, a: 1 }), 'Ctrl+Alt+C — копировать свойства'], ['pasteStyle', K('v', { c: 1, a: 1 }), 'Ctrl+Alt+V — вставить свойства'],
    ['alignLeft', K('a', { a: 1 }), 'Alt+A — по левому краю'], ['alignRight', K('d', { a: 1 }), 'Alt+D — по правому краю'], ['alignTop', K('w', { a: 1 }), 'Alt+W — по верху'],
    ['alignBottom', K('s', { a: 1 }), 'Alt+S — по низу'], ['alignH', K('h', { a: 1 }), 'Alt+H — по центру'], ['alignV', K('v', { a: 1 }), 'Alt+V — по середине'],
    ['distH', K('h', { a: 1, s: 1 }), 'Alt+Shift+H — распределить по горизонтали'], ['distV', K('v', { a: 1, s: 1 }), 'Alt+Shift+V — распределить по вертикали'],
    ['autoLayout', K('a', { s: 1 }), 'Shift+A — автораскладка'], ['tidy', K('t', { c: 1, a: 1 }), 'Ctrl+Alt+T — навести порядок'],
    ['zoomFit', K('1', { s: 1 }), 'Shift+1 — показать целиком'], ['zoom100', K('0', { s: 1 }), 'Shift+0 — 100%'], ['zoomIn', K('=', { c: 1 }), 'Ctrl+= — приблизить'], ['zoomOut', K('-', { c: 1 }), 'Ctrl+− — отдалить'],
    ['opacity', null, '1…0 — прозрачность 10…100%'],
  ],
};

export function keymapFor(mode) {
  if (mode !== 'all') return KEYMAPS[mode] || KEYMAPS.canva;
  const seen = new Set(); const out = [];
  for (const m of ['figma', 'canva', 'photoshop']) {
    for (const row of KEYMAPS[m]) {
      const id = row[1] ? `${row[1].key}|${row[1].ctrl}|${row[1].shift}|${row[1].alt}` : row[0];
      if (seen.has(id)) continue; seen.add(id); out.push(row);
    }
  }
  return out;
}

const KEY_ALIAS = { 'ъ': ']', 'х': '[', '+': '=', '_': '-', '!': '1', ')': '0' };
const CODE_KEY = (e) => {
  if (/^Key[A-Z]$/.test(e.code)) return e.code.slice(3).toLowerCase();
  if (/^Digit\d$/.test(e.code)) return e.code.slice(5);
  return { BracketLeft: '[', BracketRight: ']', Equal: '=', Minus: '-', Slash: '/', Comma: ',', NumpadAdd: '=', NumpadSubtract: '-' }[e.code] || KEY_ALIAS[e.key] || e.key.toLowerCase();
};

export function matchAction(mode, e) {
  const k = CODE_KEY(e); const ctrl = e.ctrlKey || e.metaKey;
  for (const [action, combo] of keymapFor(mode)) {
    if (!combo) continue;
    if (combo.key === k && combo.ctrl === ctrl && combo.shift === e.shiftKey && combo.alt === e.altKey) return action;
  }
  if (!ctrl && !e.altKey && !e.shiftKey && /^\d$/.test(k) && hasFeature(mode, 'opacityKeys')) return `opacity:${k}`;
  return null;
}

export function useControls() {
  const [p] = usePrefs();
  const mode = CONTROL_MODES[p.controls] ? p.controls : 'canva';
  return { mode, has: (f) => hasFeature(mode, f) };
}
