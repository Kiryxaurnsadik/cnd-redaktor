// Если крадёте, то крадите ради реально хороших людей
import { BRAND } from './brand.js';
import { uid } from './util.js';
import { docWithIds } from './pages.js';
import { BUBBLES, ICONS, LINES, SHAPES, chartSpec, tableSpec } from './elements.js';
import { MAG_TEMPLATES, QUICK_TEMPLATES } from './quicktpl.js';

export const SIZES = [
  { key: 'a4', label: 'Газетная полоса A4', width: 1414, height: 2000 },
  { key: 'post', label: 'Пост 4:5', width: 1080, height: 1350 },
  { key: 'square', label: 'Квадрат 1:1', width: 1080, height: 1080 },
  { key: 'wide', label: 'Разворот 16:9', width: 1920, height: 1080 },
  { key: 'story', label: 'Сторис 9:16', width: 1080, height: 1920 },
];

const T = (o) => ({ type: 'text', fontFamily: 'Inter', fontSize: 32, fill: '#111111', align: 'left', fontStyle: 'normal', lineHeight: 1.25, letterSpacing: 0, opacity: 1, rotation: 0, ...o });
const R = (o) => ({ type: 'rect', fill: '#0B7CFC', opacity: 1, rotation: 0, cornerRadius: 0, ...o });
const L = (o) => ({ type: 'line', stroke: '#111111', strokeWidth: 2, opacity: 1, rotation: 0, ...o });
const P = (o) => ({ type: 'placeholder', fill: '#c9c4b8', label: 'Перетащите фото', opacity: 1, rotation: 0, ...o });
const I = (o) => ({ type: 'image', opacity: 1, rotation: 0, ...o });
const E = (o) => ({ type: 'ellipse', fill: '#0B7CFC', opacity: 1, rotation: 0, ...o });
const ALL_SHAPES = [...SHAPES, ...LINES, ...BUBBLES, ...ICONS];
const SH = (id, o) => { const s = ALL_SHAPES.find((x) => x.id === id); return { type: 'shape', path: s.path, outline: !!s.outline, fill: '#0B7CFC', strokeWidth: s.outline ? 4 : 0, opacity: 1, rotation: 0, name: s.name, ...o }; };
const CH = (kind, o) => ({ ...chartSpec(kind), opacity: 1, rotation: 0, ...o });
const TB = (o) => ({ ...tableSpec(4, 3, o.style || 'cnd'), opacity: 1, rotation: 0, ...o });
const GLASS = { fill: 'rgba(255,255,255,0.06)', gradient: { type: 'linear', from: 'rgba(255,255,255,0.16)', to: 'rgba(255,255,255,0.03)', angle: 90 }, stroke: 'rgba(255,255,255,0.32)', strokeWidth: 1.5, shadow: { color: '#000000', blur: 30, x: 0, y: 10, opacity: 0.35 } };
const G = (o) => R({ ...GLASS, ...o });

const LOREM = 'Текст статьи о жизни штата Калифорния на AtlantWorld. Вставьте сюда материал или импортируйте его из Word. Колонки можно растягивать, а шрифт и выравнивание меняются справа.';

export function withIds(doc) {
  return docWithIds(doc);
}

export const OFFICIAL_TEMPLATES = [
  {
    id: 'cnd-newspaper', name: 'Газетная полоса', kind: 'Газета', tags: ['газета', 'a4', 'новости'], official: true, author: 'CND',
    doc: {
      width: 1414, height: 2000, background: '#F1EDE4',
      elements: [
        T({ x: 57, y: 40, width: 400, text: 'АВТОР: ИМЯ ФАМИЛИЯ', fontFamily: 'Old Standard TT', fontSize: 24 }),
        T({ x: 457, y: 40, width: 500, text: 'ШТАТ КАЛИФОРНИЯ · ATLANTWORLD', fontFamily: 'Old Standard TT', fontSize: 24, fontStyle: 'bold', align: 'center' }),
        T({ x: 957, y: 40, width: 400, text: 'НОЯБРЬ 2026', fontFamily: 'Old Standard TT', fontSize: 24, align: 'right' }),
        L({ x: 57, y: 88, points: [0, 0, 1300, 0], strokeWidth: 2 }),
        T({ x: 57, y: 112, width: 1300, text: 'CALIFORNIA NEWSDAY', fontFamily: 'Old Standard TT', fontSize: 104, align: 'center' }),
        L({ x: 57, y: 250, points: [0, 0, 1300, 0], strokeWidth: 5 }),
        L({ x: 57, y: 262, points: [0, 0, 1300, 0], strokeWidth: 1.5 }),
        T({ x: 57, y: 292, width: 1300, text: 'ГЛАВНАЯ НОВОСТЬ КАЛИФОРНИИ: ЗАГОЛОВОК В ДВЕ СТРОКИ', fontFamily: 'Old Standard TT', fontSize: 64, fontStyle: 'bold', lineHeight: 1.1 }),
        P({ x: 57, y: 460, width: 1300, height: 660, fx: { grayscale: 100, contrast: 115 }, label: 'Фото станет чёрно-белым, как в газете' }),
        T({ x: 57, y: 1132, width: 1300, text: 'Подпись к фото: что и где в Калифорнии происходит на снимке.', fontFamily: 'PT Serif', fontSize: 22, fontStyle: 'italic', fill: '#444444' }),
        T({ x: 57, y: 1190, width: 410, text: `${LOREM}\n\n${LOREM}`, fontFamily: 'PT Serif', fontSize: 25, align: 'justify', lineHeight: 1.35 }),
        T({ x: 502, y: 1190, width: 410, text: `${LOREM}\n\n${LOREM}`, fontFamily: 'PT Serif', fontSize: 25, align: 'justify', lineHeight: 1.35 }),
        T({ x: 947, y: 1190, width: 410, text: `${LOREM}\n\n${LOREM}`, fontFamily: 'PT Serif', fontSize: 25, align: 'justify', lineHeight: 1.35 }),
        L({ x: 57, y: 1890, points: [0, 0, 1300, 0], strokeWidth: 1.5 }),
        T({ x: 57, y: 1912, width: 800, text: 'Редакция CND · AtlantWorld · Автор: Имя Фамилия', fontFamily: 'PT Serif', fontSize: 24, fill: '#444444' }),
        I({ x: 1117, y: 1904, width: 240, height: 59, src: BRAND.horizontal, locked: true, name: 'Логотип CND' }),
      ],
    },
  },
  {
    id: 'cnd-post', name: 'Пост с персонажем', kind: 'Пост', tags: ['пост', 'вакансия', 'персонаж'], official: true, author: 'CND',
    doc: {
      width: 1080, height: 1350, background: '#03316F',
      elements: [
        T({ x: 40, y: 56, width: 1000, text: 'ПОДНИМИ РЕДАКЦИЮ С КОЛЕН', fontFamily: 'Russo One', fontSize: 70, fill: '#FFFFFF', align: 'center' }),
        E({ x: 300, y: 330, width: 480, height: 480, fill: '#0B7CFC', opacity: 0.35, gradient: { type: 'radial', from: 'rgba(11,124,252,0.9)', to: 'rgba(11,124,252,0)' } }),
        I({ x: 382, y: 300, width: 317, height: 576, src: './samples/guide.png', name: 'Гид CND' }),
        T({ x: 48, y: 250, width: 290, text: 'Мы — текстовая сила СМИ и первый фронт передачи информации.', fontFamily: 'PT Serif', fontSize: 32, fill: '#FFFFFF' }),
        T({ x: 48, y: 620, width: 290, text: 'Именно от нашего отдела зависит своевременная публикация новостей Калифорнии.', fontFamily: 'PT Serif', fontSize: 30, fill: '#FFFFFF' }),
        T({ x: 742, y: 250, width: 290, text: 'Отдел Редакции CND нуждается в кадрах как никогда.', fontFamily: 'PT Serif', fontSize: 32, fill: '#FFFFFF', align: 'right' }),
        T({ x: 742, y: 620, width: 290, text: 'Мы готовы обучить сотрудников всем нужным навыкам.', fontFamily: 'PT Serif', fontSize: 30, fill: '#FFFFFF', align: 'right' }),
        R({ x: 340, y: 900, width: 400, height: 90, fill: '#FFFFFF', cornerRadius: 45 }),
        T({ x: 340, y: 926, width: 400, text: 'ВАКАНСИЯ ОТКРЫТА', fontFamily: 'Russo One', fontSize: 34, fill: '#03316F', align: 'center' }),
        T({ x: 48, y: 1190, width: 500, text: 'Редакция CND · AtlantWorld\nАвтор: Имя Фамилия', fontFamily: 'PT Serif', fontSize: 22, fill: '#8FB6EA' }),
        T({ x: 40, y: 1270, width: 1000, text: 'Будь за определённость. Приходи работать. Служи правде.', fontFamily: 'PT Serif', fontSize: 26, fill: '#C9D8F0', align: 'center' }),
        I({ x: 952, y: 1172, width: 80, height: 80, src: BRAND.iconWhite, locked: true, name: 'Логотип CND' }),
      ],
    },
  },
  {
    id: 'cnd-report', name: 'Репортаж-разворот', kind: 'Разворот', tags: ['репортаж', '16:9', 'фото'], official: true, author: 'CND',
    doc: {
      width: 1920, height: 1080, background: '#0D1420',
      elements: [
        P({ x: 0, y: 0, width: 1920, height: 1080, label: 'Перетащите фото на весь разворот', fill: '#1D2738' }),
        R({ x: 0, y: 560, width: 1920, height: 520, fill: '#000000', gradient: { type: 'linear', from: 'rgba(0,0,0,0)', to: 'rgba(0,0,0,0.85)', angle: 90 } }),
        R({ x: 40, y: 36, width: 420, height: 52, fill: '#000000', opacity: 0.45, cornerRadius: 26, stroke: '#FFFFFF', strokeWidth: 1 }),
        T({ x: 64, y: 50, width: 380, text: 'Автор фотографии: Имя Фамилия', fontSize: 22, fill: '#FFFFFF' }),
        R({ x: 1660, y: 36, width: 220, height: 52, fill: '#000000', opacity: 0.45, cornerRadius: 26, stroke: '#FFFFFF', strokeWidth: 1 }),
        T({ x: 1660, y: 50, width: 220, text: 'Made in CND', fontSize: 22, fill: '#FFFFFF', align: 'center' }),
        T({ x: 60, y: 772, width: 1200, text: 'Заголовок', fontFamily: 'Montserrat', fontSize: 110, fontStyle: 'bold', fill: '#FFFFFF' }),
        T({ x: 60, y: 910, width: 1640, text: 'Короткий текст репортажа: где в Калифорнии, когда и что произошло. Две-три строки, чтобы читалось с телефона.', fontSize: 28, fill: '#E6E9EF', lineHeight: 1.4 }),
        SH('pin', { x: 60, y: 1010, width: 30, height: 30, fill: '#7FB8FF' }),
        T({ x: 100, y: 1012, width: 900, text: 'Калифорния · AtlantWorld', fontSize: 24, fill: '#7FB8FF' }),
        I({ x: 1764, y: 772, width: 100, height: 100, src: BRAND.iconWhite, locked: true, name: 'Логотип CND' }),
      ],
    },
  },
  {
    id: 'cnd-breaking', name: 'Срочная новость', kind: 'Пост', tags: ['срочно', 'новости', 'квадрат'], official: true, author: 'CND',
    doc: {
      width: 1080, height: 1080, background: '#0B7CFC',
      elements: [
        SH('burst', { x: 30, y: 10, width: 300, height: 190, fill: '#FFD400', rotation: -6, shadow: { color: '#000000', blur: 0, x: 6, y: 6, opacity: 0.35 } }),
        T({ x: 50, y: 80, width: 260, text: 'СРОЧНО', fontFamily: 'Rubik', fontSize: 48, fontStyle: 'bold', fill: '#8E1B1B', align: 'center', rotation: -6 }),
        I({ x: 920, y: 60, width: 100, height: 100, src: BRAND.iconWhite, locked: true, name: 'Логотип CND' }),
        P({ x: 60, y: 190, width: 960, height: 560, fill: '#3D97FD' }),
        T({ x: 60, y: 782, width: 960, text: 'Главное событие Калифорнии одной фразой', fontFamily: 'Rubik', fontSize: 64, fontStyle: 'bold', fill: '#FFFFFF', lineHeight: 1.1, textStroke: '#03316F', textStrokeWidth: 4 }),
        T({ x: 60, y: 1000, width: 960, text: 'California NewsDay · AtlantWorld', fontSize: 26, fill: '#DCEBFF' }),
      ],
    },
  },
  {
    id: 'cnd-statement', name: 'Официальное заявление', kind: 'Газета', tags: ['заявление', 'официально', 'пресс-релиз', 'документ', 'a4'], official: true, author: 'CND',
    doc: {
      width: 1414, height: 2000, background: '#FBFAF7',
      elements: [
        R({ x: 0, y: 0, width: 1414, height: 250, fill: '#03316F', gradient: { type: 'linear', from: '#03316F', to: '#0B4FA8', angle: 0 } }),
        R({ x: 0, y: 250, width: 1414, height: 10, fill: '#0B7CFC' }),
        I({ x: 100, y: 68, width: 114, height: 114, src: BRAND.iconWhite, locked: true, name: 'Логотип CND' }),
        T({ x: 240, y: 76, width: 460, text: 'California\nNewsDay', fontFamily: 'Montserrat', fontSize: 44, fontStyle: 'bold', fill: '#FFFFFF', lineHeight: 1.05 }),
        T({ x: 714, y: 78, width: 600, text: 'ПРЕСС-СЛУЖБА\nРедакция CND', fontFamily: 'Montserrat', fontSize: 24, fontStyle: 'bold', letterSpacing: 3, fill: '#FFFFFF', align: 'right', lineHeight: 1.5 }),
        T({ x: 714, y: 160, width: 600, text: 'штат Калифорния · AtlantWorld', fontFamily: 'Inter', fontSize: 22, fill: '#9DB8E6', align: 'right' }),
        R({ x: 100, y: 330, width: 1214, height: 112, fill: '#FFFFFF', stroke: '#DCE3EE', strokeWidth: 2, cornerRadius: 10, name: 'Реквизиты' }),
        ...[['Документ', '№ 12/26'], ['Дата', '4 ноября 2026'], ['Кому', 'Жителям штата'], ['Статус', 'Для публикации']].flatMap(([a, b2], i) => [
          T({ x: 132 + i * 300, y: 352, width: 270, text: a.toUpperCase(), fontFamily: 'Montserrat', fontSize: 16, fontStyle: 'bold', letterSpacing: 3, fill: '#7A8699' }),
          T({ x: 132 + i * 300, y: 384, width: 270, text: b2, fontFamily: 'Inter', fontSize: 28, fontStyle: 'bold', fill: i === 3 ? '#0B7CFC' : '#14181F' }),
        ]),
        T({ x: 100, y: 510, width: 1214, text: 'ОФИЦИАЛЬНОЕ ЗАЯВЛЕНИЕ', fontFamily: 'Montserrat', fontSize: 28, fontStyle: 'bold', fill: '#0B7CFC', letterSpacing: 10 }),
        T({ x: 100, y: 560, width: 1214, text: 'О чём это заявление: коротко, по делу и в одну-две строки', fontFamily: 'Merriweather', fontSize: 62, fontStyle: 'bold', fill: '#03316F', lineHeight: 1.18, name: 'Заголовок' }),
        R({ x: 100, y: 760, width: 8, height: 150, fill: '#0B7CFC' }),
        T({ x: 136, y: 760, width: 1178, text: 'Главное в одном абзаце: что произошло, кого это касается и что редакция просит сделать жителей штата.', fontFamily: 'PT Serif', fontSize: 34, fontStyle: 'italic', fill: '#2A3442', lineHeight: 1.45, name: 'Лид' }),
        T({ x: 100, y: 960, width: 1214, text: `${LOREM}\n\n${LOREM}`, fontFamily: 'PT Serif', fontSize: 30, fill: '#14181F', lineHeight: 1.6, align: 'justify', name: 'Текст' }),
        R({ x: 100, y: 1380, width: 1214, height: 190, fill: '#EEF4FD', cornerRadius: 12, name: 'Пункты' }),
        ...[['01', 'Что меняется', 'Коротко, одной строкой.'], ['02', 'С какого числа', 'Дата вступления в силу.'], ['03', 'Куда обращаться', 'Канал или кабинет редакции.']].flatMap(([n, a, b2], i) => [
          T({ x: 136 + i * 400, y: 1410, width: 80, text: n, fontFamily: 'Montserrat', fontSize: 44, fontStyle: 'bold', fill: '#0B7CFC' }),
          T({ x: 136 + i * 400, y: 1470, width: 360, text: a, fontFamily: 'Inter', fontSize: 26, fontStyle: 'bold', fill: '#14181F' }),
          T({ x: 136 + i * 400, y: 1508, width: 360, text: b2, fontFamily: 'Inter', fontSize: 22, fill: '#56657A' }),
        ]),
        L({ x: 100, y: 1700, points: [0, 0, 460, 0], stroke: '#14181F', strokeWidth: 2 }),
        T({ x: 100, y: 1640, width: 460, text: 'Подпись', fontFamily: 'Marck Script', fontSize: 52, fill: '#03316F', name: 'Подпись' }),
        T({ x: 100, y: 1716, width: 700, text: 'Имя Фамилия\nГлавный редактор California NewsDay', fontFamily: 'Inter', fontSize: 26, fill: '#14181F', lineHeight: 1.5 }),
        E({ x: 1040, y: 1580, width: 240, height: 240, fill: 'rgba(0,0,0,0)', stroke: '#1F5FBF', strokeWidth: 6, opacity: 0.8, rotation: -10, name: 'Печать' }),
        E({ x: 1062, y: 1602, width: 196, height: 196, fill: 'rgba(0,0,0,0)', stroke: '#1F5FBF', strokeWidth: 2, opacity: 0.8 }),
        T({ x: 1040, y: 1662, width: 240, text: 'CND\nОФИЦИАЛЬНО\nПРЕСС-СЛУЖБА', fontFamily: 'Oswald', fontSize: 28, fill: '#1F5FBF', align: 'center', rotation: -10, opacity: 0.85, lineHeight: 1.15 }),
        R({ x: 0, y: 1880, width: 1414, height: 120, fill: '#03316F' }),
        T({ x: 100, y: 1918, width: 800, text: 'Вопросы прессы: канал #пресс-служба в Discord CND', fontFamily: 'Inter', fontSize: 24, fill: '#C9D8F0' }),
        T({ x: 900, y: 1918, width: 414, text: 'californianewsday', fontFamily: 'Montserrat', fontSize: 24, fontStyle: 'bold', fill: '#FFFFFF', align: 'right' }),
      ],
    },
  },
  {
    id: 'cnd-interview', name: 'Интервью с цитатой', kind: 'Пост', tags: ['интервью', 'цитата', 'персонаж', '4:5'], official: true, author: 'CND',
    doc: {
      width: 1080, height: 1350, background: '#F1EDE4',
      elements: [
        P({ x: 0, y: 0, width: 1080, height: 640, label: 'Фото героя интервью', fill: '#C9C4B8', mask: 'roundbottom' }),
        R({ x: 60, y: 600, width: 230, height: 70, fill: '#0B7CFC', cornerRadius: 6 }),
        T({ x: 60, y: 616, width: 230, text: 'ИНТЕРВЬЮ', fontFamily: 'Oswald', fontSize: 36, fill: '#FFFFFF', align: 'center', letterSpacing: 4 }),
        SH('speech', { x: 48, y: 700, width: 110, height: 96, fill: '#0B7CFC' }),
        T({ x: 48, y: 690, width: 110, text: '“', fontFamily: 'Playfair Display', fontSize: 120, fill: '#FFFFFF', lineHeight: 1, align: 'center' }),
        T({ x: 180, y: 720, width: 840, text: 'Яркая цитата героя, ради которой стоит прочитать всё интервью.', fontFamily: 'Playfair Display', fontSize: 56, fontStyle: 'italic', fill: '#111111', lineHeight: 1.2 }),
        T({ x: 180, y: 1010, width: 840, text: 'ИМЯ ФАМИЛИЯ', fontFamily: 'Montserrat', fontSize: 36, fontStyle: 'bold', fill: '#03316F', letterSpacing: 2 }),
        T({ x: 180, y: 1060, width: 840, text: 'Должность · штат Калифорния', fontFamily: 'Inter', fontSize: 28, fill: '#5D6675' }),
        L({ x: 60, y: 1200, points: [0, 0, 960, 0], stroke: '#111111', strokeWidth: 2 }),
        T({ x: 60, y: 1232, width: 680, text: 'Полная версия — в новом выпуске CND на AtlantWorld\nАвтор: Имя Фамилия', fontFamily: 'PT Serif', fontSize: 24, fill: '#444444', lineHeight: 1.4 }),
        I({ x: 776, y: 1226, width: 244, height: 60, src: BRAND.horizontal, locked: true, name: 'Логотип CND' }),
      ],
    },
  },
  {
    id: 'cnd-digest', name: 'Дайджест дня', kind: 'Пост', tags: ['дайджест', 'итоги', 'список', 'квадрат'], official: true, author: 'CND',
    doc: {
      width: 1080, height: 1080, background: '#FFFFFF',
      elements: [
        R({ x: 0, y: 0, width: 1080, height: 190, fill: '#03316F' }),
        T({ x: 60, y: 48, width: 760, text: 'ДАЙДЖЕСТ ДНЯ', fontFamily: 'Unbounded', fontSize: 56, fontStyle: 'bold', fill: '#FFFFFF' }),
        T({ x: 60, y: 122, width: 860, text: '4 ноября 2026 · главное в Калифорнии за сутки', fontFamily: 'Inter', fontSize: 26, fill: '#8FB6EA' }),
        I({ x: 920, y: 45, width: 100, height: 100, src: BRAND.iconWhite, locked: true, name: 'Логотип CND' }),
        E({ x: 60, y: 250, width: 96, height: 96, fill: '#0B7CFC' }),
        SH('megaphone', { x: 80, y: 270, width: 56, height: 56, fill: '#FFFFFF' }),
        T({ x: 190, y: 248, width: 830, text: 'Первая новость: заголовок в одну строку', fontFamily: 'Montserrat', fontSize: 38, fontStyle: 'bold', fill: '#111111' }),
        T({ x: 190, y: 302, width: 830, text: 'Пара слов о том, что случилось и почему это важно.', fontFamily: 'Inter', fontSize: 26, fill: '#5D6675' }),
        L({ x: 60, y: 400, points: [0, 0, 960, 0], stroke: '#DFE4EC', strokeWidth: 2 }),
        E({ x: 60, y: 450, width: 96, height: 96, fill: '#0B7CFC' }),
        SH('pin', { x: 80, y: 470, width: 56, height: 56, fill: '#FFFFFF' }),
        T({ x: 190, y: 448, width: 830, text: 'Вторая новость: заголовок в одну строку', fontFamily: 'Montserrat', fontSize: 38, fontStyle: 'bold', fill: '#111111' }),
        T({ x: 190, y: 502, width: 830, text: 'Пара слов о том, что случилось и почему это важно.', fontFamily: 'Inter', fontSize: 26, fill: '#5D6675' }),
        L({ x: 60, y: 600, points: [0, 0, 960, 0], stroke: '#DFE4EC', strokeWidth: 2 }),
        E({ x: 60, y: 650, width: 96, height: 96, fill: '#0B7CFC' }),
        SH('clock', { x: 80, y: 670, width: 56, height: 56, fill: '#FFFFFF' }),
        T({ x: 190, y: 648, width: 830, text: 'Третья новость: заголовок в одну строку', fontFamily: 'Montserrat', fontSize: 38, fontStyle: 'bold', fill: '#111111' }),
        T({ x: 190, y: 702, width: 830, text: 'Пара слов о том, что случилось и почему это важно.', fontFamily: 'Inter', fontSize: 26, fill: '#5D6675' }),
        R({ x: 0, y: 960, width: 1080, height: 120, fill: '#0B7CFC' }),
        T({ x: 60, y: 1000, width: 960, text: 'Подробности — в выпуске California NewsDay на AtlantWorld', fontFamily: 'Inter', fontSize: 28, fontStyle: 'bold', fill: '#FFFFFF', align: 'center' }),
      ],
    },
  },
  {
    id: 'cnd-quote', name: 'Цитата дня', kind: 'Пост', tags: ['цитата', 'квадрат', 'мнение'], official: true, author: 'CND',
    doc: {
      width: 1080, height: 1080, background: '#0B7CFC',
      elements: [
        R({ x: 0, y: 0, width: 1080, height: 1080, fill: '#0B7CFC', gradient: { type: 'linear', from: '#2F8FFF', to: '#03316F', angle: 60 }, name: 'Фон-градиент' }),
        E({ x: 600, y: -240, width: 760, height: 760, fill: '#FFFFFF', gradient: { type: 'radial', from: 'rgba(255,255,255,0.35)', to: 'rgba(255,255,255,0)' }, blend: 'soft-light' }),
        E({ x: -260, y: 700, width: 600, height: 600, fill: '#03316F', opacity: 0.35, blend: 'multiply' }),
        T({ x: 80, y: 90, width: 300, text: '“', fontFamily: 'Playfair Display', fontSize: 340, fill: '#FFFFFF', opacity: 0.35, lineHeight: 1 }),
        T({ x: 100, y: 330, width: 880, text: 'Правда не нуждается в громких словах. Ей нужен тот, кто её расскажет.', fontFamily: 'Playfair Display', fontSize: 64, fontStyle: 'italic', fill: '#FFFFFF', lineHeight: 1.2, align: 'center' }),
        L({ x: 440, y: 720, points: [0, 0, 200, 0], stroke: '#FFFFFF', strokeWidth: 3 }),
        T({ x: 100, y: 750, width: 880, text: 'ИМЯ ФАМИЛИЯ', fontFamily: 'Montserrat', fontSize: 34, fontStyle: 'bold', fill: '#FFFFFF', align: 'center', letterSpacing: 3 }),
        T({ x: 100, y: 800, width: 880, text: 'должность · Калифорния, AtlantWorld', fontFamily: 'Inter', fontSize: 26, fill: '#DCEBFF', align: 'center' }),
        I({ x: 490, y: 940, width: 100, height: 100, src: BRAND.iconWhite, locked: true, name: 'Логотип CND' }),
      ],
    },
  },
  {
    id: 'cnd-wanted', name: 'Розыск', kind: 'Пост', tags: ['розыск', 'полиция', 'криминал', 'плакат'], official: true, author: 'CND',
    doc: {
      width: 1080, height: 1350, background: '#E9DFC7',
      elements: [
        R({ x: 30, y: 30, width: 1020, height: 1290, fill: '#E9DFC7', stroke: '#3B2A1A', strokeWidth: 6 }),
        R({ x: 46, y: 46, width: 988, height: 1258, fill: '#E9DFC7', stroke: '#3B2A1A', strokeWidth: 2 }),
        T({ x: 60, y: 80, width: 960, text: 'РАЗЫСКИВАЕТСЯ', fontFamily: 'Old Standard TT', fontSize: 96, fontStyle: 'bold', fill: '#3B2A1A', align: 'center' }),
        T({ x: 60, y: 220, width: 960, text: 'полицией штата Калифорния', fontFamily: 'PT Serif', fontSize: 34, fontStyle: 'italic', fill: '#3B2A1A', align: 'center' }),
        P({ x: 260, y: 290, width: 560, height: 560, label: 'Фото станет «старым» (сепия)', fill: '#BFB396', fx: { sepia: 85, contrast: 110, saturate: 80 }, frameStroke: '#3B2A1A', frameStrokeWidth: 4 }),
        R({ x: 220, y: 270, width: 160, height: 44, fill: '#F2E7C9', opacity: 0.85, rotation: -28, name: 'Скотч' }),
        R({ x: 700, y: 300, width: 160, height: 44, fill: '#F2E7C9', opacity: 0.85, rotation: 28, name: 'Скотч' }),
        T({ x: 60, y: 880, width: 960, text: 'ИМЯ ФАМИЛИЯ', fontFamily: 'Oswald', fontSize: 76, fill: '#3B2A1A', align: 'center', letterSpacing: 4 }),
        T({ x: 120, y: 985, width: 840, text: 'Особые приметы: рост, одежда, где видели в последний раз.', fontFamily: 'PT Serif', fontSize: 30, fill: '#3B2A1A', align: 'center', lineHeight: 1.35 }),
        T({ x: 60, y: 1090, width: 960, text: 'НАГРАДА $50 000', fontFamily: 'Russo One', fontSize: 64, fill: '#8E1B1B', align: 'center' }),
        T({ x: 100, y: 1210, width: 760, text: 'Сообщите в полицию штата или в редакцию CND', fontFamily: 'PT Serif', fontSize: 26, fill: '#3B2A1A' }),
        I({ x: 900, y: 1180, width: 90, height: 90, src: BRAND.icon, locked: true, name: 'Логотип CND' }),
      ],
    },
  },
  {
    id: 'cnd-story-news', name: 'Сторис-новость', kind: 'Сторис', tags: ['сторис', '9:16', 'новости', 'срочно'], official: true, author: 'CND',
    doc: {
      width: 1080, height: 1920, background: '#0D1420',
      elements: [
        P({ x: 0, y: 0, width: 1080, height: 1920, label: 'Фото на весь экран', fill: '#22324A' }),
        R({ x: 0, y: 0, width: 1080, height: 200, fill: '#03316F', opacity: 0.92 }),
        I({ x: 60, y: 60, width: 90, height: 90, src: BRAND.iconWhite, locked: true, name: 'Логотип CND' }),
        T({ x: 175, y: 70, width: 600, text: 'НОВОСТИ CND', fontFamily: 'Unbounded', fontSize: 46, fontStyle: 'bold', fill: '#FFFFFF' }),
        T({ x: 175, y: 126, width: 700, text: 'California NewsDay · AtlantWorld', fontFamily: 'Inter', fontSize: 24, fill: '#8FB6EA' }),
        R({ x: 60, y: 1180, width: 380, height: 70, fill: '#8E1B1B', cornerRadius: 35 }),
        T({ x: 60, y: 1196, width: 380, text: '● ПРЯМО СЕЙЧАС', fontFamily: 'Rubik', fontSize: 34, fontStyle: 'bold', fill: '#FFFFFF', align: 'center' }),
        R({ x: 40, y: 1280, width: 1000, height: 520, fill: '#FFFFFF', opacity: 0.96, cornerRadius: 28 }),
        T({ x: 90, y: 1330, width: 900, text: 'Заголовок новости крупно, чтобы читалось с телефона', fontFamily: 'Montserrat', fontSize: 70, fontStyle: 'bold', fill: '#03316F', lineHeight: 1.1 }),
        T({ x: 90, y: 1600, width: 900, text: 'Одна-две строки подробностей: когда это случилось и что известно.', fontFamily: 'Inter', fontSize: 34, fill: '#3A4352', lineHeight: 1.35 }),
        SH('pin', { x: 90, y: 1712, width: 40, height: 40, fill: '#0B7CFC' }),
        T({ x: 142, y: 1716, width: 840, text: 'Калифорния · место события', fontFamily: 'Inter', fontSize: 30, fontStyle: 'bold', fill: '#0B7CFC' }),
        T({ x: 60, y: 1840, width: 960, text: 'Подробнее — в выпуске CND', fontFamily: 'Inter', fontSize: 28, fill: '#FFFFFF', align: 'center', shadow: true }),
      ],
    },
  },
  {
    id: 'cnd-event', name: 'Афиша мероприятия', kind: 'Афиша', tags: ['афиша', 'событие', 'сторис', '9:16'], official: true, author: 'CND',
    doc: {
      width: 1080, height: 1920, background: '#03316F',
      elements: [
        E({ x: 520, y: -260, width: 900, height: 900, fill: '#0B7CFC', opacity: 0.45 }),
        E({ x: -300, y: 1400, width: 800, height: 800, fill: '#0050BE', opacity: 0.5 }),
        SH('star5', { x: 880, y: 420, width: 140, height: 140, fill: '#FFD400', rotation: 12 }),
        SH('star5', { x: 40, y: 1250, width: 90, height: 90, fill: '#FFD400', rotation: -10 }),
        SH('star8', { x: 960, y: 1260, width: 70, height: 70, fill: '#FFFFFF', opacity: 0.8 }),
        T({ x: 80, y: 120, width: 920, text: 'А Ф И Ш А   C N D', fontFamily: 'Unbounded', fontSize: 40, fill: '#8FB6EA', letterSpacing: 4 }),
        T({ x: 80, y: 200, width: 920, text: 'ГОРОДСКОЙ ФЕСТИВАЛЬ', fontFamily: 'Unbounded', fontSize: 108, fontStyle: 'bold', fill: '#FFFFFF', lineHeight: 1.05 }),
        P({ x: 80, y: 480, width: 920, height: 800, label: 'Фото или арт мероприятия', fill: '#0B4A9E', cornerRadius: 24 }),
        R({ x: 80, y: 1340, width: 920, height: 130, fill: '#0B7CFC', cornerRadius: 20 }),
        T({ x: 80, y: 1372, width: 920, text: '15 НОЯБРЯ · 18:00', fontFamily: 'Russo One', fontSize: 64, fill: '#FFFFFF', align: 'center' }),
        T({ x: 80, y: 1520, width: 920, text: 'Площадь мэрии, Калифорния\nВход свободный', fontFamily: 'Inter', fontSize: 40, fontStyle: 'bold', fill: '#FFFFFF', align: 'center', lineHeight: 1.4 }),
        T({ x: 80, y: 1680, width: 920, text: 'Музыка, конкурсы и призы от спонсоров AtlantWorld. Освещает California NewsDay.', fontFamily: 'Inter', fontSize: 30, fill: '#C9D8F0', align: 'center', lineHeight: 1.4 }),
        I({ x: 490, y: 1800, width: 100, height: 100, src: BRAND.iconWhite, locked: true, name: 'Логотип CND' }),
      ],
    },
  },
  {
    id: 'cnd-ad', name: 'Реклама бизнеса', kind: 'Разворот', tags: ['реклама', 'бизнес', '16:9', 'объявление'], official: true, author: 'CND',
    doc: {
      width: 1920, height: 1080, background: '#F1EDE4',
      elements: [
        P({ x: 0, y: 0, width: 900, height: 1080, label: 'Фото бизнеса или товара', fill: '#C9C4B8' }),
        R({ x: 900, y: 0, width: 16, height: 1080, fill: '#0B7CFC' }),
        T({ x: 1000, y: 110, width: 820, text: 'РЕКЛАМА', fontFamily: 'Oswald', fontSize: 30, fill: '#5D6675', letterSpacing: 8 }),
        T({ x: 1000, y: 160, width: 840, text: 'Название бизнеса', fontFamily: 'Lobster', fontSize: 100, fill: '#03316F', lineHeight: 1.05 }),
        T({ x: 1000, y: 330, width: 820, text: 'Короткий слоган: чем вы лучше остальных в Калифорнии.', fontFamily: 'Merriweather', fontSize: 38, fontStyle: 'italic', fill: '#14181F', lineHeight: 1.35 }),
        SH('check', { x: 1000, y: 508, width: 40, height: 40, fill: '#2FB36D' }),
        T({ x: 1060, y: 506, width: 760, text: 'Первое преимущество', fontFamily: 'Inter', fontSize: 36, fill: '#14181F' }),
        SH('check', { x: 1000, y: 588, width: 40, height: 40, fill: '#2FB36D' }),
        T({ x: 1060, y: 586, width: 760, text: 'Второе преимущество', fontFamily: 'Inter', fontSize: 36, fill: '#14181F' }),
        SH('check', { x: 1000, y: 668, width: 40, height: 40, fill: '#2FB36D' }),
        T({ x: 1060, y: 666, width: 760, text: 'Третье преимущество', fontFamily: 'Inter', fontSize: 36, fill: '#14181F' }),
        SH('tag', { x: 640, y: 60, width: 220, height: 84, fill: '#E5484D', rotation: 0 }),
        T({ x: 650, y: 82, width: 170, text: '−20%', fontFamily: 'Russo One', fontSize: 40, fill: '#FFFFFF', align: 'center' }),
        R({ x: 1000, y: 800, width: 820, height: 150, fill: '#03316F', cornerRadius: 18 }),
        T({ x: 1040, y: 830, width: 500, text: 'от $499', fontFamily: 'Russo One', fontSize: 72, fill: '#FFFFFF' }),
        T({ x: 1400, y: 840, width: 390, text: 'Калифорния, ул. Главная, 12\nТел.: 555-0101', fontFamily: 'Inter', fontSize: 28, fill: '#C9D8F0', align: 'right', lineHeight: 1.45 }),

        I({ x: 1620, y: 990, width: 240, height: 59, src: BRAND.horizontal, locked: true, name: 'Логотип CND' }),
      ],
    },
  },
];

const GLASS_THEMES = {
  graphite: { name: 'Графит', bg: ['#34383A', '#1B1D1E'], pill: 'rgba(255,255,255,0.10)', sample: './samples/street.jpg', title: 'Заголовок', sub: '— ГЛАВНОЕ!' },
  neon: { name: 'Неон', bg: ['#3A1530', '#14080F'], pill: 'rgba(170,40,120,0.40)', sample: './samples/event.jpg', title: 'Событие', sub: '— НЕ ПРОПУСТИТЕ!' },
  night: { name: 'Ночь', bg: ['#1C2740', '#0B101B'], pill: 'rgba(90,120,190,0.35)', sample: './samples/city.jpg', title: 'Калифорния', sub: 'НОЧЬЮ' },
};

function glassTemplate(key) {
  const t = GLASS_THEMES[key];
  return {
    id: `cnd-glass-${key}`, name: `Жидкое стекло: ${t.name}`, kind: 'Стекло', tags: ['стекло', 'glass', '16:9', 'фото', 'новость', t.name.toLowerCase()], official: true, author: 'CND',
    doc: {
      width: 1920, height: 1080, background: t.bg[1],
      elements: [
        R({ x: 0, y: 0, width: 1920, height: 1080, fill: t.bg[1], gradient: { type: 'linear', from: t.bg[0], to: t.bg[1], angle: 70 }, locked: true, name: 'Фон' }),
        SH('wave', { x: -120, y: 700, width: 900, height: 260, fill: '#FFFFFF', strokeWidth: 2, opacity: 0.08, rotation: -14, name: 'Узор' }),
        SH('wave', { x: 1300, y: -40, width: 800, height: 220, fill: '#FFFFFF', strokeWidth: 2, opacity: 0.06, rotation: 10, name: 'Узор' }),
        P({ x: 25, y: 25, width: 1870, height: 725, cornerRadius: 26, fill: '#3B4046', label: 'Перетащите фото', sample: { bg: t.sample }, frameStroke: 'rgba(255,255,255,0.25)', frameStrokeWidth: 1.5 }),
        G({ x: 50, y: 50, width: 470, height: 58, cornerRadius: 29, fill: 'rgba(0,0,0,0.25)', name: 'Стекло' }),
        T({ x: 76, y: 67, width: 430, text: 'Автор фотографии: Имя Фамилия', fontFamily: 'Manrope', fontSize: 22, fill: '#FFFFFF' }),
        G({ x: 1670, y: 50, width: 200, height: 58, cornerRadius: 29, fill: 'rgba(0,0,0,0.25)', name: 'Стекло' }),
        T({ x: 1670, y: 67, width: 200, text: 'Made in CND', fontFamily: 'Manrope', fontSize: 22, fill: '#FFFFFF', align: 'center' }),
        T({ x: 24, y: 770, width: 640, text: t.title, fontFamily: 'Manrope', fontSize: 104, fill: '#FFFFFF' }),
        T({ x: 650, y: 818, width: 440, text: t.sub, fontFamily: 'Manrope', fontSize: 28, fill: '#FFFFFF', letterSpacing: 9 }),
        { ...E({ x: 1115, y: 776, width: 92, height: 92 }), ...GLASS, name: 'Стекло' },
        T({ x: 1115, y: 805, width: 92, text: '1', fontFamily: 'Manrope', fontSize: 30, fill: '#FFFFFF', align: 'center' }),
        G({ x: 1230, y: 776, width: 665, height: 92, cornerRadius: 46, name: 'Стекло' }),
        R({ x: 1237, y: 783, width: 400, height: 78, cornerRadius: 39, fill: t.pill, stroke: 'rgba(255,255,255,0.22)', strokeWidth: 1.5, name: 'Плашка с именем' }),
        T({ x: 1237, y: 807, width: 400, text: 'Имя Фамилия', fontFamily: 'Manrope', fontSize: 28, fontStyle: 'bold', fill: '#FFFFFF', align: 'center' }),
        T({ x: 1645, y: 809, width: 230, text: '4 ноября, 2026 г.', fontFamily: 'Manrope', fontSize: 24, fill: '#FFFFFF', align: 'center' }),
        G({ x: 25, y: 892, width: 1870, height: 165, cornerRadius: 44, name: 'Стекло' }),
        T({ x: 62, y: 916, width: 1796, text: 'Короткий текст новости для жителей штата Калифорния на AtlantWorld. Две-четыре строки: что произошло, кто участвует и почему это важно. Выделяйте главное отдельным жирным текстом, а плашки-стекло двигайте и растягивайте как обычные фигуры.', fontFamily: 'Manrope', fontSize: 24, fill: '#E9EDF2', lineHeight: 1.3, align: 'justify' }),
      ],
    },
  };
}

const GOLD = '#F2C98A';

const EXTRA_TEMPLATES = [
  glassTemplate('graphite'),
  glassTemplate('neon'),
  glassTemplate('night'),
  {
    id: 'cnd-frames-analytics', name: 'Аналитика в рамках', kind: 'Разворот', tags: ['аналитика', 'рамки', 'фото в форме', '16:9', 'статья', 'суд', 'закон'], official: true, author: 'CND',
    doc: {
      width: 1920, height: 1080, background: '#2B2220',
      elements: [
        SH('wave', { x: -160, y: 860, width: 700, height: 300, fill: GOLD, strokeWidth: 3, opacity: 0.6, rotation: 30, name: 'Узор' }),
        SH('wave', { x: 1540, y: 900, width: 600, height: 260, fill: GOLD, strokeWidth: 3, opacity: 0.6, rotation: -30, name: 'Узор' }),
        R({ x: 40, y: 70, width: 1840, height: 960, fill: 'rgba(0,0,0,0)', stroke: GOLD, strokeWidth: 4, cornerRadius: 90, name: 'Рамка страницы' }),
        P({ x: 722, y: 55, width: 322, height: 270, mask: 'roundbottom', fill: '#4A3A34', label: 'Фото 1', frameStroke: GOLD, frameStrokeWidth: 4, sample: { bg: './samples/city.jpg' } }),
        P({ x: 1082, y: 55, width: 322, height: 270, mask: 'roundbottom', fill: '#4A3A34', label: 'Фото 2', frameStroke: GOLD, frameStrokeWidth: 4, sample: { bg: './samples/street.jpg' } }),
        P({ x: 1442, y: 55, width: 322, height: 270, mask: 'roundbottom', fill: '#4A3A34', label: 'Фото 3', frameStroke: GOLD, frameStrokeWidth: 4, sample: { bg: './samples/shop.jpg' } }),
        T({ x: 90, y: 130, width: 620, text: 'Заголовок\nаналитики', fontFamily: 'Comfortaa', fontSize: 62, fill: '#F6D7A7', lineHeight: 1.35, shadow: { color: GOLD, blur: 22, x: 0, y: 0, opacity: 0.8 } }),
        T({ x: 90, y: 350, width: 640, text: 'Насколько это важно для Калифорнии?', fontFamily: 'PT Serif', fontSize: 31, fill: GOLD, shadow: { color: GOLD, blur: 14, x: 0, y: 0, opacity: 0.6 } }),
        T({ x: 780, y: 360, width: 560, text: 'Под редакцией: Имя Фамилия', fontFamily: 'PT Serif', fontSize: 26, fill: '#F2DDBA' }),
        T({ x: 1400, y: 360, width: 300, text: 'Дата: 04.11.2026', fontFamily: 'PT Serif', fontSize: 26, fill: '#F2DDBA', align: 'right' }),
        L({ x: 780, y: 404, points: [0, 0, 920, 0], stroke: GOLD, strokeWidth: 4 }),
        R({ x: 80, y: 435, width: 560, height: 560, fill: 'rgba(0,0,0,0)', stroke: GOLD, strokeWidth: 4, cornerRadius: 34, name: 'Панель' }),
        T({ x: 112, y: 462, width: 500, text: 'Короткое вступление: в чём суть темы и почему о ней спорят жители штата.\n\nВторой абзац: что говорят законы Калифорнии и кто за это отвечает на AtlantWorld.', fontFamily: 'PT Serif', fontSize: 30, fill: '#F2DDBA', lineHeight: 1.3 }),
        R({ x: 660, y: 435, width: 4, height: 560, fill: GOLD, name: 'Разделитель' }),
        R({ x: 682, y: 435, width: 4, height: 560, fill: GOLD, name: 'Разделитель' }),
        R({ x: 780, y: 435, width: 920, height: 560, fill: 'rgba(0,0,0,0)', stroke: GOLD, strokeWidth: 4, cornerRadius: 34, name: 'Панель' }),
        T({ x: 816, y: 464, width: 850, text: 'Основной текст материала. Фото сверху вставляются в рамки любой формы: перетащите снимок на рамку, и он обрежется по её контуру вместе с золотой обводкой.\n\nЛюбую фигуру из «Элементов» тоже можно сделать рамкой: выделите её и нажмите «Вставить фото в фигуру».', fontFamily: 'PT Serif', fontSize: 30, fill: '#F2DDBA', lineHeight: 1.3 }),
        I({ x: 1760, y: 950, width: 80, height: 80, src: BRAND.iconWhite, locked: true, name: 'Логотип CND', opacity: 0.85 }),
      ],
    },
  },
  {
    id: 'cnd-poll', name: 'Опрос жителей', kind: 'Пост', tags: ['опрос', 'диаграмма', 'статистика', 'квадрат', 'мнение'], official: true, author: 'CND',
    doc: {
      width: 1080, height: 1080, background: '#F4F7FB',
      elements: [
        R({ x: 0, y: 0, width: 1080, height: 230, fill: '#0B7CFC', gradient: { type: 'linear', from: '#0B7CFC', to: '#03316F', angle: 0 } }),
        T({ x: 60, y: 46, width: 820, text: 'ОПРОС ЖИТЕЛЕЙ', fontFamily: 'Unbounded', fontSize: 46, fontStyle: 'bold', fill: '#FFFFFF' }),
        T({ x: 60, y: 118, width: 820, text: 'Стоит ли Калифорнии строить новую трассу вдоль побережья?', fontFamily: 'Inter', fontSize: 30, fill: '#DCEBFF', lineHeight: 1.25 }),
        I({ x: 930, y: 50, width: 90, height: 90, src: BRAND.iconWhite, locked: true, name: 'Логотип CND' }),
        CH('donut', { x: 60, y: 280, width: 440, height: 600, data: [{ label: 'За', value: 54 }, { label: 'Против', value: 31 }, { label: 'Не знаю', value: 15 }], name: 'Диаграмма: ответы' }),
        T({ x: 560, y: 280, width: 460, text: 'Что важнее для штата?', fontFamily: 'Montserrat', fontSize: 30, fontStyle: 'bold', fill: '#03316F' }),
        CH('bar', { x: 560, y: 340, width: 460, height: 380, data: [{ label: 'Дороги', value: 42 }, { label: 'Безопасность', value: 35 }, { label: 'Бизнес', value: 28 }, { label: 'Отдых', value: 19 }], fontSize: 20, name: 'Диаграмма: приоритеты' }),
        CH('progress', { x: 560, y: 770, width: 460, height: 90, data: [{ label: 'Явка опроса', value: 68 }], fontSize: 22, name: 'Прогресс' }),
        R({ x: 0, y: 960, width: 1080, height: 120, fill: '#03316F' }),
        T({ x: 60, y: 998, width: 960, text: 'Опрос CND среди жителей штата на AtlantWorld · 1 200 ответов', fontFamily: 'Inter', fontSize: 26, fill: '#C9D8F0', align: 'center' }),
      ],
    },
  },
  {
    id: 'cnd-numbers', name: 'Цифры недели', kind: 'Пост', tags: ['таблица', 'цифры', 'статистика', 'экономика', '4:5'], official: true, author: 'CND',
    doc: {
      width: 1080, height: 1350, background: '#0D1420',
      elements: [
        E({ x: 600, y: -300, width: 800, height: 800, fill: '#0B7CFC', gradient: { type: 'radial', from: 'rgba(11,124,252,0.55)', to: 'rgba(11,124,252,0)' } }),
        T({ x: 60, y: 70, width: 900, text: 'ЦИФРЫ НЕДЕЛИ', fontFamily: 'Russo One', fontSize: 84, fill: '#FFFFFF' }),
        T({ x: 60, y: 175, width: 900, text: 'Экономика штата Калифорния на AtlantWorld', fontFamily: 'Inter', fontSize: 30, fill: '#8FB6EA' }),
        TB({
          x: 60, y: 270, width: 960, height: 540, style: 'dark', fontSize: 28,
          cells: [['Показатель', 'Было', 'Стало'], ['Цена топлива', '$3.10', '$3.45'], ['Аренда жилья', '$1 200', '$1 150'], ['Новые бизнесы', '12', '19'], ['Вызовы полиции', '340', '295'], ['Пробки, минут', '25', '31']],
          head: '#0B7CFC', headText: '#FFFFFF', row: '#121A26', alt: '#172131', line: '#243146', text: '#E5EBF4',
        }),
        CH('progress', { x: 60, y: 860, width: 960, height: 110, data: [{ label: 'Годовой план губернатора выполнен', value: 64 }], textColor: '#E5EBF4', gridColor: '#243146', fontSize: 26 }),
        CH('line', { x: 60, y: 1030, width: 620, height: 250, data: [{ label: 'Пн', value: 3.1 }, { label: 'Ср', value: 3.2 }, { label: 'Пт', value: 3.35 }, { label: 'Вс', value: 3.45 }], textColor: '#E5EBF4', gridColor: '#243146', fontSize: 18, colors: ['#FFB547'], name: 'График цены топлива' }),
        T({ x: 720, y: 1100, width: 300, text: 'Цена топлива за неделю', fontFamily: 'Inter', fontSize: 24, fill: '#95A3B8', align: 'right' }),
        I({ x: 920, y: 1220, width: 100, height: 100, src: BRAND.iconWhite, locked: true, name: 'Логотип CND' }),
      ],
    },
  },
];

OFFICIAL_TEMPLATES.push(...EXTRA_TEMPLATES, ...QUICK_TEMPLATES, ...MAG_TEMPLATES);

export function blankDoc(size) {

  return { width: size.width, height: size.height, background: '#FFFFFF', elements: [] };
}
