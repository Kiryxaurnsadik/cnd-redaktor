// Стартовые официальные шаблоны CND (по примерам статей фракции) и пустые размеры.
import { BRAND } from './brand.js';
import { uid } from './util.js';

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

const LOREM = 'Текст статьи. Вставьте сюда материал или импортируйте его из Word. Колонки можно растягивать, а шрифт и выравнивание меняются справа.';

export function withIds(doc) {
  return { ...doc, elements: doc.elements.map((e) => ({ ...e, id: uid() })) };
}

export const OFFICIAL_TEMPLATES = [
  {
    id: 'cnd-newspaper', name: 'Газетная полоса', kind: 'Газета', tags: ['газета', 'a4', 'новости'], official: true, author: 'CND',
    doc: {
      width: 1414, height: 2000, background: '#F1EDE4',
      elements: [
        T({ x: 57, y: 40, width: 400, text: 'АВТОР: ИМЯ ФАМИЛИЯ', fontFamily: 'Old Standard TT', fontSize: 24 }),
        T({ x: 457, y: 40, width: 500, text: 'THE DAILY NEWS', fontFamily: 'Old Standard TT', fontSize: 26, fontStyle: 'bold', align: 'center' }),
        T({ x: 957, y: 40, width: 400, text: 'НОЯБРЬ 2026', fontFamily: 'Old Standard TT', fontSize: 24, align: 'right' }),
        L({ x: 57, y: 88, points: [0, 0, 1300, 0], strokeWidth: 2 }),
        T({ x: 57, y: 112, width: 1300, text: 'CALIFORNIA NEWSDAY', fontFamily: 'Old Standard TT', fontSize: 104, align: 'center' }),
        L({ x: 57, y: 250, points: [0, 0, 1300, 0], strokeWidth: 5 }),
        L({ x: 57, y: 262, points: [0, 0, 1300, 0], strokeWidth: 1.5 }),
        T({ x: 57, y: 292, width: 1300, text: 'ЗАГОЛОВОК ГЛАВНОЙ НОВОСТИ ДНЯ В ДВЕ СТРОКИ', fontFamily: 'Old Standard TT', fontSize: 64, fontStyle: 'bold', lineHeight: 1.1 }),
        P({ x: 57, y: 460, width: 1300, height: 660 }),
        T({ x: 57, y: 1132, width: 1300, text: 'Подпись к фото: что происходит на снимке.', fontFamily: 'PT Serif', fontSize: 22, fontStyle: 'italic', fill: '#444444' }),
        T({ x: 57, y: 1190, width: 410, text: `${LOREM}\n\n${LOREM}`, fontFamily: 'PT Serif', fontSize: 25, align: 'justify', lineHeight: 1.35 }),
        T({ x: 502, y: 1190, width: 410, text: `${LOREM}\n\n${LOREM}`, fontFamily: 'PT Serif', fontSize: 25, align: 'justify', lineHeight: 1.35 }),
        T({ x: 947, y: 1190, width: 410, text: `${LOREM}\n\n${LOREM}`, fontFamily: 'PT Serif', fontSize: 25, align: 'justify', lineHeight: 1.35 }),
        L({ x: 57, y: 1890, points: [0, 0, 1300, 0], strokeWidth: 1.5 }),
        T({ x: 57, y: 1912, width: 800, text: 'Редакция CND · Автор: Имя Фамилия', fontFamily: 'PT Serif', fontSize: 24, fill: '#444444' }),
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
        P({ x: 340, y: 210, width: 400, height: 940, label: 'Персонаж', fill: '#0B4A9E' }),
        T({ x: 48, y: 250, width: 290, text: 'Мы — текстовая сила СМИ и первый фронт передачи информации.', fontFamily: 'PT Serif', fontSize: 32, fill: '#FFFFFF' }),
        T({ x: 48, y: 620, width: 290, text: 'Именно от нашего отдела зависит своевременная публикация новостей Калифорнии.', fontFamily: 'PT Serif', fontSize: 30, fill: '#FFFFFF' }),
        T({ x: 742, y: 250, width: 290, text: 'Отдел Редакции CND нуждается в кадрах как никогда.', fontFamily: 'PT Serif', fontSize: 32, fill: '#FFFFFF', align: 'right' }),
        T({ x: 742, y: 620, width: 290, text: 'Мы готовы обучить сотрудников всем нужным навыкам.', fontFamily: 'PT Serif', fontSize: 30, fill: '#FFFFFF', align: 'right' }),
        T({ x: 48, y: 1190, width: 500, text: 'Редакция CND\nАвтор: Имя Фамилия', fontFamily: 'PT Serif', fontSize: 22, fill: '#8FB6EA' }),
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
        R({ x: 0, y: 740, width: 1920, height: 340, fill: '#000000', opacity: 0.55 }),
        R({ x: 40, y: 36, width: 420, height: 52, fill: '#000000', opacity: 0.45, cornerRadius: 26, stroke: '#FFFFFF', strokeWidth: 1 }),
        T({ x: 64, y: 50, width: 380, text: 'Автор фотографии: Имя Фамилия', fontSize: 22, fill: '#FFFFFF' }),
        R({ x: 1660, y: 36, width: 220, height: 52, fill: '#000000', opacity: 0.45, cornerRadius: 26, stroke: '#FFFFFF', strokeWidth: 1 }),
        T({ x: 1660, y: 50, width: 220, text: 'Made in CND', fontSize: 22, fill: '#FFFFFF', align: 'center' }),
        T({ x: 60, y: 772, width: 1200, text: 'Заголовок', fontFamily: 'Montserrat', fontSize: 110, fontStyle: 'bold', fill: '#FFFFFF' }),
        T({ x: 60, y: 910, width: 1800, text: 'Короткий текст репортажа: где, когда и что произошло. Две-три строки, чтобы читалось с телефона.', fontSize: 28, fill: '#E6E9EF', lineHeight: 1.4 }),
        I({ x: 1764, y: 772, width: 100, height: 100, src: BRAND.iconWhite, locked: true, name: 'Логотип CND' }),
      ],
    },
  },
  {
    id: 'cnd-breaking', name: 'Срочная новость', kind: 'Пост', tags: ['срочно', 'новости', 'квадрат'], official: true, author: 'CND',
    doc: {
      width: 1080, height: 1080, background: '#0B7CFC',
      elements: [
        R({ x: 60, y: 70, width: 250, height: 72, fill: '#8E1B1B', cornerRadius: 8 }),
        T({ x: 60, y: 84, width: 250, text: 'СРОЧНО', fontFamily: 'Rubik', fontSize: 42, fontStyle: 'bold', fill: '#FFFFFF', align: 'center' }),
        I({ x: 920, y: 60, width: 100, height: 100, src: BRAND.iconWhite, locked: true, name: 'Логотип CND' }),
        P({ x: 60, y: 190, width: 960, height: 560, fill: '#3D97FD' }),
        T({ x: 60, y: 782, width: 960, text: 'Главное событие дня одной фразой', fontFamily: 'Rubik', fontSize: 64, fontStyle: 'bold', fill: '#FFFFFF', lineHeight: 1.1 }),
        T({ x: 60, y: 1000, width: 960, text: 'California NewsDay · Real news. California.', fontSize: 26, fill: '#DCEBFF' }),
      ],
    },
  },
];

export function blankDoc(size) {
  return { width: size.width, height: size.height, background: '#FFFFFF', elements: [] };
}
