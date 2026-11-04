// Если крадёте, то крадите ради реально хороших людей
const r2 = (v) => Math.round(v * 100) / 100;

export function polygonPath(n, rot = -90) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = ((rot + (360 / n) * i) * Math.PI) / 180;
    pts.push(`${r2(50 + 48 * Math.cos(a))} ${r2(50 + 48 * Math.sin(a))}`);
  }
  return `M${pts.join(' L')} Z`;
}

export function starPath(n, inner = 0.45, rot = -90) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = ((rot + (180 / n) * i) * Math.PI) / 180;
    const r = i % 2 ? 48 * inner : 48;
    pts.push(`${r2(50 + r * Math.cos(a))} ${r2(50 + r * Math.sin(a))}`);
  }
  return `M${pts.join(' L')} Z`;
}

function gearPath(teeth = 10) {
  const pts = [];
  const step = 360 / teeth;
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    [[a0 - step * 0.22, 46], [a0 - step * 0.14, 48], [a0 + step * 0.14, 48], [a0 + step * 0.22, 46], [a0 + step * 0.3, 36], [a0 + step * 0.7, 36]].forEach(([a, r]) => {
      const t = (a * Math.PI) / 180;
      pts.push(`${r2(50 + r * Math.cos(t))} ${r2(50 + r * Math.sin(t))}`);
    });
  }
  return `M${pts.join(' L')} Z M50 34 A16 16 0 1 0 50.01 34 Z`;
}

const circle = (cx, cy, r) => `M${cx} ${cy - r} A${r} ${r} 0 1 0 ${cx + 0.01} ${cy - r} Z`;

const S = (id, name, path, extra = {}) => ({ id, name, path, ...extra });

export const SHAPES = [
  S('sq', 'Квадрат', 'M2 2 H98 V98 H2 Z'),
  S('circle', 'Круг', circle(50, 50, 48)),
  S('tri', 'Треугольник', 'M50 4 L97 94 L3 94 Z'),
  S('rtri', 'Прямоугольный треугольник', 'M4 4 L4 96 L96 96 Z'),
  S('diamond', 'Ромб', 'M50 2 L98 50 L50 98 L2 50 Z'),
  S('pent', 'Пятиугольник', polygonPath(5)),
  S('hex', 'Шестиугольник', polygonPath(6, 0)),
  S('oct', 'Восьмиугольник', polygonPath(8, 22.5)),
  S('para', 'Параллелограмм', 'M26 8 H98 L74 92 H2 Z', { w: 360, h: 200 }),
  S('trap', 'Трапеция', 'M24 10 H76 L98 90 H2 Z', { w: 360, h: 240 }),
  S('star5', 'Звезда', starPath(5, 0.42)),
  S('star6', 'Звезда 6', starPath(6, 0.55)),
  S('star8', 'Звезда 8', starPath(8, 0.6)),
  S('burst', 'Взрыв, «СКИДКА»', starPath(16, 0.78)),
  S('heart', 'Сердце', 'M50 92 C22 72 2 54 2 32 C2 15 14 4 29 4 C39 4 46 9 50 18 C54 9 61 4 71 4 C86 4 98 15 98 32 C98 54 78 72 50 92 Z'),
  S('plus', 'Плюс', 'M36 2 H64 V36 H98 V64 H64 V98 H36 V64 H2 V36 H36 Z'),
  S('ring', 'Кольцо', `${circle(50, 50, 48)} ${circle(50, 50, 28)}`),
  S('half', 'Полукруг', 'M2 74 A48 48 0 0 1 98 74 Z', { w: 300, h: 160 }),
  S('quarter', 'Четверть круга', 'M4 96 V4 A92 92 0 0 1 96 96 Z'),
  S('arch', 'Арка', 'M4 98 V50 A46 46 0 0 1 96 50 V98 Z', { w: 260, h: 320 }),
  S('moon', 'Месяц', 'M62 4 A46 46 0 1 0 96 66 A36 36 0 1 1 62 4 Z'),
  S('bolt', 'Молния', 'M60 2 L14 58 H46 L36 98 L86 40 H54 Z'),
  S('cloud', 'Облако', 'M26 84 C12 84 2 74 2 61 C2 49 11 40 23 39 C24 24 36 14 51 14 C64 14 75 22 79 34 C90 35 98 45 98 57 C98 72 88 84 74 84 Z', { w: 360, h: 260 }),
  S('drop', 'Капля', 'M50 2 C50 2 14 46 14 66 C14 86 30 98 50 98 C70 98 86 86 86 66 C86 46 50 2 50 2 Z'),
  S('shield', 'Щит', 'M50 2 L94 16 V48 C94 74 74 90 50 98 C26 90 6 74 6 48 V16 Z'),
];

export const LINES = [
  S('arrow', 'Стрелка', 'M2 36 H62 V12 L98 50 L62 88 V64 H2 Z', { w: 360, h: 200 }),
  S('arrow2', 'Двойная стрелка', 'M2 50 L30 14 V34 H70 V14 L98 50 L70 86 V66 H30 V86 Z', { w: 400, h: 180 }),
  S('chevron', 'Шеврон', 'M2 4 H60 L98 50 L60 96 H2 L40 50 Z', { w: 260, h: 240 }),
  S('ribbon', 'Лента', 'M2 18 H98 L86 50 L98 82 H2 L14 50 Z', { w: 520, h: 140 }),
  S('tag', 'Ярлык', 'M2 20 H74 L98 50 L74 80 H2 Z', { w: 420, h: 160 }),
  S('arrowline', 'Стрелка-линия', 'M4 50 H92 M72 30 L94 50 L72 70', { outline: true, w: 400, h: 120 }),
  S('curved', 'Изогнутая стрелка', 'M8 84 C18 34 56 16 88 28 M72 12 L90 28 L70 42', { outline: true }),
  S('wave', 'Волна', 'M2 50 C14 18 36 18 50 50 S86 82 98 50', { outline: true, w: 500, h: 120 }),
  S('zigzag', 'Зигзаг', 'M2 70 L18 30 L34 70 L50 30 L66 70 L82 30 L98 70', { outline: true, w: 500, h: 100 }),
  S('scribble', 'Подчёркивание от руки', 'M4 62 C24 40 46 70 66 48 C76 38 86 44 96 40 M10 78 C36 66 64 74 92 60', { outline: true, w: 500, h: 110 }),
  S('circlehand', 'Обвести от руки', 'M58 10 C26 4 4 22 6 48 C8 74 34 92 62 88 C86 84 98 64 94 42 C90 22 70 10 46 12 C38 13 30 16 24 20', { outline: true, w: 420, h: 260 }),
  S('bracket', 'Скобка', 'M70 4 C40 4 40 20 40 40 C40 48 34 50 26 50 C34 50 40 52 40 60 C40 80 40 96 70 96', { outline: true, w: 120, h: 300 }),
];

export const BUBBLES = [
  S('speech', 'Реплика', 'M12 4 H88 Q96 4 96 12 V58 Q96 66 88 66 H42 L20 92 L26 66 H12 Q4 66 4 58 V12 Q4 4 12 4 Z', { w: 420, h: 320 }),
  S('speech-r', 'Реплика справа', 'M12 4 H88 Q96 4 96 12 V58 Q96 66 88 66 H74 L80 92 L58 66 H12 Q4 66 4 58 V12 Q4 4 12 4 Z', { w: 420, h: 320 }),
  S('oval', 'Овальная реплика', 'M50 6 C76 6 96 20 96 38 C96 56 76 70 50 70 C44 70 38 69 33 68 L14 90 L20 62 C10 56 4 48 4 38 C4 20 24 6 50 6 Z', { w: 420, h: 320 }),
  S('think', 'Мысли', `M50 6 C76 6 96 20 96 38 C96 56 76 70 50 70 C24 70 4 56 4 38 C4 20 24 6 50 6 Z ${circle(24, 80, 7)} ${circle(12, 93, 4)}`, { w: 420, h: 320 }),
  S('shout', 'Крик', starPath(14, 0.72, -77), { w: 420, h: 320 }),
  S('callout', 'Выноска', 'M4 4 H96 V70 H60 L50 96 L40 70 H4 Z', { w: 420, h: 300 }),
];

export const ICONS = [
  S('pin', 'Метка на карте', `M50 2 C30 2 14 18 14 38 C14 64 50 98 50 98 C50 98 86 64 86 38 C86 18 70 2 50 2 Z ${circle(50, 38, 14)}`),
  S('pin-c', 'Метка в круге', `${circle(50, 50, 48)} M50 18 C38 18 28 28 28 40 C28 56 50 80 50 80 C50 80 72 56 72 40 C72 28 62 18 50 18 Z ${circle(50, 40, 9)}`),
  S('phone', 'Телефон', 'M28 6 L40 6 L48 28 L38 36 C44 50 50 56 64 62 L72 52 L94 60 L94 72 C94 84 84 94 72 94 C38 94 6 62 6 28 C6 16 16 6 28 6 Z'),
  S('phone-c', 'Телефон в круге', `${circle(50, 50, 48)} M36 24 L44 24 L49 38 L43 43 C47 51 50 54 58 58 L63 52 L76 57 L76 64 C76 71 70 77 63 77 C42 77 23 58 23 37 C23 30 29 24 36 24 Z`),
  S('mail', 'Письмо', 'M4 18 H96 L50 54 Z M4 28 L50 64 L96 28 V82 H4 Z', { w: 300, h: 240 }),
  S('check', 'Галочка', 'M6 52 L20 38 L40 58 L82 14 L96 28 L40 86 Z'),
  S('cross', 'Крестик', 'M18 4 L50 36 L82 4 L96 18 L64 50 L96 82 L82 96 L50 64 L18 96 L4 82 L36 50 L4 18 Z'),
  S('gear', 'Шестерёнка', gearPath(10)),
  S('mic', 'Микрофон', 'M38 6 H62 V50 A12 12 0 0 1 38 50 Z M22 42 H30 V50 A20 20 0 0 0 70 50 V42 H78 V50 A28 28 0 0 1 54 78 V88 H70 V96 H30 V88 H46 V78 A28 28 0 0 1 22 50 Z'),
  S('camera', 'Фотоаппарат', `M8 28 H30 L38 16 H62 L70 28 H92 V86 H8 Z ${circle(50, 56, 19)}`, { w: 300, h: 260 }),
  S('news', 'Газета', 'M10 14 H78 V80 A6 6 0 0 0 90 80 V30 H96 V82 A12 12 0 0 1 84 94 H18 A8 8 0 0 1 10 86 Z M20 24 V46 H48 V24 Z M56 26 H68 V32 H56 Z M56 40 H68 V46 H56 Z M20 56 H68 V62 H20 Z M20 70 H68 V76 H20 Z'),
  S('megaphone', 'Рупор', 'M10 38 H30 L78 12 V88 L30 62 H10 Z M84 40 H96 V60 H84 Z M34 66 H48 L56 92 H42 Z'),
  S('play', 'Видео', `${circle(50, 50, 48)} M40 30 L72 50 L40 70 Z`),
  S('clock', 'Часы', `${circle(50, 50, 48)} M46 18 H54 V47 L72 58 L68 65 L46 52 Z`),
  S('warn', 'Внимание', 'M50 4 L98 92 H2 Z M46 34 H54 V64 H46 Z M46 72 H54 V82 H46 Z'),
  S('info', 'Инфо', `${circle(50, 50, 48)} M44 42 H56 V78 H44 Z ${circle(50, 28, 7)}`),
  S('user', 'Человек', `${circle(50, 28, 22)} M8 96 C8 70 28 56 50 56 C72 56 92 70 92 96 Z`),
  S('home', 'Дом', 'M50 6 L96 46 H84 V94 H60 V64 H40 V94 H16 V46 H4 Z'),
  S('search', 'Поиск', `${circle(42, 42, 34)} ${circle(42, 42, 22)} M64 72 L72 64 L96 86 L88 94 Z`),
  S('star-r', 'Оценка', starPath(5, 0.5)),
  S('flag', 'Флаг', 'M14 4 H22 V96 H14 Z M26 8 C44 0 56 18 90 8 V54 C56 64 44 46 26 54 Z'),
  S('car', 'Машина', `M10 60 L18 36 C20 30 24 28 30 28 H70 C76 28 80 30 82 36 L90 60 H96 V80 H86 A11 11 0 0 1 64 80 H36 A11 11 0 0 1 14 80 H4 V60 Z M26 56 H74 L68 38 H32 Z ${circle(25, 80, 8)} ${circle(75, 80, 8)}`, { w: 320, h: 220 }),
  S('heart-h', 'Сердце от руки', 'M50 88 C10 60 4 30 22 18 C36 10 48 22 50 34 C54 18 70 8 82 18 C98 34 78 64 44 96', { outline: true }),
  S('clip', 'Скрепка', 'M66 30 V70 A16 16 0 0 1 34 70 V22 A10 10 0 0 1 54 22 V66 A4 4 0 0 1 46 66 V30', { outline: true, w: 140, h: 300 }),
];

export const DECOR = [
  { id: 'g-sunset', name: 'Градиент: закат', spec: { type: 'rect', width: 600, height: 400, fill: '#FF8A00', gradient: { type: 'linear', from: '#FF8A00', to: 'rgba(255,255,255,0)', angle: 0 } } },
  { id: 'g-cnd', name: 'Градиент CND', spec: { type: 'rect', width: 600, height: 400, fill: '#0B7CFC', gradient: { type: 'linear', from: '#0B7CFC', to: '#03316F', angle: 90 } } },
  { id: 'g-dark', name: 'Затемнение снизу', spec: { type: 'rect', width: 1080, height: 500, fill: '#000000', gradient: { type: 'linear', from: 'rgba(0,0,0,0)', to: 'rgba(0,0,0,0.85)', angle: 90 } } },
  { id: 'g-glow', name: 'Свечение', spec: { type: 'ellipse', width: 500, height: 500, fill: '#FFD54A', gradient: { type: 'radial', from: 'rgba(255,213,74,0.95)', to: 'rgba(255,213,74,0)' } } },
  { id: 'g-blue', name: 'Синий круг', spec: { type: 'ellipse', width: 400, height: 400, fill: '#2F80ED', gradient: { type: 'linear', from: '#3B8CF0', to: '#1E5FC4', angle: 45 } } },
  { id: 'blob1', name: 'Пятно розовое', spec: { type: 'shape', width: 420, height: 320, fill: '#F7C6E6', path: 'M22 18 C38 2 66 6 82 18 C98 30 98 56 86 72 C72 92 40 96 22 82 C4 68 6 34 22 18 Z' } },
  { id: 'blob2', name: 'Пятно зелёное', spec: { type: 'shape', width: 420, height: 320, fill: '#B9D39A', path: 'M14 40 C14 16 40 4 62 10 C86 16 98 38 92 60 C86 82 62 96 38 90 C16 84 14 62 14 40 Z' } },
  { id: 'blob3', name: 'Пятно-контур', spec: { type: 'shape', width: 420, height: 320, fill: '#111111', outline: true, strokeWidth: 4, path: 'M20 30 C30 8 58 4 72 16 C80 24 92 22 96 40 C100 62 84 70 80 82 C74 98 46 98 34 86 C24 76 6 76 4 58 C2 44 14 42 20 30 Z' } },
  { id: 'marker', name: 'Маркер-выделение', spec: { type: 'rect', width: 500, height: 70, fill: '#FFD400', opacity: 0.85, cornerRadius: 6 } },
  { id: 'paper', name: 'Лист бумаги', spec: { type: 'rect', width: 500, height: 640, fill: '#FAFAF7', stroke: '#E6E3DA', strokeWidth: 2, shadow: { color: '#000000', blur: 18, x: 0, y: 6, opacity: 0.18 } } },
  { id: 'polaroid', name: 'Полароид', spec: [
    { type: 'rect', width: 460, height: 540, fill: '#FFFFFF', shadow: { color: '#000000', blur: 20, x: 0, y: 8, opacity: 0.25 } },
    { type: 'placeholder', width: 400, height: 400, fill: '#9aa6b8', label: 'Фото', dx: 30, dy: 30 },
  ] },
  { id: 'tape', name: 'Скотч', spec: { type: 'rect', width: 220, height: 56, fill: '#F2E7C9', opacity: 0.85, rotation: -8 } },
];

export const FRAMES = [
  { id: 'f-rect', name: 'Прямоугольная', mask: '' },
  { id: 'f-round', name: 'Скруглённая', mask: 'round' },
  { id: 'f-circle', name: 'Круглая', mask: 'circle', w: 500, h: 500 },
  { id: 'f-arch', name: 'Арка', mask: 'arch', w: 420, h: 560 },
  { id: 'f-rbottom', name: 'Скруглённый низ', mask: 'roundbottom', w: 420, h: 300, frameStroke: '#F2C98A', frameStrokeWidth: 6 },
  { id: 'f-rtop', name: 'Скруглённый верх', mask: 'roundtop', w: 420, h: 300 },

  { id: 'f-heart', name: 'Сердце', mask: 'heart', w: 500, h: 480 },
  { id: 'f-star', name: 'Звезда', mask: 'star5', w: 520, h: 520 },
  { id: 'f-hex', name: 'Шестиугольник', mask: 'hex', w: 520, h: 520 },
  { id: 'f-blob', name: 'Пятно', mask: 'blob1', w: 560, h: 440 },
  { id: 'f-tri', name: 'Треугольник', mask: 'tri', w: 520, h: 480 },
];

const BLOB_PATHS = Object.fromEntries(DECOR.filter((d) => d.spec.path).map((d) => [d.id, d.spec.path]));
const ALL_SHAPES = [...SHAPES, ...LINES, ...BUBBLES, ...ICONS];

export function maskPath(mask) {
  if (!mask) return null;
  if (mask === 'round') return null;
  if (mask === 'arch') return 'M0 100 V50 A50 50 0 0 1 100 50 V100 Z';
  if (mask === 'roundbottom') return 'M0 0 H100 V64 A36 36 0 0 1 64 100 H36 A36 36 0 0 1 0 64 Z';
  if (mask === 'roundtop') return 'M0 100 V36 A36 36 0 0 1 36 0 H64 A36 36 0 0 1 100 36 V100 Z';
  
  return ALL_SHAPES.find((s) => s.id === mask)?.path || BLOB_PATHS[mask] || null;
}

export const CHART_KINDS = {
  column: 'Столбцы',
  bar: 'Полосы',
  line: 'Линия',
  area: 'Область',
  pie: 'Круговая',
  donut: 'Кольцевая',
  progress: 'Прогресс',
};

export const CHART_COLORS = ['#0B7CFC', '#03316F', '#FF8A00', '#2FB36D', '#E5484D', '#8E5CF7', '#14B8C4', '#F5B800'];

export function chartSpec(kind) {
  const data = kind === 'progress'
    ? [{ label: 'Готово', value: 72 }]
    : kind === 'pie' || kind === 'donut'
      ? [{ label: 'За', value: 54 }, { label: 'Против', value: 31 }, { label: 'Не знаю', value: 15 }]
      : [{ label: 'Пн', value: 12 }, { label: 'Вт', value: 19 }, { label: 'Ср', value: 15 }, { label: 'Чт', value: 24 }, { label: 'Пт', value: 30 }];
  const round = kind === 'pie' || kind === 'donut';
  return {
    type: 'chart', kind, data, colors: CHART_COLORS.slice(), width: round ? 520 : kind === 'progress' ? 640 : 720,
    height: round ? 520 : kind === 'progress' ? 90 : 460, textColor: '#111111', fontFamily: 'Inter', fontSize: 22,
    showValues: true, showLabels: true, gridColor: '#D8DEE8', name: `Диаграмма: ${CHART_KINDS[kind]}`,
  };
}

export const TABLE_STYLES = {
  cnd: { label: 'CND синяя', head: '#0B7CFC', headText: '#FFFFFF', row: '#FFFFFF', alt: '#EEF4FF', line: '#C9D6EA', text: '#111111' },
  dark: { label: 'Тёмная', head: '#03316F', headText: '#FFFFFF', row: '#0F1B2E', alt: '#16253D', line: '#2B3D5A', text: '#F1F5FB' },
  paper: { label: 'Газетная', head: '#111111', headText: '#FFFFFF', row: '#FAFAF7', alt: '#F0EEE6', line: '#C8C4B6', text: '#111111' },
  plain: { label: 'Простая', head: '#FFFFFF', headText: '#111111', row: '#FFFFFF', alt: '#FFFFFF', line: '#999999', text: '#111111' },
};

export function tableSpec(rows = 4, cols = 3, style = 'cnd') {
  const cells = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) row.push(r === 0 ? `Столбец ${c + 1}` : '');
    cells.push(row);
  }
  if (rows > 1 && cols > 1) { cells[1][0] = 'Пример'; cells[1][1] = '123'; }
  return {
    type: 'table', cells, header: true, style, ...TABLE_STYLES[style], width: Math.min(900, cols * 240), height: rows * 64,
    fontFamily: 'Inter', fontSize: 24, name: 'Таблица',
  };
}

export function shapeSpec(s, fill = '#0B7CFC') {
  const w = s.w || 300, h = s.h || 300;
  return s.outline
    ? { type: 'shape', path: s.path, width: w, height: h, fill: '#111111', outline: true, strokeWidth: 5, name: s.name }
    : { type: 'shape', path: s.path, width: w, height: h, fill, name: s.name };
}

export const PEOPLE = [
  { id: 'p-side', name: 'Репортёр CND с микрофоном', src: './help/side-character.png', w: 416, h: 630 },
  { id: 'p-3d', name: 'Репортёр CND 3D', src: './samples/reporter.png' },
  { id: 'p-flat', name: 'Репортёр CND 2D', skin: './skins/cnd-reporter.png', flat: true, w: 240, h: 480 },
  { id: 'p-head', name: 'Голова репортёра', skin: './skins/cnd-reporter.png', head: true, w: 300, h: 300 },
];

export function parseSvgToShape(text) {
  const dom = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = dom.querySelector('svg');
  if (!svg || dom.querySelector('parsererror')) throw new Error('Не получилось прочитать SVG');
  let vb = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
  if (vb.length !== 4 || vb.some((v) => !Number.isFinite(v))) {
    const w = parseFloat(svg.getAttribute('width')) || 100, h = parseFloat(svg.getAttribute('height')) || 100;
    vb = [0, 0, w, h];
  }
  const unsupported = svg.querySelector('image, text, linearGradient, radialGradient, pattern, filter, mask, use');
  const parts = []; const colors = new Set(); let anyStroke = false;
  const fillOf = (el) => {
    let n = el; while (n && n !== svg.parentNode) {
      const f = n.getAttribute?.('fill') || (n.getAttribute?.('style') || '').match(/fill:\s*([^;]+)/)?.[1];
      if (f) return f.trim();
      n = n.parentNode;
    }
    return '#000000';
  };
  for (const el of svg.querySelectorAll('path, rect, circle, ellipse, polygon, polyline, line')) {
    if (el.closest('defs, clipPath, mask')) continue;
    if (el.getAttribute('transform') || el.parentNode?.getAttribute?.('transform')) return null;
    const f = fillOf(el);
    if (f === 'none') { anyStroke = true; } else colors.add(f.toLowerCase());
    const g = (k) => parseFloat(el.getAttribute(k)) || 0;
    switch (el.tagName.toLowerCase()) {
      case 'path': parts.push(el.getAttribute('d') || ''); break;
      case 'rect': { const x = g('x'), y = g('y'), w = g('width'), h = g('height'); parts.push(`M${x} ${y} H${x + w} V${y + h} H${x} Z`); break; }
      case 'circle': { const cx = g('cx'), cy = g('cy'), r = g('r'); parts.push(`M${cx} ${cy - r} A${r} ${r} 0 1 0 ${cx + 0.01} ${cy - r} Z`); break; }
      case 'ellipse': { const cx = g('cx'), cy = g('cy'), rx = g('rx'), ry = g('ry'); parts.push(`M${cx} ${cy - ry} A${rx} ${ry} 0 1 0 ${cx + 0.01} ${cy - ry} Z`); break; }
      case 'polygon': case 'polyline': {
        const nums = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
        const pts = []; for (let i = 0; i + 1 < nums.length; i += 2) pts.push(`${nums[i]} ${nums[i + 1]}`);
        if (pts.length) parts.push(`M${pts.join(' L')}${el.tagName === 'polygon' ? ' Z' : ''}`); break;
      }
      case 'line': parts.push(`M${g('x1')} ${g('y1')} L${g('x2')} ${g('y2')}`); anyStroke = true; break;
      default:
    }
  }
  if (unsupported || !parts.length || colors.size > 1 || (anyStroke && colors.size)) return null;
  const color = [...colors][0];
  return {
    type: 'shape', path: parts.join(' '), vb, fill: anyStroke ? '#111111' : (color && color !== 'currentcolor' ? color : '#111111'),
    outline: anyStroke, strokeWidth: anyStroke ? 4 : 0, width: 300, height: Math.round(300 * (vb[3] / vb[2])) || 300,
  };
}

export const RECENT_KEY = 'cnd_recent_elements';
export function loadRecent() { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; } }
export function pushRecent(item) {
  const next = [item, ...loadRecent().filter((r) => r.key !== item.key)].slice(0, 12);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
  return next;
}
