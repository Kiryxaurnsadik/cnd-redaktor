// Если крадёте, то крадите ради реально хороших людей
import { useEffect, useState } from 'react';
import { api } from '../api/index.js';
import { BRAND, BRAND_COLORS, ADAMS_THANKS } from '../lib/brand.js';
import { FONT_TYPES, deleteFont, importFontFile, useFonts } from '../lib/fonts.js';
import { OFFICIAL_TEMPLATES } from '../lib/templates.js';
import { SKIN_SOURCES, fetchSkinByNick, renderFlatBody, renderHead, validateSkin } from '../lib/skin.js';
import { fileToDataURL } from '../lib/util.js';
import { docThumb } from '../lib/thumb.js';
import { Box, Circle, Contrast, Frame, Image as ImageIcon, Minus, MoreHorizontal, RectangleHorizontal, Search, Square, Trash2, Upload, UserRound } from 'lucide-react';

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

export function PhotosPanel({ addImageFile, uploads, addImage }) {
  return (
    <>
      <h3>Фото и скриншоты</h3>
      <button className="primary" style={{ width: '100%' }} onClick={() => document.getElementById('photo-file').click()}><Upload size={16} /> Загрузить фото</button>
      <input id="photo-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden
        onChange={(e) => { [...e.target.files].forEach((f) => addImageFile(f)); e.target.value = ''; }} />
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

export function CharactersPanel({ addImage, openPoser, embedded }) {
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
    try { localStorage.setItem(SKINS_KEY, JSON.stringify(next)); } catch {}
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
      {embedded ? <div className="el-sec">Свой персонаж по скину</div> : <h3>Персонажи со скинов</h3>}
      <p className="small muted thanks">{ADAMS_THANKS}</p>
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
      <label>Нет скина под рукой? Возьмите пример</label>
      <div className="row">
        <button className="grow small" onClick={() => useSkin('./skins/cnd-reporter.png', 'Репортёр CND')}>Репортёр CND</button>
        <button className="grow small" onClick={() => useSkin('./skins/cnd-guide.png', 'Гид CND')}>Гид CND</button>
      </div>
      {error && <div className="error">{error}</div>}
      {skin && (
        <div className="card" style={{ marginTop: 12, padding: 12 }}>
          <div className="row">
            {preview && <img src={preview} alt="" style={{ width: 56, imageRendering: 'pixelated' }} />}
            <b className="grow">Скин выбран</b>
          </div>
          <button className="add-btn" style={{ marginTop: 10 }} onClick={async () => addImage(await renderHead(skin, 512), { width: 300, height: 300, name: 'Голова' })}><Square size={16} /> Голова 2D</button>
          <button className="add-btn" onClick={async () => addImage(await renderHead(skin, 512, { overlay: false }), { width: 300, height: 300, name: 'Голова без шляпы' })}>Голова без слоя шляпы</button>
          <button className="add-btn" onClick={async () => addImage(await renderFlatBody(skin, 24), { width: 240, height: 480, name: 'Персонаж 2D' })}><ImageIcon size={16} /> Персонаж 2D (спереди)</button>
          <button className="add-btn" onClick={() => openPoser(skin, 'head')}><Box size={16} /> Голова 3D (поворот и свет)…</button>
          <button className="primary" style={{ width: '100%' }} onClick={() => openPoser(skin)}><UserRound size={16} /> Персонаж 3D: поза и свет…</button>
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
      <FontsBlock applyFont={applyFont} />
    </>
  );
}

function FontsBlock({ applyFont }) {
  const { all, custom } = useFonts();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const take = async (file) => {
    if (!file) return;
    setBusy(true); setMsg('');
    try { const name = await importFontFile(file); setMsg(`Шрифт «${name}» добавлен для всей редакции`); applyFont(name, true); }
    catch (e) { setMsg(e.message); }
    setBusy(false);
  };
  return (
    <>
      <label>Шрифты (к выделенному тексту)</label>
      <div className="drop" style={{ padding: 12 }} onClick={() => document.getElementById('font-file').click()}
        onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); take(e.dataTransfer.files[0]); }}>
        <Upload size={18} /><span className="small">{busy ? 'Загружаю…' : 'Импорт шрифта: TTF, OTF, WOFF'}</span>
      </div>
      <input id="font-file" type="file" accept={FONT_TYPES} hidden onChange={(e) => { take(e.target.files[0]); e.target.value = ''; }} />
      {msg && <p className="small muted">{msg}</p>}
      <div style={{ marginTop: 8 }}>
        {all.map((f) => {
          const own = custom.find((c) => c.family === f);
          return (
            <div key={f} className="row" style={{ marginBottom: 6 }}>
              <button className="text-preset grow" style={{ fontFamily: `"${f}"`, marginBottom: 0 }} onClick={() => applyFont(f)}>
                {f}{own && <span className="small muted" style={{ fontFamily: 'Inter' }}>свой · {own.author}</span>}
              </button>
              {own && <button className="icon ghost" title="Удалить шрифт" onClick={() => deleteFont(own.id)}><Trash2 size={14} /></button>}
            </div>
          );
        })}
      </div>
    </>
  );
}

function TplThumb({ t }) {
  const [url, setUrl] = useState(t.thumb || null);
  useEffect(() => { if (!t.thumb) docThumb(t.doc, t.id).then(setUrl).catch(() => {}); }, [t]);
  return <div className="thumb" style={{ backgroundImage: url ? `url(${url})` : 'none' }} />;
}

export function TemplatesPanel({ applyTemplate }) {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  useEffect(() => { api.listTemplates().then(setList).catch(() => {}); }, []);
  const all = [...OFFICIAL_TEMPLATES, ...list].filter((t) => !q || `${t.name} ${t.kind || ''} ${(t.tags || []).join(' ')} ${t.author}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <h3>Шаблоны</h3>
      <div className="search" style={{ maxWidth: 'none' }}><Search size={16} /><input placeholder="Поиск: газета, сторис, розыск…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <p className="small muted">Шаблон заменит текущий дизайн. Передумали — <kbd>Ctrl</kbd>+<kbd>Z</kbd>.</p>
      <div className="tpl-list">
        {all.map((t) => (
          <button key={t.id} className="tpl-item" onClick={() => applyTemplate(t)} title={`${t.name} · ${t.doc.width}×${t.doc.height}`}>
            <TplThumb t={t} />
            <div className="cap"><b>{t.name}</b><div className="muted">{t.official ? 'CND' : t.author}</div></div>
          </button>
        ))}
      </div>
      {!all.length && <p className="muted small">Ничего не нашлось.</p>}
    </>
  );
}
