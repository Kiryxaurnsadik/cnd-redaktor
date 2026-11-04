// Если крадёте, то крадите ради реально хороших людей
import { useEffect, useState } from 'react';
import {
  AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical, AlignStartHorizontal, AlignStartVertical,
  Bold, BookmarkPlus, CaseSensitive, ChevronDown, ChevronUp, ChevronsDown, ChevronsUp, CopyPlus, Eye, EyeOff, FlipHorizontal2,
  FlipVertical2, Group, Italic, Lock, Move, Ungroup, Upload, RotateCcw, Sparkles, Trash2, Underline, Unlock, Wand2,
} from 'lucide-react';
import { BRAND_COLORS } from '../lib/brand.js';
import { FONT_TYPES, importFontFile, useFonts } from '../lib/fonts.js';
import { CHART_KINDS, FRAMES, TABLE_STYLES } from '../lib/elements.js';
import { FX_DEFAULT, FX_PRESETS } from '../lib/pathscale.js';

function Color({ label, value, onChange }) {
  return (
    <>
      <label>{label}</label>
      <div className="row">
        <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} style={{ width: 52 }} />
        <input value={value || ''} onChange={(e) => onChange(e.target.value)} />
      </div>
      <div className="swatches">
        {BRAND_COLORS.map((c) => <button key={c.value} className="swatch" title={c.name} style={{ background: c.value }} onClick={() => onChange(c.value)} />)}
      </div>
    </>
  );
}

const num = (v) => Math.round(Number(v) * 10) / 10;
const TYPE_NAMES = { text: 'Текст', rect: 'Прямоугольник', ellipse: 'Круг', line: 'Линия', image: 'Картинка', placeholder: 'Рамка для фото', shape: 'Фигура', chart: 'Диаграмма', table: 'Таблица' };

const BLENDS = [
  ['', 'Обычное'], ['multiply', 'Умножение'], ['screen', 'Экран'], ['overlay', 'Перекрытие'], ['darken', 'Затемнение'],
  ['lighten', 'Осветление'], ['color-dodge', 'Осветление основы'], ['color-burn', 'Затемнение основы'], ['soft-light', 'Мягкий свет'],
  ['hard-light', 'Жёсткий свет'], ['difference', 'Разница'], ['hue', 'Цветовой тон'], ['saturation', 'Насыщенность'], ['color', 'Цветность'], ['luminosity', 'Яркость'],
];

function Slider({ label, value, min, max, step = 1, onChange, unit = '' }) {
  return (
    <>
      <label>{label}: {value}{unit}</label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </>
  );
}

const CROP_POS = [['↖', 'Слева сверху'], ['↑', 'Сверху'], ['↗', 'Справа сверху'], ['←', 'Слева'], ['•', 'По центру'], ['→', 'Справа'], ['↙', 'Слева снизу'], ['↓', 'Снизу'], ['↘', 'Справа снизу']];

function CropBox({ el, set, cropping, toggle }) {
  const c = { x: 0.5, y: 0.5, zoom: 1, ...(el.crop || {}) };
  const put = (p) => set({ crop: { ...c, ...p } });
  return (
    <Section title="Какая часть фото видна" open={!!(el.mask || el.clipPath || el.crop)}>
      <div className="crop-grid">
        {CROP_POS.map(([ic, name], i) => {
          const x = (i % 3) / 2, y = Math.floor(i / 3) / 2;
          const on = Math.abs(c.x - x) < 0.01 && Math.abs(c.y - y) < 0.01;
          return <button key={name} className={on ? 'on' : ''} title={name} aria-label={name} onClick={() => put({ x, y })}>{ic}</button>;
        })}
      </div>
      <Slider label="Приблизить" value={Math.round(c.zoom * 100)} min={100} max={400} step={5} unit="%" onChange={(v) => put({ zoom: v / 100 })} />
      <Slider label="Влево ↔ вправо" value={Math.round(c.x * 100)} min={0} max={100} unit="%" onChange={(v) => put({ x: v / 100 })} />
      <Slider label="Вверх ↕ вниз" value={Math.round(c.y * 100)} min={0} max={100} unit="%" onChange={(v) => put({ y: v / 100 })} />
      <div className="row wrap" style={{ marginTop: 8 }}>
        <button className={cropping ? 'primary' : ''} onClick={toggle}><Move size={15} /> {cropping ? 'Готово' : 'Двигать фото пальцем или мышью'}</button>
        <button onClick={() => set({ crop: { x: 0.5, y: 0.5, zoom: 1 } })}>Сбросить</button>
      </div>
      <p className="small muted">Двойной клик или двойное касание по фото тоже включает сдвиг. Выйти — клик мимо фото или Esc.</p>
    </Section>
  );
}

function Section({ title, children, open: initial = false }) {
  const [open, setOpen] = useState(initial);
  return (
    <div className={`psec ${open ? 'open' : ''}`}>
      <button className="psec-head" onClick={() => setOpen((o) => !o)}>{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {title}</button>
      {open && <div className="psec-body">{children}</div>}
    </div>
  );
}

function toHex(c) {
  if (!c) return '#000000';
  if (c.startsWith('#')) return c.length === 4 ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}` : c.slice(0, 7);
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? `#${[m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, '0')).join('')}` : '#000000';
}
function hexToClear(c) {
  const h = toHex(c); return `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},0)`;
}
const isClear = (c) => /rgba\(.*,\s*0\)$/.test(c || '');

export const GRADIENT_PRESETS = [
  { from: '#0B7CFC', to: '#03316F', angle: 90 }, { from: '#ff7a18', to: '#af002d', angle: 45 },
  { from: '#f5d020', to: '#f53803', angle: 135 }, { from: '#00c6ff', to: '#0072ff', angle: 90 },
  { from: '#a18cd1', to: '#fbc2eb', angle: 120 }, { from: '#43e97b', to: '#38f9d7', angle: 90 },
  { from: '#ff0844', mid: '#ffb199', to: '#ffd194', angle: 0 }, { from: '#12c2e9', mid: '#c471ed', to: '#f64f59', angle: 0 },
  { from: '#232526', to: '#414345', angle: 90 }, { from: '#FFD700', mid: '#FFF6B0', to: '#B8860B', angle: 90 },
  { from: '#000000', to: 'rgba(0,0,0,0)', angle: 270 }, { from: '#ffffff', to: 'rgba(255,255,255,0)', angle: 90 },
];
const gcss = (g) => `linear-gradient(${(g.angle || 0) + 90}deg, ${g.from}, ${g.mid ? `${g.mid}, ` : ''}${g.to})`;

function GradientBox({ el, set, label = 'Градиент', field = 'gradient' }) {
  const g = el[field];
  const put = (patch) => set({ [field]: patch && { ...g, ...patch } });
  return (
    <>
      <label className="row" style={{ gap: 8 }}>
        <input type="checkbox" style={{ width: 'auto' }} checked={!!g} onChange={(e) => set({ [field]: e.target.checked ? { type: 'linear', from: toHex(el.fill || el.stroke || el.background || '#0B7CFC'), to: '#03316F', angle: 90 } : undefined })} />
        {label}
      </label>
      {g && (
        <>
          <div className="grad-presets">
            {GRADIENT_PRESETS.map((p, i) => <button key={i} title="Готовый градиент" style={{ background: gcss(p) }} onClick={() => set({ [field]: { type: g.type || 'linear', ...p, mid: p.mid } })} />)}
          </div>
          <div className="seg">
            <button className={g.type !== 'radial' ? 'on' : ''} onClick={() => put({ type: 'linear' })}>Линейный</button>
            <button className={g.type === 'radial' ? 'on' : ''} onClick={() => put({ type: 'radial' })}>Круговой</button>
          </div>
          <div className="three">
            <div><label>Цвет 1</label><input type="color" value={toHex(g.from)} onChange={(e) => put({ from: e.target.value })} /></div>
            <div><label>Середина</label>{g.mid ? <input type="color" value={toHex(g.mid)} onChange={(e) => put({ mid: e.target.value })} /> : <button className="small" style={{ width: '100%', height: 36 }} onClick={() => put({ mid: '#ffffff' })}>+</button>}</div>
            <div><label>Цвет 2</label><input type="color" value={toHex(g.to)} onChange={(e) => put({ to: isClear(g.to) ? hexToClear(e.target.value) : e.target.value })} /></div>
          </div>
          <div className="row wrap" style={{ gap: 10 }}>
            <label className="row" style={{ gap: 6 }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={isClear(g.to)} onChange={(e) => put({ to: e.target.checked ? hexToClear(g.to) : toHex(g.to) })} />
              Конец прозрачный
            </label>
            {g.mid && <button className="small ghost" onClick={() => put({ mid: undefined })}>Убрать середину</button>}
            <button className="small ghost" onClick={() => put({ from: g.to, to: g.from })}>⇄ Поменять</button>
          </div>
          {g.type !== 'radial' && <Slider label="Угол" value={g.angle || 0} min={0} max={360} step={5} unit="°" onChange={(v) => put({ angle: v })} />}
        </>
      )}
    </>
  );
}

function EffectsBox({ el, set, ctl }) {
  const sh = el.shadow === true ? { color: '#000000', blur: 12, x: 0, y: 0, opacity: 0.6 } : el.shadow;
  const put = (p) => set({ shadow: { ...sh, ...p } });
  return (
    <Section title="Эффекты: тень и наложение">
      <label className="row" style={{ gap: 8 }}>
        <input type="checkbox" style={{ width: 'auto' }} checked={!!sh} onChange={(e) => set({ shadow: e.target.checked ? { color: '#000000', blur: 16, x: 0, y: 6, opacity: 0.45 } : undefined })} />
        Тень
      </label>
      {sh && (
        <>
          <div className="row"><input type="color" value={toHex(sh.color)} onChange={(e) => put({ color: e.target.value })} style={{ width: 52 }} />
            <div className="seg grow">
              <button onClick={() => put({ blur: 4, x: 3, y: 3, opacity: 0.9 })}>Жёсткая</button>
              <button onClick={() => put({ blur: 18, x: 0, y: 8, opacity: 0.45 })}>Мягкая</button>
              <button onClick={() => put({ blur: 30, x: 0, y: 0, opacity: 0.9, color: '#FFD54A' })}>Свечение</button>
            </div>
          </div>
          <Slider label="Размытие" value={sh.blur ?? 12} min={0} max={80} onChange={(v) => put({ blur: v })} />
          <div className="two">
            <div><Slider label="Сдвиг X" value={sh.x || 0} min={-60} max={60} onChange={(v) => put({ x: v })} /></div>
            <div><Slider label="Сдвиг Y" value={sh.y || 0} min={-60} max={60} onChange={(v) => put({ y: v })} /></div>
          </div>
          <Slider label="Плотность" value={Math.round((sh.opacity ?? 0.6) * 100)} min={0} max={100} unit="%" onChange={(v) => put({ opacity: v / 100 })} />
        </>
      )}
      {(ctl?.has('blend') || el.blend) && <><label>Режим наложения</label>
      <select value={el.blend || ''} onChange={(e) => set({ blend: e.target.value || undefined })}>
        {BLENDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select></>}
    </Section>
  );
}

function FiltersBox({ el, set, ctl }) {
  const fx = { ...FX_DEFAULT, ...(el.fx || {}) };
  const put = (p) => set({ fx: { ...(el.fx || {}), ...p } });
  return (
    <Section title="Фильтры и коррекция" open>
      <div className="fx-presets">
        {FX_PRESETS.map((p) => <button key={p.id} className="small" onClick={() => set({ fx: p.id === 'none' ? undefined : { ...p.fx } })}>{p.name}</button>)}
      </div>
      <Slider label="Яркость" value={fx.brightness} min={0} max={200} unit="%" onChange={(v) => put({ brightness: v })} />
      <Slider label="Контраст" value={fx.contrast} min={0} max={200} unit="%" onChange={(v) => put({ contrast: v })} />
      <Slider label="Насыщенность" value={fx.saturate} min={0} max={300} unit="%" onChange={(v) => put({ saturate: v })} />
      {ctl?.has('fxFull') ? <>
      <Slider label="Оттенок" value={fx.hue} min={-180} max={180} unit="°" onChange={(v) => put({ hue: v })} />
      <Slider label="Размытие" value={fx.blur} min={0} max={20} step={0.5} unit=" px" onChange={(v) => put({ blur: v })} />
      <Slider label="Ч/Б" value={fx.grayscale} min={0} max={100} unit="%" onChange={(v) => put({ grayscale: v })} />
      <Slider label="Сепия" value={fx.sepia} min={0} max={100} unit="%" onChange={(v) => put({ sepia: v })} />
      <Slider label="Негатив" value={fx.invert} min={0} max={100} unit="%" onChange={(v) => put({ invert: v })} />
      </> : <p className="small muted">Больше ползунков (оттенок, размытие, сепия) — в режиме управления «Photoshop» или «Всё сразу» в «Моих настройках».</p>}
      {el.fx && <button className="small" style={{ marginTop: 8 }} onClick={() => set({ fx: undefined })}><RotateCcw size={14} /> Сбросить фильтры</button>}
    </Section>
  );
}

function DocColors({ actions, ids }) {
  const cols = actions.docColors(ids);
  if (!cols.length) return null;
  return (
    <Section title={ids ? 'Цвета выделенного' : 'Цвета дизайна'} open>
      <p className="small muted" style={{ marginTop: 0 }}>Поменяйте цвет — он заменится везде, где встречается.</p>
      <div className="swatches">
        {cols.map((c) => <input key={c} type="color" className="swatch-input" title={c} defaultValue={c} onChange={(e) => actions.replaceColor(c, e.target.value.toLowerCase(), ids)} />)}
      </div>
    </Section>
  );
}

function MultiPanel({ doc, ids, actions, ctl }) {
  const [gap, setGap] = useState(24);
  const [cross, setCross] = useState('start');
  const els = doc.elements.filter((e) => ids.includes(e.id));
  const grouped = els.some((e) => e.groupId);
  const op = Math.round((els.reduce((a, e) => a + (e.opacity ?? 1), 0) / els.length) * 100);
  return (
    <>
      <div className="row"><h3 className="grow" style={{ margin: 0 }}>Выбрано: {ids.length}</h3>
        <button className="small" title="Дублировать" onClick={actions.duplicateSel}><CopyPlus size={15} /></button>
        <button className="small danger" title="Удалить" onClick={actions.removeSel}><Trash2 size={15} /></button>
      </div>
      <div className="row wrap" style={{ marginTop: 8 }}>
        <button className="small" onClick={actions.group}><Group size={15} /> Сгруппировать</button>
        {grouped && <button className="small" onClick={actions.ungroup}><Ungroup size={15} /> Разгруппировать</button>}
      </div>
      <label>Выровнять между собой</label>
      <div className="row wrap align-row">
        <button title="По левому краю" onClick={() => actions.alignSel('left')}><AlignStartVertical size={15} /></button>
        <button title="По центру" onClick={() => actions.alignSel('hcenter')}><AlignCenterVertical size={15} /></button>
        <button title="По правому краю" onClick={() => actions.alignSel('right')}><AlignEndVertical size={15} /></button>
        <button title="По верху" onClick={() => actions.alignSel('top')}><AlignStartHorizontal size={15} /></button>
        <button title="По середине" onClick={() => actions.alignSel('vcenter')}><AlignCenterHorizontal size={15} /></button>
        <button title="По низу" onClick={() => actions.alignSel('bottom')}><AlignEndHorizontal size={15} /></button>
      </div>
      {ctl?.has('distribute') && (<div className="row wrap" style={{ marginTop: 6 }}>
        <button className="small" onClick={() => actions.distribute('h')}>↔ Равные промежутки</button>
        <button className="small" onClick={() => actions.distribute('v')}>↕ Равные промежутки</button>
      </div>)}
      {ctl?.has('autoLayout') && (
        <Section title="Автораскладка (как в Figma)" open>
          <Slider label="Отступ" value={gap} min={0} max={200} unit=" px" onChange={setGap} />
          <div className="seg" style={{ marginTop: 6 }}>
            {[['start', 'К началу'], ['center', 'По центру'], ['end', 'К концу']].map(([k, l]) => <button key={k} className={cross === k ? 'on' : ''} onClick={() => setCross(k)}>{l}</button>)}
          </div>
          <div className="row wrap" style={{ marginTop: 8 }}>
            <button className="small" onClick={() => actions.autoLayout('row', gap, cross)}>→ В ряд</button>
            <button className="small" onClick={() => actions.autoLayout('column', gap, cross)}>↓ В колонку</button>
            {ctl?.has('tidy') && <button className="small" onClick={() => actions.tidy(gap)}>▦ Навести порядок</button>}
          </div>
        </Section>
      )}
      <Slider label="Прозрачность всех" value={op} min={0} max={100} unit="%" onChange={(v) => actions.setForSel({ opacity: v / 100 })} />
      <div className="row wrap" style={{ marginTop: 8 }}>
        <button className="small" onClick={() => actions.setForSel({ locked: true })}><Lock size={14} /> Закрепить</button>
        <button className="small" onClick={() => actions.setForSel({ locked: false })}><Unlock size={14} /> Открепить</button>
        <button className="small" onClick={actions.pasteStyle} title="Ctrl+Alt+V">Вставить стиль</button>
      </div>
      {ctl?.has('selColors') && <DocColors actions={actions} ids={ids} />}
      <p className="small muted">Тяните любой из выбранных — двигаются все. Shift+клик убирает элемент из выбора.</p>
    </>
  );
}

function parseChart(t) {
  return t.split('\n').map((ln) => {
    const m = ln.match(/^(.*?)[:;=\t]\s*(-?[\d.,]+)\s*%?\s*$/);
    return m ? { label: m[1].trim(), value: Number(m[2].replace(',', '.')) } : null;
  }).filter(Boolean);
}

function ChartBox({ el, set }) {
  const [text, setText] = useState('');
  useEffect(() => { setText((el.data || []).map((d) => `${d.label}: ${d.value}`).join('\n')); }, [el.id]);
  const apply = (t) => { setText(t); const data = parseChart(t); if (data.length) set({ data }); };
  const n = Math.max(1, Math.min(8, (el.data || []).length));
  return (
    <>
      <label>Вид</label>
      <select value={el.kind} onChange={(e) => set({ kind: e.target.value })}>
        {Object.entries(CHART_KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
      <label>Данные: «подпись: число», по строке на значение</label>
      <textarea rows={6} value={text} onChange={(e) => apply(e.target.value)} />
      <label>Цвета</label>
      <div className="row wrap">
        {(el.colors || []).slice(0, n).map((c, i) => (
          <input key={i} type="color" value={c} style={{ width: 38 }} onChange={(e) => { const colors = [...el.colors]; colors[i] = e.target.value; set({ colors }); }} />
        ))}
      </div>
      <div className="two">
        <div><label>Текст</label><input type="color" value={el.textColor || '#111111'} onChange={(e) => set({ textColor: e.target.value })} /></div>
        <div><label>Размер текста</label><input type="number" value={el.fontSize || 22} onChange={(e) => set({ fontSize: Number(e.target.value) })} /></div>
      </div>
      <label className="row" style={{ gap: 8 }}><input type="checkbox" style={{ width: 'auto' }} checked={!!el.showValues} onChange={(e) => set({ showValues: e.target.checked })} /> Показывать числа</label>
      <label className="row" style={{ gap: 8 }}><input type="checkbox" style={{ width: 'auto' }} checked={!!el.showLabels} onChange={(e) => set({ showLabels: e.target.checked })} /> Показывать подписи</label>
      <label className="row" style={{ gap: 8 }}><input type="checkbox" style={{ width: 'auto' }} checked={!!el.background} onChange={(e) => set({ background: e.target.checked ? '#FFFFFF' : undefined })} /> Подложка</label>
      {el.background && <input type="color" value={el.background} onChange={(e) => set({ background: e.target.value })} style={{ width: 52 }} />}
    </>
  );
}

function TableBox({ el, set }) {
  const rows = el.cells || [[]]; const cols = Math.max(1, ...rows.map((r) => r.length));
  const [text, setText] = useState('');
  useEffect(() => { setText(rows.map((r) => r.join(' | ')).join('\n')); }, [el.id, rows.length, cols]);
  const apply = (t) => { setText(t); set({ cells: t.split('\n').map((r) => r.split(/\s*[|\t]\s*/)) }); };
  const resize = (dr, dc) => {
    let next = rows.map((r) => [...r]);
    if (dr > 0) next.push(Array(cols).fill(''));
    if (dr < 0 && next.length > 1) next.pop();
    if (dc > 0) next = next.map((r) => [...r, '']);
    if (dc < 0 && cols > 1) next = next.map((r) => r.slice(0, cols - 1));
    set({ cells: next, height: (el.height / rows.length) * next.length });
  };
  return (
    <>
      <label>Ячейки: строка на ряд, столбцы через «|»</label>
      <textarea rows={6} value={text} onChange={(e) => apply(e.target.value)} style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }} />
      <div className="row wrap">
        <button className="small" onClick={() => resize(1, 0)}>+ ряд</button><button className="small" onClick={() => resize(-1, 0)}>− ряд</button>
        <button className="small" onClick={() => resize(0, 1)}>+ столбец</button><button className="small" onClick={() => resize(0, -1)}>− столбец</button>
      </div>
      <label>Стиль</label>
      <select value={el.style || ''} onChange={(e) => { const st = TABLE_STYLES[e.target.value]; if (st) { const { label: _l, ...colors } = st; set({ style: e.target.value, ...colors }); } }}>
        {Object.entries(TABLE_STYLES).map(([k, st]) => <option key={k} value={k}>{st.label}</option>)}
      </select>
      <div className="two">
        <div><label>Шапка</label><input type="color" value={el.head} onChange={(e) => set({ head: e.target.value })} /></div>
        <div><label>Линии</label><input type="color" value={el.line} onChange={(e) => set({ line: e.target.value })} /></div>
        <div><label>Ряды</label><input type="color" value={el.row} onChange={(e) => set({ row: e.target.value })} /></div>
        <div><label>Через ряд</label><input type="color" value={el.alt} onChange={(e) => set({ alt: e.target.value })} /></div>
        <div><label>Текст</label><input type="color" value={el.text} onChange={(e) => set({ text: e.target.value })} /></div>
        <div><label>Размер текста</label><input type="number" value={el.fontSize || 24} onChange={(e) => set({ fontSize: Number(e.target.value) })} /></div>
      </div>
      <label className="row" style={{ gap: 8 }}><input type="checkbox" style={{ width: 'auto' }} checked={!!el.header} onChange={(e) => set({ header: e.target.checked })} /> Первый ряд — шапка</label>
    </>
  );
}

function FrameStroke({ el, set }) {
  return (
    <>
      <label className="row" style={{ gap: 8 }}>
        <input type="checkbox" style={{ width: 'auto' }} checked={!!el.frameStroke} onChange={(e) => set({ frameStroke: e.target.checked ? '#F2C98A' : undefined, frameStrokeWidth: el.frameStrokeWidth || 6 })} />
        Обводка рамки по форме
      </label>
      {el.frameStroke && (
        <div className="row"><input type="color" value={toHex(el.frameStroke)} onChange={(e) => set({ frameStroke: e.target.value })} style={{ width: 52 }} />
          <input type="range" min="1" max="30" value={el.frameStrokeWidth || 6} onChange={(e) => set({ frameStrokeWidth: Number(e.target.value) })} /></div>
      )}
    </>
  );
}

function FlipRow({ el, set }) {
  return (
    <div className="row" style={{ marginTop: 8 }}>
      <button className={`small ${el.flipX ? 'primary' : ''}`} title="Отразить по горизонтали" onClick={() => set({ flipX: !el.flipX })}><FlipHorizontal2 size={15} /> Отразить</button>
      <button className={`small ${el.flipY ? 'primary' : ''}`} title="Отразить по вертикали" onClick={() => set({ flipY: !el.flipY })}><FlipVertical2 size={15} /></button>
    </div>
  );
}

export function elName(e) {
  if (e.name) return e.name;
  if (e.type === 'text') return e.text.slice(0, 28) || 'Текст';
  return TYPE_NAMES[e.type] || e.type;
}

export default function PropsPanel({ doc, el, update, updateDoc, actions, select, selectedId, multi, ctl }) {
  const fonts = useFonts().all;
  const [fontBusy, setFontBusy] = useState(false);
  const [fontErr, setFontErr] = useState('');
  const set = (patch) => update(el.id, patch);
  const toggleStyle = (part) => {
    const cur = new Set((el.fontStyle || 'normal').split(' ').filter((x) => x !== 'normal'));
    cur.has(part) ? cur.delete(part) : cur.add(part);
    set({ fontStyle: [...cur].sort().join(' ') || 'normal' });
  };
  return (
    <div className="props">
      {multi && <MultiPanel doc={doc} ids={multi} actions={actions} ctl={ctl} />}
      {!el && !multi && (
        <>
          <h3>Документ</h3>
          <div className="muted small">{doc.width} × {doc.height} px</div>
          <div className="two">
            <div><label>Ширина</label><input type="number" value={doc.width} onChange={(e) => updateDoc({ width: Math.max(50, Number(e.target.value)) })} /></div>
            <div><label>Высота</label><input type="number" value={doc.height} onChange={(e) => updateDoc({ height: Math.max(50, Number(e.target.value)) })} /></div>
          </div>
          <Color label="Фон" value={doc.background} onChange={(v) => updateDoc({ background: v })} />
          <GradientBox el={{ fill: doc.background, gradient: doc.gradient }} set={updateDoc} label="Градиентный фон" />
          {ctl?.has('selColors') && <DocColors actions={actions} />}
          <p className="small muted">Shift+клик или рамка мышью по пустому месту — выбрать несколько элементов.</p>
        </>
      )}
      {el && (
        <>
          <div className="row"><h3 className="grow" style={{ margin: 0 }}>{TYPE_NAMES[el.type]}</h3>
            <button className="small" title="Сохранить в «Элементы редакции»" onClick={actions.saveAsElement}><BookmarkPlus size={15} /></button>
            <button className="small" title="Дублировать (Ctrl+D)" onClick={actions.duplicate}><CopyPlus size={15} /></button>
            <button className="small danger" title="Удалить (Delete)" onClick={actions.remove}><Trash2 size={15} /></button>
          </div>
          {el.type === 'text' && (
            <>
              <label>Текст (двойной клик по тексту — править на холсте)</label>
              <textarea rows={4} value={el.text} onChange={(e) => set({ text: e.target.value })} />
              <label>Шрифт</label>
              <div className="row" style={{ gap: 6 }}>
                <select className="grow" value={el.fontFamily} onChange={(e) => set({ fontFamily: e.target.value })} style={{ fontFamily: el.fontFamily }}>
                  {fonts.map((f) => <option key={f} style={{ fontFamily: f }}>{f}</option>)}
                </select>
                <button className="small" title="Загрузить свой шрифт (TTF, OTF, WOFF)" disabled={fontBusy} onClick={() => document.getElementById('props-font-file').click()}><Upload size={15} /> {fontBusy ? '…' : 'Свой'}</button>
              </div>
              <input id="props-font-file" type="file" accept={FONT_TYPES} hidden onChange={async (e) => {
                const f = e.target.files[0]; e.target.value = ''; if (!f) return;
                setFontBusy(true); setFontErr('');
                try { const name = await importFontFile(f); set({ fontFamily: name }); } catch (er) { setFontErr(er.message || 'Не получилось загрузить шрифт'); }
                setFontBusy(false);
              }} />
              {fontErr && <div className="error">{fontErr}</div>}
              <div className="two">
                <div><label>Размер</label><input type="number" value={num(el.fontSize)} onChange={(e) => set({ fontSize: Number(e.target.value) })} /></div>
                <div><label>Межстрочный</label><input type="number" step="0.05" value={el.lineHeight || 1.2} onChange={(e) => set({ lineHeight: Number(e.target.value) })} /></div>
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <button className={el.fontStyle?.includes('bold') ? 'primary' : ''} onClick={() => toggleStyle('bold')}><Bold size={15} /></button>
                <button className={el.fontStyle?.includes('italic') ? 'primary' : ''} onClick={() => toggleStyle('italic')}><Italic size={15} /></button>
                <button className={el.textDecoration === 'underline' ? 'primary' : ''} onClick={() => set({ textDecoration: el.textDecoration === 'underline' ? '' : 'underline' })}><Underline size={15} /></button>
                <button title="ПРОПИСНЫЕ / строчные" onClick={() => set({ text: el.text === el.text.toUpperCase() ? el.text.toLowerCase() : el.text.toUpperCase() })}><CaseSensitive size={15} /></button>
                <button className={el.shadow ? 'primary' : ''} title="Тень" onClick={() => set({ shadow: !el.shadow })}><Sparkles size={15} /></button>
              </div>
              <label>Выравнивание</label>
              <select value={el.align} onChange={(e) => set({ align: e.target.value })}>
                <option value="left">По левому краю</option><option value="center">По центру</option>
                <option value="right">По правому краю</option><option value="justify">По ширине</option>
              </select>
              <label>Межбуквенный: {el.letterSpacing || 0}</label>
              <input type="range" min="-5" max="30" value={el.letterSpacing || 0} onChange={(e) => set({ letterSpacing: Number(e.target.value) })} />
              <Color label="Цвет текста" value={el.fill} onChange={(v) => set({ fill: v })} />
              <GradientBox el={el} set={set} label="Градиент в буквах" />
              <label className="row" style={{ gap: 8 }}>
                <input type="checkbox" style={{ width: 'auto' }} checked={!!el.textStroke} onChange={(e) => set({ textStroke: e.target.checked ? '#000000' : undefined, textStrokeWidth: 3 })} /> Обводка букв
              </label>
              {el.textStroke && (
                <div className="row"><input type="color" value={el.textStroke} onChange={(e) => set({ textStroke: e.target.value })} style={{ width: 52 }} />
                  <input type="range" min="1" max="20" value={el.textStrokeWidth || 3} onChange={(e) => set({ textStrokeWidth: Number(e.target.value) })} /></div>
              )}
            </>
          )}
          {['rect', 'ellipse', 'placeholder'].includes(el.type) && (
            <>
              <Color label="Заливка" value={el.fill} onChange={(v) => set({ fill: v })} />
              <GradientBox el={el} set={set} />
              {el.type === 'placeholder' && (<><label>Форма рамки</label>
                <select value={el.clipPath ? '__own' : el.mask || ''} onChange={(e) => e.target.value !== '__own' && set({ mask: e.target.value || undefined, clipPath: undefined, clipVb: undefined })}>
                  {el.clipPath && <option value="__own">Своя форма</option>}
                  {FRAMES.map((f) => <option key={f.id} value={f.mask}>{f.name}</option>)}
                </select>
                <FrameStroke el={el} set={set} /></>)}
              {el.type !== 'ellipse' && (<><label>Скругление</label><input type="number" value={el.cornerRadius || 0} onChange={(e) => set({ cornerRadius: Number(e.target.value) })} /></>)}
              {el.type !== 'placeholder' && (<div className="two">
                <div><label>Обводка</label><input type="color" value={el.stroke || '#000000'} onChange={(e) => set({ stroke: e.target.value })} /></div>
                <div><label>Толщина</label><input type="number" value={el.strokeWidth || 0} onChange={(e) => set({ strokeWidth: Number(e.target.value) })} /></div>
              </div>)}
              {el.type === 'placeholder' && (<><label>Подпись</label><input value={el.label || ''} onChange={(e) => set({ label: e.target.value })} />
                <button className="primary" style={{ marginTop: 10, width: '100%' }} onClick={actions.pickPhotoForPlaceholder}>Вставить фото сюда</button></>)}
            </>
          )}
          {el.type === 'line' && (
            <>
              <Color label="Цвет" value={el.stroke} onChange={(v) => set({ stroke: v })} />
              <label>Толщина</label><input type="number" value={el.strokeWidth} onChange={(e) => set({ strokeWidth: Number(e.target.value) })} />
              <label className="row"><input type="checkbox" style={{ width: 'auto' }} checked={!!el.dash} onChange={(e) => set({ dash: e.target.checked })} /> Пунктир</label>
              <GradientBox el={el} set={set} label="Градиент по линии" />
            </>
          )}
          {el.type === 'shape' && (
            <>
              <Color label={el.outline ? 'Цвет линии' : 'Заливка'} value={el.fill} onChange={(v) => set({ fill: v })} />
              {el.outline
                ? <Slider label="Толщина линии" value={el.strokeWidth || 4} min={1} max={40} onChange={(v) => set({ strokeWidth: v })} />
                : (<>
                  <GradientBox el={el} set={set} />
                  <div className="two">
                    <div><label>Обводка</label><input type="color" value={el.stroke || '#000000'} onChange={(e) => set({ stroke: e.target.value })} /></div>
                    <div><label>Толщина</label><input type="number" value={el.strokeWidth || 0} onChange={(e) => set({ strokeWidth: Number(e.target.value) })} /></div>
                  </div>
                </>)}
              <FlipRow el={el} set={set} />
              <label className="row" style={{ gap: 8 }}><input type="checkbox" style={{ width: 'auto' }} checked={!!el.keepRatio} onChange={(e) => set({ keepRatio: e.target.checked })} /> Сохранять пропорции</label>
              {!el.outline && (
                <div className="row wrap" style={{ marginTop: 8 }}>
                  <button className="primary small" onClick={actions.pickPhotoForPlaceholder}>Вставить фото в фигуру</button>
                  <button className="small" onClick={actions.toFrame}>Сделать рамкой</button>
                </div>
              )}
            </>
          )}
          {el.type === 'chart' && <ChartBox el={el} set={set} />}
          {el.type === 'table' && <TableBox el={el} set={set} />}
          {el.type === 'image' && (
            <>
              <CropBox el={el} set={set} cropping={actions.cropping} toggle={actions.toggleCrop} />
              <FlipRow el={el} set={set} />
              <label>Обрезать по форме</label>
              <select value={el.clipPath ? '__own' : el.mask || ''} onChange={(e) => e.target.value !== '__own' && set({ mask: e.target.value || undefined, clipPath: undefined, clipVb: undefined })}>
                {el.clipPath && <option value="__own">Своя форма</option>}
                {FRAMES.map((f) => <option key={f.id} value={f.mask}>{f.name}</option>)}
              </select>
              <FrameStroke el={el} set={set} />
              {(el.mask || el.clipPath) && (
                <div className="row wrap" style={{ marginTop: 8 }}>
                  <button className="small" onClick={actions.pickPhotoForPlaceholder}>Заменить фото</button>
                  <button className="small" onClick={actions.toFrame}>Убрать фото, оставить рамку</button>
                </div>
              )}

              {!el.mask && <Slider label="Скругление углов" value={el.cornerRadius || 0} min={0} max={Math.round(Math.min(el.width, el.height) / 2)} onChange={(v) => set({ cornerRadius: v })} />}
              <div className="two">
                <div><label>Рамка</label><input type="color" value={el.stroke || '#ffffff'} onChange={(e) => set({ stroke: e.target.value, strokeWidth: el.strokeWidth || 8 })} /></div>
                <div><label>Толщина</label><input type="number" value={el.strokeWidth || 0} onChange={(e) => set({ strokeWidth: Number(e.target.value), stroke: el.stroke || '#ffffff' })} /></div>
              </div>
              <FiltersBox el={el} set={set} ctl={ctl} />
            </>
          )}
          {el.type === 'image' && (
            <div className="row wrap" style={{ marginTop: 8 }}>
              <button onClick={actions.fitImage}>Растянуть на холст</button>
              <button onClick={actions.resetRatio}>Исходные пропорции</button>
              <button onClick={() => actions.imageTool('bg')}><Wand2 size={15} /> Убрать фон</button>
              <button onClick={() => actions.imageTool('upscale')}><Sparkles size={15} /> Улучшить качество</button>
              {el.origSrc && <button onClick={actions.restoreImage}><RotateCcw size={15} /> Вернуть оригинал</button>}
            </div>
          )}
          <div className="two">
            <div><label>X</label><input type="number" value={num(el.x)} onChange={(e) => set({ x: Number(e.target.value) })} /></div>
            <div><label>Y</label><input type="number" value={num(el.y)} onChange={(e) => set({ y: Number(e.target.value) })} /></div>
            {el.type !== 'line' && <div><label>Ширина</label><input type="number" value={num(el.width)} onChange={(e) => set({ width: Number(e.target.value) })} /></div>}
            {!['text', 'line'].includes(el.type) && <div><label>Высота</label><input type="number" value={num(el.height)} onChange={(e) => set({ height: Number(e.target.value) })} /></div>}
            <div><label>Поворот</label><input type="number" value={num(el.rotation || 0)} onChange={(e) => set({ rotation: Number(e.target.value) })} /></div>
          </div>
          {el.type !== 'placeholder' && <EffectsBox el={el} set={set} ctl={ctl} />}
          <label>Выровнять на листе</label>
          <div className="row wrap align-row">
            <button className="small" title="По левому краю" onClick={() => actions.align('left')}><AlignStartVertical size={15} /></button>
            <button className="small" title="По центру по горизонтали" onClick={() => actions.align('hcenter')}><AlignCenterVertical size={15} /></button>
            <button className="small" title="По правому краю" onClick={() => actions.align('right')}><AlignEndVertical size={15} /></button>
            <button className="small" title="По верху" onClick={() => actions.align('top')}><AlignStartHorizontal size={15} /></button>
            <button className="small" title="По центру по вертикали" onClick={() => actions.align('vcenter')}><AlignCenterHorizontal size={15} /></button>
            <button className="small" title="По низу" onClick={() => actions.align('bottom')}><AlignEndHorizontal size={15} /></button>
          </div>
          <label>Прозрачность: {Math.round((el.opacity ?? 1) * 100)}%</label>
          <input type="range" min="0" max="1" step="0.05" value={el.opacity ?? 1} onChange={(e) => set({ opacity: Number(e.target.value) })} />
          <div className="row wrap" style={{ marginTop: 10 }}>
            <button className="small" title="На передний план" onClick={() => actions.order('top')}><ChevronsUp size={15} /></button>
            <button className="small" title="Выше на слой" onClick={() => actions.order('up')}><ChevronUp size={15} /></button>
            <button className="small" title="Ниже на слой" onClick={() => actions.order('down')}><ChevronDown size={15} /></button>
            <button className="small" title="На задний план" onClick={() => actions.order('bottom')}><ChevronsDown size={15} /></button>
            <button className="small" title="Выровнять по центру листа" onClick={() => actions.center()}><AlignCenterHorizontal size={15} /> В центр</button>

          </div>
        </>
      )}
      <h3 style={{ marginTop: 20 }}>Слои</h3>
      {[...doc.elements].reverse().map((e) => (
        <div key={e.id} className={`layer ${e.id === selectedId ? 'sel' : ''}`} onClick={() => select(e.id)}>
          <span className="name" style={{ opacity: e.visible === false ? 0.4 : 1 }}>{elName(e)}</span>
          <button title="Показать/скрыть" onClick={(ev) => { ev.stopPropagation(); update(e.id, { visible: e.visible === false }); }}>{e.visible === false ? <EyeOff size={14} /> : <Eye size={14} />}</button>
          <button title="Закрепить" onClick={(ev) => { ev.stopPropagation(); update(e.id, { locked: !e.locked }); }}>{e.locked ? <Lock size={14} /> : <Unlock size={14} />}</button>
        </div>
      ))}
      {!doc.elements.length && <p className="muted small">Добавьте текст, фото или элементы слева.</p>}
    </div>
  );
}
