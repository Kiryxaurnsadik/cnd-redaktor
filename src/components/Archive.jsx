// Если крадёте, то крадите ради реально хороших людей
import { useEffect, useRef, useState } from 'react';
import { Archive as ArchiveIcon, ArrowLeft, Copy, Download, Heart, Pencil, Pin, PinOff, Search, Trash2, X } from 'lucide-react';
import { api } from '../api/index.js';
import TopBar from './TopBar.jsx';
import { can, formatDate } from '../lib/util.js';

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

export function LikeButton({ kind, item, onChange, flash, big }) {
  const [busy, setBusy] = useState(false);
  const toggle = async (e) => {
    e.stopPropagation(); if (busy) return;
    const on = !item.liked;
    onChange({ liked: on, likes: Math.max(0, (item.likes || 0) + (on ? 1 : -1)) });
    setBusy(true);
    try { onChange(await api.like(kind, item.id, on)); } catch (err) { onChange({ liked: item.liked, likes: item.likes }); flash?.(err.message); }
    setBusy(false);
  };
  return (
    <button className={`like-btn${item.liked ? ' on' : ''}${big ? '' : ' small'}`} onClick={toggle} title={item.liked ? 'Убрать лайк' : 'Нравится'} aria-pressed={!!item.liked}>
      <Heart size={big ? 16 : 14} fill={item.liked ? 'currentColor' : 'none'} /> {item.likes || 0}
    </button>
  );
}

export function PinButton({ kind, item, session, onChange, flash, big }) {
  if (!can(session, 'pin')) return null;
  const toggle = async (e) => {
    e.stopPropagation();
    const on = !item.pinned;
    try { await api.pin(kind, item.id, on); onChange({ pinned: on }); flash?.(on ? 'Закреплено наверху' : 'Откреплено'); } catch (err) { flash?.(err.message); }
  };
  return (
    <button className={`pin-btn${item.pinned ? ' on' : ''}${big ? '' : ' small'}`} onClick={toggle} title={item.pinned ? 'Открепить' : 'Закрепить наверху'}>
      {item.pinned ? <PinOff size={big ? 16 : 14} /> : <Pin size={big ? 16 : 14} />}{big && (item.pinned ? ' Открепить' : ' Закрепить')}
    </button>
  );
}

export function ArchiveCard({ a, onOpen, session, onChange, flash }) {
  return (
    <div className={`tile arch-tile${a.pinned ? ' pinned' : ''}`} role="button" tabIndex={0} onClick={() => onOpen(a)} onKeyDown={(e) => { if (e.key === 'Enter') onOpen(a); }}>
      <div className="thumb" style={{ backgroundImage: a.thumb ? `url(${a.thumb})` : 'none', backgroundSize: 'cover' }}>
        {a.pinned && <span className="pin-badge"><Pin size={12} /> Закреплено</span>}
      </div>
      <div className="meta">
        <b>{a.title || 'Без названия'}</b>
        <div className="muted">{a.author} · {formatDate(a.at)}</div>
        {onChange && (
          <div className="row tile-actions">
            <LikeButton kind="archive" item={a} onChange={onChange} flash={flash} />
            <PinButton kind="archive" item={a} session={session} onChange={onChange} flash={flash} />
          </div>
        )}
      </div>
    </div>
  );
}

export function ArchiveViewer({ item, session, onClose, onDeleted, onChange, go, flash }) {
  const [full, setFull] = useState(null);
  const [armed, setArmed] = useState(false);
  useEffect(() => { api.archiveGet(item.id).then(setFull).catch((e) => flash(e.message)); }, [item.id]);
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const canDelete = item.author === session.nickname || can(session, 'archiveDelete');
  const canEdit = item.workId && (item.author === session.nickname || can(session, 'works'));
  const blob = async () => (await fetch(full.image)).blob();
  const download = async () => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(await blob());
    a.download = `${(item.title || 'cnd').replace(/[\\/:*?"<>|]+/g, '_')}.jpg`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  const copy = () => {
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
          {onChange && <LikeButton kind="archive" item={item} onChange={onChange} flash={flash} big />}
          {onChange && <PinButton kind="archive" item={item} session={session} onChange={onChange} flash={flash} big />}
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
  const patch = (id, p) => {
    setItems((list) => {
      const next = list.map((x) => (x.id === id ? { ...x, ...p } : x));
      return 'pinned' in p ? [...next.filter((x) => x.pinned), ...next.filter((x) => !x.pinned)] : next;
    });
    setOpen((o) => (o && o.id === id ? { ...o, ...p } : o));
  };
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
        <p className="muted small" style={{ marginTop: -4 }}>Здесь все готовые работы редакции. Ставьте лайки понравившимся, закреплённые показываются первыми. Работа попадает сюда, когда её скачивают, копируют или отправляют в Discord с галочкой «Добавить в ленту архива».</p>
        {error && <div className="error">{error}</div>}
        <div className="grid arch-grid">
          {items.map((a) => <ArchiveCard key={a.id} a={a} onOpen={setOpen} session={session} flash={flash} onChange={(p) => patch(a.id, p)} />)}
        </div>
        {!items.length && !error && <p className="muted">В архиве пока пусто.</p>}
        {more && <div style={{ textAlign: 'center', marginTop: 16 }}><button onClick={() => load(false)}>Показать ещё</button></div>}
      </div>
      {open && <ArchiveViewer item={open} session={session} go={go} flash={flash} onChange={(p) => patch(open.id, p)} onClose={() => setOpen(null)} onDeleted={(id) => setItems(items.filter((x) => x.id !== id))} />}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
