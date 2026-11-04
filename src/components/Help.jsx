// Инструкция по сайту и подсказки для редактора
import { useEffect, useState } from 'react';
import { BookOpen, HelpCircle, X } from 'lucide-react';
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
          <li>Получите у редактора или админа <b>токен</b> вида <code>CND-XXXX-XXXX</code>. Он выдаётся на ваш ник и действует ограниченное время, обычно 42 часа.</li>
          <li>Введите токен и игровой никнейм в точности как в токене, например <code>Имя_Фамилия</code>.</li>
          <li>Приложите скриншот игрового удостоверения CND: перетащите файл, нажмите на поле или вставьте его через <kbd>Ctrl</kbd>+<kbd>V</kbd>. Админу удостоверение не нужно.</li>
          <li>В шапке сайта виден таймер. Когда он дойдёт до нуля, сайт попросит войти снова с новым токеном.</li>
        </ol>
        <p className="muted small">Загружайте только игровое удостоверение из Minecraft, не настоящие документы.</p>
      </>
    ),
  },
  {
    key: 'editor', title: 'Создание работы', body: (
      <ol>
        <li>На главной выберите размер (газетная полоса, пост, сторис) или готовый шаблон.</li>
        <li>Слева вкладки: <b>Шаблоны</b>, <b>Текст</b>, <b>Фото</b>, <b>Элементы</b>, <b>Персонажи</b>, <b>Бренд</b>. Нажмите на нужное, и оно появится на листе.</li>
        <li>Справа настройки выделенного: шрифт, размер, цвет, выравнивание, прозрачность, а ниже список слоёв.</li>
        <li>Текст правится двойным кликом. Фото кладётся в серую рамку перетаскиванием или кнопкой «Вставить фото сюда».</li>
        <li>Работа сохраняется сама. Найти её можно на главной в разделе «Мои работы».</li>
      </ol>
    ),
  },
  {
    key: 'chars', title: 'Персонажи и головы', body: (
      <ul>
        <li>Во вкладке <b>Персонажи</b> найдите скин по нику или загрузите файл скина PNG 64×64.</li>
        <li><b>Голова 2D</b> и <b>Персонаж 2D</b> — плоская картинка спереди.</li>
        <li><b>Голова 3D</b> — объёмная голова: крутите мышью, выберите свет и вставьте на лист.</li>
        <li><b>Персонаж 3D</b> — готовые позы (с микрофоном, машет, сидит и другие), ползунки для рук и ног, 6 видов света.</li>
        <li>Персонаж вставляется с прозрачным фоном, его можно поставить поверх фото.</li>
      </ul>
    ),
  },
  {
    key: 'export', title: 'Скачивание и Discord', body: (
      <ul>
        <li><b>Скачать</b>: PNG для лучшего качества, JPG для лёгкого файла, WEBP. Размер 1× или 2×.</li>
        <li><b>Копировать</b> (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>C</kbd>) кладёт картинку в буфер. Затем вставьте её в Discord через <kbd>Ctrl</kbd>+<kbd>V</kbd>, скачивать не нужно.</li>
        <li><b>Отправить в Discord</b> (у редакторов) публикует картинку в канал фракции через вебхук.</li>
        <li>На каждую картинку ставится водяной знак CND. Его вид выбирается в меню скачивания, если админ разрешил. Убрать знак нельзя.</li>
        <li>У стажёров работы до одобрения выгружаются с надписью «ЧЕРНОВИК CND».</li>
      </ul>
    ),
  },
  {
    key: 'review', title: 'Проверка работ', body: (
      <ol>
        <li>Стажёр или журналист нажимает <b>На проверку</b>.</li>
        <li>Редактор видит работу в Админке на вкладке «Проверка работ», открывает её и жмёт <b>Одобрить</b> или <b>Вернуть</b>.</li>
        <li>Если подключён Discord, в канал приходит уведомление.</li>
      </ol>
    ),
  },
  {
    key: 'admin', title: 'Админка', body: (
      <ul>
        <li><b>Токены</b>: выдайте токен на ник или групповой токен на собрание. Срок задаётся в часах или днях, есть быстрые кнопки и продление. Код показывается один раз.</li>
        <li><b>Журнал входов</b>: кто и когда вошёл, фото удостоверения, отметка если один токен вводили с разными никами.</li>
        <li><b>Экспорты</b>: кто что скачал. «Чья это работа?» читает скрытую метку автора из PNG.</li>
        <li><b>Настройки</b> (только админ): режим входа, вид водяного знака, Discord-вебхук и события для уведомлений, должности.</li>
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
      <button className="icon" title="Инструкция (F1)" aria-label="Инструкция" onClick={() => setOpen(true)}><HelpCircle size={18} /></button>
      {open && <HelpModal start={start} onClose={() => setOpen(false)} />}
    </>
  );
}
