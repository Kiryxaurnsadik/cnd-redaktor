// Если крадёте, то крадите ради реально хороших людей
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/index.js';
import TopBar from './TopBar.jsx';
import Countdown from './Countdown.jsx';
import { Credit, HelpModal } from './Help.jsx';
import { Archive as ArchiveIcon, BookOpen, ChevronDown, ChevronRight, FilePlus2, FolderOpen, LayoutTemplate, Lightbulb, Pencil, RotateCcw, Search, Shield, Trash2, X } from 'lucide-react';
import { ArchiveCard, ArchiveViewer, LikeButton, PinButton, useArchive } from './Archive.jsx';
import { OFFICIAL_TEMPLATES, SIZES, blankDoc, withIds } from '../lib/templates.js';
import { docThumb } from '../lib/thumb.js';
import { fontsReady } from '../lib/textfit.js';
import { can, canOpenAdmin, formatDate, roleLabel } from '../lib/util.js';

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
  const [trash, setTrash] = useState([]);
  const [trashOpen, setTrashOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  const reload = () => {
    api.listWorks().then(setWorks).catch((e) => setError(e.message));
    api.listTrash?.().then(setTrash).catch(() => setTrash([]));
    api.listTemplates().then(setTemplates).catch((e) => setError(e.message));
  };
  useEffect(reload, []);

  const allTemplates = useMemo(() => [...templates.filter((t) => t.pinned), ...templates.filter((t) => !t.pinned && !t.official && t.author === session.nickname), ...OFFICIAL_TEMPLATES, ...templates.filter((t) => !t.pinned && !(t.author === session.nickname && !t.official))], [templates]);
  const patchTpl = (id, p) => setTemplates((list) => list.map((t) => (t.id === id ? { ...t, ...p } : t)));
  const PINNED = 'Закреплённые';
  const MINE = 'Ваши работы';
  const groupOf = (t) => (t.pinned ? PINNED : mineTpl(t) ? MINE : t.kind || 'Другое');
  const kinds = [...new Set(allTemplates.map((t) => t.kind).filter(Boolean))];
  const [collapsed, setCollapsed] = useState(() => { try { return JSON.parse(localStorage.getItem('cnd_tpl_collapsed') || '[]'); } catch { return []; } });
  const toggleKind = (k) => setCollapsed((c) => {
    const n = c.includes(k) ? c.filter((x) => x !== k) : [...c, k];
    try { localStorage.setItem('cnd_tpl_collapsed', JSON.stringify(n)); } catch {}
    return n;
  });
  const found = allTemplates.filter((t) => {
    const hay = `${t.name} ${(t.tags || []).join(' ')} ${t.author}`.toLowerCase();
    return (!q || hay.includes(q.toLowerCase())) && (!kind || t.kind === kind);
  });

  const mineTpl = (t) => !t.official && t.author === session.nickname;
  const openTemplate = async (t, edit = false) => {
    const mine = mineTpl(t);
    if (!t.official && !mine) api.useTemplate(t.id).catch(() => {});
    let src = t.doc;
    if (t.rebuild) { await fontsReady(t.fonts || []); src = t.rebuild(); }
    const doc = withIds(structuredClone(src));
    if (mine) doc.fromTpl = t.id;
    go({ name: 'editor', doc, title: t.name, notice: edit ? 'Измените шаблон и нажмите «В шаблоны» → «Обновить у всех»' : '' });
  };
  const [armed, setArmed] = useState(null);
  const arm = (id) => { setArmed(id); setTimeout(() => setArmed((a) => (a === id ? null : a)), 4000); };
  const removeWork = async (w) => {
    if (armed !== w.id) { arm(w.id); return; }
    setArmed(null);
    try { await api.deleteWork(w.id); setNotice(w); reload(); } catch (e) { setError(e.message); }
  };
  const restoreWork = async (id) => {
    try { await api.restoreWork(id); setNotice(null); reload(); } catch (e) { setError(e.message); }
  };
  const purgeWork = async (w) => {
    if (armed !== `p${w.id}`) { arm(`p${w.id}`); return; }
    setArmed(null);
    try { await api.purgeWork(w.id); reload(); } catch (e) { setError(e.message); }
  };
  const removeTemplate = async (t) => {
    if (armed !== t.id) { arm(t.id); return; }
    setArmed(null);
    try { await api.deleteTemplate(t.id); reload(); } catch (e) { setError(e.message); }
  };

  const [helpOpen, setHelpOpen] = useState(false);
  const arch = useArchive('', 10);
  const [archOpen, setArchOpen] = useState(null);
  useEffect(() => { arch.load(true); }, []);
  const patchArch = (id, p) => { arch.setItems((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x))); setArchOpen((o) => (o && o.id === id ? { ...o, ...p } : o)); };
  const [tipHidden, setTipHidden] = useState(() => { try { return localStorage.getItem('cnd_tip_home') === '1'; } catch { return false; } });
  const hideTip = () => { setTipHidden(true); try { localStorage.setItem('cnd_tip_home', '1'); } catch {} };
  const hour = new Date().getHours();
  const hello = hour < 5 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';

  return (
    <>
      <TopBar session={session} left={left} logout={logout} help="editor">
        <span className="brand-name">CND Редактор</span>
        <button onClick={() => go({ name: 'archive' })} title="Архив" aria-label="Архив"><ArchiveIcon size={16} /> <span className="lbl">Архив</span></button>
        {canOpenAdmin(session) && <button onClick={() => go({ name: 'admin' })} title="Админка" aria-label="Админка"><Shield size={16} /> <span className="lbl">Админка</span></button>}
      </TopBar>
      <div className="page">
        {error && <div className="error">{error}</div>}
        <div className="card hero">
          <div className="grow">
            <h1>{hello}, {session.nickname}!</h1>
            <p>{roleLabel(session.role)} редакции California NewsDay. Начните с шаблона или пустого листа.</p>
          </div>
          <div className="stat"><b><Countdown to={session.expiresAt} /></b><span>до конца доступа</span></div>
          <div className="stat"><b>{works.length}</b><span>моих работ</span></div>
          <div className="hero-actions">
            <button onClick={() => setHelpOpen(true)}><BookOpen size={16} /> Инструкция</button>
            <button onClick={() => go({ name: 'archive' })}><ArchiveIcon size={16} /> Лента архива</button>
          </div>
        </div>
        {!tipHidden && (
          <div className="tip-card">
            <Lightbulb size={18} />
            <div className="grow small">Впервые здесь? Загляните в <b>инструкцию</b>: как войти, собрать статью, вставить персонажа и отправить картинку в Discord. Открывается кнопкой «?» или клавишей <kbd>F1</kbd>.</div>
            <button className="small" onClick={() => setHelpOpen(true)}>Открыть</button>
            <button className="icon ghost" onClick={hideTip} aria-label="Скрыть"><X size={16} /></button>
          </div>
        )}
        {helpOpen && <HelpModal role={session.role} onClose={() => setHelpOpen(false)} />}

        <div className="section"><h2><FilePlus2 size={20} /> Создать</h2></div>
        <div className="grid">
          {SIZES.map((s) => {
            const k = 40 / Math.max(s.width, s.height);
            return (
              <button key={s.key} className="tile size-tile" onClick={() => go({ name: 'editor', doc: blankDoc(s), title: s.label })}>
                <span className="shape"><i style={{ width: s.width * k, height: s.height * k }} /></span>
                <span><b>{s.label}</b><div className="muted small">{s.width} × {s.height}</div></span>
              </button>
            );
          })}
        </div>

        <div className="section">
          <h2><LayoutTemplate size={20} /> Шаблоны</h2>
          <div className="search"><Search size={16} /><input placeholder="Поиск по названию, тегу, автору" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <select style={{ maxWidth: 180 }} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">Все типы</option>
            {kinds.map((k) => <option key={k}>{k}</option>)}
          </select>
        </div>
        {!found.length && <p className="muted">Ничего не нашлось.</p>}
        {[...new Set(found.map(groupOf))].map((kd) => {
          const list = found.filter((t) => groupOf(t) === kd);
          const shut = collapsed.includes(kd) && !q;
          return (
            <div key={kd} className="tpl-group">
              <button className="tpl-head" onClick={() => toggleKind(kd)} aria-expanded={!shut}>
                {shut ? <ChevronRight size={18} /> : <ChevronDown size={18} />}<b>{kd}</b><span className="muted small">{list.length}</span>
              </button>
              {!shut && (
                <div className="grid">
                  {list.map((t) => (
            <div key={t.id} className="tile" onClick={() => openTemplate(t)}>
              <Thumb doc={t.doc} src={t.thumb} k={t.id} />
              <div className="meta">
                <div className="row"><b className="grow">{t.name}</b>{t.official && <span className="badge blue">CND</span>}</div>
                <div className="muted">{t.official ? `Официальный${t.pagesCount ? ` · ${t.pagesCount} стр.` : ''}` : mineTpl(t) ? `Ваш шаблон · взяли ${t.uses || 0} раз` : `Автор: ${t.author} · взяли ${t.uses || 0} раз`}</div>
                {'likes' in t && (
                  <div className="row tile-actions">
                    <LikeButton kind="template" item={t} onChange={(p) => patchTpl(t.id, p)} flash={setError} />
                    <PinButton kind="template" item={t} session={session} onChange={(p) => patchTpl(t.id, p)} flash={setError} />
                  </div>
                )}
                {!t.official && (t.author === session.nickname || can(session, 'templates')) && (
                  <div className="row tile-actions">
                    {mineTpl(t) && <button className="ghost small" title="Открыть, поправить и обновить у всех" onClick={(e) => { e.stopPropagation(); openTemplate(t, true); }}><Pencil size={14} /> Обновить</button>}
                    <button className="ghost danger small" onClick={(e) => { e.stopPropagation(); removeTemplate(t); }}><Trash2 size={14} />{armed === t.id ? 'Точно убрать?' : 'Убрать'}</button>
                  </div>
                )}
              </div>
            </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="section"><h2><FolderOpen size={20} /> Мои работы</h2></div>
        <div className="grid">
          {works.map((w) => (
            <div key={w.id} className="tile" onClick={() => go({ name: 'editor', workId: w.id })}>
              <Thumb src={w.thumb} />
              <div className="meta">
                <b>{w.title || 'Без названия'}</b>
                <div className="muted">Изменено {formatDate(w.updatedAt)}</div>
                <button className="ghost danger small" style={{ justifySelf: 'start' }} onClick={(e) => { e.stopPropagation(); removeWork(w); }}><Trash2 size={14} />{armed === w.id ? 'Точно удалить?' : 'Удалить'}</button>
              </div>
            </div>
          ))}
          {!works.length && <p className="muted">Пока пусто. Начните с шаблона или пустого размера.</p>}
        </div>
        {notice && (
          <div className="tip-card">
            <Trash2 size={18} />
            <div className="grow small">«{notice.title || 'Без названия'}» в корзине. Она хранится там 30 дней.</div>
            <button className="small" onClick={() => restoreWork(notice.id)}><RotateCcw size={14} /> Вернуть</button>
            <button className="icon ghost" onClick={() => setNotice(null)} aria-label="Скрыть"><X size={16} /></button>
          </div>
        )}
        {!!trash.length && (
          <>
            <button className="tpl-head" onClick={() => setTrashOpen((o) => !o)}>
              {trashOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />} <Trash2 size={16} /> Корзина <span className="muted small">{trash.length} · хранится 30 дней</span>
            </button>
            {trashOpen && (
              <div className="trash-list">
                {trash.map((w) => (
                  <div key={w.id} className="trash-item">
                    {w.thumb ? <img src={w.thumb} alt="" /> : <img alt="" />}
                    <div className="grow">
                      <b>{w.title || 'Без названия'}</b>
                      <div className="muted small">Удалено {formatDate(w.deletedAt)}{w.author !== session.nickname ? ` · ${w.author}` : ''}</div>
                    </div>
                    <button className="small" onClick={() => restoreWork(w.id)}><RotateCcw size={14} /> Вернуть</button>
                    <button className="ghost danger small" onClick={() => purgeWork(w)}>{armed === `p${w.id}` ? 'Стереть навсегда?' : 'Стереть'}</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        <div className="section"><h2><ArchiveIcon size={20} /> Свежее в архиве</h2><button className="ghost" onClick={() => go({ name: 'archive' })}>Вся лента →</button></div>
        <div className="grid arch-grid">
          {arch.items.map((a) => <ArchiveCard key={a.id} a={a} onOpen={setArchOpen} session={session} flash={setError} onChange={(p) => patchArch(a.id, p)} />)}
        </div>
        {arch.error && <div className="error">Архив не загрузился: {arch.error}</div>}
        {!arch.items.length && !arch.error && <p className="muted">Пока пусто. Скачайте или скопируйте готовую работу, и она появится здесь для всей редакции.</p>}
        {archOpen && <ArchiveViewer item={archOpen} session={session} go={go} flash={(m) => setError(m)} onChange={(p) => patchArch(archOpen.id, p)} onClose={() => setArchOpen(null)} onDeleted={(id) => arch.setItems(arch.items.filter((x) => x.id !== id))} />}
        <div className="footer"><Credit className="grow" /><span>California NewsDay · Real news. California.</span></div>
      </div>
    </>
  );
}
