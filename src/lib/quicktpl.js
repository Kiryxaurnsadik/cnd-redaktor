// Если крадёте, то крадите ради реально хороших людей
import { BRAND } from './brand.js';
import { uid } from './util.js';
import { ICONS, SHAPES } from './elements.js';
import { MAG_PRESETS, MAG_STYLES, buildMagazine, magFonts } from './magazine.js';

const base = { opacity: 1, rotation: 0 };
const T = (o) => ({ type: 'text', fontFamily: 'Inter', fontSize: 32, fill: '#FFFFFF', align: 'left', fontStyle: 'normal', lineHeight: 1.25, letterSpacing: 0, ...base, ...o });
const R = (o) => ({ type: 'rect', fill: '#0B7CFC', cornerRadius: 0, ...base, ...o });
const E = (o) => ({ type: 'ellipse', fill: '#0B7CFC', ...base, ...o });
const P = (o) => ({ type: 'placeholder', fill: '#2A3442', label: 'Перетащите фото', ...base, ...o });
const I = (o) => ({ type: 'image', ...base, ...o });
const SH = (id, o) => { const s = [...SHAPES, ...ICONS].find((x) => x.id === id); return { type: 'shape', path: s.path, outline: !!s.outline, fill: '#FFFFFF', strokeWidth: s.outline ? 4 : 0, ...base, name: s.name, ...o }; };
const PATH = (path, o) => ({ type: 'shape', path, outline: false, strokeWidth: 0, ...base, ...o });

const BADGE = 'M50 4 L61 14 L76 11 L80 26 L94 33 L89 48 L96 62 L83 71 L82 86 L67 87 L58 99 L45 92 L31 98 L24 85 L9 82 L10 67 L2 54 L12 42 L9 27 L23 22 L29 8 L43 12 Z';
const TICK = 'M28 52 L43 67 L74 36 L67 29 L43 53 L35 45 Z';
const REPLY = 'M50 10 C26 10 8 25 8 44 C8 56 15 66 26 72 L22 92 L44 77 C46 77 48 78 50 78 C74 78 92 62 92 44 C92 25 74 10 50 10 Z M50 20 C69 20 82 31 82 44 C82 58 69 68 50 68 C47 68 45 68 42 67 L34 73 L35 65 C24 60 18 53 18 44 C18 31 31 20 50 20 Z';
const REPOST = 'M24 18 L42 36 L30 36 L30 66 L60 66 L70 78 L18 78 L18 36 L6 36 Z M76 82 L58 64 L70 64 L70 34 L40 34 L30 22 L82 22 L82 64 L94 64 Z';
const HEART = 'M50 90 C46 86 8 62 8 34 C8 20 19 10 32 10 C40 10 46 14 50 21 C54 14 60 10 68 10 C81 10 92 20 92 34 C92 62 54 86 50 90 Z M50 76 C62 67 82 51 82 34 C82 26 76 20 68 20 C60 20 55 26 50 34 C45 26 40 20 32 20 C24 20 18 26 18 34 C18 51 38 67 50 76 Z';
const VIEWS = 'M14 88 L14 52 L26 52 L26 88 Z M38 88 L38 30 L50 30 L50 88 Z M62 88 L62 12 L74 12 L74 88 Z M86 88 L86 44 L98 44 L98 88 Z';

function tweet(x, y, w, opts = {}) {
  const g = uid();
  const ink = opts.light ? '#0F1419' : '#E7E9EA', sub = opts.light ? '#536471' : '#71767B', bg = opts.light ? '#FFFFFF' : '#000000';
  const els = [
    R({ x, y, width: w, height: opts.h, fill: bg, name: 'Пост: фон' }),
    P({ x: x + 48, y: y + 48, width: 96, height: 96, cornerRadius: 48, fill: '#1D2733', label: 'Аватар', name: 'Пост: аватар' }),
    T({ x: x + 168, y: y + 56, width: 560, text: opts.name || 'California NewsDay', fontFamily: 'Inter', fontStyle: 'bold', fontSize: 34, fill: ink, lineHeight: 1.1, name: 'Пост: имя' }),
    PATH(BADGE, { x: x + 168 + (opts.badgeX || 330), y: y + 58, width: 36, height: 36, fill: '#1D9BF0', name: 'Пост: галочка' }),
    PATH(TICK, { x: x + 168 + (opts.badgeX || 330), y: y + 58, width: 36, height: 36, fill: '#FFFFFF', name: 'Пост: галочка' }),
    T({ x: x + 168, y: y + 102, width: 600, text: opts.handle || '@cnd_news · 2 ч', fontFamily: 'Inter', fontSize: 28, fill: sub, name: 'Пост: ник' }),
    T({ x: x + w - 110, y: y + 56, width: 60, text: '···', fontFamily: 'Inter', fontStyle: 'bold', fontSize: 34, fill: sub, align: 'right' }),
    T({ x: x + 48, y: y + 176, width: w - 96, text: opts.text || 'Срочно: в центре Лос-Сантоса перекрыли три улицы. Очевидцы сообщают о колонне полиции и вертолёте над мэрией. Подробности уточняются.', fontFamily: 'Inter', fontSize: 36, fill: ink, lineHeight: 1.35, name: 'Пост: текст' }),
    P({ x: x + 48, y: y + (opts.photoY || 370), width: w - 96, height: opts.photoH || 520, cornerRadius: 28, fill: '#1D2733', label: 'Фото из поста', name: 'Пост: фото' }),
  ];
  const sy = y + (opts.photoY || 370) + (opts.photoH || 520) + 34;
  const stat = (path, n, i) => {
    const sx = x + 48 + i * ((w - 96) / 4);
    return [PATH(path, { x: sx, y: sy, width: 34, height: 34, fill: sub }), T({ x: sx + 48, y: sy + 1, width: 160, text: n, fontFamily: 'Inter', fontSize: 27, fill: sub })];
  };
  els.push(...stat(REPLY, '1,2 тыс.', 0), ...stat(REPOST, '4,8 тыс.', 1), ...stat(HEART, '23 тыс.', 2), ...stat(VIEWS, '1,1 млн', 3));
  return els.map((e) => ({ ...e, groupId: g }));
}

const QUICK_NEWS = {
  id: 'cnd-quick-news', name: 'Quick News', kind: 'Quick', tags: ['quick', 'новость', 'твиттер', 'пост', 'соцсети', '1:1', 'срочно'], official: true, author: 'CND',
  doc: {
    width: 1080, height: 1080, background: '#000000',
    elements: [
      ...tweet(0, 0, 1080, { h: 1080 }),
      R({ x: 0, y: 330, width: 1080, height: 750, fill: '#000000', gradient: { type: 'linear', from: 'rgba(0,0,0,0)', to: 'rgba(0,0,0,0.96)', angle: 90 }, name: 'Тень' }),
      R({ x: 0, y: 760, width: 1080, height: 320, fill: '#000000', opacity: 0.35, name: 'Тень: усиление' }),
      R({ x: 60, y: 650, width: 236, height: 52, cornerRadius: 26, fill: '#0B7CFC', name: 'Плашка' }),
      T({ x: 60, y: 662, width: 236, text: 'QUICK NEWS', fontFamily: 'Montserrat', fontStyle: 'bold', fontSize: 24, letterSpacing: 3, align: 'center', lineHeight: 1.1 }),
      T({ x: 316, y: 662, width: 400, text: 'California NewsDay', fontFamily: 'Montserrat', fontStyle: 'bold', fontSize: 24, fill: '#9DB8E6', lineHeight: 1.1 }),
      T({ x: 60, y: 728, width: 960, text: 'Центр города перекрыт: полиция стягивает силы к мэрии', fontFamily: 'Montserrat', fontStyle: 'bold', fontSize: 60, lineHeight: 1.08, name: 'Заголовок' }),
      T({ x: 60, y: 1000, width: 780, text: 'Источник: пост в соцсети · подробности на портале CND', fontFamily: 'Inter', fontSize: 24, fill: '#B8C4D6', name: 'Источник' }),
      I({ x: 946, y: 976, width: 74, height: 74, src: BRAND.iconWhite, locked: true, name: 'Логотип CND' }),
    ],
  },
};

const WEEK = [['Пн', 'sun', 24, 15], ['Вт', 'part', 22, 14], ['Ср', 'cloud', 19, 13], ['Чт', 'rain', 17, 12], ['Пт', 'storm', 16, 11], ['Сб', 'part', 20, 13], ['Вс', 'sun', 25, 16]];
const WORDS = { sun: 'Солнечно', part: 'Переменная облачность', cloud: 'Облачно', rain: 'Дождь', storm: 'Гроза' };

function sunRays(cx, cy, r, fill, g) {
  const out = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const len = r * 0.42, w = r * 0.16, d = r * 1.28;
    out.push(R({ x: cx + Math.cos(a) * d - w / 2, y: cy + Math.sin(a) * d - len / 2, width: w, height: len, cornerRadius: w / 2, fill, rotation: 0, groupId: g, offsetFix: true, _a: (a * 180) / Math.PI + 90 }));
  }
  return out.map(({ _a, offsetFix, ...e }) => {
    const cxr = e.x + e.width / 2, cyr = e.y + e.height / 2;
    const rad = (_a * Math.PI) / 180;
    const ox = -e.width / 2, oy = -e.height / 2;
    return { ...e, x: cxr + ox * Math.cos(rad) - oy * Math.sin(rad), y: cyr + ox * Math.sin(rad) + oy * Math.cos(rad), rotation: _a };
  });
}

function weatherIcon(kind, x, y, s) {
  const g = uid();
  const SUN = '#FFC53D', CLOUD = '#FFFFFF', DROP = '#7CC4FF';
  const cloud = (cx, cy, w, fill = CLOUD, op = 1) => SH('cloud', { x: cx, y: cy, width: w, height: w * 0.66, fill, opacity: op, groupId: g, name: 'Облако' });
  const sun = (cx, cy, r) => [E({ x: cx - r, y: cy - r, width: r * 2, height: r * 2, fill: SUN, groupId: g, name: 'Солнце' }), ...sunRays(cx, cy, r, SUN, g)];
  if (kind === 'sun') return sun(x + s / 2, y + s / 2, s * 0.26);
  if (kind === 'part') return [...sun(x + s * 0.36, y + s * 0.36, s * 0.2), cloud(x + s * 0.18, y + s * 0.38, s * 0.78)];
  if (kind === 'cloud') return [cloud(x + s * 0.02, y + s * 0.16, s * 0.6, '#C9D6E8', 0.9), cloud(x + s * 0.16, y + s * 0.3, s * 0.8)];
  const els = [cloud(x + s * 0.1, y + s * 0.1, s * 0.82)];
  if (kind === 'rain') [0, 1, 2].forEach((i) => els.push(SH('drop', { x: x + s * (0.26 + i * 0.2), y: y + s * 0.68, width: s * 0.12, height: s * 0.2, fill: DROP, groupId: g, name: 'Капля' })));
  if (kind === 'storm') els.push(SH('bolt', { x: x + s * 0.38, y: y + s * 0.58, width: s * 0.26, height: s * 0.4, fill: SUN, groupId: g, name: 'Молния' }));
  return els;
}

const GL = { fill: 'rgba(255,255,255,0.12)', gradient: { type: 'linear', from: 'rgba(255,255,255,0.22)', to: 'rgba(255,255,255,0.06)', angle: 90 }, stroke: 'rgba(255,255,255,0.35)', strokeWidth: 1.5, shadow: { color: '#001A4D', blur: 30, x: 0, y: 10, opacity: 0.3 } };
const SKY = { type: 'linear', from: '#2F8FFF', to: '#03316F', angle: 90 };

function weatherHeader(x, y, w, big) {
  return [
    R({ x, y, width: big ? 268 : 244, height: 52, cornerRadius: 26, fill: '#FFFFFF', name: 'Плашка' }),
    T({ x, y: y + 12, width: big ? 268 : 244, text: 'QUICK WEATHER', fontFamily: 'Montserrat', fontStyle: 'bold', fontSize: 22, letterSpacing: 2.5, fill: '#0B4FA8', align: 'center', lineHeight: 1.1 }),
    T({ x, y: y + 78, width: w, text: 'Прогноз на неделю', fontFamily: 'Montserrat', fontStyle: 'bold', fontSize: big ? 78 : 64, lineHeight: 1.05, name: 'Заголовок' }),
    T({ x, y: y + (big ? 170 : 160), width: w, text: 'Лос-Сантос · 2–8 ноября', fontFamily: 'Inter', fontSize: 30, fill: '#CFE2FF', name: 'Город и даты' }),
  ];
}

function todayCard(x, y, w, h) {
  return [
    R({ x, y, width: w, height: h, cornerRadius: 36, ...GL, name: 'Сегодня' }),
    ...weatherIcon('sun', x + 26, y + (h - 220) / 2, 220),
    T({ x: x + 270, y: y + 40, width: w - 300, text: 'СЕГОДНЯ · ПОНЕДЕЛЬНИК', fontFamily: 'Montserrat', fontStyle: 'bold', fontSize: 20, letterSpacing: 2.5, fill: '#CFE2FF' }),
    T({ x: x + 266, y: y + 70, width: 330, text: '+24°', fontFamily: 'Montserrat', fontStyle: 'bold', fontSize: 132, lineHeight: 1, name: 'Температура' }),
    T({ x: x + 270, y: y + 206, width: w - 300, text: 'Солнечно, ночью +15°', fontFamily: 'Inter', fontStyle: 'bold', fontSize: 30, lineHeight: 1.2 }),
    T({ x: x + 270, y: y + 250, width: w - 300, text: 'Ветер 3 м/с · влажность 40% · УФ 6', fontFamily: 'Inter', fontSize: 24, fill: '#CFE2FF', lineHeight: 1.3 }),
  ];
}

function dayTile(d, x, y, w, h) {
  const [name, kind, hi, lo] = d;
  const ic = Math.min(w * 0.7, h * 0.4);
  return [
    R({ x, y, width: w, height: h, cornerRadius: 26, ...GL, name: `День: ${name}` }),
    T({ x, y: y + 20, width: w, text: name, fontFamily: 'Montserrat', fontStyle: 'bold', fontSize: 28, align: 'center', lineHeight: 1.1 }),
    ...weatherIcon(kind, x + (w - ic) / 2, y + 62, ic),
    T({ x, y: y + 72 + ic, width: w, text: `+${hi}°`, fontFamily: 'Montserrat', fontStyle: 'bold', fontSize: 38, align: 'center', lineHeight: 1.1 }),
    T({ x, y: y + 118 + ic, width: w, text: `+${lo}°`, fontFamily: 'Montserrat', fontSize: 26, fill: '#A9C8F5', align: 'center', lineHeight: 1.1 }),
  ];
}

const QUICK_WEATHER_SQ = {
  id: 'cnd-quick-weather-1x1', name: 'Quick Weather 1:1', kind: 'Quick', tags: ['quick', 'погода', 'прогноз', 'неделя', '1:1', 'квадрат'], official: true, author: 'CND',
  doc: {
    width: 1080, height: 1080, background: '#0B4FA8', gradient: SKY,
    elements: [
      E({ x: 640, y: -220, width: 640, height: 640, fill: '#FFFFFF', gradient: { type: 'radial', from: 'rgba(255,214,102,0.45)', to: 'rgba(255,214,102,0)' }, name: 'Свечение' }),
      ...weatherHeader(60, 56, 860, false),
      I({ x: 946, y: 60, width: 74, height: 74, src: BRAND.iconWhite, locked: true, name: 'Логотип CND' }),
      ...todayCard(60, 290, 960, 320),
      ...WEEK.slice(1).flatMap((d, i) => dayTile(d, 60 + i * 162, 640, 150, 300)),
      T({ x: 60, y: 980, width: 960, text: 'Неделя будет тёплой, в четверг и пятницу возьмите зонт.', fontFamily: 'Inter', fontStyle: 'italic', fontSize: 28, fill: '#E3EEFF', name: 'Совет' }),
      T({ x: 60, y: 1026, width: 960, text: 'California NewsDay · служба погоды', fontFamily: 'Montserrat', fontStyle: 'bold', fontSize: 18, letterSpacing: 3, fill: '#9DB8E6' }),
    ],
  },
};

const QUICK_WEATHER_WIDE = {
  id: 'cnd-quick-weather-16x9', name: 'Quick Weather 16:9', kind: 'Quick', tags: ['quick', 'погода', 'прогноз', 'неделя', '16:9', 'разворот'], official: true, author: 'CND',
  doc: {
    width: 1920, height: 1080, background: '#0B4FA8', gradient: SKY,
    elements: [
      E({ x: 1400, y: -320, width: 800, height: 800, fill: '#FFFFFF', gradient: { type: 'radial', from: 'rgba(255,214,102,0.45)', to: 'rgba(255,214,102,0)' }, name: 'Свечение' }),
      ...weatherHeader(80, 70, 900, true),
      I({ x: 1756, y: 930, width: 84, height: 84, src: BRAND.iconWhite, locked: true, name: 'Логотип CND' }),
      ...todayCard(1040, 70, 800, 320),
      ...WEEK.flatMap((d, i) => dayTile(d, 80 + i * 252, 470, 228, 400)),
      T({ x: 80, y: 926, width: 1600, text: 'Неделя будет тёплой, в четверг и пятницу возьмите зонт и не паркуйтесь под деревьями.', fontFamily: 'Inter', fontStyle: 'italic', fontSize: 32, fill: '#E3EEFF', name: 'Совет' }),
      T({ x: 80, y: 990, width: 1300, text: 'California NewsDay · служба погоды · данные на 08:00', fontFamily: 'Montserrat', fontStyle: 'bold', fontSize: 20, letterSpacing: 3, fill: '#9DB8E6' }),
    ],
  },
};

export const QUICK_TEMPLATES = [QUICK_NEWS, QUICK_WEATHER_SQ, QUICK_WEATHER_WIDE];

const MAG_NAMES = { velour: 'Журнал VELOUR: весь выпуск', velvet: 'Журнал VELVET: весь выпуск', caliber: 'Журнал CALIBER: весь выпуск', cnd: 'Журнал CND WEEKLY: весь выпуск' };

export const MAG_TEMPLATES = Object.keys(MAG_PRESETS).map((style) => {
  let cached = null;
  const make = () => buildMagazine({ style, month: new Date().getMonth(), year: new Date().getFullYear(), pages: MAG_PRESETS[style] });
  return {
    id: `cnd-mag-${style}`, name: MAG_NAMES[style], kind: 'Журнал', official: true, author: 'CND',
    tags: ['журнал', 'выпуск', 'многостраничный', 'a4', 'штрихкод', MAG_STYLES[style].name.toLowerCase()],
    pagesCount: MAG_PRESETS[style].length,
    fonts: magFonts(style),
    rebuild: make,
    get doc() { cached ||= make(); return cached; },
  };
});
