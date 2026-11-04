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
const E = (o) => ({ type: 'ellipse', fill: '#0B7CFC', opacity: 1, rotation: 0, ...o });

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
  // ---------- журнал и газета ----------
  {
    id: 'cnd-magazine-cover', name: 'Обложка журнала', kind: 'Журнал', tags: ['журнал', 'обложка', 'выпуск', 'a4'], official: true, author: 'CND',
    doc: {
      width: 1414, height: 2000, background: '#0D1420',
      elements: [
        P({ x: 0, y: 0, width: 1414, height: 2000, label: 'Фото на всю обложку', fill: '#22324A' }),
        R({ x: 0, y: 0, width: 1414, height: 360, fill: '#000000', opacity: 0.35 }),
        T({ x: 60, y: 60, width: 1294, text: 'ВЫПУСК № 12 · НОЯБРЬ 2026 · ЦЕНА $5', fontFamily: 'Oswald', fontSize: 30, fill: '#FFFFFF', align: 'center', letterSpacing: 6 }),
        T({ x: 40, y: 110, width: 1334, text: 'CALIFORNIA NEWSDAY', fontFamily: 'Playfair Display', fontSize: 148, fontStyle: 'bold', fill: '#FFFFFF', align: 'center', shadow: true }),
        R({ x: 0, y: 1300, width: 1414, height: 700, fill: '#000000', opacity: 0.55 }),
        R({ x: 80, y: 1360, width: 220, height: 56, fill: '#8E1B1B', cornerRadius: 6 }),
        T({ x: 80, y: 1370, width: 220, text: 'ЭКСКЛЮЗИВ', fontFamily: 'Oswald', fontSize: 32, fill: '#FFFFFF', align: 'center', letterSpacing: 3 }),
        T({ x: 80, y: 1440, width: 1150, text: 'Главная тема выпуска в одну-две строки', fontFamily: 'Playfair Display', fontSize: 96, fontStyle: 'bold', fill: '#FFFFFF', lineHeight: 1.05, shadow: true }),
        R({ x: 80, y: 1700, width: 8, height: 64, fill: '#0B7CFC' }),
        T({ x: 108, y: 1704, width: 560, text: 'Интервью с мэром: планы на зиму', fontFamily: 'Inter', fontSize: 28, fontStyle: 'bold', fill: '#FFFFFF' }),
        R({ x: 700, y: 1700, width: 8, height: 64, fill: '#0B7CFC' }),
        T({ x: 728, y: 1704, width: 560, text: 'Криминальная хроника недели', fontFamily: 'Inter', fontSize: 28, fontStyle: 'bold', fill: '#FFFFFF' }),
        R({ x: 80, y: 1800, width: 8, height: 64, fill: '#0B7CFC' }),
        T({ x: 108, y: 1804, width: 560, text: 'Бизнес: кто открылся в городе', fontFamily: 'Inter', fontSize: 28, fontStyle: 'bold', fill: '#FFFFFF' }),
        R({ x: 700, y: 1800, width: 8, height: 64, fill: '#0B7CFC' }),
        T({ x: 728, y: 1804, width: 560, text: 'Спорт и события выходных', fontFamily: 'Inter', fontSize: 28, fontStyle: 'bold', fill: '#FFFFFF' }),
        I({ x: 1214, y: 1800, width: 130, height: 130, src: BRAND.iconWhite, locked: true, name: 'Логотип CND' }),
      ],
    },
  },
  {
    id: 'cnd-statement', name: 'Официальное заявление', kind: 'Газета', tags: ['заявление', 'официально', 'пресс-релиз', 'a4'], official: true, author: 'CND',
    doc: {
      width: 1414, height: 2000, background: '#FFFFFF',
      elements: [
        R({ x: 0, y: 0, width: 1414, height: 24, fill: '#0B7CFC' }),
        I({ x: 100, y: 110, width: 480, height: 117, src: BRAND.horizontal, locked: true, name: 'Логотип CND' }),
        T({ x: 814, y: 120, width: 500, text: 'Пресс-служба CND\nЛос-Сантос, 4 ноября 2026', fontFamily: 'Inter', fontSize: 26, fill: '#5D6675', align: 'right', lineHeight: 1.5 }),
        L({ x: 100, y: 290, points: [0, 0, 1214, 0], stroke: '#DFE4EC', strokeWidth: 3 }),
        T({ x: 100, y: 360, width: 1214, text: 'ОФИЦИАЛЬНОЕ ЗАЯВЛЕНИЕ', fontFamily: 'Montserrat', fontSize: 30, fontStyle: 'bold', fill: '#0B7CFC', letterSpacing: 8 }),
        T({ x: 100, y: 420, width: 1214, text: 'О чём это заявление: коротко и по делу', fontFamily: 'Merriweather', fontSize: 64, fontStyle: 'bold', fill: '#03316F', lineHeight: 1.2 }),
        T({ x: 100, y: 640, width: 1214, text: `${LOREM}\n\n${LOREM}\n\n${LOREM}`, fontFamily: 'PT Serif', fontSize: 32, fill: '#14181F', lineHeight: 1.55, align: 'justify' }),
        L({ x: 100, y: 1650, points: [0, 0, 420, 0], stroke: '#14181F', strokeWidth: 2 }),
        T({ x: 100, y: 1670, width: 700, text: 'Имя Фамилия\nГлавный редактор California NewsDay', fontFamily: 'Inter', fontSize: 28, fill: '#14181F', lineHeight: 1.5 }),
        R({ x: 0, y: 1900, width: 1414, height: 100, fill: '#03316F' }),
        T({ x: 100, y: 1935, width: 1214, text: 'California NewsDay · Real news. California.', fontFamily: 'Inter', fontSize: 26, fill: '#C9D8F0', align: 'center' }),
      ],
    },
  },
  // ---------- посты ----------
  {
    id: 'cnd-interview', name: 'Интервью с цитатой', kind: 'Пост', tags: ['интервью', 'цитата', 'персонаж', '4:5'], official: true, author: 'CND',
    doc: {
      width: 1080, height: 1350, background: '#F1EDE4',
      elements: [
        P({ x: 0, y: 0, width: 1080, height: 640, label: 'Фото героя интервью', fill: '#C9C4B8' }),
        R({ x: 60, y: 600, width: 230, height: 70, fill: '#0B7CFC', cornerRadius: 6 }),
        T({ x: 60, y: 616, width: 230, text: 'ИНТЕРВЬЮ', fontFamily: 'Oswald', fontSize: 36, fill: '#FFFFFF', align: 'center', letterSpacing: 4 }),
        T({ x: 48, y: 650, width: 200, text: '“', fontFamily: 'Playfair Display', fontSize: 260, fill: '#0B7CFC', lineHeight: 1 }),
        T({ x: 180, y: 720, width: 840, text: 'Яркая цитата героя, ради которой стоит прочитать всё интервью.', fontFamily: 'Playfair Display', fontSize: 56, fontStyle: 'italic', fill: '#111111', lineHeight: 1.2 }),
        T({ x: 180, y: 1010, width: 840, text: 'ИМЯ ФАМИЛИЯ', fontFamily: 'Montserrat', fontSize: 36, fontStyle: 'bold', fill: '#03316F', letterSpacing: 2 }),
        T({ x: 180, y: 1060, width: 840, text: 'Должность или кем приходится городу', fontFamily: 'Inter', fontSize: 28, fill: '#5D6675' }),
        L({ x: 60, y: 1200, points: [0, 0, 960, 0], stroke: '#111111', strokeWidth: 2 }),
        T({ x: 60, y: 1232, width: 640, text: 'Полная версия — в новом выпуске CND\nАвтор: Имя Фамилия', fontFamily: 'PT Serif', fontSize: 24, fill: '#444444', lineHeight: 1.4 }),
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
        T({ x: 60, y: 122, width: 760, text: '4 ноября 2026 · главное за сутки', fontFamily: 'Inter', fontSize: 26, fill: '#8FB6EA' }),
        I({ x: 920, y: 45, width: 100, height: 100, src: BRAND.iconWhite, locked: true, name: 'Логотип CND' }),
        E({ x: 60, y: 250, width: 96, height: 96, fill: '#0B7CFC' }),
        T({ x: 60, y: 270, width: 96, text: '1', fontFamily: 'Russo One', fontSize: 54, fill: '#FFFFFF', align: 'center' }),
        T({ x: 190, y: 248, width: 830, text: 'Первая новость: заголовок в одну строку', fontFamily: 'Montserrat', fontSize: 38, fontStyle: 'bold', fill: '#111111' }),
        T({ x: 190, y: 302, width: 830, text: 'Пара слов о том, что случилось и почему это важно.', fontFamily: 'Inter', fontSize: 26, fill: '#5D6675' }),
        L({ x: 60, y: 400, points: [0, 0, 960, 0], stroke: '#DFE4EC', strokeWidth: 2 }),
        E({ x: 60, y: 450, width: 96, height: 96, fill: '#0B7CFC' }),
        T({ x: 60, y: 470, width: 96, text: '2', fontFamily: 'Russo One', fontSize: 54, fill: '#FFFFFF', align: 'center' }),
        T({ x: 190, y: 448, width: 830, text: 'Вторая новость: заголовок в одну строку', fontFamily: 'Montserrat', fontSize: 38, fontStyle: 'bold', fill: '#111111' }),
        T({ x: 190, y: 502, width: 830, text: 'Пара слов о том, что случилось и почему это важно.', fontFamily: 'Inter', fontSize: 26, fill: '#5D6675' }),
        L({ x: 60, y: 600, points: [0, 0, 960, 0], stroke: '#DFE4EC', strokeWidth: 2 }),
        E({ x: 60, y: 650, width: 96, height: 96, fill: '#0B7CFC' }),
        T({ x: 60, y: 670, width: 96, text: '3', fontFamily: 'Russo One', fontSize: 54, fill: '#FFFFFF', align: 'center' }),
        T({ x: 190, y: 648, width: 830, text: 'Третья новость: заголовок в одну строку', fontFamily: 'Montserrat', fontSize: 38, fontStyle: 'bold', fill: '#111111' }),
        T({ x: 190, y: 702, width: 830, text: 'Пара слов о том, что случилось и почему это важно.', fontFamily: 'Inter', fontSize: 26, fill: '#5D6675' }),
        R({ x: 0, y: 960, width: 1080, height: 120, fill: '#0B7CFC' }),
        T({ x: 60, y: 1000, width: 960, text: 'Подробности каждой новости — в выпуске California NewsDay', fontFamily: 'Inter', fontSize: 28, fontStyle: 'bold', fill: '#FFFFFF', align: 'center' }),
      ],
    },
  },
  {
    id: 'cnd-quote', name: 'Цитата дня', kind: 'Пост', tags: ['цитата', 'квадрат', 'мнение'], official: true, author: 'CND',
    doc: {
      width: 1080, height: 1080, background: '#0B7CFC',
      elements: [
        E({ x: 640, y: -200, width: 700, height: 700, fill: '#FFFFFF', opacity: 0.08 }),
        E({ x: -260, y: 700, width: 600, height: 600, fill: '#03316F', opacity: 0.35 }),
        T({ x: 80, y: 90, width: 300, text: '“', fontFamily: 'Playfair Display', fontSize: 340, fill: '#FFFFFF', opacity: 0.35, lineHeight: 1 }),
        T({ x: 100, y: 330, width: 880, text: 'Правда не нуждается в громких словах. Ей нужен тот, кто её расскажет.', fontFamily: 'Playfair Display', fontSize: 64, fontStyle: 'italic', fill: '#FFFFFF', lineHeight: 1.2, align: 'center' }),
        L({ x: 440, y: 720, points: [0, 0, 200, 0], stroke: '#FFFFFF', strokeWidth: 3 }),
        T({ x: 100, y: 750, width: 880, text: 'ИМЯ ФАМИЛИЯ', fontFamily: 'Montserrat', fontSize: 34, fontStyle: 'bold', fill: '#FFFFFF', align: 'center', letterSpacing: 3 }),
        T({ x: 100, y: 800, width: 880, text: 'должность', fontFamily: 'Inter', fontSize: 26, fill: '#DCEBFF', align: 'center' }),
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
        T({ x: 60, y: 220, width: 960, text: 'полицией Лос-Сантоса', fontFamily: 'PT Serif', fontSize: 34, fontStyle: 'italic', fill: '#3B2A1A', align: 'center' }),
        P({ x: 260, y: 290, width: 560, height: 560, label: 'Фото или голова персонажа', fill: '#BFB396' }),
        T({ x: 60, y: 880, width: 960, text: 'ИМЯ ФАМИЛИЯ', fontFamily: 'Oswald', fontSize: 76, fill: '#3B2A1A', align: 'center', letterSpacing: 4 }),
        T({ x: 120, y: 985, width: 840, text: 'Особые приметы: рост, одежда, где видели в последний раз.', fontFamily: 'PT Serif', fontSize: 30, fill: '#3B2A1A', align: 'center', lineHeight: 1.35 }),
        T({ x: 60, y: 1090, width: 960, text: 'НАГРАДА $50 000', fontFamily: 'Russo One', fontSize: 64, fill: '#8E1B1B', align: 'center' }),
        T({ x: 100, y: 1210, width: 700, text: 'Сообщите в полицию или в редакцию CND', fontFamily: 'PT Serif', fontSize: 26, fill: '#3B2A1A' }),
        I({ x: 900, y: 1180, width: 90, height: 90, src: BRAND.icon, locked: true, name: 'Логотип CND' }),
      ],
    },
  },
  // ---------- сторис и афиши ----------
  {
    id: 'cnd-story-news', name: 'Сторис-новость', kind: 'Сторис', tags: ['сторис', '9:16', 'новости', 'срочно'], official: true, author: 'CND',
    doc: {
      width: 1080, height: 1920, background: '#0D1420',
      elements: [
        P({ x: 0, y: 0, width: 1080, height: 1920, label: 'Фото на весь экран', fill: '#22324A' }),
        R({ x: 0, y: 0, width: 1080, height: 200, fill: '#03316F', opacity: 0.92 }),
        I({ x: 60, y: 60, width: 90, height: 90, src: BRAND.iconWhite, locked: true, name: 'Логотип CND' }),
        T({ x: 175, y: 70, width: 600, text: 'НОВОСТИ CND', fontFamily: 'Unbounded', fontSize: 46, fontStyle: 'bold', fill: '#FFFFFF' }),
        T({ x: 175, y: 126, width: 600, text: 'California NewsDay', fontFamily: 'Inter', fontSize: 24, fill: '#8FB6EA' }),
        R({ x: 60, y: 1180, width: 380, height: 70, fill: '#8E1B1B', cornerRadius: 35 }),
        T({ x: 60, y: 1196, width: 380, text: '● ПРЯМО СЕЙЧАС', fontFamily: 'Rubik', fontSize: 34, fontStyle: 'bold', fill: '#FFFFFF', align: 'center' }),
        R({ x: 40, y: 1280, width: 1000, height: 520, fill: '#FFFFFF', opacity: 0.96, cornerRadius: 28 }),
        T({ x: 90, y: 1330, width: 900, text: 'Заголовок новости крупно, чтобы читалось с телефона', fontFamily: 'Montserrat', fontSize: 70, fontStyle: 'bold', fill: '#03316F', lineHeight: 1.1 }),
        T({ x: 90, y: 1600, width: 900, text: 'Одна-две строки подробностей: где и когда это случилось.', fontFamily: 'Inter', fontSize: 34, fill: '#3A4352', lineHeight: 1.35 }),
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
        T({ x: 80, y: 120, width: 920, text: 'А Ф И Ш А   C N D', fontFamily: 'Unbounded', fontSize: 40, fill: '#8FB6EA', letterSpacing: 4 }),
        T({ x: 80, y: 200, width: 920, text: 'ГОРОДСКОЙ ФЕСТИВАЛЬ', fontFamily: 'Unbounded', fontSize: 108, fontStyle: 'bold', fill: '#FFFFFF', lineHeight: 1.05 }),
        P({ x: 80, y: 480, width: 920, height: 800, label: 'Фото или арт мероприятия', fill: '#0B4A9E', cornerRadius: 24 }),
        R({ x: 80, y: 1340, width: 920, height: 130, fill: '#0B7CFC', cornerRadius: 20 }),
        T({ x: 80, y: 1372, width: 920, text: '15 НОЯБРЯ · 18:00', fontFamily: 'Russo One', fontSize: 64, fill: '#FFFFFF', align: 'center' }),
        T({ x: 80, y: 1520, width: 920, text: 'Площадь мэрии, Лос-Сантос\nВход свободный', fontFamily: 'Inter', fontSize: 40, fontStyle: 'bold', fill: '#FFFFFF', align: 'center', lineHeight: 1.4 }),
        T({ x: 80, y: 1700, width: 920, text: 'Музыка, конкурсы и призы от спонсоров. Освещает California NewsDay.', fontFamily: 'Inter', fontSize: 30, fill: '#C9D8F0', align: 'center', lineHeight: 1.4 }),
        I({ x: 490, y: 1800, width: 100, height: 100, src: BRAND.iconWhite, locked: true, name: 'Логотип CND' }),
      ],
    },
  },
  // ---------- развороты ----------
  {
    id: 'cnd-ad', name: 'Реклама бизнеса', kind: 'Разворот', tags: ['реклама', 'бизнес', '16:9', 'объявление'], official: true, author: 'CND',
    doc: {
      width: 1920, height: 1080, background: '#F1EDE4',
      elements: [
        P({ x: 0, y: 0, width: 900, height: 1080, label: 'Фото бизнеса или товара', fill: '#C9C4B8' }),
        R({ x: 900, y: 0, width: 16, height: 1080, fill: '#0B7CFC' }),
        T({ x: 1000, y: 110, width: 820, text: 'РЕКЛАМА', fontFamily: 'Oswald', fontSize: 30, fill: '#5D6675', letterSpacing: 8 }),
        T({ x: 1000, y: 160, width: 840, text: 'Название бизнеса', fontFamily: 'Lobster', fontSize: 100, fill: '#03316F', lineHeight: 1.05 }),
        T({ x: 1000, y: 330, width: 820, text: 'Короткий слоган: чем вы лучше остальных в городе.', fontFamily: 'Merriweather', fontSize: 38, fontStyle: 'italic', fill: '#14181F', lineHeight: 1.35 }),
        T({ x: 1000, y: 500, width: 820, text: '✓  Первое преимущество\n✓  Второе преимущество\n✓  Третье преимущество', fontFamily: 'Inter', fontSize: 36, fill: '#14181F', lineHeight: 1.7 }),
        R({ x: 1000, y: 800, width: 820, height: 150, fill: '#03316F', cornerRadius: 18 }),
        T({ x: 1040, y: 830, width: 500, text: 'от $499', fontFamily: 'Russo One', fontSize: 72, fill: '#FFFFFF' }),
        T({ x: 1450, y: 840, width: 340, text: 'Адрес: Вайнвуд, 12\nТел.: 555-0101', fontFamily: 'Inter', fontSize: 28, fill: '#C9D8F0', align: 'right', lineHeight: 1.45 }),
        I({ x: 1620, y: 990, width: 240, height: 59, src: BRAND.horizontal, locked: true, name: 'Логотип CND' }),
      ],
    },
  },
];


export function blankDoc(size) {
  return { width: size.width, height: size.height, background: '#FFFFFF', elements: [] };
}
