import { useEffect, useState } from 'react';
import { api } from '../api/index.js';
import { BRAND, BRAND_COLORS, FONTS } from '../lib/brand.js';
import { OFFICIAL_TEMPLATES } from '../lib/templates.js';
import { SKIN_SOURCES, fetchSkinByNick, renderFlatBody, renderHead, validateSkin } from '../lib/skin.js';
import { fileToDataURL } from '../lib/util.js';

export const TEXT_PRESETS = [
  { label: 'Заголовок', el: { text: 'Заголовок', fontFamily: 'Montserrat', fontSize: 96, fontStyle: 'bold', width: 900 } },
  { label: 'Газетный заголовок', el: { text: 'ЗАГОЛОВОК НОВОСТИ', fontFamily: 'Old Standard TT', fontSize: 72, fontStyle: 'bold', width: 1000 } },
  { label: 'Подзаголовок', el: { text: 'Подзаголовок', fontFamily: 'Inter', fontSize: 48, fontStyle: 'bold', width: 800 } },
  { label: 'Текст статьи', el: { text: 'Текст статьи. Двойной клик — редактировать.', fontFamily: 'PT Serif', fontSize: 28, width: 600, align: 'justify', lineHeight: 1.35 } },
  { label: 'Цитата', el: { text: '«Цитата героя материала»', fontFamily: 'Playfair Display', fontSize: 44, fontStyle: 'italic', width: 700 } },
  { label: 'Подпись автора', el: { text: 'Редакция CND · Автор: Имя Фамилия', fontFamily: 'PT Serif', fontSize: 24, width: 600, fill: '#555555' } },
  { label: 'Пиксельный текст', el: { text: 'ТЕКСТ', fontFamily: 'Press Start 2P', fontSize: 40, width: 600 } },
];

export function TextPanel({ add }) {
  return (
    <>
      <h3>Текст</h3>
      {TEXT_PRESETS.map((p) => (
        <button key={p.label} className="text-preset" onClick={() => add({ type: 'text', fill: '#111111', align: 'left', fontStyle: 'normal', lineHeight: 1.2, ...p.el })}
          style={{ fontFamily: p.el.fontFamily, fontWeight: p.el.fontStyle?.includes('bold') ? 700 : 400, fontStyle: p.el.fontStyle?.includes('italic') ? 'italic' : 'normal' }}>
          {p.label}
        </button>
      ))}
      <button className="text-preset" onClick={() => add([
        { type: 'rect', width: 260, height: 72, fill: '#8E1B1B', cornerRadius: 8 },
        { type: 'text', text: 'СРОЧНО', fontFamily: 'Rubik', fontSize: 42, fontStyle: 'bold', fill: '#ffffff', width: 260, align: 'center', dy: 14 },
      ])}>Плашка «СРОЧНО»</button>
    </>
  );
}

export function ElementsPanel({ add }) {
  return (
    <>
      <h3>Элементы</h3>
      <button className="add-btn" onClick={() => add({ type: 'rect', width: 400, height: 250, fill: '#0B7CFC' })}>▭ Прямоугольник</button>
      <button className="add-btn" onClick={() => add({ type: 'rect', width: 400, height: 80, fill: '#03316F', cornerRadius: 40 })}>⬭ Плашка со скруглением</button>
      <button className="add-btn" onClick={() => add({ type: 'ellipse', width: 300, height: 300, fill: '#0B7CFC' })}>● Круг</button>
      <button className="add-btn" onClick={() => add({ type: 'line', points: [0, 0, 600, 0], stroke: '#111111', strokeWidth: 4 })}>— Линия</button>
      <button className="add-btn" onClick={() => add({ type: 'line', points: [0, 0, 600, 0], stroke: '#111111', strokeWidth: 3, dash: true })}>┄ Пунктир</button>
      <button className="add-btn" onClick={() => add({ type: 'placeholder', width: 600, height: 400, fill: '#9aa6b8', label: 'Перетащите фото' })}>🖼 Рамка для фото</button>
      <button className="add-btn" onClick={() => add({ type: 'rect', width: 800, height: 300, fill: '#000000', opacity: 0.5 })}>▒ Затемнение под текст</button>
    </>
  );
}

export function PhotosPanel({ addImageFile, uploads, addImage }) {
  return (
    <>
      <h3>Фото и скриншоты</h3>
      <button className="primary" style={{ width: '100%' }} onClick={() => document.getElementById('photo-file').click()}>Загрузить фото</button>
      <input id="photo-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden
        onChange={(e) => [...e.target.files].forEach(addImageFile)} />
      <p className="small muted">Можно перетащить файл прямо на холст или нажать Ctrl+V со скриншотом. Если выделена рамка для фото — картинка встанет в неё.</p>
      <div className="thumbs">
        {uploads.map((u, i) => <div key={i} className="t" style={{ backgroundImage: `url(${u})`, imageRendering: 'auto' }} onClick={() => addImage(u)} />)}
      </div>
      <p className="small muted">Импорт PSD, PDF и DOCX появится в следующем этапе.</p>
    </>
  );
}

const SKINS_KEY = 'cnd_recent_skins';
function loadSkins() { try { return JSON.parse(localStorage.getItem(SKINS_KEY)) || []; } catch { return []; } }

export function CharactersPanel({ addImage, openPoser }) {
  const [nick, setNick] = useState('');
  const [source, setSource] = useState('mojang');
  const [skin, setSkin] = useState(null);
  const [recent, setRecent] = useState(loadSkins);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => { if (skin) renderHead(skin, 128).then(setPreview).catch(() => setPreview(null)); }, [skin]);

  const remember = (url, label) => {
    const next = [{ url, label }, ...recent.filter((r) => r.url !== url)].slice(0, 12);
    setRecent(next);
    try { localStorage.setItem(SKINS_KEY, JSON.stringify(next)); } catch { /* мало места */ }
  };
  const useSkin = async (url, label) => {
    setError('');
    try { await validateSkin(url); setSkin(url); remember(url, label); } catch (e) { setError(e.message); }
  };
  const byNick = async () => {
    if (!nick.trim()) return;
    setBusy(true); setError('');
    try { await useSkin(await fetchSkinByNick(nick, source), nick.trim()); } catch (e) { setError(`${e.message}. Загрузите скин файлом.`); }
    setBusy(false);
  };
  const byFile = async (file) => { if (file) useSkin(await fileToDataURL(file), file.name.replace(/\.png$/i, '')); };

  return (
    <>
      <h3>Персонажи со скинов</h3>
      <label>Скин по никнейму</label>
      <div className="row">
        <input value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Никнейм" onKeyDown={(e) => e.key === 'Enter' && byNick()} />
        <button onClick={byNick} disabled={busy}>{busy ? '…' : 'Найти'}</button>
      </div>
      <select style={{ marginTop: 6 }} value={source} onChange={(e) => setSource(e.target.value)}>
        {Object.entries(SKIN_SOURCES).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
      </select>
      <label>Или файлом (PNG 64×64)</label>
      <div className="drop" onClick={() => document.getElementById('skin-file').click()}
        onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); byFile(e.dataTransfer.files[0]); }}>
        Перетащите скин или нажмите
      </div>
      <input id="skin-file" type="file" accept="image/png" hidden onChange={(e) => byFile(e.target.files[0])} />
      {error && <div className="error">{error}</div>}
      {skin && (
        <div className="card" style={{ marginTop: 12, padding: 12 }}>
          <div className="row">
            {preview && <img src={preview} alt="" style={{ width: 56, imageRendering: 'pixelated' }} />}
            <b className="grow">Скин выбран</b>
          </div>
          <button className="add-btn" style={{ marginTop: 10 }} onClick={async () => addImage(await renderHead(skin, 512), { width: 300, height: 300, name: 'Голова' })}>Голова 2D</button>
          <button className="add-btn" onClick={async () => addImage(await renderHead(skin, 512, { overlay: false }), { width: 300, height: 300, name: 'Голова без шляпы' })}>Голова без слоя шляпы</button>
          <button className="add-btn" onClick={async () => addImage(await renderFlatBody(skin, 24), { width: 240, height: 480, name: 'Персонаж 2D' })}>Персонаж 2D (спереди)</button>
          <button className="primary" style={{ width: '100%' }} onClick={() => openPoser(skin)}>3D: поза и свет…</button>
        </div>
      )}
      {!!recent.length && (<>
        <label>Недавние скины</label>
        <div className="thumbs" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {recent.map((r) => <RecentSkin key={r.url} r={r} onClick={() => useSkin(r.url, r.label)} />)}
        </div>
      </>)}
    </>
  );
}

function RecentSkin({ r, onClick }) {
  const [head, setHead] = useState(null);
  useEffect(() => { renderHead(r.url, 64).then(setHead).catch(() => {}); }, [r.url]);
  return <div className="t" title={r.label} onClick={onClick} style={{ backgroundImage: head ? `url(${head})` : 'none' }} />;
}

export function BrandPanel({ addImage, applyColor, applyFont }) {
  const logos = [
    { src: BRAND.horizontal, w: 480, h: 117, label: 'Горизонтальный' },
    { src: BRAND.vertical, w: 360, h: 380, label: 'Вертикальный' },
    { src: BRAND.icon, w: 200, h: 200, label: 'Значок' },
    { src: BRAND.iconWhite, w: 200, h: 200, label: 'Значок белый', dark: true },
  ];
  return (
    <>
      <h3>Бренд CND</h3>
      <label>Логотипы</label>
      <div className="thumbs">
        {logos.map((l) => (
          <div key={l.src} className="t" title={l.label} onClick={() => addImage(l.src, { width: l.w, height: l.h, name: `Логотип: ${l.label}` })}
            style={{ backgroundImage: `url(${l.src})`, backgroundColor: l.dark ? '#03316F' : undefined, backgroundSize: '80%', imageRendering: 'auto' }} />
        ))}
      </div>
      <label>Цвета (применяются к выделенному)</label>
      <div className="swatches">
        {BRAND_COLORS.map((c) => <button key={c.value} className="swatch" title={c.name} style={{ background: c.value }} onClick={() => applyColor(c.value)} />)}
      </div>
      <label>Шрифты (к выделенному тексту)</label>
      {FONTS.map((f) => <button key={f} className="text-preset" style={{ fontFamily: f }} onClick={() => applyFont(f)}>{f}</button>)}
    </>
  );
}

export function TemplatesPanel({ applyTemplate }) {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  useEffect(() => { api.listTemplates().then(setList).catch(() => {}); }, []);
  const all = [...OFFICIAL_TEMPLATES, ...list].filter((t) => !q || `${t.name} ${(t.tags || []).join(' ')} ${t.author}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <h3>Шаблоны</h3>
      <input placeholder="Поиск" value={q} onChange={(e) => setQ(e.target.value)} />
      <div style={{ marginTop: 10 }}>
        {all.map((t) => (
          <button key={t.id} className="text-preset" onClick={() => applyTemplate(t)}>
            <b>{t.name}</b><div className="small muted">{t.official ? 'CND' : t.author} · {t.doc.width}×{t.doc.height}</div>
          </button>
        ))}
      </div>
    </>
  );
}
