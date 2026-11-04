// Лента архива: все готовые работы редакции, видна каждому сотруднику CND
import { useEffect, useRef, useState } from 'react';
import { Archive as ArchiveIcon, ArrowLeft, Copy, Download, Pencil, Search, Trash2, X } from 'lucide-react';
import { api } from '../api/index.js';
import TopBar from './TopBar.jsx';
import { canManage, formatDate } from '../lib/util.js';

const PAGE = 40;

export function useArchive(q = '', limit = PAGE) {
  const [items, setItems] = useState([]);
  const [more, setMore] = useState(false);
  const [error, setError] = useState('');
  const load = async (reset = true) => {
    try {
      const before = reset ? null : items[items.length - 1]?.at;
      const list = await api.archiveList({ q, before, limit });
      setItems(reset ? list : [...items, ...list]);
      setMore(list.length === limit);
    } catch (e) { setError(e.message); }
  };
  return { items, more, error, load, setItems };
}

export function ArchiveCard({ a, onOpen }) {
  return (
    <button className="tile arch-tile" onClick={() => onOpen(a)}>
      <div className="thumb" style={{ backgroundImage: a.thumb ? `url(${a.thumb})` : 'none', backgroundSize: 'cover' }} />
      <div className="meta">
        <b>{a.title || 'Без названия'}</b>
        <div className="muted">{a.author} · {formatDate(a.at)}</div>
      </div>
    </button>
  );
}

export function ArchiveViewer({ item, session, onClose, onDeleted, go, flash }) {
  const [full, setFull] = useState(null);
  const [armed, setArmed] = useState(false);
  useEffect(() => { api.archiveGet(item.id).then(setFull).catch((e) => flash(e.message)); }, [item.id]);
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const canDelete = item.author === session.nickname || canManage(session.role);
  const canEdit = item.workId && (item.author === session.nickname || canManage(session.role));
  const blob = async () => (await fetch(full.image)).blob();
  const download = async () => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(await blob());
    a.download = `${(item.title || 'cnd').replace(/[\\/:*?"<>|]+/g, '_')}.jpg`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  const copy = () => {
    // Буфер принимает только PNG: перекодируем JPEG из архива
    const png = blob().then((b) => createImageBitmap(b)).then((bmp) => {
      const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
      c.getContext('2d').drawImage(bmp, 0, 0);
      return new Promise((r) => c.toBlob(r, 'image/png'));
    });
    navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
      .then(() => flash('Картинка скопирована')).catch(() => flash('Не удалось скопировать, скачайте файл'));
  };
  const remove = async () => {
    if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 4000); return; }
    try { await api.archiveDelete(item.id); onDeleted(item.id); onClose(); flash('Удалено из архива'); } catch (e) { flash(e.message); }
  };
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal arch-view">
        <div className="row wrap" style={{ marginBottom: 12 }}>
          <div className="grow">
            <h2 style={{ margin: 0 }}>{item.title || 'Без названия'}</h2>
            <div className="muted small">Автор: {item.author} · {formatDate(item.at)}{item.width ? ` · ${item.width}×${item.height}` : ''}</div>
          </div>
          <button onClick={download} disabled={!full}><Download size={16} /> Скачать</button>
          <button onClick={copy} disabled={!full}><Copy size={16} /> Копировать</button>
          {canEdit && <button onClick={() => go({ name: 'editor', workId: item.workId })}><Pencil size={16} /> Открыть в редакторе</button>}
          {canDelete && <button className="danger" onClick={remove}><Trash2 size={16} /> {armed ? 'Точно удалить?' : 'Удалить'}</button>}
          <button className="icon ghost" onClick={onClose} aria-label="Закрыть"><X size={18} /></button>
        </div>
        <div className="arch-img">{full ? <img src={full.image} alt={item.title} /> : <img src={item.thumb} alt="" style={{ filter: 'blur(2px)' }} />}</div>
      </div>
    </div>
  );
}

export default function ArchivePage({ session, logout, go }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const [toast, setToast] = useState('');
  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };
  const { items, more, error, load, setItems } = useArchive(q);
  const t = useRef(null);
  useEffect(() => { clearTimeout(t.current); t.current = setTimeout(() => load(true), 250); }, [q]);
  return (
    <>
      <TopBar session={session} logout={logout} help="archive">
        <button onClick={() => go({ name: 'home' })}><ArrowLeft size={16} /> К работам</button>
        <span className="brand-name">Архив CND</span>
      </TopBar>
      <div className="page">
        <div className="section" style={{ marginTop: 6 }}>
          <h2><ArchiveIcon size={20} /> Лента архива</h2>
          <div className="search"><Search size={16} /><input placeholder="Поиск по названию или автору" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        </div>
        <p className="muted small" style={{ marginTop: -4 }}>Здесь все готовые работы редакции. Работа попадает сюда, когда её скачивают, копируют или отправляют в Discord с галочкой «Добавить в ленту архива».</p>
        {error && <div className="error">{error}</div>}
        <div className="grid arch-grid">
          {items.map((a) => <ArchiveCard key={a.id} a={a} onOpen={setOpen} />)}
        </div>
        {!items.length && !error && <p className="muted">В архиве пока пусто.</p>}
        {more && <div style={{ textAlign: 'center', marginTop: 16 }}><button onClick={() => load(false)}>Показать ещё</button></div>}
      </div>
      {open && <ArchiveViewer item={open} session={session} go={go} flash={flash} onClose={() => setOpen(null)} onDeleted={(id) => setItems(items.filter((x) => x.id !== id))} />}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
