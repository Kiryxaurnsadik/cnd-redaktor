// Инструкция по сайту и подсказки для редактора
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, X } from 'lucide-react';
import { usePrefs } from '../lib/prefs.js';
import { CREDIT } from '../lib/brand.js';

export const TIPS = [
  'Двойной клик по тексту — редактировать. Ctrl+Enter или Esc — закончить.',
  'Перетащите фото прямо на серую рамку, и оно встанет в неё с обрезкой.',
  'Ctrl+V вставляет скриншот из буфера сразу на холст.',
  'Ctrl+Shift+C копирует готовую картинку с водяным знаком, чтобы вставить её в Discord.',
  'Стрелки двигают выделенное на 1 px, со Shift — на 10 px.',
  'Ctrl+D дублирует элемент, Delete удаляет, Ctrl+Z отменяет.',
  'Во вкладке «Персонажи» можно сделать 3D-голову или персонажа в позе с красивым светом.',
  'Розовые линии при перетаскивании показывают центр и края листа.',
  'Сохраните удачный дизайн кнопкой «В шаблоны», и коллеги найдут его поиском.',
  'Работа сохраняется сама через пару секунд после каждого изменения.',
];

const SECTIONS = [
  {
    key: 'start', title: 'Вход на сайт', body: (
      <>
        <ol>
          <li>Получите у редактора или админа <b>токен</b> вида <code>CND-XXXX-XXXX</code>. Он выдаётся на ваш ник и действует ограниченное время: часы или дни.</li>
          <li>Введите токен и игровой никнейм точно как в токене, например <code>Имя_Фамилия</code>.</li>
          <li>Приложите скриншот игрового удостоверения CND: перетащите файл, нажмите на поле или вставьте через <kbd>Ctrl</kbd>+<kbd>V</kbd>. Админу удостоверение не нужно.</li>
          <li>В шапке сайта идёт таймер до окончания токена. Когда он дойдёт до нуля, войдите снова с новым токеном.</li>
        </ol>
        <p className="muted small">Загружайте только игровое удостоверение из Minecraft, не настоящие документы.</p>
      </>
    ),
  },
  {
    key: 'editor', title: 'Как сделать работу', body: (
      <ol>
        <li>На главной выберите <b>размер</b> (газетная полоса, пост, сторис) или <b>шаблон</b>.</li>
        <li>Слева вкладки: <b>Шаблоны</b>, <b>Текст</b>, <b>Фото</b>, <b>Элементы</b>, <b>Персонажи</b>, <b>Бренд</b>. Нажмите на нужное, и оно появится на листе.</li>
        <li>Справа настройки выделенного: шрифт, размер, цвет, выравнивание, прозрачность. Ниже список слоёв: глаз скрывает слой, замок закрепляет.</li>
        <li>Текст правится <b>двойным кликом</b>. Фото кладётся в серую рамку: перетащите файл прямо на неё.</li>
        <li>Работа сохраняется сама. Найти её можно на главной в разделе «Мои работы».</li>
        <li>Готово? Нажмите <b>Скачать</b> или <b>Копировать</b> и опубликуйте работу в нужном канале Discord.</li>
      </ol>
    ),
  },
  {
    key: 'chars', title: 'Персонажи и предметы', body: (
      <>
        <div className="help-figure">
          <img src="./help/reporter-mic.png" alt="3D-персонаж с микрофоном" />
          <div>
            <b>Персонаж с предметом в руке</b>
            <p className="small" style={{ margin: '4px 0 0' }}>Как в SkinPreview Maker: выберите позу, предмет и свет, покрутите мышью и вставьте на лист с прозрачным фоном.</p>
          </div>
        </div>
        <ol>
          <li>Откройте вкладку <b>Персонажи</b>. Найдите скин по нику или загрузите файл скина PNG 64×64. Для пробы есть пример «Репортёр CND».</li>
          <li><b>Голова 2D</b> и <b>Персонаж 2D</b> дают плоскую картинку спереди.</li>
          <li><b>Голова 3D</b> — объёмная голова: поверните её мышью и выберите свет.</li>
          <li><b>Персонаж 3D</b>: выберите <b>позу</b> (с микрофоном, машет, указывает, сидит и другие), затем <b>предмет в руке</b>: микрофон, фотокамеру, блокнот, газету, телефон, кофе, меч, кирку или флаг CND. Предмет можно переложить в другую руку.</li>
          <li>Свой предмет: выберите «Свой предмет» и загрузите картинку 16×16, например текстуру предмета из Minecraft. Каждый пиксель станет блоком.</li>
          <li>Свет: Blockbench (ровный), студия, контровой, закат, неон, нуар. Ползунки в «Тонкой настройке» двигают голову, руки и ноги.</li>
          <li>Нажмите <b>Вставить на холст</b>.</li>
        </ol>
      </>
    ),
  },
  {
    key: 'fonts', title: 'Свои шрифты', body: (
      <ol>
        <li>Откройте вкладку <b>Бренд</b> и нажмите «Импорт шрифта».</li>
        <li>Выберите файл <b>TTF, OTF, WOFF или WOFF2</b> до 3 МБ.</li>
        <li>Шрифт сразу появится в списке у всей редакции. Его можно выбрать и справа в настройках текста.</li>
        <li>Удалить свой шрифт можно кнопкой с корзиной рядом с ним.</li>
      </ol>
    ),
  },
  {
    key: 'export', title: 'Скачивание и Discord', body: (
      <ul>
        <li><b>Скачать</b>: PNG для лучшего качества, JPG для лёгкого файла, WEBP. Размер 1× или 2×.</li>
        <li><b>Копировать</b> (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>C</kbd>) кладёт картинку в буфер. Вставьте её в Discord через <kbd>Ctrl</kbd>+<kbd>V</kbd>, скачивать не нужно.</li>
        <li>У редакторов в меню «Скачать» есть <b>отправка в Discord</b>: выберите канал, допишите текст и отправьте.</li>
        <li>На каждую картинку ставится водяной знак CND. Его вид можно выбрать в меню скачивания, если админ разрешил. Убрать знак нельзя.</li>
      </ul>
    ),
  },
  {
    key: 'archive', title: 'Лента архива', body: (
      <ul>
        <li><b>Архив</b> — общая лента готовых работ всей редакции. Открывается кнопкой «Архив» на главной.</li>
        <li>Работа попадает в архив сама, когда вы её скачиваете, копируете или отправляете в Discord. Галочку можно снять в меню «Скачать» или выключить в «Моих настройках».</li>
        <li>Нажмите на карточку, чтобы открыть картинку целиком, скачать или скопировать её.</li>
        <li>Удалить из архива может автор работы, редактор или админ.</li>
      </ul>
    ),
  },
  {
    key: 'settings', title: 'Мои настройки', body: (
      <ul>
        <li>Кнопка с шестерёнкой в шапке открывает <b>Мои настройки</b>.</li>
        <li>Там выбирается тема: светлая, тёмная или как в системе.</li>
        <li>Там же можно <b>выключить автоматическое открытие этой инструкции</b> после входа и подсказки в редакторе.</li>
        <li>Ещё там задаются формат и размер скачивания по умолчанию и добавление работ в архив.</li>
      </ul>
    ),
  },
  {
    key: 'admin', title: 'Админка', body: (
      <ul>
        <li><b>Токены</b>: выдайте токен на ник или групповой токен на собрание. Срок задаётся в часах или днях, есть быстрые кнопки и продление. Код показывается один раз.</li>
        <li><b>Журнал входов</b>: кто и когда вошёл, фото удостоверения, отметка, если один токен вводили с разными никами.</li>
        <li><b>Работы сотрудников</b>: все работы фракции, любую можно открыть.</li>
        <li><b>Экспорты</b>: кто что скачал. «Чья это работа?» читает скрытую метку автора из PNG.</li>
        <li><b>Настройки</b> (только админ): вход, водяной знак, каналы Discord, должности.</li>
      </ul>
    ),
  },
  {
    key: 'keys', title: 'Горячие клавиши', body: (
      <div className="keys">
        <span><kbd>Ctrl</kbd>+<kbd>Z</kbd></span><span>Отменить</span>
        <span><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd></span><span>Повторить</span>
        <span><kbd>Ctrl</kbd>+<kbd>D</kbd></span><span>Дублировать</span>
        <span><kbd>Delete</kbd></span><span>Удалить выделенное</span>
        <span><kbd>Enter</kbd></span><span>Редактировать выделенный текст</span>
        <span><kbd>←↑→↓</kbd></span><span>Сдвиг на 1 px, с <kbd>Shift</kbd> на 10 px</span>
        <span><kbd>Ctrl</kbd>+<kbd>V</kbd></span><span>Вставить скриншот или текст</span>
        <span><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>C</kbd></span><span>Копировать картинку в буфер</span>
        <span><kbd>Esc</kbd></span><span>Снять выделение</span>
        <span><kbd>F1</kbd></span><span>Эта инструкция</span>
      </div>
    ),
  },
];

export function Credit({ className = 'credit' }) {
  return (
    <div className={className}>
      Сайт сделан для {CREDIT.faction} сервера <b>{CREDIT.server}</b> · автор <b>{CREDIT.author}</b>
    </div>
  );
}

export function HelpModal({ onClose, start = 'start' }) {
  const [tab, setTab] = useState(start);
  const [prefs, setPrefs] = usePrefs();
  const sec = SECTIONS.find((s) => s.key === tab) || SECTIONS[0];
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 860 }} role="dialog" aria-label="Инструкция">
        <div className="row" style={{ marginBottom: 14 }}>
          <BookOpen size={22} color="var(--brand)" />
          <h2 className="grow" style={{ margin: 0 }}>Инструкция CND Редактора</h2>
          <button className="icon ghost" onClick={onClose} aria-label="Закрыть"><X size={18} /></button>
        </div>
        <div className="help">
          <nav>{SECTIONS.map((s) => <button key={s.key} className={s.key === tab ? 'on' : ''} onClick={() => setTab(s.key)}>{s.title}</button>)}</nav>
          <article><h3>{sec.title}</h3>{sec.body}</article>
        </div>
        <div className="help-foot">
          <label className="toggle">
            <input type="checkbox" checked={prefs.autoHelp} onChange={(e) => setPrefs({ autoHelp: e.target.checked })} />
            <span className="sw" aria-hidden="true" />
            <span className="grow"><b>Открывать инструкцию после входа</b><span className="small muted">Можно поменять в «Моих настройках»</span></span>
          </label>
          <button className="primary" onClick={onClose}>Понятно</button>
        </div>
        <Credit />
      </div>
    </div>
  );
}

// Кнопка «?» + F1 в любом месте
export function HelpButton({ start }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'F1') { e.preventDefault(); setOpen(true); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <>
      <button className="help-btn" title="Инструкция (F1)" aria-label="Инструкция" onClick={() => setOpen(true)}><BookOpen size={17} /><span className="lbl">Инструкция</span></button>
      {open && createPortal(<HelpModal start={start} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}
