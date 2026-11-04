// Если крадёте, то крадите ради реально хороших людей
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, BadgeCheck, BookmarkPlus, Copy, Download, Image as ImageIcon, LayoutTemplate, Lightbulb, Redo2, Send, Shapes, Type, Undo2, X, SlidersHorizontal, Minus, Plus, ChevronDown } from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';
import { HelpButton, TIPS } from './Help.jsx';
import { Who } from './TopBar.jsx';
import { UserSettingsButton } from './UserSettings.jsx';
import { api } from '../api/index.js';
import CanvasStage from './CanvasStage.jsx';
import PropsPanel from './PropsPanel.jsx';
import SkinPoser from './SkinPoser.jsx';
import { BgRemoveModal, UpscaleModal } from './ImageTools.jsx';
import { BrandPanel, PhotosPanel, TemplatesPanel, TextPanel } from './Panels.jsx';
import ElementsPanel from './ElementsPanel.jsx';
import { docThumb } from '../lib/thumb.js';
import { elName } from './PropsPanel.jsx';
import { BRAND } from '../lib/brand.js';
import { WATERMARK_STYLES, applyWatermark } from '../lib/watermark.js';
import { loadCustomFonts } from '../lib/fonts.js';
import { usePrefs } from '../lib/prefs.js';
import { isWebhook, postToDiscord } from '../lib/discord.js';
import { withIds } from '../lib/templates.js';
import { canManage, compressImage, loadImage, roleLabel, uid } from '../lib/util.js';

const RAIL = [
  ['templates', LayoutTemplate, 'Шаблоны'], ['text', Type, 'Текст'], ['photos', ImageIcon, 'Фото'],
  ['elements', Shapes, 'Элементы'], ['brand', BadgeCheck, 'Бренд'],
];

export default function Editor({ session, left, go, open }) {
  const [doc, setDocState] = useState(null);
  const [title, setTitle] = useState(open.title || 'Без названия');
  const [workId, setWorkId] = useState(open.workId || null);
  const [author, setAuthor] = useState(session.nickname);
  const [selectedId, setSelectedId] = useState(null);
  const [imageTool, setImageTool] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [tab, setTab] = useState('text');
  const mobile = useMedia('(max-width: 1024px)');
  const [sheet, setSheet] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [fit, setFit] = useState(0.3);
  const [uploads, setUploads] = useState([]);
  const [poserSkin, setPoserSkin] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [prefs, savePrefs] = usePrefs();
  const exportOpts = { format: prefs.exportFormat, mult: prefs.exportMult, quality: prefs.exportQuality };
  const setExportOpts = (o) => savePrefs({ exportFormat: o.format, exportMult: o.mult, exportQuality: o.quality });
  const [toArchive, setToArchive] = useState(prefs.archiveOnExport);
  const [channel, setChannel] = useState(0);
  const [comment, setComment] = useState('');
  const [toast, setToast] = useState('');
  const [saved, setSaved] = useState('');
  const [settings, setSettings] = useState({ watermarkOpacity: 0.85, watermarkCorner: 'br', watermarkStyle: 'corner', watermarkChoice: true });
  const [wmStyle, setWmStyle] = useState(null);
  const [fontTick, setFontTick] = useState(0);
  const history = useRef({ past: [], future: [] });
  const stageApi = useRef(null);
  const wsRef = useRef(null);
  const placeholderTarget = useRef(null);

  const [tipIdx, setTipIdx] = useState(() => Math.floor(Math.random() * TIPS.length));
  const tipOn = prefs.tips;
  const hideTips = () => savePrefs({ tips: false });
  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };

  useEffect(() => {
    api.getSettings().then((s) => s && setSettings((p) => ({ ...p, ...s }))).catch(() => {});
    loadCustomFonts().then(() => setFontTick((t) => t + 1));
    if (open.workId) {
      api.getWork(open.workId).then((w) => {
        if (!w) { flash('Работа не найдена'); go({ name: 'home' }); return; }
        setDocState(w.doc); setTitle(w.title || 'Без названия'); setAuthor(w.author);
      });
    } else setDocState(open.doc);
  }, []);

  useEffect(() => {
    const onDone = () => setFontTick((t) => t + 1);
    document.fonts?.addEventListener?.('loadingdone', onDone);
    document.fonts?.ready.then(onDone);
    return () => document.fonts?.removeEventListener?.('loadingdone', onDone);
  }, []);

  useEffect(() => {
    if (!doc) return;
    const fams = new Set(doc.elements.filter((e) => e.type === 'text').map((e) => `${e.fontStyle?.includes('italic') ? 'italic ' : ''}${e.fontStyle?.includes('bold') ? '700' : '400'} 32px "${e.fontFamily}"`));
    Promise.all([...fams].map((f) => document.fonts.load(f, 'АаЯя Aa').catch(() => {}))).then(() => setFontTick((t) => t + 1));
  }, [doc?.elements]);

  useLayoutEffect(() => {
    if (!doc) return;
    const calc = () => {
      const ws = wsRef.current; if (!ws) return;
      const pad = 2 * (parseFloat(getComputedStyle(ws).paddingLeft) || 30);
      const w = ws.clientWidth - pad; const h = ws.clientHeight - pad;
      if (w > 20 && h > 20) setFit(Math.min(w / doc.width, h / doc.height));
    };
    calc();
    const ro = new ResizeObserver(calc); if (wsRef.current) ro.observe(wsRef.current);
    window.addEventListener('resize', calc);
    return () => { ro.disconnect(); window.removeEventListener('resize', calc); };
  }, [doc?.width, doc?.height]);
  const scale = Math.max(0.05, fit * zoom);
  const pointerDown = useRef(false);
  useEffect(() => {
    const down = () => { pointerDown.current = true; };
    const up = () => { pointerDown.current = false; };
    window.addEventListener('pointerdown', down, true); window.addEventListener('pointerup', up, true); window.addEventListener('pointercancel', up, true);
    return () => { window.removeEventListener('pointerdown', down, true); window.removeEventListener('pointerup', up, true); window.removeEventListener('pointercancel', up, true); };
  }, []);
  useEffect(() => {
    if (!mobile) return undefined;
    if (!selectedId) { setSheet((s) => (s === 'props' ? null : s)); return undefined; }
    const open = () => setSheet('props');
    if (!pointerDown.current) { open(); return undefined; }
    const onUp = () => setTimeout(open, 0);
    window.addEventListener('pointerup', onUp, { once: true });
    return () => window.removeEventListener('pointerup', onUp);
  }, [selectedId, mobile]);

  const touched = useRef(false);
  const commit = useCallback((next) => {
    touched.current = true;
    setDocState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      if (value !== prev) {
        history.current.past.push(prev);
        if (history.current.past.length > 100) history.current.past.shift();
        history.current.future = [];
      }
      return value;
    });
  }, []);
  const undo = () => { const h = history.current; if (!h.past.length) return; touched.current = true; setDocState((cur) => { h.future.push(cur); return h.past.pop(); }); };
  const redo = () => { const h = history.current; if (!h.future.length) return; touched.current = true; setDocState((cur) => { h.past.push(cur); return h.future.pop(); }); };

  const update = useCallback((id, patch) => commit((d) => ({ ...d, elements: d.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)) })), [commit]);
  const updateDoc = (patch) => commit((d) => ({ ...d, ...patch }));
  const selected = doc?.elements.find((e) => e.id === selectedId) || null;

  const add = (spec) => {
    const items = Array.isArray(spec) ? spec : [spec];
    const base = items[0];
    const w = base.width || 400, h = base.height || base.fontSize || 100;
    const x0 = Math.round(doc.width / 2 - w / 2), y0 = Math.round(doc.height / 2 - h / 2);
    const created = items.map(({ dy = 0, dx = 0, ...it }) => ({ opacity: 1, rotation: 0, ...it, id: uid(), x: x0 + dx, y: y0 + dy }));
    commit((d) => ({ ...d, elements: [...d.elements, ...created] }));
    setSelectedId(created[created.length - 1].id);
  };

  const addImage = async (src, opts = {}) => {
    let { width, height } = opts;
    if (!width || !height) {
      const img = await loadImage(src);
      const k = Math.min(1, (doc.width * 0.6) / img.width, (doc.height * 0.6) / img.height);
      width = img.width * k; height = img.height * k;
    }
    const targetId = placeholderTarget.current; placeholderTarget.current = null;
    const ph = targetId ? doc.elements.find((e) => e.id === targetId && isFrame(e)) : doc.elements.find((e) => e.id === selectedId && isFrame(e, true));
    if (ph && !opts.name) {
      commit((d) => ({ ...d, elements: d.elements.map((e) => (e.id === ph.id ? { ...photoInFrame(e, src), crop: { x: 0.5, y: 0.5, zoom: 1 } } : e)) }));
      setSelectedId(ph.id);
      flash(mobile ? 'Фото в рамке. Двойное касание — сдвинуть фото внутри' : 'Фото в рамке. Двойной клик — сдвинуть фото внутри рамки');
      return;
    }
    add({ type: 'image', src, width, height, name: opts.name });
  };

  const addImageFile = async (file, targetId) => {
    if (!file?.type?.startsWith('image/')) return;
    const keepPng = file.type === 'image/png' && file.size < 1.5e6;
    const src = await compressImage(file, 2200, 0.88, keepPng ? 'image/png' : 'image/jpeg');
    setUploads((u) => [src, ...u].slice(0, 20));
    if (targetId) placeholderTarget.current = targetId;
    await addImage(src);
  };

  const actions = {
    cropping: !!selected && editingId === selected.id,
    toggleCrop: () => { if (!selected) return; if (editingId === selected.id) { setEditingId(null); return; } if (!selected.crop) update(selected.id, { crop: { x: 0.5, y: 0.5, zoom: 1 } }); setEditingId(selected.id); },
    remove: () => { if (!selected) return; commit((d) => ({ ...d, elements: d.elements.filter((e) => e.id !== selected.id) })); setSelectedId(null); },
    duplicate: () => {
      if (!selected) return;
      const copy = { ...structuredClone(selected), id: uid(), x: selected.x + 30, y: selected.y + 30, locked: false };
      commit((d) => ({ ...d, elements: [...d.elements, copy] })); setSelectedId(copy.id);
    },
    order: (where) => commit((d) => {
      const els = [...d.elements]; const i = els.findIndex((e) => e.id === selectedId); if (i < 0) return d;
      const [el] = els.splice(i, 1);
      const j = where === 'top' ? els.length : where === 'bottom' ? 0 : where === 'up' ? Math.min(els.length, i + 1) : Math.max(0, i - 1);
      els.splice(j, 0, el); return { ...d, elements: els };
    }),
    center: () => selected && update(selected.id, { x: Math.round((doc.width - (selected.width || 0)) / 2), y: selected.type === 'text' ? selected.y : Math.round((doc.height - (selected.height || 0)) / 2) }),
    align: (where) => {
      if (!selected) return;
      const node = stageApi.current?.stage()?.findOne(`#${selected.id}`);
      const box = node ? node.getClientRect({ relativeTo: node.getLayer() }) : { x: selected.x, y: selected.y, width: selected.width || 0, height: selected.height || 0 };
      const dx = where === 'left' ? -box.x : where === 'right' ? doc.width - box.x - box.width : where === 'hcenter' ? (doc.width - box.width) / 2 - box.x : 0;
      const dy = where === 'top' ? -box.y : where === 'bottom' ? doc.height - box.y - box.height : where === 'vcenter' ? (doc.height - box.height) / 2 - box.y : 0;
      update(selected.id, { x: Math.round(selected.x + dx), y: Math.round(selected.y + dy) });
    },
    saveAsElement: async () => {
      if (!selected) return;
      const { id: _id, x: _x, y: _y, locked: _l, ...spec } = structuredClone(selected);
      const name = elName(selected);
      try {
        let thumb = null;
        if (selected.type === 'image') thumb = await compressImage(selected.src, 160, 0.8, 'image/png');
        else if (selected.type !== 'shape') thumb = await docThumb({ width: selected.width || 300, height: selected.height || selected.fontSize * 2 || 200, background: '#ffffff', elements: [{ ...spec, id: 'x', x: 0, y: 0, rotation: 0 }] }, null, 160);
        await api.saveElement({ name, data: { spec, thumb } });
        flash('Сохранено в «Элементы → Элементы редакции»');
      } catch (e) { flash(e.message || 'Не получилось сохранить'); }
    },
    fitImage: () => selected && update(selected.id, { x: 0, y: 0, width: doc.width, height: doc.height }),
    imageTool: (kind) => selected?.type === 'image' && setImageTool(kind),
    restoreImage: async () => {
      if (!selected?.origSrc) return;
      const img = await loadImage(selected.origSrc);
      update(selected.id, { src: selected.origSrc, origSrc: undefined, height: selected.width * (img.height / img.width) });
      flash('Вернул оригинал');
    },
    resetRatio: async () => { if (!selected) return; const img = await loadImage(selected.src); update(selected.id, { height: selected.width * (img.height / img.width) }); },
    pickPhotoForPlaceholder: () => { placeholderTarget.current = selectedId; document.getElementById('photo-file').click(); },
    toFrame: () => {
      if (!selected) return;
      const ph = {
        id: selected.id, type: 'placeholder', x: selected.x, y: selected.y, width: selected.width, height: selected.height,
        rotation: selected.rotation, opacity: selected.opacity, fill: '#9aa6b8', label: 'Перетащите фото', name: selected.name,
        mask: selected.type === 'image' ? selected.mask : undefined, cornerRadius: selected.cornerRadius,
        clipPath: selected.type === 'shape' ? selected.path : selected.clipPath, clipVb: selected.type === 'shape' ? selected.vb : selected.clipVb,
        frameStroke: selected.type === 'shape' ? (selected.strokeWidth ? selected.stroke : undefined) : selected.frameStroke,
        frameStrokeWidth: selected.type === 'shape' ? selected.strokeWidth : selected.frameStrokeWidth, shadow: selected.shadow,
      };
      commit((d) => ({ ...d, elements: d.elements.map((e) => (e.id === selected.id ? ph : e)) }));
      flash('Теперь это рамка: перетащите на неё фото');
    },

  };

  const applyColor = (c) => {
    if (!selected) { updateDoc({ background: c }); return; }
    const patch = selected.type === 'line' ? { stroke: c }
      : selected.type === 'chart' ? { colors: [c, ...(selected.colors || []).slice(1)] }
        : selected.type === 'table' ? { head: c }
          : selected.type === 'image' ? { stroke: c, strokeWidth: selected.strokeWidth || 8 }
            : { fill: c, gradient: undefined };
    update(selected.id, patch);

  };
  const applyFont = (f, quiet) => selected?.type === 'text' ? update(selected.id, { fontFamily: f }) : !quiet && flash('Выделите текст');
  const applyTemplate = (t) => {
    if (!t.official) api.useTemplate(t.id).catch(() => {});
    commit(withIds(structuredClone(t.doc))); setSelectedId(null);
    flash('Шаблон применён. Ctrl+Z — вернуть прежний дизайн');
  };

  useEffect(() => {
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if (mod && e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); redo(); return; }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'c') { e.preventDefault(); copyToClipboard(); return; }
      if (typing || !selected) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); actions.remove(); }
      else if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); actions.duplicate(); }
      else if (e.key === 'Escape') { if (editingId) setEditingId(null); else setSelectedId(null); }
      else if (e.key.startsWith('Arrow') && !selected.locked) {
        e.preventDefault(); const s = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -s : e.key === 'ArrowRight' ? s : 0; const dy = e.key === 'ArrowUp' ? -s : e.key === 'ArrowDown' ? s : 0;
        update(selected.id, { x: selected.x + dx, y: selected.y + dy });
      } else if (e.key === 'Enter' && selected.type === 'text') { e.preventDefault(); setEditingId(selected.id); }
    };
    const onPaste = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
      if (item) { e.preventDefault(); addImageFile(item.getAsFile()); return; }
      const text = e.clipboardData?.getData('text/plain');
      if (text) { e.preventDefault(); add({ type: 'text', text, fontFamily: 'PT Serif', fontSize: 28, width: Math.min(900, doc.width * 0.8), fill: '#111111', align: 'left', fontStyle: 'normal', lineHeight: 1.3 }); }
    };
    window.addEventListener('keydown', onKey); window.addEventListener('paste', onPaste);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('paste', onPaste); };
  });

  const savingRef = useRef(null);
  const persist = async (extra = {}) => {
    if (!doc) return;
    const id = workId || uid();
    if (!workId) setWorkId(id);
    const thumb = stageApi.current?.toThumb(360);
    try {
      await api.saveWork({ id, title, doc, thumb, ...extra });
      setSaved(`Сохранено ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`);
      return id;
    } catch (e) { setSaved('Не сохранено'); flash(e.message); throw e; }
  };
  useEffect(() => {
    if (!doc) return;
    clearTimeout(savingRef.current);
    if (!touched.current) { setSaved(workId ? '' : 'Без изменений — не в «Моих работах»'); return undefined; }
    setSaved('Сохраняю…');
    savingRef.current = setTimeout(() => persist().catch(() => {}), 1500);
    return () => clearTimeout(savingRef.current);
  }, [doc, title]);

  const styleNow = (settings.watermarkChoice && wmStyle) || settings.watermarkStyle || 'corner';
  const renderFinal = async (format, mult) => {
    setEditingId(null);
    const canvas = stageApi.current.toCanvas(mult);
    let exportId = '';
    try {
      const rec = await api.logExport({ workId, title, format, watermark: WATERMARK_STYLES[styleNow] || styleNow });
      exportId = rec?.id || '';
    } catch {}
    const k = canvas.width / doc.width;
    const avoid = doc.elements.filter((e) => e.type === 'image' && /логотип/i.test(e.name || '') && e.visible !== false)
      .map((e) => ({ x: e.x * k, y: e.y * k, width: e.width * k, height: e.height * k }));
    await applyWatermark(canvas, { author: session.nickname, exportId, opacity: settings.watermarkOpacity, corner: settings.watermarkCorner, style: styleNow, avoid });
    return canvas;
  };
  const toBlob = (canvas, type, q) => new Promise((r) => canvas.toBlob(r, type, q));

  const scaled = (canvas, max, q) => {
    const k = Math.min(1, max / Math.max(canvas.width, canvas.height));
    const c = document.createElement('canvas'); c.width = Math.round(canvas.width * k); c.height = Math.round(canvas.height * k);
    const x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(canvas, 0, 0, c.width, c.height);
    return { url: c.toDataURL('image/jpeg', q), w: c.width, h: c.height };
  };
  const addToArchive = async (canvas, quiet = false) => {
    try {
      const big = scaled(canvas, 1600, 0.85); const small = scaled(canvas, 420, 0.72);
      await api.archiveAdd({ title: title || 'Без названия', workId, image: big.url, thumb: small.url, width: big.w, height: big.h });
      if (!quiet) flash('Работа добавлена в ленту архива');
    } catch (e) { flash(`Архив: ${e.message}`); }
  };
  const archiveIfNeeded = (canvas) => { if (toArchive) addToArchive(canvas, true); };

  const download = async () => {
    const { format, mult, quality } = exportOpts;
    const type = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' }[format];
    const canvas = await renderFinal(format, mult);
    archiveIfNeeded(canvas);
    const blob = await toBlob(canvas, type, quality);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(title || 'cnd').replace(/[\\/:*?"<>|]+/g, '_')}.${format}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setExportOpen(false);
  };

  const copyToClipboard = () => {
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') { flash('Браузер не умеет копировать картинки, скачайте файл'); return; }
    const blobPromise = renderFinal('png-буфер', exportOpts.mult).then((c) => { archiveIfNeeded(c); return toBlob(c, 'image/png'); });
    navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPromise })])
      .then(() => flash('Картинка скопирована — вставьте её в Discord (Ctrl+V)'))
      .catch(() => flash('Не удалось скопировать. Разрешите доступ к буферу обмена или скачайте файл.'));
    setExportOpen(false);
  };

  const [sending, setSending] = useState(false);
  const channels = (settings.discordChannels?.length ? settings.discordChannels : settings.discordWebhook ? [{ name: 'Discord', url: settings.discordWebhook }] : [])
    .filter((c) => isWebhook(c.url));
  const sendToDiscord = async () => {
    setSending(true);
    try {
      const ch = channels[channel] || channels[0];
      const canvas = await renderFinal('discord', exportOpts.mult);
      archiveIfNeeded(canvas);
      const blob = await toBlob(canvas, 'image/png');
      const text = [comment.trim(), `📰 **${title || 'Без названия'}** · автор: ${author}`].filter(Boolean).join('\n');
      await postToDiscord(ch.url, { content: text, file: blob, filename: `${(title || 'cnd').replace(/[^\wа-яё-]+/gi, '_')}.png` });
      flash(`Отправлено в канал «${ch.name}»`);
      setComment('');
      setExportOpen(false);
    } catch (e) { flash(e.message); }
    setSending(false);
  };

  const [tplForm, setTplForm] = useState(null);
  const saveAsTemplate = async () => {
    const name = tplForm.name.trim(); if (!name) { flash('Введите название шаблона'); return; }
    const tags = tplForm.tags.split(',').map((t) => t.trim()).filter(Boolean);
    setTplForm(null);
    const clean = { ...doc, elements: doc.elements.map((e) => ({ ...e })) };
    try {
      await api.saveTemplate({ name, tags, kind: doc.width > doc.height ? 'Разворот' : doc.width === doc.height ? 'Пост' : 'Газета', thumb: stageApi.current.toThumb(360), doc: clean });
      flash('Шаблон опубликован — коллеги найдут его в поиске');
    } catch (e) { flash(e.message); }
  };

  if (!doc) return <div className="editor"><div className="topbar">Загрузка…</div></div>;

  const editingEl = doc.elements.find((e) => e.id === editingId);

  return (
    <div className="editor">
      <div className="topbar">
        <button onClick={async () => { if (touched.current) await persist().catch(() => {}); go({ name: 'home' }); }} title="Сохранить и выйти к работам" aria-label="Работы"><ArrowLeft size={16} /> <span className="lbl">Работы</span></button>
        <img className="logo" src={BRAND.iconWhite} alt="" />
        <input className="title" value={title} onChange={(e) => { touched.current = true; setTitle(e.target.value); }} />
        <span className="saved">{saved}</span>
        <span className="sep" />
        <button className="icon" title="Отменить (Ctrl+Z)" aria-label="Отменить" onClick={undo}><Undo2 size={17} /></button>
        <button className="icon" title="Повторить (Ctrl+Shift+Z)" aria-label="Повторить" onClick={redo}><Redo2 size={17} /></button>
        <select className="zoom" title="Масштаб" value={zoom} onChange={(e) => setZoom(Number(e.target.value))}>
          {[0.5, 0.75, 1, 1.5, 2, 3].map((z) => <option key={z} value={z}>{Math.round(z * 100)}%</option>)}
        </select>
        <div className="grow" />
        <Who compact session={session} label={author !== session.nickname ? `Автор: ${author}` : session.nickname} />
        <button className="hide-phone" onClick={() => setTplForm({ name: title, tags: '' })} title="Опубликовать дизайн как шаблон для коллег"><BookmarkPlus size={16} /> <span className="lbl">В шаблоны</span></button>
        <button className="hide-phone" onClick={copyToClipboard} title="Копировать картинку в буфер (Ctrl+Shift+C)" aria-label="Копировать"><Copy size={16} /> <span className="lbl">Копировать</span></button>
        <HelpButton start="editor" role={session.role} />
        <span className="hide-phone row" style={{ gap: 8 }}><UserSettingsButton /><ThemeToggle /></span>
        <div style={{ position: 'relative' }}>
          <button className="primary" onClick={() => setExportOpen((v) => !v)} aria-label="Скачать"><Download size={16} /> <span className="lbl-keep">Скачать</span></button>
          {exportOpen && (
            <div className="card menu">
              <label>Формат</label>
              <select value={exportOpts.format} onChange={(e) => setExportOpts({ ...exportOpts, format: e.target.value })}>
                <option value="png">PNG — лучшее качество</option>
                <option value="jpg">JPG — меньше вес, для публикации</option>
                <option value="webp">WEBP</option>
              </select>
              <label>Размер</label>
              <select value={exportOpts.mult} onChange={(e) => setExportOpts({ ...exportOpts, mult: Number(e.target.value) })}>
                <option value={1}>1× ({doc.width}×{doc.height})</option>
                <option value={2}>2× ({doc.width * 2}×{doc.height * 2})</option>
                <option value={0.5}>0.5× (для превью)</option>
              </select>
              {exportOpts.format !== 'png' && (<><label>Качество: {Math.round(exportOpts.quality * 100)}%</label>
                <input type="range" min="0.6" max="1" step="0.02" value={exportOpts.quality} onChange={(e) => setExportOpts({ ...exportOpts, quality: Number(e.target.value) })} /></>)}
              {settings.watermarkChoice && (<><label>Водяной знак</label>
                <select value={styleNow} onChange={(e) => setWmStyle(e.target.value)}>
                  {Object.entries(WATERMARK_STYLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select></>)}
              <label className="row" style={{ marginTop: 12 }}>
                <input type="checkbox" style={{ width: 'auto' }} checked={toArchive} onChange={(e) => setToArchive(e.target.checked)} />
                <span className="small">Добавить в ленту архива CND</span>
              </label>
              <button className="primary" style={{ width: '100%', marginTop: 10 }} onClick={download}><Download size={16} /> Скачать файл</button>
              <button style={{ width: '100%', marginTop: 6 }} onClick={copyToClipboard}><Copy size={16} /> Копировать в буфер (PNG)</button>
              {mobile && <button style={{ width: '100%', marginTop: 6 }} onClick={() => { setExportOpen(false); setTplForm({ name: title, tags: '' }); }}><BookmarkPlus size={16} /> Опубликовать как шаблон</button>}
              {!!channels.length && (
                <div className="menu-discord">
                  <label>Отправить в Discord</label>
                  {channels.length > 1 && (
                    <select value={channel} onChange={(e) => setChannel(Number(e.target.value))}>
                      {channels.map((c, i) => <option key={i} value={i}>#{c.name}</option>)}
                    </select>
                  )}
                  <input style={{ marginTop: 6 }} placeholder="Текст к посту (необязательно)" value={comment} onChange={(e) => setComment(e.target.value)} />
                  <button style={{ width: '100%', marginTop: 6 }} disabled={sending} onClick={sendToDiscord}><Send size={16} /> {sending ? 'Отправляю…' : `В канал «${(channels[channel] || channels[0]).name}»`}</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="editor-body">
        <div className="rail">
          {RAIL.map(([k, Ico, label]) => (
            <button key={k} className={tab === k && (!mobile || sheet === 'drawer') ? 'active' : ''}
              onClick={() => { if (mobile) setSheet((s) => (s === 'drawer' && tab === k ? null : 'drawer')); setTab(k); }}>
              <Ico size={22} strokeWidth={1.8} />{label}
            </button>
          ))}
          {mobile && (
            <button className={sheet === 'props' ? 'active' : ''} onClick={() => setSheet((s) => (s === 'props' ? null : 'props'))}>
              <SlidersHorizontal size={22} strokeWidth={1.8} />{selected ? 'Свойства' : 'Лист'}
            </button>
          )}
        </div>
        <div className={`drawer ${mobile ? 'sheet' : ''}`} hidden={mobile && sheet !== 'drawer'}>
          {mobile && <SheetHead title={(RAIL.find((r) => r[0] === tab) || [])[2]} onClose={() => setSheet(null)} />}
          {tab === 'templates' && <TemplatesPanel applyTemplate={applyTemplate} />}
          {tab === 'text' && <TextPanel add={add} />}
          {tab === 'photos' && <PhotosPanel addImageFile={addImageFile} uploads={uploads} addImage={addImage} />}
          {tab === 'elements' && <ElementsPanel add={add} addImage={addImage} flash={flash} openPoser={(skin, mode = 'body') => setPoserSkin({ skin, mode })} />}
          {tab === 'brand' && <BrandPanel addImage={addImage} applyColor={applyColor} applyFont={applyFont} />}
          {tab !== 'photos' && <input id="photo-file" type="file" accept="image/*" hidden onChange={(e) => { [...e.target.files].forEach((f) => addImageFile(f)); e.target.value = ''; }} />}
        </div>
        <div className="workspace" ref={wsRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const target = stageApi.current?.elementAt(e.clientX, e.clientY);
            const ph = doc.elements.find((x) => x.id === target && isFrame(x));
            [...e.dataTransfer.files].forEach((f, i) => addImageFile(f, i === 0 && ph ? ph.id : null));
          }}>
          <div className="stage-shadow" style={{ position: 'relative' }}>
            <CanvasStage ref={stageApi} doc={doc} scale={scale} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); if (id !== editingId) setEditingId(null); }}
              onChange={update} onEditText={setEditingId} editingId={editingId} fontTick={fontTick} />
            {editingEl?.type === 'text' && <TextOverlay el={editingEl} scale={scale} onDone={(text) => { if (text !== editingEl.text) update(editingEl.id, { text }); setEditingId(null); }} />}
          </div>
          {!doc.elements.length && <div className="empty-hint"><div>Лист пустой. Выберите <b>шаблон</b> или добавьте <b>текст</b>{mobile ? ' на панели снизу.' : ' слева. Фото можно просто перетащить сюда.'}</div></div>}
          {tipOn && (
            <div className="tipbar">
              <Lightbulb size={16} /><span className="grow">{TIPS[tipIdx % TIPS.length]}</span>
              <button className="ghost" onClick={() => setTipIdx((i) => i + 1)}>Ещё</button>
              <button className="ghost icon" aria-label="Скрыть подсказки" title="Скрыть подсказки" onClick={hideTips}><X size={14} /></button>
            </div>
          )}
        </div>
        {mobile && (
          <div className="zoom-fab">
            <button aria-label="Уменьшить" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}><Minus size={16} /></button>
            <button className="zoom-val" onClick={() => setZoom(1)} title="По размеру экрана">{Math.round(zoom * 100)}%</button>
            <button aria-label="Увеличить" onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}><Plus size={16} /></button>
          </div>
        )}
        <div className={mobile ? 'sheet props-sheet' : 'props-host'} hidden={mobile && sheet !== 'props'}>
          {mobile && <SheetHead title={selected ? 'Свойства' : 'Лист и слои'} onClose={() => { setSheet(null); if (selected) setSelectedId(null); }} />}
        <PropsPanel doc={doc} el={selected} update={update} updateDoc={updateDoc} actions={actions} select={setSelectedId} selectedId={selectedId} />
        </div>
      </div>
      {imageTool && selected?.type === 'image' && (() => {
        const Tool = imageTool === 'bg' ? BgRemoveModal : UpscaleModal;
        return <Tool el={selected} onClose={() => setImageTool(null)} onApply={(src, orig) => { update(selected.id, { src, origSrc: orig }); setImageTool(null); flash(imageTool === 'bg' ? 'Фон убран' : 'Качество улучшено'); }} />;
      })()}
      {poserSkin && <SkinPoser skin={poserSkin.skin} mode={poserSkin.mode} onClose={() => setPoserSkin(null)} onInsert={(url, m) => { setPoserSkin(null); addImage(url, { name: m === 'head' ? '3D-голова' : '3D-персонаж' }); }} />}
      {tplForm && (
        <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && setTplForm(null)}>
          <form className="modal" style={{ maxWidth: 420 }} onSubmit={(e) => { e.preventDefault(); saveAsTemplate(); }}>
            <h2>Сохранить как шаблон</h2>
            <p className="small muted">Шаблон появится в общей библиотеке, коллеги найдут его поиском.</p>
            <label htmlFor="tpl-name">Название</label>
            <input id="tpl-name" autoFocus value={tplForm.name} onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })} />
            <label htmlFor="tpl-tags">Теги через запятую</label>
            <input id="tpl-tags" placeholder="газета, новости, срочно" value={tplForm.tags} onChange={(e) => setTplForm({ ...tplForm, tags: e.target.value })} />
            <div className="row" style={{ marginTop: 14 }}>
              <button type="submit" className="primary">Опубликовать шаблон</button>
              <button type="button" onClick={() => setTplForm(null)}>Отмена</button>
            </div>
          </form>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function SheetHead({ title, onClose }) {
  return (
    <div className="sheet-head">
      <b className="grow">{title}</b>
      <button className="icon ghost" aria-label="Свернуть" onClick={onClose}><ChevronDown size={20} /></button>
    </div>
  );
}

function useMedia(q) {
  const [m, setM] = useState(() => typeof matchMedia === 'function' && matchMedia(q).matches);
  useEffect(() => {
    const mq = matchMedia(q); const on = () => setM(mq.matches);
    mq.addEventListener('change', on); on();
    return () => mq.removeEventListener('change', on);
  }, [q]);
  return m;
}

function TextOverlay({ el, scale, onDone }) {
  const ref = useRef(null);
  const [value, setValue] = useState(el.text);
  useEffect(() => { ref.current.focus(); ref.current.select(); }, []);
  useEffect(() => { const t = ref.current; t.style.height = 'auto'; t.style.height = `${t.scrollHeight}px`; }, [value]);
  return (
    <textarea ref={ref} className="text-editor" value={value} onChange={(e) => setValue(e.target.value)}
      onBlur={() => onDone(value)}
      onKeyDown={(e) => { if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); onDone(value); } e.stopPropagation(); }}
      style={{
        left: el.x * scale, top: el.y * scale, width: el.width * scale, fontSize: el.fontSize * scale,
        fontFamily: el.fontFamily, fontWeight: el.fontStyle?.includes('bold') ? 700 : 400, fontStyle: el.fontStyle?.includes('italic') ? 'italic' : 'normal',
        lineHeight: el.lineHeight || 1.2, color: el.fill, textAlign: el.align === 'justify' ? 'left' : el.align,
        letterSpacing: (el.letterSpacing || 0) * scale, transform: `rotate(${el.rotation || 0}deg)`,
      }} />
  );
}

function isFrame(e, strict = false) {
  if (!e) return false;
  if (e.type === 'placeholder') return true;
  if (e.type === 'shape') return !e.outline;
  return !strict && e.type === 'image' && !!(e.mask || e.clipPath);
}

function photoInFrame(e, src) {
  const fromShape = e.type === 'shape';
  return {
    id: e.id, type: 'image', src, x: e.x, y: e.y, width: e.width, height: e.height, rotation: e.rotation, opacity: e.opacity,
    name: e.type === 'image' ? e.name : undefined, mask: fromShape ? undefined : e.mask, cornerRadius: e.cornerRadius,
    clipPath: fromShape ? e.path : e.clipPath, clipVb: fromShape ? e.vb : e.clipVb,
    frameStroke: fromShape ? (e.strokeWidth ? e.stroke || '#000000' : undefined) : e.frameStroke,
    frameStrokeWidth: fromShape ? e.strokeWidth : e.frameStrokeWidth, shadow: e.shadow, fx: e.type === 'shape' ? undefined : e.fx,
  };
}
