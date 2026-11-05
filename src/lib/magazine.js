// Если крадёте, то крадите ради реально хороших людей
import { uid } from './util.js';
import { barcodeElements } from './barcode.js';
import { withPages } from './pages.js';
import { fitText, flow, measureWidth } from './textfit.js';

export const MAG_W = 1414;
export const MAG_H = 2000;
const W = MAG_W, H = MAG_H, M = 118, CW = W - M * 2;

export const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

export const MAG_STYLES = {
  velour: {
    label: 'Люкс · бордо (как VELOUR)', name: 'VELOUR', tagline: 'журнал о стиле, роскоши и умении выглядеть достойно в любые времена',
    paper: '#F1EADB', ink: '#1F1412', dark: '#2A1617', darkInk: '#F3E9DA', darkMuted: '#B9A79A', accent: '#7A1E2A', accent2: '#E0B25A', gold: '#B08D4A', muted: '#6B5A55', line: '#CDBFA8', blush: '#E9C5C1',
    mast: 'Playfair Display', head: 'Playfair Display', script: 'Playfair Display', scriptStyle: 'italic', body: 'Lora', label: 'Montserrat', upper: false,
    cover: 'luxe', coverBg: '#2B1718', mastColor: '#1F1412', motto: '«Хороший образ пугает. Отличный — заставляет обернуться дважды».',
  },
  velvet: {
    label: 'Бархат · розовый (как VELVET)', name: 'VELVET', tagline: 'бархатная перчатка, стальная рука',
    paper: '#F8E8E8', ink: '#1A1016', dark: '#150C12', darkInk: '#F6E9EC', darkMuted: '#BCA6AE', accent: '#8E1550', accent2: '#E77FB0', gold: '#C9A54E', muted: '#6E5A63', line: '#DCC2C8', blush: '#F2D4DA',
    mast: 'Playfair Display', head: 'Cormorant Garamond', script: 'Marck Script', scriptStyle: 'normal', body: 'Lora', label: 'Montserrat', upper: false,
    cover: 'band', coverLines: 'columns', mastColor: '#8E1550', motto: '«Бархатная перчатка. Стальная рука».',
  },
  caliber: {
    label: 'Калибр · кремовый и красный (как CALIBER)', name: 'CALIBER', tagline: 'мужчины крупного калибра',
    paper: '#F2EAD8', ink: '#161212', dark: '#161212', darkInk: '#F2EAD8', darkMuted: '#B3A893', accent: '#B3141B', accent2: '#E0A53A', gold: '#E0A53A', muted: '#5E554A', line: '#CFC3AA', blush: '#F2EAD8',
    mast: 'Playfair Display', head: 'Oswald', script: 'Lobster', scriptStyle: 'normal', body: 'PT Serif', label: 'Montserrat', upper: true,
    cover: 'band', coverLines: 'boxes', mastColor: '#B3141B', motto: '«Форма обязательна. Футболка — по желанию».',
  },
  cnd: {
    label: 'CND · синий (фирменный)', name: 'CND WEEKLY', tagline: 'Real news. California.',
    paper: '#F3F6FB', ink: '#0C1726', dark: '#081A36', darkInk: '#EAF2FF', darkMuted: '#9DB0CC', accent: '#0B7CFC', accent2: '#FFB547', gold: '#FFB547', muted: '#56657A', line: '#C9D5E5', blush: '#DCEBFF',
    mast: 'Montserrat', head: 'Montserrat', script: 'Playfair Display', scriptStyle: 'italic', body: 'PT Serif', label: 'Inter', upper: false,
    cover: 'band', coverLines: 'columns', mastColor: '#0B7CFC', motto: '«Сначала факты. Потом заголовки».',
  },
};

const base = { opacity: 1, rotation: 0 };
const T = (o) => ({ type: 'text', fontFamily: 'Inter', fontSize: 26, fill: '#111111', align: 'left', fontStyle: 'normal', lineHeight: 1.3, letterSpacing: 0, ...base, ...o });
const R = (o) => ({ type: 'rect', fill: '#000000', cornerRadius: 0, ...base, ...o });
const L = (x, y, len, stroke, w = 2) => ({ type: 'line', x, y, points: [0, 0, len, 0], stroke, strokeWidth: w, ...base });
const V = (x, y, len, stroke, w = 2) => ({ type: 'line', x, y, points: [0, 0, 0, len], stroke, strokeWidth: w, ...base });
const E = (o) => ({ type: 'ellipse', fill: '#000000', ...base, ...o });
const P = (o) => ({ type: 'placeholder', fill: '#BDB3A6', label: 'Перетащите фото', ...base, ...o });

function kit(S, dark) {
  const ink = dark ? S.darkInk : S.ink;
  const muted = dark ? S.darkMuted : S.muted;
  const acc = dark ? S.accent2 : S.accent;
  const up = (t) => (S.upper ? t.toUpperCase() : t);
  return {
    ink, muted, acc,
    lab: (x, y, w, text, fill = acc, o = {}) => T({ x, y, width: w, text: text.toUpperCase(), fontFamily: S.label, fontSize: 19, fontStyle: 'bold', letterSpacing: 4, fill, lineHeight: 1.2, ...o }),
    head: (x, y, w, text, size, o = {}) => T({ x, y, width: w, text: up(text), fontFamily: S.head, fontSize: size, fontStyle: S.head === 'Cormorant Garamond' ? 'normal' : 'bold', fill: ink, lineHeight: 1.05, ...o }),
    script: (x, y, w, text, size, o = {}) => T({ x, y, width: w, text, fontFamily: S.script, fontSize: size, fontStyle: S.scriptStyle, fill: acc, lineHeight: 1.12, ...o }),
    body: (x, y, w, text, size = 25, o = {}) => T({ x, y, width: w, text, fontFamily: S.body, fontSize: size, fill: ink, lineHeight: 1.5, ...o }),
    cap: (x, y, letter, size = 132) => T({ x, y, width: size * 1.05, text: letter, fontFamily: S.head, fontSize: size, fontStyle: 'bold', fill: acc, lineHeight: 0.9 }),
  };
}

function capPair(cap, body) {
  const right = body.x + body.width;
  const x = Math.round(cap.x + measureWidth(cap, cap.text) + 14);
  return [{ ...cap, width: x - cap.x }, { ...body, x, width: right - x }];
}

function header(S, c, section, dark) {
  const k = kit(S, dark);
  return [
    T({ x: M, y: 86, width: 600, maxLines: 1, text: c.name, fontFamily: S.mast, fontSize: 46, fontStyle: 'bold', fill: dark ? S.darkInk : (S.cover === 'band' ? S.mastColor : S.ink), letterSpacing: 1, keep: true, name: 'Колонтитул: название' }),
    k.lab(W - M - 600, 104, 600, section, dark ? S.gold : S.accent, { align: 'right', name: 'Колонтитул: рубрика' }),
    { ...L(M, 166, CW, dark ? S.darkMuted : S.ink, 2), keep: true, name: 'Колонтитул: линия' },
  ];
}

function footer(S, c, dark) {
  const k = kit(S, dark);
  return [
    { ...L(M, 1866, CW, dark ? 'rgba(255,255,255,0.18)' : S.line, 1.5), keep: true, name: 'Подвал: линия' },
    { ...k.lab(M, 1896, 900, c.footer, dark ? S.darkMuted : S.ink, { fontSize: 18, letterSpacing: 3 }), keep: true, name: 'Подвал: выпуск' },
    { ...k.lab(W - M - 200, 1896, 200, '{nn}', dark ? S.gold : S.accent, { align: 'right', fontSize: 20 }), text: '{nn}', auto: true, keep: true, name: 'Номер страницы' },
  ];
}

function sticker(S, x, y, size, top, main, fill, ink, mainFont) {
  return [
    E({ x, y, width: size, height: size, fill, shadow: { color: '#000000', blur: 26, x: 0, y: 10, opacity: 0.3 } }),
    T({ x, y: y + size * 0.3, width: size, text: top.toUpperCase(), fontFamily: S.label, fontSize: Math.round(size * 0.075), fontStyle: 'bold', letterSpacing: 3, fill: ink, align: 'center' }),
    T({ x: x + size * 0.08, y: y + size * 0.42, width: size * 0.84, text: main, fontFamily: mainFont || S.head, fontSize: Math.round(size * 0.15), fontStyle: mainFont ? 'normal' : 'bold', fill: ink, align: 'center', lineHeight: 1 }),
  ];
}

function barcode(c, x, y, w = 230, h = 112, color = '#000000') {
  return barcodeElements(c.code, { x, y, width: w, height: h, color, groupId: uid() });
}

const PAGES = {
  cover: {
    title: 'Обложка', desc: '', cover: true,
    build(S, c) {
      if (S.cover === 'luxe') {
        const k = kit(S, true);
        return {
          background: S.coverBg,
          elements: [
            k.lab(M, 78, 420, `№ ${c.issue} · ${c.month} ${c.year}`, S.darkInk),
            k.lab(W / 2 - 250, 78, 500, c.city, S.darkInk, { align: 'center' }),
            k.lab(W - M - 300, 78, 300, c.price, S.darkInk, { align: 'right' }),
            T({ x: M - 40, y: 118, width: CW + 80, text: c.name, fontFamily: S.mast, fontSize: c.name.length > 7 ? 230 : 290, fontStyle: 'bold', fill: S.darkInk, align: 'center', lineHeight: 1, letterSpacing: -4, maxLines: 1, minScale: 0.3, name: 'Название журнала' }),
            L(M, 492, 130, S.darkMuted, 1.5), L(W - M - 130, 492, 130, S.darkMuted, 1.5),
            T({ x: M + 150, y: 474, width: CW - 300, text: c.tagline, fontFamily: S.head, fontStyle: 'italic', fontSize: 28, fill: S.darkInk, align: 'center', opacity: 0.85 }),
            E({ x: 640, y: 600, width: 700, height: 700, fill: S.accent, opacity: 0.85 }),
            P({ x: 560, y: 620, width: 790, height: 880, label: 'Главный предмет или герой (PNG без фона)', fill: 'rgba(0,0,0,0)' }),
            ...sticker(S, 1090, 540, 230, 'Хит сезона', c.price, S.blush, S.ink),
            ...flow(560, 14, [
              k.lab(M, 0, 440, 'Эксклюзив', S.gold),
              { ...k.head(M, 0, 420, 'Главный материал номера', 50), maxLines: 2 },
              { ...k.body(M, 0, 420, 'Короткое пояснение, почему об этом говорит весь штат', 24, { fill: S.darkMuted }), after: 30 },
              { ...L(M, 0, 90, S.gold, 2), after: 36 },
              k.lab(M, 0, 440, 'Дуэль сезона', S.gold),
              { ...k.head(M, 0, 420, 'Сравнение двух героев', 50, { fontStyle: 'italic' }), maxLines: 2 },
              { ...k.body(M, 0, 420, 'Большая или маленькая? Разбираем без эмоций', 24, { fill: S.darkMuted }), after: 30 },
              { ...L(M, 0, 90, S.gold, 2), after: 36 },
              k.lab(M, 0, 440, 'Гид', S.gold),
              { ...k.head(M, 0, 420, 'Что взять с собой', 50), maxLines: 2 },
              k.body(M, 0, 420, 'Документы, пропуск и помада: набор на каждый день', 24, { fill: S.darkMuted }),
            ]),
            L(M, 1640, CW, S.darkMuted, 1.5),
            k.lab(M, 1676, 600, 'Главная тема номера', S.darkInk),
            T({ x: M, y: 1712, width: 900, text: 'Осень под замком', fontFamily: S.head, fontStyle: 'italic bold', fontSize: 100, fill: S.darkInk, lineHeight: 1, maxLines: 1 }),
            k.body(M, 1836, 900, 'Главная тема номера: 6 оттенков, 4 тренда, 3 образа', 26, { fill: S.darkInk }),
            ...barcode(c, W - M - 230, 1712, 230, 112),
            k.lab(W - M - 230, 1840, 230, `${c.mm} / ${c.year}`, S.darkInk, { align: 'right', fontSize: 18 }),
          ],
        };
      }
      const k = kit(S, false), kd = kit(S, true);
      const els = [
        R({ x: 0, y: 0, width: W, height: 460, fill: S.paper }),
        k.lab(M - 40, 64, 700, 'California News Day представляет', S.ink),
        k.lab(W - M - 460, 64, 500, `№ ${c.issue} · ${c.month} ${c.year}`, S.ink, { align: 'right' }),
        T({ x: 40, y: 96, width: W - 80, text: c.name, fontFamily: S.mast, fontSize: c.name.length > 7 ? 220 : 260, fontStyle: 'bold', fill: S.mastColor, align: 'center', lineHeight: 1, letterSpacing: 2, maxLines: 1, minScale: 0.3, name: 'Название журнала' }),
        R({ x: W / 2 - 340, y: 366, width: 680, height: 66, fill: S.dark }),
        T({ x: W / 2 - 340, y: 374, width: 680, text: c.tagline, fontFamily: S.script, fontStyle: S.scriptStyle, fontSize: 36, fill: S.darkInk, align: 'center', lineHeight: 1.2 }),
        P({ x: 0, y: 460, width: W, height: 1200, label: 'Фото героя на всю ширину', fill: '#8A6A52' }),
        ...sticker(S, W - M - 250, 520, 260, S.coverLines === 'boxes' ? 'Первый выпуск' : 'Героиня номера', S.coverLines === 'boxes' ? 'без футболок' : 'Имя\nФамилия', S.gold, S.ink, S.script),
      ];
      if (S.coverLines === 'boxes') {
        els.push(
          R({ x: M - 30, y: 520, width: 540, height: 150, fill: S.dark }),
          kd.lab(M - 6, 540, 500, 'Эксклюзив', S.gold),
          T({ x: M - 6, y: 570, width: 500, text: 'СОЛДАТ МЕСЯЦА', fontFamily: S.head, fontStyle: 'bold', fontSize: 58, fill: S.darkInk, lineHeight: 1 }),
          T({ x: M - 6, y: 634, width: 500, text: 'Имя засекречено. Пресс — нет.', fontFamily: S.body, fontSize: 22, fill: S.darkMuted }),
          R({ x: M - 30, y: 690, width: 520, height: 130, fill: S.paper }),
          T({ x: M - 6, y: 708, width: 480, text: 'ПРЕСС ПО УСТАВУ', fontFamily: S.head, fontStyle: 'bold', fontSize: 50, fill: S.ink, lineHeight: 1 }),
          T({ x: M - 6, y: 768, width: 480, text: 'Пять упражнений без увольнительной', fontFamily: S.body, fontSize: 22, fill: S.muted }),
          R({ x: M - 30, y: 840, width: 520, height: 130, fill: S.accent }),
          T({ x: M - 6, y: 856, width: 480, text: 'ТЕСТ', fontFamily: S.head, fontStyle: 'bold', fontSize: 50, fill: '#FFFFFF', lineHeight: 1 }),
          T({ x: M - 6, y: 912, width: 480, text: 'Какой ты калибр?', fontFamily: S.script, fontSize: 40, fill: '#FFFFFF' }),
          R({ x: 0, y: 1660, width: W, height: 340, fill: S.dark }), R({ x: 0, y: 1660, width: W, height: 8, fill: S.accent }),
          T({ x: M - 30, y: 1730, width: 860, text: 'Цензура проверила. Покраснела. Пропустила.', fontFamily: S.script, fontSize: 52, fill: S.darkInk, lineHeight: 1.1, maxLines: 2 }),
          kd.lab(M - 30, 1880, 600, 'Не для слабонервных', S.gold),
        );
      } else {
        els.push(
          R({ x: 0, y: 1660, width: W, height: 340, fill: S.dark }), R({ x: 0, y: 1660, width: W, height: 8, fill: S.accent }),
          ...[['Эксклюзив', 'Главный материал без цензуры'], ['Стиль', 'Образ в кабинете героини'], ['Тест', 'Бархат или сталь?']].flatMap(([a, b], i) => [
            kd.lab(M + i * 330, 1712, 300, a, S.gold), T({ x: M + i * 330, y: 1746, width: 300, text: b, fontFamily: S.head, fontSize: 40, fill: S.darkInk, lineHeight: 1.08, maxLines: 2 }),
          ]),
          L(M, 1862, 860, 'rgba(255,255,255,0.2)', 1.5),
          T({ x: M, y: 1886, width: 900, text: 'Протест отклонён. Красота — принята.', fontFamily: S.script, fontStyle: S.scriptStyle, fontSize: 46, fill: S.darkInk, maxLines: 1 }),
        );
      }
      els.push(...barcode(c, W - M - 220, 1736, 220, 108), kd.lab(W - M - 220, 1858, 220, `${c.mm} / ${c.year} · ${c.price}`, S.darkInk, { align: 'right', fontSize: 17 }));
      return { background: S.dark, elements: els };
    },
  },

  contents: {
    title: 'Содержание и письмо редактора', desc: 'Что в номере',
    build(S, c, ctx) {
      const k = kit(S, false);
      const list = (ctx.contents || []).slice(0, 8);
      const els = [...header(S, c, `№ ${c.issue} · ${c.month} ${c.year}`, false)];
      els.push(T({ x: M, y: 206, width: 560, text: S.upper ? 'В НОМЕРЕ' : 'Содержание', fontFamily: S.head, fontStyle: S.upper ? 'bold' : 'italic bold', fontSize: 88, fill: S.ink, lineHeight: 1, maxLines: 1 }));
      list.forEach((it, i) => {
        const y = 340 + i * 116;
        els.push(L(M, y - 14, 540, S.line, 1.5),
          T({ x: M, y, width: 110, text: String(it.page).padStart(2, '0'), fontFamily: S.head, fontStyle: 'bold', fontSize: 62, fill: S.accent, lineHeight: 1 }),
          T({ x: M + 124, y: y + 2, width: 416, text: S.upper ? it.title.toUpperCase() : it.title, fontFamily: S.head, fontStyle: 'bold', fontSize: 32, fill: S.ink, lineHeight: 1.1, maxLines: 1 }),
          T({ x: M + 124, y: y + 46, width: 416, text: it.desc, fontFamily: S.body, fontSize: 21, fill: S.muted, lineHeight: 1.3, maxLines: 2 }));
      });
      const py = Math.max(340 + list.length * 116 + 40, 1240);
      els.push(P({ x: M, y: py, width: 540, height: 1740 - py, label: 'Кадр со съёмок' }),
        T({ x: M, y: 1756, width: 540, text: 'ЗА КАДРОМ: подпись к фото — кто и где снят.', fontFamily: S.label, fontSize: 17, fill: S.muted, lineHeight: 1.35 }));
      const X = M + 610, CWR = CW - 610;
      els.push(k.lab(X, 210, CWR, 'Письмо редактора'),
        T({ x: X, y: 250, width: CWR, text: 'Заголовок письма\nв две строки', fontFamily: S.head, fontStyle: S.head === 'Cormorant Garamond' ? 'normal' : 'bold', fontSize: 70, fill: S.ink, lineHeight: 1.05, maxLines: 2 }),
        R({ x: X, y: 432, width: 90, height: 4, fill: S.gold }),
        ...capPair(k.cap(X, 476, 'Ш', 136), k.body(X + 110, 480, CWR - 110, 'естнадцатого числа Калифорния проснулась в другом мире. Наши планы перенесены, а половина редакции добирается до офиса через три проверки.', 25)),
        k.body(X, 690, CWR, 'И всё же мы выпускаем этот номер. Потому что стиль — это не то, что можно отменить указом. Это способ сказать: я здесь, я в порядке, и я выгляжу лучше, чем обстоятельства.\n\nВ этом номере — герои, о которых говорит весь штат, образы на каждый день и честные ответы на вопросы читателей.\n\nБерегите себя. И храните документы в красивой сумке.', 25),
        T({ x: X, y: 1420, width: CWR, text: 'Имя Редактора', fontFamily: S.script === 'Playfair Display' ? 'Marck Script' : S.script, fontSize: 64, fill: S.accent }),
        k.lab(X, 1512, CWR, `Главный редактор ${c.name}`, S.muted),
        R({ x: X, y: 1600, width: CWR, height: 210, fill: S.cover === 'luxe' ? S.dark : S.accent }),
        T({ x: X + 32, y: 1630, width: CWR - 64, text: S.motto, fontFamily: S.head, fontStyle: 'italic', fontSize: 34, fill: '#FFFFFF', lineHeight: 1.2 }),
        kit(S, true).lab(X + 32, 1764, CWR - 64, `Девиз ${c.name}`, S.cover === 'luxe' ? S.gold : '#FFFFFF', { fontSize: 16 }),
        ...footer(S, c, false));
      return { background: S.paper, elements: els };
    },
  },

  hero: {
    title: 'Герой номера', desc: 'Фотосессия и анкета героя', dark: true,
    build(S, c) {
      const k = kit(S, true);
      return {
        background: S.dark,
        elements: [
          ...header(S, c, 'Герой номера', true),
          k.head(M, 196, CW, 'Мисс Месяца', 112, { fill: S.darkInk, maxLines: 1 }),
          k.script(M, 322, CW, 'Имя Фамилия героя', 56, { maxLines: 1 }),
          P({ x: 0, y: 420, width: W, height: 900, label: 'Главное фото героя' }),
          ...capPair(k.cap(M, 1372, 'О', 120), k.body(M + 96, 1378, 600, 'на приехала на съёмку на чёрном лимузине — и не опоздала ни на минуту. Расскажите, кто герой, чем он знаменит в Калифорнии и почему именно он открывает номер.', 24, { fill: S.darkInk })),
          k.body(M, 1560, 696, 'Второй абзац: детали со съёмки, цитаты и то, что не попало в официальную биографию.', 24, { fill: S.darkMuted }),
          T({ x: M, y: 1690, width: 696, text: '«Яркая цитата героя, ради которой читают номер».', fontFamily: S.head, fontStyle: 'italic', fontSize: 38, fill: S.accent2, lineHeight: 1.2 }),
          R({ x: M + 760, y: 1372, width: CW - 760, height: 460, fill: S.paper }),
          k.lab(M + 790, 1398, CW - 820, 'Анкета героя', S.accent),
          L(M + 790, 1432, CW - 820, S.ink, 2),
          ...[['Должность', 'кем работает в штате'], ['Любимое слово', '«Протестую!»'], ['Любимый звук', 'стук молотка'], ['Слабость', 'чёрные лимузины'], ['Не любит', 'алиби без свидетелей'], ['Девиз', 'последнее слово за мной']].flatMap(([a, b], i) => [
            T({ x: M + 790, y: 1452 + i * 60, width: CW - 820, text: `${a.toUpperCase()}:`, fontFamily: S.label, fontStyle: 'bold', fontSize: 17, letterSpacing: 1, fill: S.ink }),
            T({ x: M + 790, y: 1474 + i * 60, width: CW - 820, text: b, fontFamily: S.body, fontSize: 21, fill: S.ink }),
          ]),
          ...footer(S, c, true),
        ],
      };
    },
  },

  feature: {
    title: 'Главный предмет', desc: 'Большой материал с характеристиками',
    build(S, c) {
      const k = kit(S, false);
      const X2 = M + 740, W2 = CW - 740;
      return {
        background: S.paper,
        elements: [
          ...header(S, c, 'Главный предмет сезона', false),
          k.lab(M, 204, CW, 'Бренд · осень 2026'),
          k.head(M, 236, CW, 'Розовый', 132, { maxLines: 1 }),
          T({ x: M, y: 370, width: CW, text: S.upper ? 'СЕЙФ' : 'сейф', fontFamily: S.cover === 'band' && S.upper ? S.script : S.head, fontStyle: S.upper ? 'normal' : 'italic', fontSize: S.upper ? 96 : 120, fill: S.accent, lineHeight: 1 }),
          k.body(M, 508, CW, 'Лид материала: одна-две строки, которые объясняют, почему этот предмет — главный в сезоне и что мы с ним сделали.', 29, { fontStyle: 'italic', fill: S.muted }),
          P({ x: M, y: 640, width: 700, height: 660, label: 'Фото предмета', fill: S.blush }),
          ...[['Цена', '$250 000'], ['Вместимость', 'Большая'], ['Формат', 'Саквояж'], ['Как носить', 'В руке']].flatMap(([a, b], i) => {
            const x = X2 + (i % 2) * (W2 / 2 + 6), y = 640 + Math.floor(i / 2) * 140;
            return [L(x, y, W2 / 2 - 12, S.accent, 2), k.lab(x, y + 16, W2 / 2 - 12, a, S.muted, { fontSize: 16 }), k.head(x, y + 46, W2 / 2 - 12, b, 42, { fill: i === 0 ? S.accent : S.ink, maxLines: 1 })];
          }),
          R({ x: X2, y: 940, width: W2, height: 360, fill: S.dark }),
          kit(S, true).lab(X2 + 28, 968, W2 - 56, 'Что помещается внутри', S.gold, { fontSize: 16 }),
          T({ x: X2 + 28, y: 1008, width: (W2 - 56) / 2, text: '▪ Паспорт\n▪ Шарф\n▪ Косметичка\n▪ Аптечка', fontFamily: S.body, fontSize: 23, fill: S.darkInk, lineHeight: 1.7 }),
          T({ x: X2 + 28 + (W2 - 56) / 2, y: 1008, width: (W2 - 56) / 2, text: '▪ Пропуск\n▪ Перчатки\n▪ Ноутбук\n▪ Зонт', fontFamily: S.body, fontSize: 23, fill: S.darkInk, lineHeight: 1.7 }),
          T({ x: X2 + 28, y: 1222, width: W2 - 56, text: 'Хватит на поездку в соседний округ.', fontFamily: S.body, fontStyle: 'italic', fontSize: 20, fill: S.darkMuted }),
          ...capPair(k.cap(M, 1356, 'Е', 110), k.body(M + 86, 1360, 290, 'ё невозможно не заметить: оттенок, силуэт и монограмма.', 23)),
          k.body(M, 1500, 376, 'Первая колонка текста. Расскажите историю предмета, где его купить и сколько он стоит в Калифорнии.', 23),
          k.body(M + 410, 1356, 376, 'Вторая колонка: что внутри, как носить и с чем сочетать. Плотный текст лучше разбить на короткие абзацы.\n\nКороткий вывод.', 23),
          T({ x: M + 820, y: 1352, width: CW - 820, text: '«Цитата, которая продаёт материал».', fontFamily: S.head, fontStyle: 'italic', fontSize: 44, fill: S.accent, lineHeight: 1.15, maxH: 250 }),
          R({ x: M + 820, y: 1620, width: CW - 820, height: 200, fill: 'rgba(0,0,0,0)', stroke: S.ink, strokeWidth: 1.5 }),
          T({ x: M + 844, y: 1642, width: CW - 868, text: 'ОТ РЕДАКЦИИ. Совет читателю в двух-трёх строках.', fontFamily: S.body, fontSize: 21, fill: S.ink, lineHeight: 1.4 }),
          ...footer(S, c, false),
        ],
      };
    },
  },

  darkFeature: {
    title: 'Второй предмет', desc: 'Тёмная полоса с акцентом', dark: true,
    build(S, c) {
      const k = kit(S, true);
      const X2 = M + 600, W2 = CW - 600;
      return {
        background: S.dark,
        gradient: { type: 'linear', from: S.dark, to: S.cover === 'luxe' ? '#3A1F4F' : S.dark, angle: 90 },
        elements: [
          ...header(S, c, 'Клетка сезона', true),
          P({ x: M, y: 210, width: 560, height: 900, label: 'Фото предмета (PNG без фона)', fill: 'rgba(255,255,255,0.06)' }),
          k.lab(X2, 210, W2, 'Бренд · осень 2026', S.gold),
          k.head(X2, 246, W2, 'Фиолетовая', 96, { fill: S.darkInk, maxLines: 1 }),
          T({ x: X2, y: 350, width: W2, text: S.upper ? 'КЛЕТКА' : 'клетка', fontFamily: S.head, fontStyle: 'italic', fontSize: 96, fill: S.accent2, lineHeight: 1 }),
          k.body(X2, 480, W2, 'Короткий лид: младшая сестра главного предмета стоит вдвое дешевле — и понимает эту осень лучше всех.', 27, { fontStyle: 'italic', fill: S.darkMuted }),
          ...[['Цена', '$125 000'], ['Вместимость', 'Маленькая'], ['Формат', 'На ремнях'], ['Фурнитура', 'Золото']].flatMap(([a, b], i) => {
            const x = X2 + (i % 2) * (W2 / 2 + 6), y = 660 + Math.floor(i / 2) * 130;
            return [L(x, y, W2 / 2 - 12, S.gold, 1.5), k.lab(x, y + 14, W2 / 2 - 12, a, S.darkMuted, { fontSize: 16 }), k.head(x, y + 42, W2 / 2 - 12, b, 40, { fill: i === 0 ? S.gold : S.darkInk, maxLines: 1 })];
          }),
          ...capPair(k.cap(X2, 940, 'Е', 110), k.body(X2 + 86, 946, W2 - 86, 'сли первый предмет — заявление, то этот — интонация. Опишите его характер.', 23, { fill: S.darkInk })),
          k.body(X2, 1090, W2, 'Второй абзац о том, кому он подойдёт и почему его стоит выбрать.\n\nТретий абзац: главное достоинство — сдержанность.', 23, { fill: S.darkInk }),
          L(M, 1170, 560, S.gold, 1.5),
          k.lab(M, 1194, 560, 'Что помещается внутри', S.gold, { fontSize: 16 }),
          T({ x: M, y: 1232, width: 270, text: '▪ Телефон\n▪ Ключи', fontFamily: S.body, fontSize: 23, fill: S.darkInk, lineHeight: 1.7 }),
          T({ x: M + 280, y: 1232, width: 280, text: '▪ Пропуск\n▪ Помада', fontFamily: S.body, fontSize: 23, fill: S.darkInk, lineHeight: 1.7 }),
          L(M, 1560, 560, S.gold, 1.5),
          T({ x: M, y: 1590, width: 560, text: 'Маленькая сумка.\nБольшое впечатление.\nПоловина цены.', fontFamily: S.head, fontStyle: 'italic', fontSize: 40, fill: S.gold, lineHeight: 1.2 }),
          R({ x: X2, y: 1600, width: W2, height: 210, fill: 'rgba(0,0,0,0)', stroke: 'rgba(255,255,255,0.25)', strokeWidth: 1.5 }),
          R({ x: X2 + 28, y: 1640, width: 56, height: 56, fill: S.accent2, stroke: S.gold, strokeWidth: 2 }),
          T({ x: X2 + 108, y: 1630, width: W2 - 136, text: 'С ЧЕМ НОСИТЬ. Графитовое пальто, кремовая водолазка, золотые серьги-кольца.', fontFamily: S.body, fontSize: 21, fill: S.darkInk, lineHeight: 1.45 }),
          ...footer(S, c, true),
        ],
      };
    },
  },

  story: {
    title: 'Фотоистория', desc: 'Большое фото, текст и распорядок',
    build(S, c) {
      const k = kit(S, false), kd = kit(S, true);
      return {
        background: S.paper,
        elements: [
          ...header(S, c, 'Фотоистория', false),
          k.head(M, 200, CW, 'Утро в казарме', 112, { maxLines: 1 }),
          k.script(M, 326, CW, 'Даже самым суровым нужны объятия', 48, { maxLines: 1 }),
          P({ x: M, y: 420, width: CW, height: 720, label: 'Главное фото истории' }),
          ...capPair(k.cap(M, 1196, 'Ш', 110), k.body(M + 90, 1200, 560, 'есть утра, все ещё спят. А наш герой уже позирует — правда, слегка смущённо.', 24)),
          k.body(M, 1330, 650, 'Продолжение истории: что происходило за кадром и чем закончилось утро.', 24),
          L(M, 1600, 650, S.ink, 2),
          T({ x: M, y: 1630, width: 650, text: '«Застелить кровать за 45 секунд — это дисциплина. Сделать это красиво — искусство».', fontFamily: S.script, fontStyle: S.scriptStyle, fontSize: 36, fill: S.ink, lineHeight: 1.25 }),
          R({ x: M + 700, y: 1196, width: CW - 700, height: 630, fill: S.dark }),
          kd.lab(M + 728, 1222, CW - 756, 'Распорядок дня', S.gold),
          ...['06:00|Подъём. Кофе найти не удалось.', '06:15|Разминка, пока никто не видит.', '07:00|Тренировка — см. следующую страницу.', '09:00|Построение. Оборачиваются все.', '13:00|Бумажная работа с фикусом.', '18:00|Свидание с машиной.', '22:00|Отбой. Сердце бьётся по уставу.'].flatMap((r, i) => {
            const [t, d] = r.split('|'); const y = 1272 + i * 76;
            return [T({ x: M + 728, y, width: 100, text: t, fontFamily: S.label, fontStyle: 'bold', fontSize: 20, fill: S.accent2 }), T({ x: M + 840, y, width: CW - 870, text: d, fontFamily: S.body, fontSize: 20, fill: S.darkInk, lineHeight: 1.35 })];
          }),
          ...footer(S, c, false),
        ],
      };
    },
  },

  list: {
    title: 'Пять пунктов', desc: 'Упражнения, правила или советы', accent: true,
    build(S, c) {
      const k = kit(S, true);
      const items = [['Первый пункт', '3 × 20. Короткое пояснение.'], ['Второй пункт', '3 × 10. Пояснение в одну строку.'], ['Третий пункт', 'Держите, пока не надоест.'], ['Четвёртый пункт', 'Новичкам подойдёт рюкзак.'], ['Пятый пункт', 'Улыбаться фотографу обязательно.']];
      return {
        background: S.accent,
        elements: [
          ...header(S, c, 'Форма', true).map((e) => (e.type === 'line' ? { ...e, stroke: 'rgba(255,255,255,0.6)' } : e.name === 'Колонтитул: рубрика' ? { ...e, fill: '#FFFFFF' } : e)),
          k.head(M, 200, CW, 'Пресс по уставу', 112, { fill: '#FFFFFF', maxLines: 1 }),
          k.script(M, 326, CW, 'Пять упражнений без увольнительной', 46, { fill: S.gold, maxLines: 1 }),
          P({ x: M, y: 420, width: CW, height: 760, label: 'Фото', frameStroke: '#FFFFFF', frameStrokeWidth: 6 }),
          ...items.flatMap(([a, b], i) => {
            const x = M + (i % 2) * (CW / 2 + 10), y = 1240 + Math.floor(i / 2) * 170;
            return [T({ x, y, width: 80, text: String(i + 1), fontFamily: S.head, fontStyle: 'bold', fontSize: 92, fill: S.gold, lineHeight: 1 }),
              T({ x: x + 90, y: y + 6, width: CW / 2 - 110, text: a.toUpperCase(), fontFamily: S.head, fontStyle: 'bold', fontSize: 32, fill: '#FFFFFF', lineHeight: 1.1, maxLines: 1 }),
              T({ x: x + 90, y: y + 50, width: CW / 2 - 110, text: b, fontFamily: S.body, fontSize: 22, fill: '#FFFFFF', opacity: 0.85 })];
          }),
          R({ x: M + CW / 2 + 10, y: 1580, width: CW / 2 - 10, height: 200, fill: S.dark }),
          k.lab(M + CW / 2 + 38, 1606, CW / 2 - 60, `Совет ${c.name}`, S.gold, { fontSize: 16 }),
          T({ x: M + CW / 2 + 38, y: 1644, width: CW / 2 - 66, text: 'Короткий совет от редакции в две-три строки.', fontFamily: S.body, fontSize: 22, fill: S.darkInk, lineHeight: 1.4 }),
          ...footer(S, c, true).map((e) => (e.type === 'line' ? { ...e, stroke: 'rgba(255,255,255,0.4)' } : e.auto ? { ...e, fill: '#FFFFFF' } : { ...e, fill: '#FFFFFF' })),
        ],
      };
    },
  },

  palette: {
    title: 'Тренды: палитра', desc: 'Шесть оттенков и четыре идеи',
    build(S, c) {
      const k = kit(S, false);
      const sw = [['#6B1E24', 'Бордо «Комендантский час»', 'пальто, помада, перчатки'], ['#4A2E22', 'Шоколад «Голливудские холмы»', 'трикотаж и замша'], ['#C49A98', 'Пыльная роза «Сейф»', 'тон главного предмета'], ['#3E2A5C', 'Баклажан «Ночной патруль»', 'клетка и шарфы'], ['#5C5F3E', 'Олива «Блокпост»', 'милитари без пафоса'], ['#B08D4A', 'Золото «Фурнитура»', 'цепи, пряжки, замки']];
      const cw = (CW - 48) / 3;
      return {
        background: S.paper,
        elements: [
          ...header(S, c, 'Тренды', false),
          k.head(M, 200, CW, `${c.month}`, 112, { maxLines: 1 }),
          T({ x: M, y: 318, width: CW, text: 'в шести оттенках', fontFamily: S.head, fontStyle: 'italic', fontSize: 96, fill: S.accent, lineHeight: 1, maxLines: 1 }),
          k.body(M, 440, CW, 'Палитра этой осени — глубокая, тёплая и немного тревожная. Как сам город после заката.', 27, { fontStyle: 'italic', fill: S.muted }),
          ...sw.flatMap(([col, name, use], i) => {
            const x = M + (i % 3) * (cw + 24), y = 560 + Math.floor(i / 3) * 370;
            return [R({ x, y, width: cw, height: 180, fill: col }), T({ x, y: y + 198, width: cw, text: name, fontFamily: S.head, fontStyle: 'bold', fontSize: 30, fill: S.ink, lineHeight: 1.12, maxLines: 2 }), T({ x, y: y + 276, width: cw, text: `${col} · ${use}`, fontFamily: S.label, fontSize: 17, fill: S.muted, letterSpacing: 0.5 })];
          }),
          T({ x: M, y: 1316, width: 700, text: 'Четыре идеи сезона', fontFamily: S.head, fontStyle: 'italic bold', fontSize: 52, fill: S.ink, maxLines: 1 }),
          L(M + 620, 1352, CW - 620, S.ink, 1.5),
          ...[['Тихая броня', 'Структурные пальто, плотная кожа, чёткие плечи.'], ['Клетка возвращается', 'От шотландки до мелкого «окна».'], ['Металл на виду', 'Золотые ремни и тяжёлые пряжки.'], ['Большое и маленькое', 'Саквояж для дня, крошечная сумка для вечера.']].flatMap(([a, b], i) => {
            const x = M + (i % 2) * (CW / 2 + 10), y = 1440 + Math.floor(i / 2) * 190;
            return [T({ x, y, width: 100, text: String(i + 1).padStart(2, '0'), fontFamily: S.head, fontStyle: 'bold', fontSize: 64, fill: S.accent, lineHeight: 1 }), T({ x: x + 110, y, width: CW / 2 - 130, text: a, fontFamily: S.head, fontStyle: 'bold', fontSize: 32, fill: S.ink, maxLines: 1 }), k.body(x + 110, y + 46, CW / 2 - 130, b, 22)];
          }),
          ...footer(S, c, false),
        ],
      };
    },
  },

  compare: {
    title: 'Дуэль сезона', desc: 'Сравнение двух героев в таблице',
    build(S, c) {
      const k = kit(S, false), kd = kit(S, true);
      const rows = [['Цена', '$250 000', '$125 000 · выгоднее'], ['Формат', 'Саквояж', 'Сумка на ремнях'], ['Вместимость', 'Большая', 'Маленькая'], ['Как носить', 'В руке', 'Через плечо'], ['Цвет', 'Пыльная роза', 'Баклажан в клетку'], ['Повод', 'Деловой день', 'Ужин, приём'], ['Настроение', 'Статус · громко', 'Вкус · вполголоса']];
      const c1 = M + 380, c2 = M + 780;
      return {
        background: S.paper,
        elements: [
          ...header(S, c, 'Сравнение', false),
          k.head(M, 200, 360, 'Дуэль', 112, { maxLines: 1 }),
          T({ x: M + 380, y: 210, width: 420, text: S.upper ? 'СЕЗОНА' : 'сезона', fontFamily: S.head, fontStyle: 'italic', fontSize: 100, fill: S.accent, lineHeight: 1, maxLines: 1 }),
          k.body(W - M - 380, 220, 380, 'Две легенды, одна витрина. Считаем без эмоций.', 24, { fontStyle: 'italic', fill: S.muted, align: 'right' }),
          P({ x: M, y: 380, width: CW / 2, height: 480, label: 'Первый герой', fill: S.blush }),
          P({ x: M + CW / 2, y: 380, width: CW / 2, height: 480, label: 'Второй герой', fill: '#3E2A5C' }),
          E({ x: W / 2 - 70, y: 550, width: 140, height: 140, fill: S.dark, stroke: S.gold, strokeWidth: 3 }),
          T({ x: W / 2 - 70, y: 588, width: 140, text: 'vs', fontFamily: S.head, fontStyle: 'italic', fontSize: 56, fill: S.darkInk, align: 'center', lineHeight: 1 }),
          k.head(M + 28, 790, 500, 'Первый', 44, { fill: S.ink }),
          k.head(W - M - 528, 790, 500, 'Второй', 44, { fill: '#FFFFFF', align: 'right' }),
          k.lab(M, 900, 360, 'Параметр', S.ink, { fontSize: 16 }), k.lab(c1, 900, 380, 'Первый', S.ink, { fontSize: 16 }), k.lab(c2, 900, 400, 'Второй', S.ink, { fontSize: 16 }),
          L(M, 934, CW, S.ink, 2),
          ...rows.flatMap(([a, b, d], i) => {
            const y = 952 + i * 62;
            return [T({ x: M, y, width: 360, text: a, fontFamily: S.body, fontSize: 23, fill: S.muted }), T({ x: c1, y, width: 380, text: b, fontFamily: S.body, fontSize: 23, fill: S.ink }), T({ x: c2, y, width: 400, text: d, fontFamily: S.body, fontStyle: i % 3 === 0 ? 'bold' : 'normal', fontSize: 23, fill: i % 3 === 0 ? S.accent : S.ink }), L(M, y + 46, CW, S.line, 1)];
          }),
          R({ x: M, y: 1430, width: CW, height: 400, fill: S.dark }),
          kd.lab(M + 40, 1462, 500, 'Вердикт редакции', S.gold), L(M + 400, 1474, CW - 440, S.gold, 1.5),
          T({ x: M + 40, y: 1510, width: CW - 80, text: 'Главный вывод в две строки: кому что подойдёт и почему. Без эмоций, только факты.', fontFamily: S.body, fontSize: 34, fill: S.darkInk, lineHeight: 1.35 }),
          T({ x: M + 40, y: 1666, width: CW / 2 - 70, text: 'Берите первый, если часто ездите по штату и хотите уместить жизнь в одну сумку.', fontFamily: S.body, fontSize: 21, fill: S.darkInk, lineHeight: 1.45 }),
          T({ x: M + CW / 2 + 10, y: 1666, width: CW / 2 - 50, text: 'Берите второй, если вам хватит телефона и пропуска, а руки должны быть свободны.', fontFamily: S.body, fontSize: 21, fill: S.darkInk, lineHeight: 1.45 }),
          ...footer(S, c, false),
        ],
      };
    },
  },

  looks: {
    title: 'Три образа', desc: 'Утро, день и вечер',
    build(S, c) {
      const k = kit(S, false);
      const cw = (CW - 60) / 3;
      const looks = [['08:30', 'Совещание в мэрии', 'Строго · тепло · без лишнего'], ['17:40', 'Холмы до заката', 'Ярко · уверенно · до отбоя'], ['20:55', 'Домой до отбоя', 'Тихо · удобно · руки свободны']];
      return {
        background: S.paper,
        elements: [
          ...header(S, c, 'Стиль', false),
          k.head(M, 200, 600, 'Три образа', 104, { maxLines: 1 }),
          T({ x: M + 620, y: 210, width: CW - 620, maxLines: 1, text: S.upper ? 'НА ОСЕНЬ' : 'на осень', fontFamily: S.head, fontStyle: 'italic', fontSize: 96, fill: S.accent, lineHeight: 1 }),
          k.body(M, 330, CW, 'Один день в Калифорнии — от утреннего совещания до последней минуты перед отбоем.', 26, { fontStyle: 'italic', fill: S.muted }),
          ...looks.flatMap(([t, name, sub], i) => {
            const x = M + i * (cw + 30);
            return [P({ x, y: 430, width: cw, height: 470, label: `Образ ${i + 1}` }), R({ x: x + 16, y: 446, width: 110, height: 40, fill: S.dark }), T({ x: x + 16, y: 454, width: 110, text: t, fontFamily: S.label, fontStyle: 'bold', fontSize: 19, fill: S.darkInk, align: 'center' }),
              T({ x, y: 924, width: cw, text: name, fontFamily: S.head, fontStyle: 'bold', fontSize: 36, fill: S.ink, lineHeight: 1.1, maxLines: 2 }),
              T({ x, y: 1012, width: cw, text: sub.toUpperCase(), fontFamily: S.label, fontStyle: 'bold', fontSize: 15, letterSpacing: 1.5, fill: S.accent }),
              T({ x, y: 1056, width: cw, text: '▪ Пальто цвета верблюжьей шерсти\n▪ Водолазка цвета шоколада\n▪ Кремовые брюки\n▪ Лоферы на толстой подошве', fontFamily: S.body, fontSize: 21, fill: S.ink, lineHeight: 1.55 }),
              L(x, 1290, cw, S.line, 1), T({ x, y: 1304, width: cw, text: 'Сумка: какая и почему.', fontFamily: S.body, fontSize: 20, fill: S.muted })];
          }),
          L(M, 1410, CW, S.ink, 2),
          T({ x: M, y: 1440, width: 900, text: 'Этикет военного положения', fontFamily: S.head, fontStyle: 'italic bold', fontSize: 50, fill: S.ink, maxLines: 1 }),
          k.lab(W - M - 300, 1462, 300, '4 правила', S.accent, { align: 'right' }),
          ...['Документы — в сумке, а не в кармане.', 'На проверке — никаких резких движений.', 'Собрания больше семи человек запрещены.', 'После отбоя город принадлежит патрулям.'].flatMap((r, i) => {
            const x = M + (i % 2) * (CW / 2 + 10), y = 1540 + Math.floor(i / 2) * 130;
            return [T({ x, y, width: 70, text: ['I', 'II', 'III', 'IV'][i], fontFamily: S.head, fontStyle: 'bold', fontSize: 50, fill: S.accent, lineHeight: 1 }), k.body(x + 80, y + 4, CW / 2 - 100, r, 22)];
          }),
          ...footer(S, c, false),
        ],
      };
    },
  },

  quiz: {
    title: 'Тест', desc: 'Четыре вопроса и вердикт',
    build(S, c) {
      const k = kit(S, false), kd = kit(S, true);
      const qs = ['Твой идеальный понедельник…', 'Тебе возражают. Ты…', 'Твой цвет…', 'На свидание ты приедешь…'];
      return {
        background: S.paper,
        elements: [
          ...header(S, c, 'Тест', false),
          k.head(M, 200, CW, 'Бархат или сталь?', 110, { maxLines: 1 }),
          k.body(M, 330, CW, 'Ответь честно на четыре вопроса и посчитай, каких букв больше.', 25, { fontStyle: 'italic', fill: S.muted }),
          P({ x: M, y: 410, width: CW, height: 640, label: 'Фото к тесту' }),
          ...qs.flatMap((q, i) => {
            const x = M + (i % 2) * (CW / 2 + 12), y = 1100 + Math.floor(i / 2) * 250, w = CW / 2 - 12;
            return [L(x, y, w, S.ink, 1.5), T({ x, y: y + 16, width: w, text: `${i + 1}. ${q}`, fontFamily: S.head, fontStyle: 'bold', fontSize: 32, fill: S.ink, maxLines: 1 }),
              T({ x, y: y + 70, width: w, text: 'А — первый вариант ответа\nБ — второй вариант ответа\nВ — третий вариант ответа', fontFamily: S.body, fontSize: 22, fill: S.ink, lineHeight: 1.6 })];
          }),
          R({ x: M, y: 1620, width: CW, height: 210, fill: S.dark }),
          kd.lab(M + 32, 1644, 400, 'Вердикт', S.gold),
          ...[['Больше А — бархат.', 'Нежная, но тебя никто не забывает.'], ['Больше Б — шёлк.', 'Гибкая, яркая и на своей волне.'], ['Больше В — сталь.', `Ты — следующий герой ${c.name}.`]].flatMap(([a, b], i) => {
            const x = M + 32 + i * ((CW - 64) / 3);
            return [kd.lab(x, 1690, (CW - 64) / 3 - 20, a, S.accent2, { fontSize: 16, letterSpacing: 2 }), T({ x, y: 1722, width: (CW - 64) / 3 - 24, text: b, fontFamily: S.body, fontSize: 20, fill: S.darkInk, lineHeight: 1.4 })];
          }),
          ...footer(S, c, false),
        ],
      };
    },
  },

  adDuo: {
    title: 'Реклама: два товара', desc: '', ad: true,
    build(S, c) {
      const k = kit(S, true);
      const bg = S.cover === 'luxe' ? '#6B1C22' : S.accent;
      const cw = (CW - 28) / 2;
      return {
        background: bg,
        elements: [
          k.lab(M, 80, 400, 'Реклама', S.darkInk), k.lab(W - M - 600, 80, 600, `Магазин · ${c.city}`, S.darkInk, { align: 'right' }),
          k.head(M, 170, CW, 'Две легенды.', 150, { fill: S.darkInk, maxLines: 1 }),
          T({ x: M, y: 330, width: CW, text: 'Один сезон.', fontFamily: S.head, fontStyle: 'italic', fontSize: 150, fill: S.blush, lineHeight: 1, maxLines: 1 }),
          P({ x: M, y: 540, width: cw, height: 800, label: 'Товар 1', fill: S.blush }),
          P({ x: M + cw + 28, y: 540, width: cw, height: 800, label: 'Товар 2', fill: '#3E2A5C' }),
          T({ x: M, y: 1366, width: cw - 160, text: 'Товар один', fontFamily: S.head, fontStyle: 'bold', fontSize: 42, fill: S.darkInk, maxLines: 1 }),
          k.lab(M + cw - 200, 1380, 200, '$250 000', S.darkInk, { align: 'right', fontSize: 21 }),
          T({ x: M + cw + 28, y: 1366, width: cw - 160, text: 'Товар два', fontFamily: S.head, fontStyle: 'bold', fontSize: 42, fill: S.darkInk, maxLines: 1 }),
          k.lab(M + 2 * cw + 28 - 200, 1380, 200, '$125 000', S.darkInk, { align: 'right', fontSize: 21 }),
          L(M, 1432, cw, 'rgba(255,255,255,0.4)', 1.5), L(M + cw + 28, 1432, cw, 'rgba(255,255,255,0.4)', 1.5),
          k.body(M, 1470, CW, 'Большая — для дня. Маленькая — для вечера. Обе — для этой осени.', 28, { fill: S.darkInk }),
          R({ x: M, y: 1690, width: CW, height: 150, fill: S.dark }),
          T({ x: M + 36, y: 1736, width: 260, text: c.name, fontFamily: S.mast, fontStyle: 'bold', fontSize: 44, fill: S.darkInk, maxLines: 1 }),
          V(M + 320, 1716, 98, S.gold, 2),
          T({ x: M + 350, y: 1724, width: CW - 390, text: 'В СЛЕДУЮЩЕМ НОМЕРЕ. Первые холода: пальто, перчатки и образы для долгих вечеров.', fontFamily: S.body, fontSize: 23, fill: S.darkInk, lineHeight: 1.45 }),
        ],
      };
    },
  },

  adProduct: {
    title: 'Реклама: аромат или товар', desc: '', ad: true, dark: true,
    build(S, c) {
      const k = kit(S, true);
      return {
        background: S.dark,
        elements: [
          k.lab(M, 80, 400, 'Реклама', S.darkMuted), k.lab(W - M - 700, 80, 700, 'Для тех, за кем последнее слово', S.darkMuted, { align: 'right' }),
          T({ x: M, y: 170, width: 800, text: 'Новый аромат', fontFamily: S.script === 'Playfair Display' ? 'Marck Script' : S.script, fontSize: 52, fill: S.gold }),
          k.head(M, 250, 760, 'Протест\nпринят', 130, { fill: S.darkInk, maxLines: 2 }),
          k.lab(M, 540, 800, 'Eau de parfum · 50 мл', S.accent2),
          k.body(M, 590, 760, 'Пахнет пионами, дорогой кожей и уверенностью человека, за которым всегда последнее слово.', 27, { fontStyle: 'italic', fill: S.darkInk }),
          P({ x: W - M - 360, y: 170, width: 360, height: 560, label: 'Фото флакона', fill: S.accent }),
          P({ x: M, y: 780, width: 480, height: 480, cornerRadius: 240, label: 'Лицо кампании', frameStroke: S.gold, frameStrokeWidth: 6 }),
          k.lab(M + 560, 800, CW - 560, 'Пирамида аромата', S.gold), L(M + 560, 836, CW - 560, 'rgba(255,255,255,0.2)', 1.5),
          ...[['Верхние ноты', 'розовый перец, бергамот, малина'], ['Ноты сердца', 'пион, тубероза, тонкая кожа'], ['Базовые ноты', 'ваниль, сандал, белый мускус'], ['Семейство', 'цветочно-пудровый с кожей']].flatMap(([a, b], i) => [
            T({ x: M + 560, y: 860 + i * 92, width: CW - 560, text: `${a.toUpperCase()}:`, fontFamily: S.label, fontStyle: 'bold', fontSize: 18, letterSpacing: 2, fill: S.accent2 }),
            T({ x: M + 560, y: 888 + i * 92, width: CW - 560, text: b, fontFamily: S.body, fontSize: 23, fill: S.darkInk }),
          ]),
          L(M, 1320, CW, 'rgba(255,255,255,0.15)', 1.5),
          ...[['Стойкость', 'До 10 часов — дольше любого заседания.'], ['Шлейф', 'Мягкий. Вспоминают после ухода.'], ['Флакон', 'Розовое стекло, золотая крышка.']].flatMap(([a, b], i) => [
            k.lab(M + i * (CW / 3), 1352, CW / 3 - 24, a, S.gold, { fontSize: 17 }),
            T({ x: M + i * (CW / 3), y: 1386, width: CW / 3 - 24, text: b, fontFamily: S.body, fontSize: 22, fill: S.darkInk, lineHeight: 1.4 }),
          ]),
          R({ x: M, y: 1520, width: CW, height: 90, fill: 'rgba(0,0,0,0)', stroke: S.gold, strokeWidth: 1.5 }),
          T({ x: M + 28, y: 1550, width: CW - 56, text: 'КАК НОСИТЬ. Одно нажатие на запястье перед заседанием, второе — перед свиданием.', fontFamily: S.body, fontSize: 22, fill: S.darkInk }),
          R({ x: M, y: 1680, width: 420, height: 170, fill: S.gold }),
          k.lab(M + 28, 1704, 360, 'Цена · 50 мл', S.ink, { fontSize: 16 }),
          T({ x: M + 28, y: 1738, width: 380, text: c.price, fontFamily: S.head, fontStyle: 'bold', fontSize: 76, fill: S.ink, lineHeight: 1, maxLines: 1 }),
          R({ x: M + 420, y: 1680, width: CW - 420, height: 170, fill: S.accent }),
          T({ x: M + 450, y: 1700, width: CW - 480, text: 'Аромат, который не оспаривают.', fontFamily: S.script === 'Playfair Display' ? 'Marck Script' : S.script, fontSize: 42, fill: '#FFFFFF', maxLines: 1 }),
          T({ x: M + 450, y: 1762, width: CW - 480, text: 'Заказывайте на портале CALIFORNIA NEWS DAY. Доставка по всему штату.', fontFamily: S.body, fontSize: 21, fill: '#FFFFFF', lineHeight: 1.4 }),
        ],
      };
    },
  },

  back: {
    title: 'Задняя обложка', desc: '', cover: true,
    build(S, c) {
      const k = kit(S, true);
      return {
        background: S.dark,
        elements: [
          P({ x: 0, y: 0, width: W, height: 1500, label: 'Фото на задней обложке' }),
          R({ x: 0, y: 1500, width: W, height: 500, fill: S.dark }), R({ x: 0, y: 1500, width: W, height: 8, fill: S.accent }),
          T({ x: M, y: 1570, width: 860, text: c.name, fontFamily: S.mast, fontStyle: 'bold', fontSize: 110, fill: S.darkInk, lineHeight: 1, maxLines: 1 }),
          T({ x: M, y: 1700, width: 900, text: `В следующем номере: тема, которую ждёт весь штат.`, fontFamily: S.script, fontStyle: S.scriptStyle, fontSize: 38, fill: S.accent2, maxLines: 2, width: 860 }),
          k.lab(M, 1810, 900, `California News Day · ${c.city} · ${c.month} ${c.year}`, S.darkMuted),
          ...barcode(c, W - M - 230, 1600, 230, 112),
        ],
      };
    },
  },
};

export const MAG_PAGES = Object.entries(PAGES).map(([key, p]) => ({ key, title: p.title, desc: p.desc }));

export const MAG_PRESETS = {
  velour: ['cover', 'contents', 'feature', 'darkFeature', 'compare', 'looks', 'palette', 'adDuo'],
  velvet: ['cover', 'contents', 'hero', 'story', 'quiz', 'adProduct'],
  caliber: ['cover', 'contents', 'hero', 'story', 'list', 'quiz', 'adProduct'],
  cnd: ['cover', 'contents', 'hero', 'feature', 'compare', 'quiz', 'adDuo', 'back'],
};

export function magCode(issue, month, year) {
  return `4607${String(year).slice(-2)}${String(month + 1).padStart(2, '0')}${String(issue).replace(/\D/g, '').padStart(3, '0').slice(-3)}0`;
}

export function buildMagazine(opts) {
  const S = { ...MAG_STYLES[opts.style] || MAG_STYLES.velour };
  if (opts.accent) S.accent = opts.accent;
  const month = MONTHS[opts.month ?? new Date().getMonth()];
  const year = opts.year || new Date().getFullYear();
  const c = {
    name: (opts.name || S.name).trim(), tagline: opts.tagline || S.tagline, issue: opts.issue || '1', month: month.toUpperCase(), monthName: month,
    year, mm: String((opts.month ?? 0) + 1).padStart(2, '0'), price: opts.price || '$100', city: (opts.city || 'Калифорния').toUpperCase(),
  };
  c.code = opts.code || magCode(c.issue, opts.month ?? 0, year);
  c.footer = `${c.name} · ${S.cover === 'luxe' ? `${month} ${year}` : 'California News Day'}`;
  c.month = month.toUpperCase();
  const keys = (opts.pages?.length ? opts.pages : MAG_PRESETS[opts.style] || MAG_PRESETS.velour).filter((k) => PAGES[k]);
  const contents = keys.map((k, i) => ({ key: k, page: i + 1, title: PAGES[k].title, desc: PAGES[k].desc })).filter((x) => !PAGES[x.key].cover && !PAGES[x.key].ad && x.key !== 'contents');
  const pages = keys.map((k) => {
    const pg = PAGES[k].build(S, { ...c, month: k === 'palette' ? month : c.month }, { contents });
    return { id: uid(), name: PAGES[k].title, background: pg.background, gradient: pg.gradient, elements: pg.elements.map((e) => ({ ...fitText(e), id: uid() })) };
  });
  let photos = [...(opts.photos || [])];
  if (photos.length) {
    pages.forEach((p) => {
      p.elements = p.elements.map((e) => {
        if (e.type !== 'placeholder' || !photos.length) return e;
        const src = photos.shift();
        return { id: e.id, type: 'image', src, x: e.x, y: e.y, width: e.width, height: e.height, rotation: 0, opacity: 1, cornerRadius: e.cornerRadius, frameStroke: e.frameStroke, frameStrokeWidth: e.frameStrokeWidth, crop: { x: 0.5, y: 0.5, zoom: 1 } };
      });
    });
  }
  return withPages({ width: W, height: H, elements: [] }, pages, 0);
}

export function magFonts(style) {
  const S = MAG_STYLES[style] || MAG_STYLES.velour;
  return [S.mast, S.head, S.script, S.body, S.label, 'Marck Script', 'JetBrains Mono'];
}
