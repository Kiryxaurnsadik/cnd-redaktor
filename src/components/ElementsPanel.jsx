// Если крадёте, то крадите ради реально хороших людей
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ChartArea, ChartBar, ChartColumn, ChartLine, ChartPie, Donut, Frame, Gauge, Hexagon, MessageSquare,
  PencilRuler, Search, Shapes, Smile, Sparkles, Spline, Table2, Trash2, Upload, UserRound, FolderHeart, X,
} from 'lucide-react';
import { api } from '../api/index.js';
import {
  BUBBLES, CHART_KINDS, DECOR, FRAMES, ICONS, LINES, PEOPLE, SHAPES, TABLE_STYLES, chartSpec, loadRecent, maskPath,
  parseSvgToShape, polygonPath, pushRecent, shapeSpec, starPath, tableSpec,
} from '../lib/elements.js';
import { renderFlatBody, renderHead } from '../lib/skin.js';
import { CharactersPanel } from './Panels.jsx';
import { compressImage, loadImage } from '../lib/util.js';

const CHART_ICONS = { column: ChartColumn, bar: ChartBar, line: ChartLine, area: ChartArea, pie: ChartPie, donut: Donut, progress: Gauge };

function ShapeSvg({ path, outline, vb, color = 'currentColor' }) {
  const box = vb ? vb.join(' ') : '0 0 100 100';
  return (
    <svg viewBox={box} preserveAspectRatio="xMidYMid meet">
      {outline
        ? <path d={path} fill="none" stroke={color} strokeWidth={vb ? Math.max(vb[2], vb[3]) / 22 : 5} strokeLinecap="round" strokeLinejoin="round" />
        : <path d={path} fill={color} fillRule="evenodd" />}
    </svg>
  );
}

function DecorPreview({ spec }) {
  const s = Array.isArray(spec) ? spec[0] : spec;
  if (s.path) return <ShapeSvg path={s.path} outline={s.outline} color={s.fill} />;
  const g = s.gradient;
  const bg = g ? (g.type === 'radial' ? `radial-gradient(circle, ${g.from}, ${g.to} 70%)` : `linear-gradient(${(g.angle || 0) + 90}deg, ${g.from}, ${g.to})`) : s.fill;
  const ratio = Math.min(1, s.height / s.width);
  return (
    <div className="el-decor" style={{
      background: bg, opacity: s.opacity ?? 1, borderRadius: s.type === 'ellipse' ? '50%' : Math.min(12, s.cornerRadius || 0),
      height: `${Math.max(18, ratio * 80)}%`, border: s.stroke ? `1px solid ${s.stroke}` : 'none',
      boxShadow: s.shadow ? '0 3px 10px rgba(0,0,0,.25)' : 'none', transform: s.rotation ? `rotate(${s.rotation}deg)` : 'none',
    }} />
  );
}

function FramePreview({ mask }) {
  const d = maskPath(mask);
  return (
    <svg viewBox="0 0 100 100">
      {d ? <path d={d} fill="#9aa6b8" fillRule="evenodd" /> : <rect x="4" y="14" width="92" height="72" rx={mask === 'round' ? 12 : 0} fill="#9aa6b8" />}
      <path d="M30 62 L44 46 L54 56 L62 48 L74 62 Z" fill="#fff" opacity=".9" />
      <circle cx="40" cy="38" r="5" fill="#fff" opacity=".9" />
    </svg>
  );
}

function PersonPreview({ p }) {
  const [src, setSrc] = useState(p.src || null);
  useEffect(() => {
    if (p.flat) renderFlatBody(p.skin, 8).then(setSrc).catch(() => {});
    else if (p.head) renderHead(p.skin, 128).then(setSrc).catch(() => {});
  }, [p]);
  return src ? <img src={src} alt="" style={{ imageRendering: p.flat || p.head ? 'pixelated' : 'auto' }} /> : null;
}

function TablePreview({ st }) {
  return (
    <svg viewBox="0 0 100 70">
      {[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => (
        <rect key={`${r}${c}`} x={4 + c * 31} y={4 + r * 16} width="31" height="16" fill={r === 0 ? st.head : r % 2 ? st.row : st.alt} stroke={st.line} strokeWidth="1" />
      )))}
    </svg>
  );
}

const CATS = [
  { id: 'shapes', name: 'Фигуры', Icon: Shapes, color: '#0B7CFC' },
  { id: 'lines', name: 'Линии и стрелки', Icon: Spline, color: '#FF8A00' },
  { id: 'bubbles', name: 'Реплики', Icon: MessageSquare, color: '#8E5CF7' },
  { id: 'icons', name: 'Иконки', Icon: Smile, color: '#2FB36D' },
  { id: 'frames', name: 'Рамки для фото', Icon: Frame, color: '#14B8C4' },
  { id: 'decor', name: 'Градиенты и декор', Icon: Sparkles, color: '#E5484D' },
  { id: 'charts', name: 'Диаграммы', Icon: ChartColumn, color: '#03316F' },
  { id: 'tables', name: 'Таблицы', Icon: Table2, color: '#F5B800' },
  { id: 'people', name: 'Персонажи CND', Icon: UserRound, color: '#0B7CFC' },
  { id: 'mine', name: 'Элементы редакции', Icon: FolderHeart, color: '#E5484D' },
  { id: 'make', name: 'Создать фигуру', Icon: PencilRuler, color: '#2FB36D' },
];

export default function ElementsPanel({ add, addImage, flash, openPoser }) {
  const [cat, setCat] = useState(null);
  const [q, setQ] = useState('');
  const [recent, setRecent] = useState(loadRecent);
  const [mine, setMine] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const loadMine = () => api.listElements?.().then(setMine).catch(() => {});
  useEffect(() => { loadMine(); }, []);
  useEffect(() => { if (cat === 'mine') loadMine(); }, [cat]);

  const items = useMemo(() => {
    const list = [];
    const sh = (arr, c) => arr.forEach((s) => list.push({ key: `${c}:${s.id}`, cat: c, name: s.name, preview: <ShapeSvg path={s.path} outline={s.outline} />, run: () => add(shapeSpec(s)) }));
    sh(SHAPES, 'shapes'); sh(LINES, 'lines'); sh(BUBBLES, 'bubbles'); sh(ICONS, 'icons');
    list.push({ key: 'lines:line', cat: 'lines', name: 'Прямая линия', preview: <svg viewBox="0 0 100 100"><path d="M6 50 H94" stroke="currentColor" strokeWidth="6" strokeLinecap="round" /></svg>, run: () => add({ type: 'line', points: [0, 0, 600, 0], stroke: '#111111', strokeWidth: 4 }) });
    list.push({ key: 'lines:dash', cat: 'lines', name: 'Пунктир', preview: <svg viewBox="0 0 100 100"><path d="M6 50 H94" stroke="currentColor" strokeWidth="6" strokeDasharray="12 8" /></svg>, run: () => add({ type: 'line', points: [0, 0, 600, 0], stroke: '#111111', strokeWidth: 3, dash: true }) });
    FRAMES.forEach((f) => list.push({ key: `frames:${f.id}`, cat: 'frames', name: `Рамка: ${f.name}`, preview: <FramePreview mask={f.mask} />, run: () => add({ type: 'placeholder', width: f.w || 600, height: f.h || 400, fill: '#9aa6b8', label: 'Перетащите фото', mask: f.mask || undefined, frameStroke: f.frameStroke, frameStrokeWidth: f.frameStrokeWidth }) }));
    DECOR.forEach((d) => list.push({ key: `decor:${d.id}`, cat: 'decor', name: d.name, preview: <DecorPreview spec={d.spec} />, run: () => add(structuredClone(d.spec)) }));
    Object.entries(CHART_KINDS).forEach(([k, name]) => { const I = CHART_ICONS[k]; list.push({ key: `charts:${k}`, cat: 'charts', name: `Диаграмма: ${name}`, preview: <I size={34} strokeWidth={1.6} />, run: () => add(chartSpec(k)) }); });
    Object.entries(TABLE_STYLES).forEach(([k, st]) => list.push({ key: `tables:${k}`, cat: 'tables', name: `Таблица: ${st.label}`, preview: <TablePreview st={st} />, run: () => add(tableSpec(4, 3, k)) }));
    PEOPLE.forEach((p) => list.push({
      key: `people:${p.id}`, cat: 'people', name: p.name, preview: <PersonPreview p={p} />, tall: true,
      run: async () => {
        const src = p.flat ? await renderFlatBody(p.skin, 24) : p.head ? await renderHead(p.skin, 512) : p.src;
        addImage(src, { name: p.name, ...(p.w ? { width: p.w, height: p.h } : {}) });
      },
    }));
    mine.forEach((m) => list.push({
      key: `mine:${m.id}`, cat: 'mine', name: m.name, author: m.author, id: m.id,
      preview: m.data?.thumb ? <img src={m.data.thumb} alt="" /> : m.data?.spec?.path ? <ShapeSvg path={m.data.spec.path} vb={m.data.spec.vb} outline={m.data.spec.outline} color={m.data.spec.fill} /> : null,
      run: () => {
        const spec = structuredClone(m.data.spec);
        if (!Array.isArray(spec) && spec.type === 'image') addImage(spec.src, { name: m.name, width: spec.width, height: spec.height });
        else add(spec);
      },
    }));
    return list;
  }, [add, addImage, mine]);

  const use = (it) => { it.run(); setRecent(pushRecent({ key: it.key })); };
  const found = q.trim() ? items.filter((it) => it.name.toLowerCase().includes(q.trim().toLowerCase())) : null;
  const recentItems = recent.map((r) => items.find((it) => it.key === r.key)).filter(Boolean).slice(0, 6);
  const picks = ['shapes:heart', 'icons:pin', 'shapes:star5', 'bubbles:speech', 'charts:column', 'frames:f-circle'].map((k) => items.find((it) => it.key === k)).filter(Boolean);

  const importFile = async (file) => {
    if (!file) return;
    setBusy(true); setErr('');
    try {
      const name = file.name.replace(/\.[a-z0-9]+$/i, '').slice(0, 60) || 'Элемент';
      let spec;
      if (/svg/.test(file.type) || /\.svg$/i.test(file.name)) {
        const text = await file.text();
        spec = parseSvgToShape(text);
        if (!spec) {
          const url = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(text)))}`;
          const img = await loadImage(url);
          const k = Math.min(4, 1200 / Math.max(img.width || 300, img.height || 300));
          const c = document.createElement('canvas'); c.width = Math.round((img.width || 300) * k); c.height = Math.round((img.height || 300) * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          spec = { type: 'image', src: c.toDataURL('image/png'), width: Math.min(500, c.width), height: Math.min(500, c.width) * (c.height / c.width) };
        }
      } else if (file.type.startsWith('image/')) {
        const src = await compressImage(file, 1200, 0.9, file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png');
        const img = await loadImage(src);
        const w = Math.min(500, img.width);
        spec = { type: 'image', src, width: w, height: w * (img.height / img.width) };
      } else throw new Error('Нужен SVG, PNG, JPG или WebP');
      const thumb = spec.type === 'image' ? await compressImage(spec.src, 160, 0.8, 'image/png') : null;
      await api.saveElement({ name, data: { spec, thumb } });
      await loadMine();
      if (spec.type === 'image') addImage(spec.src, { name, width: spec.width, height: spec.height }); else add(spec);
      setCat('mine');
      flash?.(spec.type === 'shape' ? 'SVG стал фигурой: цвет меняется справа' : 'Элемент добавлен для всей редакции');
    } catch (e) { setErr(e.message || 'Не получилось импортировать'); }
    setBusy(false);
  };

  const removeMine = async (it) => {
    try { await api.deleteElement(it.id); loadMine(); } catch (e) { setErr(e.message); }
  };

  const grid = (list, opts = {}) => (
    <div className={`el-grid ${opts.row ? 'row' : ''}`}>
      {list.map((it) => (
        <div key={it.key} className={`el-item ${it.tall ? 'tall' : ''}`} title={it.name}>
          <button className="el-hit" onClick={() => use(it)} aria-label={it.name}>{it.preview}</button>
          {it.cat === 'mine' && <button className="el-del" title="Удалить из элементов редакции" onClick={() => removeMine(it)}><Trash2 size={12} /></button>}
          {opts.names && <span className="el-name">{it.name}</span>}
        </div>
      ))}
    </div>
  );

  const current = CATS.find((c) => c.id === cat);
  return (
    <>
      <h3>Элементы</h3>
      <div className="search" style={{ maxWidth: 'none' }}>
        <Search size={16} />
        <input placeholder="Поиск: звезда, стрелка, телефон…" value={q} onChange={(e) => setQ(e.target.value)} />
        {q && <button className="icon ghost" onClick={() => setQ('')} aria-label="Очистить"><X size={14} /></button>}
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <button className="grow" onClick={() => document.getElementById('el-file').click()} disabled={busy}><Upload size={15} /> {busy ? 'Загружаю…' : 'Импорт: SVG, PNG'}</button>
      </div>
      <input id="el-file" type="file" accept=".svg,image/svg+xml,image/png,image/jpeg,image/webp" hidden onChange={(e) => { importFile(e.target.files[0]); e.target.value = ''; }} />
      {err && <div className="error">{err}</div>}

      {found && (<>{grid(found)}{!found.length && <p className="muted small">Ничего не нашлось.</p>}</>)}

      {!found && current && (
        <>
          <button className="el-back" onClick={() => setCat(null)}><ArrowLeft size={16} /> {current.name}</button>
          {cat === 'make' ? <ShapeMaker add={add} /> : grid(items.filter((it) => it.cat === cat), { names: ['charts', 'tables', 'people', 'mine', 'decor'].includes(cat) })}
          {cat === 'people' && <div className="el-skins"><CharactersPanel addImage={addImage} openPoser={openPoser} embedded /></div>}
          {cat === 'frames' && <p className="small muted">Выделите рамку и перетащите фото на неё — фото обрежется по форме.</p>}
          {cat === 'charts' && <p className="small muted">Цифры и подписи меняются справа, когда диаграмма выделена.</p>}
          {cat === 'mine' && !items.some((it) => it.cat === 'mine') && <p className="small muted">Пока пусто. Импортируйте SVG или PNG, либо выделите что-то на холсте и нажмите «В элементы» справа.</p>}
        </>
      )}

      {!found && !current && (
        <>
          {!!recentItems.length && (<><div className="el-sec">Недавно использованные</div>{grid(recentItems, { row: true })}</>)}
          <div className="el-sec">Рекомендации</div>
          {grid(picks, { row: true })}
          <div className="el-sec">Категории</div>
          <div className="el-cats">
            {CATS.map(({ id, name, Icon, color }) => (
              <button key={id} className="el-cat" onClick={() => setCat(id)}>
                <span className="el-cat-ic" style={{ background: color }}><Icon size={22} color="#fff" /></span>
                <span>{name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function ShapeMaker({ add }) {
  const [sides, setSides] = useState(5);
  const [star, setStar] = useState(true);
  const [inner, setInner] = useState(45);
  const [turn, setTurn] = useState(0);
  const [color, setColor] = useState('#0B7CFC');
  const path = star ? starPath(sides, inner / 100, -90 + turn) : polygonPath(sides, -90 + turn);
  return (
    <div className="shape-maker">
      <div className="shape-maker-view" style={{ color }}><ShapeSvg path={path} /></div>
      <div className="seg" style={{ marginTop: 8 }}>
        <button className={!star ? 'on' : ''} onClick={() => setStar(false)}><Hexagon size={14} /> Многоугольник</button>
        <button className={star ? 'on' : ''} onClick={() => setStar(true)}>★ Звезда</button>
      </div>
      <label>{star ? 'Лучей' : 'Углов'}: {sides}</label>
      <input type="range" min="3" max="24" value={sides} onChange={(e) => setSides(Number(e.target.value))} />
      {star && (<><label>Глубина лучей: {100 - inner}%</label>
        <input type="range" min="10" max="92" value={inner} onChange={(e) => setInner(Number(e.target.value))} /></>)}
      <label>Поворот: {turn}°</label>
      <input type="range" min="0" max="90" value={turn} onChange={(e) => setTurn(Number(e.target.value))} />
      <label>Цвет</label>
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 52 }} />
      <button className="primary" style={{ width: '100%', marginTop: 12 }} onClick={() => add({ type: 'shape', path, width: 320, height: 320, fill: color, name: star ? `Звезда ${sides}` : `Многоугольник ${sides}` })}>Добавить на холст</button>
      <button style={{ width: '100%', marginTop: 8 }} onClick={() => add({ type: 'placeholder', clipPath: path, width: 420, height: 420, fill: '#9aa6b8', label: 'Фото', frameStroke: color, frameStrokeWidth: 6, name: 'Рамка своей формы' })}>Сделать рамкой для фото</button>

    </div>
  );
}
