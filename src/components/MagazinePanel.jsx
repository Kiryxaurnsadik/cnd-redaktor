// Если крадёте, то крадите ради реально хороших людей
import { useState } from 'react';
import { BookOpen, Barcode, Hash, ImagePlus, PanelTop, Sparkles } from 'lucide-react';
import { MAG_PAGES, MAG_PRESETS, MAG_STYLES, MONTHS, buildMagazine, magCode, magFonts } from '../lib/magazine.js';
import { fontsReady } from '../lib/textfit.js';
import { barcodeElements } from '../lib/barcode.js';
import { compressImage, uid } from '../lib/util.js';

export default function MagazinePanel({ doc, replaceDoc, add, addAllPages, flash }) {
  const now = new Date();
  const [o, setO] = useState({ style: 'velour', name: 'VELOUR', tagline: MAG_STYLES.velour.tagline, issue: '1', month: now.getMonth(), year: now.getFullYear(), price: '$100', city: 'Калифорния', pages: MAG_PRESETS.velour });
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState(false);
  const [code, setCode] = useState('');
  const set = (p) => setO((x) => ({ ...x, ...p }));
  const pickStyle = (style) => set({ style, name: MAG_STYLES[style].name, tagline: MAG_STYLES[style].tagline, pages: MAG_PRESETS[style] });
  const toggle = (k) => set({ pages: o.pages.includes(k) ? o.pages.filter((x) => x !== k) : [...o.pages, k] });
  const move = (i, d) => { const p = [...o.pages]; const j = i + d; if (j < 0 || j >= p.length) return; [p[i], p[j]] = [p[j], p[i]]; set({ pages: p }); };
  const hasContent = doc.elements.length > 0 || (doc.pages?.length || 0) > 1;

  const loadPhotos = async (files) => {
    setBusy(true);
    try {
      const list = [];
      for (const f of files) if (f.type.startsWith('image/')) list.push(await compressImage(f, 2200, 0.88, f.type === 'image/png' && f.size < 1.5e6 ? 'image/png' : 'image/jpeg'));
      setPhotos((p) => [...p, ...list].slice(0, 60));
    } catch (e) { flash(e.message); }
    setBusy(false);
  };
  const generate = async () => {
    if (!o.pages.length) { flash('Отметьте хотя бы одну страницу'); return; }
    if (hasContent && !armed) { setArmed(true); setTimeout(() => setArmed(false), 4000); return; }
    setArmed(false); setBusy(true);
    await fontsReady(magFonts(o.style));
    setBusy(false);
    const d = buildMagazine({ ...o, photos });
    replaceDoc(d);
    flash(`Журнал готов: ${o.pages.length} стр. Ctrl+Z — вернуть прежний дизайн`);
  };
  const addNumber = () => add({ type: 'text', text: '{nn}', auto: true, fontFamily: 'Montserrat', fontSize: 22, fontStyle: 'bold', fill: '#7A1E2A', width: 120, align: 'right', letterSpacing: 3, lineHeight: 1.2, keep: true, name: 'Номер страницы' });
  const addBarcode = () => {
    const g = uid();
    const els = barcodeElements(code || magCode(o.issue, o.month, o.year), { x: 0, y: 0, width: 260, height: 128, groupId: g });
    add(els.map((e, i) => ({ ...e, dx: e.x, dy: e.y })));
  };
  const addRunning = () => {
    const name = o.name || 'ЖУРНАЛ';
    addAllPages((p, i) => {
      if (i === 0) return p;
      const bg = (p.background || '#ffffff').toLowerCase();
      const dark = /^#([0-3][0-9a-f]){3}$/i.test(bg) || /^#(0|1|2)/.test(bg);
      const ink = dark ? '#F3E9DA' : '#1F1412';
      const W = doc.width, H = doc.height, M = Math.round(W * 0.083);
      const els = [
        { type: 'text', text: name, x: M, y: Math.round(H * 0.043), width: 600, fontFamily: 'Playfair Display', fontSize: Math.round(W * 0.032), fontStyle: 'bold', fill: ink, keep: true, name: 'Колонтитул: название' },
        { type: 'line', x: M, y: Math.round(H * 0.083), points: [0, 0, W - M * 2, 0], stroke: ink, strokeWidth: 2, keep: true, name: 'Колонтитул: линия' },
        { type: 'line', x: M, y: Math.round(H * 0.933), points: [0, 0, W - M * 2, 0], stroke: ink, strokeWidth: 1, opacity: 0.4, keep: true, name: 'Подвал: линия' },
        { type: 'text', text: `${name} · ${MONTHS[o.month]} ${o.year}`.toUpperCase(), x: M, y: Math.round(H * 0.948), width: 900, fontFamily: 'Montserrat', fontSize: 18, fontStyle: 'bold', letterSpacing: 3, fill: ink, keep: true, name: 'Подвал: выпуск' },
        { type: 'text', text: '{nn}', auto: true, x: W - M - 200, y: Math.round(H * 0.948), width: 200, align: 'right', fontFamily: 'Montserrat', fontSize: 20, fontStyle: 'bold', letterSpacing: 3, fill: dark ? '#E0B25A' : '#7A1E2A', keep: true, name: 'Номер страницы' },
      ].map((e) => ({ opacity: 1, rotation: 0, align: 'left', lineHeight: 1.2, letterSpacing: 0, ...e, id: uid() }));
      const clean = p.elements.filter((e) => !/^(Колонтитул|Подвал|Номер страницы)/.test(e.name || ''));
      return { ...p, elements: [...clean, ...els] };
    });
    flash('Колонтитулы и номера добавлены на все страницы, кроме обложки');
  };

  return (
    <>
      <h3><BookOpen size={18} /> Журнал</h3>
      <p className="small muted">Соберите журнал за минуту: выберите стиль и страницы, загрузите фото пачкой — они сами встанут в рамки по порядку. Потом всё можно поменять.</p>

      <label>Стиль</label>
      <div className="mag-styles">
        {Object.entries(MAG_STYLES).map(([k, s]) => (
          <button key={k} className={o.style === k ? 'on' : ''} onClick={() => pickStyle(k)} title={s.label}>
            <span className="mag-sw" style={{ background: s.cover === 'luxe' ? s.coverBg : s.paper }}><b style={{ color: s.cover === 'luxe' ? s.darkInk : s.mastColor, fontFamily: s.mast }}>{s.name.slice(0, 6)}</b><i style={{ background: s.accent }} /><i style={{ background: s.gold }} /></span>
            <span className="small">{s.label.split(' (')[0]}</span>
          </button>
        ))}
      </div>

      <label>Название журнала</label>
      <input value={o.name} onChange={(e) => set({ name: e.target.value.toUpperCase() })} maxLength={14} />
      <label>Подзаголовок</label>
      <input value={o.tagline} onChange={(e) => set({ tagline: e.target.value })} />
      <div className="row" style={{ gap: 8 }}>
        <div className="grow"><label>Номер</label><input value={o.issue} onChange={(e) => set({ issue: e.target.value })} /></div>
        <div className="grow"><label>Месяц</label><select value={o.month} onChange={(e) => set({ month: Number(e.target.value) })}>{MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}</select></div>
        <div style={{ width: 90 }}><label>Год</label><input type="number" value={o.year} onChange={(e) => set({ year: Number(e.target.value) || o.year })} /></div>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <div className="grow"><label>Цена</label><input value={o.price} onChange={(e) => set({ price: e.target.value })} /></div>
        <div className="grow"><label>Город</label><input value={o.city} onChange={(e) => set({ city: e.target.value })} /></div>
      </div>

      <label>Страницы по порядку ({o.pages.length})</label>
      <div className="mag-pages">
        {o.pages.map((k, i) => {
          const p = MAG_PAGES.find((x) => x.key === k);
          return (
            <div key={`${k}-${i}`} className="mag-page on">
              <span className="pg-n">{i + 1}</span><span className="grow">{p?.title}</span>
              <button className="icon ghost small" aria-label="Выше" onClick={() => move(i, -1)}>↑</button>
              <button className="icon ghost small" aria-label="Ниже" onClick={() => move(i, 1)}>↓</button>
              <button className="icon ghost small" aria-label="Убрать" onClick={() => set({ pages: o.pages.filter((_, j) => j !== i) })}>×</button>
            </div>
          );
        })}
      </div>
      <div className="mag-add">
        {MAG_PAGES.map((p) => <button key={p.key} className="small" onClick={() => set({ pages: [...o.pages, p.key] })} title={p.desc}>+ {p.title}</button>)}
      </div>

      <label>Фото для журнала ({photos.length})</label>
      <button style={{ width: '100%' }} disabled={busy} onClick={() => document.getElementById('mag-photos').click()}><ImagePlus size={16} /> {busy ? 'Загружаю…' : 'Загрузить фото пачкой'}</button>
      <input id="mag-photos" type="file" accept="image/*" multiple hidden onChange={(e) => { const f = [...e.target.files]; e.target.value = ''; loadPhotos(f); }} />
      {photos.length > 0 && (
        <>
          <div className="mag-photos">{photos.map((p, i) => <button key={i} style={{ backgroundImage: `url(${p})` }} title="Убрать" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}><span>{i + 1}</span></button>)}</div>
          <p className="small muted">Фото встанут в рамки по порядку: обложка, потом страницы. Нажмите на фото, чтобы убрать его.</p>
        </>
      )}
      <button className="primary" style={{ width: '100%', marginTop: 10 }} disabled={busy} onClick={generate}><Sparkles size={16} /> {busy ? 'Готовлю…' : armed ? 'Заменить текущий дизайн?' : 'Собрать журнал'}</button>

      <h4 className="set-h" style={{ marginTop: 18 }}>Инструменты</h4>
      <button style={{ width: '100%' }} onClick={addNumber}><Hash size={16} /> Номер страницы на лист</button>
      <button style={{ width: '100%', marginTop: 6 }} onClick={addRunning}><PanelTop size={16} /> Колонтитулы и номера на все страницы</button>
      <label>Штрихкод EAN-13 (12 цифр, последняя считается сама)</label>
      <div className="row" style={{ gap: 6 }}>
        <input value={code} placeholder={magCode(o.issue, o.month, o.year)} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 12))} />
        <button onClick={addBarcode} title="Добавить штрихкод"><Barcode size={16} /></button>
      </div>
      <p className="small muted">Новые страницы (кнопка «+» внизу) сами получают колонтитулы и номер. «Дублировать» копирует страницу целиком.</p>
    </>
  );
}
