import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/index.js';
import TopBar from './TopBar.jsx';
import { OFFICIAL_TEMPLATES, SIZES, blankDoc, withIds } from '../lib/templates.js';
import { docThumb } from '../lib/thumb.js';
import { canManage, formatDate } from '../lib/util.js';

const STATUS = { draft: ['Черновик', ''], review: ['На проверке', 'warn'], approved: ['Одобрено', 'ok'], returned: ['На доработке', 'bad'], published: ['Опубликовано', 'blue'] };
export const statusBadge = (s) => { const [t, c] = STATUS[s] || STATUS.draft; return <span className={`badge ${c}`}>{t}</span>; };

function Thumb({ doc, src, k }) {
  const [url, setUrl] = useState(src || null);
  useEffect(() => { if (!src && doc) docThumb(doc, k).then(setUrl); }, [doc, src, k]);
  return <div className="thumb" style={{ backgroundImage: url ? `url(${url})` : 'none' }} />;
}

export default function Home({ session, logout, left, go }) {
  const [works, setWorks] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('');
  const [error, setError] = useState('');

  const reload = () => {
    api.listWorks().then(setWorks).catch((e) => setError(e.message));
    api.listTemplates().then(setTemplates).catch((e) => setError(e.message));
  };
  useEffect(reload, []);

  const allTemplates = useMemo(() => [...OFFICIAL_TEMPLATES, ...templates], [templates]);
  const kinds = [...new Set(allTemplates.map((t) => t.kind).filter(Boolean))];
  const found = allTemplates.filter((t) => {
    const hay = `${t.name} ${(t.tags || []).join(' ')} ${t.author}`.toLowerCase();
    return (!q || hay.includes(q.toLowerCase())) && (!kind || t.kind === kind);
  });

  const openTemplate = (t) => {
    if (!t.official) api.useTemplate(t.id).catch(() => {});
    go({ name: 'editor', doc: withIds(structuredClone(t.doc)), title: t.name });
  };
  // Удаление в два нажатия: «Удалить» → «Точно удалить?»
  const [armed, setArmed] = useState(null);
  const arm = (id) => { setArmed(id); setTimeout(() => setArmed((a) => (a === id ? null : a)), 4000); };
  const removeWork = async (w) => {
    if (armed !== w.id) { arm(w.id); return; }
    await api.deleteWork(w.id); setArmed(null); reload();
  };
  const removeTemplate = async (t) => {
    if (armed !== t.id) { arm(t.id); return; }
    setArmed(null);
    try { await api.deleteTemplate(t.id); reload(); } catch (e) { setError(e.message); }
  };

  return (
    <>
      <TopBar session={session} left={left} logout={logout}>
        <b>CND Редактор</b>
        {canManage(session.role) && <button onClick={() => go({ name: 'admin' })}>Админка</button>}
      </TopBar>
      <div className="page">
        {error && <div className="error">{error}</div>}
        <div className="section"><h2>Создать</h2></div>
        <div className="grid">
          {SIZES.map((s) => (
            <button key={s.key} className="tile size-tile" onClick={() => go({ name: 'editor', doc: blankDoc(s), title: s.label })}>
              <b>{s.label}</b><div className="muted small">{s.width} × {s.height}</div>
            </button>
          ))}
        </div>

        <div className="section">
          <h2>Шаблоны</h2>
          <input style={{ maxWidth: 320 }} placeholder="Поиск по названию, тегу, автору" value={q} onChange={(e) => setQ(e.target.value)} />
          <select style={{ maxWidth: 180 }} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">Все типы</option>
            {kinds.map((k) => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div className="grid">
          {found.map((t) => (
            <div key={t.id} className="tile" onClick={() => openTemplate(t)}>
              <Thumb doc={t.doc} src={t.thumb} k={t.id} />
              <div className="meta">
                <div className="row"><b className="grow">{t.name}</b>{t.official && <span className="badge blue">CND</span>}</div>
                <div className="muted">{t.official ? 'Официальный' : `Автор: ${t.author} · взяли ${t.uses || 0} раз`}</div>
                {!t.official && (t.author === session.nickname || canManage(session.role)) && (
                  <button className="ghost danger small" onClick={(e) => { e.stopPropagation(); removeTemplate(t); }}>{armed === t.id ? 'Точно удалить?' : 'Удалить'}</button>
                )}
              </div>
            </div>
          ))}
          {!found.length && <p className="muted">Ничего не нашлось.</p>}
        </div>

        <div className="section"><h2>Мои работы</h2></div>
        <div className="grid">
          {works.map((w) => (
            <div key={w.id} className="tile" onClick={() => go({ name: 'editor', workId: w.id })}>
              <Thumb src={w.thumb} />
              <div className="meta">
                <div className="row"><b className="grow">{w.title || 'Без названия'}</b>{statusBadge(w.status)}</div>
                <div className="muted">Изменено {formatDate(w.updatedAt)}</div>
                <button className="ghost danger small" onClick={(e) => { e.stopPropagation(); removeWork(w); }}>{armed === w.id ? 'Точно удалить?' : 'Удалить'}</button>
              </div>
            </div>
          ))}
          {!works.length && <p className="muted">Пока пусто. Начните с шаблона или пустого размера.</p>}
        </div>
      </div>
    </>
  );
}
