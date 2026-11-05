// Если крадёте, то крадите ради реально хороших людей
import { useState } from 'react';
import { FileText, ImagePlus, Sparkles } from 'lucide-react';
import { GEN_FORMATS, GEN_THEMES, generateArticle, parseArticle } from '../lib/articlegen.js';
import { fontsReady } from '../lib/textfit.js';
import { compressImage } from '../lib/util.js';

export default function GenPanel({ doc, replaceDoc, flash, author }) {
  const [o, setO] = useState({ text: '', title: '', rubric: 'Новости штата', format: 'paper', theme: 'cnd', author });
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState(false);
  const set = (p) => setO((x) => ({ ...x, ...p }));
  const info = o.text.trim() ? parseArticle(o.text, o.title) : null;
  const loadFile = async (f) => {
    if (!f) return;
    try {
      if (/\.docx$/i.test(f.name)) { const m = await import('mammoth'); const r = await (m.default || m).extractRawText({ arrayBuffer: await f.arrayBuffer() }); set({ text: r.value }); }
      else set({ text: await f.text() });
    } catch (e) { flash(e.message); }
  };
  const loadPhotos = async (files) => {
    setBusy(true);
    try { const list = []; for (const f of files) if (f.type.startsWith('image/')) list.push(await compressImage(f, 2000, 0.88)); setPhotos((p) => [...p, ...list].slice(0, 12)); } catch (e) { flash(e.message); }
    setBusy(false);
  };
  const go = async () => {
    if (!o.text.trim()) { flash('Вставьте текст статьи'); return; }
    const has = doc.elements.length > 0 || (doc.pages?.length || 0) > 1;
    if (has && !armed) { setArmed(true); setTimeout(() => setArmed(false), 4000); return; }
    setArmed(false); setBusy(true);
    await fontsReady(['PT Serif', 'Merriweather', 'Montserrat', 'Inter']);
    try { const d = generateArticle({ ...o, photos }); replaceDoc(d); flash(`Статья собрана: ${d.pages?.length || 1} стр. Ctrl+Z — вернуть прежний дизайн`); } catch (e) { flash(e.message); }
    setBusy(false);
  };
  return (
    <>
      <h3><Sparkles size={18} /> Генератор статьи <span className="badge blue">бета</span></h3>
      <p className="small muted">Вставьте текст и фото — сайт сам найдёт заголовок, лид и цитату в «ёлочках», разложит текст по колонкам и страницам. Всё потом можно поправить.</p>
      <label>Заголовок (можно пусто — возьмём первую строку)</label>
      <input value={o.title} onChange={(e) => set({ title: e.target.value })} />
      <label>Текст статьи</label>
      <textarea rows={9} value={o.text} onChange={(e) => set({ text: e.target.value })} placeholder="Абзацы разделяйте пустой строкой." />
      <button className="small" style={{ marginTop: 4 }} onClick={() => document.getElementById('gen-file').click()}><FileText size={14} /> Из файла .txt или .docx</button>
      <input id="gen-file" type="file" accept=".txt,.md,.docx" hidden onChange={(e) => { loadFile(e.target.files[0]); e.target.value = ''; }} />
      {info && <p className="small muted">Заголовок: «{info.head.slice(0, 60)}» · абзацев: {info.body.length + (info.lead ? 1 : 0)}{info.quote ? ' · цитата найдена' : ''} · {info.minutes} мин чтения</p>}
      <div className="row" style={{ gap: 8 }}>
        <div className="grow"><label>Рубрика</label><input value={o.rubric} onChange={(e) => set({ rubric: e.target.value })} /></div>
        <div className="grow"><label>Автор</label><input value={o.author} onChange={(e) => set({ author: e.target.value })} /></div>
      </div>
      <label>Формат</label>
      <select value={o.format} onChange={(e) => set({ format: e.target.value })}>{Object.entries(GEN_FORMATS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}</select>
      <label>Оформление</label>
      <select value={o.theme} onChange={(e) => set({ theme: e.target.value })}>{Object.entries(GEN_THEMES).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}</select>
      <label>Фото ({photos.length})</label>
      <button style={{ width: '100%' }} disabled={busy} onClick={() => document.getElementById('gen-photos').click()}><ImagePlus size={16} /> Добавить фото</button>
      <input id="gen-photos" type="file" accept="image/*" multiple hidden onChange={(e) => { const f = [...e.target.files]; e.target.value = ''; loadPhotos(f); }} />
      {!!photos.length && <div className="mag-photos">{photos.map((p, i) => <button key={i} style={{ backgroundImage: `url(${p})` }} title="Убрать" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}><span>{i + 1}</span></button>)}</div>}
      <button className="primary" style={{ width: '100%', marginTop: 10 }} disabled={busy} onClick={go}><Sparkles size={16} /> {busy ? 'Собираю…' : armed ? 'Заменить текущий дизайн?' : 'Собрать статью'}</button>
    </>
  );
}
