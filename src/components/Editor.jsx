// Если крадёте, то крадите ради реально хороших людей
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Clapperboard, Film } from 'lucide-react';
import AnimPanel from './AnimPanel.jsx';
import { DEFAULT_ANIM, encodeGif, encodeVideo, hasAnims, makeAnimator, timingOf } from '../lib/anim.js';
import { ArrowLeft, BadgeCheck, BookOpen, FileText, FolderArchive, BookmarkPlus, Copy, Download, Image as ImageIcon, LayoutTemplate, Lightbulb, Redo2, Send, Shapes, Type, Undo2, X, SlidersHorizontal, Minus, Plus, ChevronDown } from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';
import { HelpButton, TIPS } from './Help.jsx';
import { Who } from './TopBar.jsx';
import { UserSettingsButton } from './UserSettings.jsx';
import { api } from '../api/index.js';
import CanvasStage from './CanvasStage.jsx';
import PropsPanel from './PropsPanel.jsx';
import SkinPoser from './SkinPoser.jsx';
import { BgRemoveModal, UpscaleModal } from './ImageTools.jsx';
import { importKind } from '../lib/importers.js';
import { photoInFrame } from '../lib/frames.js';
import { BrandPanel, PhotosPanel, TemplatesPanel, TextPanel } from './Panels.jsx';
import ElementsPanel from './ElementsPanel.jsx';
import PageBar from './PageBar.jsx';
import MagazinePanel from './MagazinePanel.jsx';
import { addPage, allPages, applyToAllPages, goPage, movePage, pageCount, pageDoc, pageIndex, removePage, withPages } from '../lib/pages.js';
import { canvasJpeg, makePdf } from '../lib/pdfwrite.js';
import { docThumb } from '../lib/thumb.js';
import { elName } from './PropsPanel.jsx';
import { BRAND } from '../lib/brand.js';
import { WATERMARK_STYLES, applyWatermark } from '../lib/watermark.js';
import { loadCustomFonts } from '../lib/fonts.js';
import { matchAction, useControls } from '../lib/controls.js';
import { usePrefs } from '../lib/prefs.js';
import { isWebhook, postToDiscord } from '../lib/discord.js';
import { withIds } from '../lib/templates.js';
import { canManage, compressImage, loadImage, roleLabel, uid } from '../lib/util.js';

const RAIL = [
  ['templates', LayoutTemplate, 'Шаблоны'], ['magazine', BookOpen, 'Журнал'], ['anim', Clapperboard, 'Анимация'], ['text', Type, 'Текст'], ['photos', ImageIcon, 'Фото'],
  ['elements', Shapes, 'Элементы'], ['brand', BadgeCheck, 'Бренд'],
];

export default function Editor({ session, left, go, open }) {
  const [doc, setDocState] = useState(null);
  const [title, setTitle] = useState(open.title || 'Без названия');
  const [workId, setWorkId] = useState(open.workId || null);
  const [author, setAuthor] = useState(session.nickname);
  const [selectedId, setSelectedIdRaw] = useState(null);
  const [multi, setMulti] = useState([]);
  const setSelectedId = (id) => { setMulti([]); setSelectedIdRaw(id); };
  const ctl = useControls();
  const styleClip = useRef(null);
  const [imageTool, setImageTool] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [tab, setTab] = useState('text');
  const mobile = useMedia('(max-width: 1024px)');
  const [sheet, setSheet] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [fit, setFit] = useState(0.3);
  const [uploads, setUploads] = useState([]);
  const [pendingImport, setPendingImport] = useState(null);
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
    if (open.notice) setTimeout(() => { setToast(open.notice); setTimeout(() => setToast(''), 6000); }, 400);
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

  useEffect(() => {
    docRef.current = doc;
    if (!doc || pageCount(doc) < 2) return undefined;
    clearTimeout(thumbTimer.current);
    thumbTimer.current = setTimeout(async () => {
      const pages = allPages(doc); const cur = pageIndex(doc);
      const next = {};
      for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        const key = `${p.id}:${JSON.stringify(p).length}`;
        if (i === cur) { const u = stageApi.current?.toThumb(160); if (u) next[p.id] = u; continue; }
        try { next[p.id] = await docThumb(pageDoc(doc, i), key, 160); } catch {}
      }
      setPageThumbs(next);
    }, 500);
    return () => clearTimeout(thumbTimer.current);
  }, [doc]);

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
  const docRef = useRef(null);
  const [pageThumbs, setPageThumbs] = useState({});
  const thumbTimer = useRef(null);
  const switchPage = (i) => { setSelectedId(null); setEditingId(null); setDocState((d) => goPage(d, i)); };
  const pageOps = {
    add: (i) => { commit((d) => addPage(goPage(d, i), i, false)); setSelectedId(null); },
    duplicate: (i) => { commit((d) => addPage(goPage(d, i), i, true)); setSelectedId(null); flash('Страница продублирована'); },
    remove: (i) => { commit((d) => removePage(d, i)); setSelectedId(null); },
    move: (a, b) => commit((d) => movePage(d, a, b)),
  };
  const undo = () => { const h = history.current; if (!h.past.length) return; touched.current = true; setDocState((cur) => { h.future.push(cur); return h.past.pop(); }); };
  const redo = () => { const h = history.current; if (!h.future.length) return; touched.current = true; setDocState((cur) => { h.past.push(cur); return h.future.pop(); }); };

  const update = useCallback((id, patch) => commit((d) => ({ ...d, elements: d.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)) })), [commit]);
  const updateDoc = (patch) => commit((d) => ({ ...d, ...patch }));
  const updateMany = (patches) => commit((d) => ({ ...d, elements: d.elements.map((e) => (patches[e.id] ? { ...e, ...patches[e.id] } : e)) }));
  const selIds = multi.length > 1 ? multi : selectedId ? [selectedId] : [];
  const isMulti = selIds.length > 1;
  const selected = isMulti ? null : (doc?.elements.find((e) => e.id === selectedId) || null);
  const selectIds = (ids) => {
    const u = [...new Set(ids)].filter((id) => doc.elements.some((e) => e.id === id));
    if (u.length <= 1) { setMulti([]); setSelectedIdRaw(u[0] || null); } else { setMulti(u); setSelectedIdRaw(u[u.length - 1]); }
  };
  const groupOf = (id) => { const el = doc.elements.find((e) => e.id === id); return el?.groupId ? doc.elements.filter((e) => e.groupId === el.groupId).map((e) => e.id) : [id]; };
  const pick = (id, add) => {
    if (id !== editingId) setEditingId(null);
    if (!id) { if (!add) selectIds([]); return; }
    const ids = groupOf(id);
    if (add) {
      const has = ids.every((x) => selIds.includes(x));
      selectIds(has ? selIds.filter((x) => !ids.includes(x)) : [...selIds, ...ids]);
    } else if (isMulti && selIds.includes(id)) { /* keep */ } else selectIds(ids);
  };
  const boxOf = (id) => {
    const el = doc.elements.find((e) => e.id === id);
    const node = stageApi.current?.stage()?.findOne(`#${id}`);
    return node ? node.getClientRect({ relativeTo: node.getLayer() }) : { x: el.x, y: el.y, width: el.width || 0, height: el.height || 0 };
  };

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

  const importResult = (res) => {
    if (!res?.elements?.length) { flash('В файле не нашлось слоёв для импорта'); return; }
    const empty = !doc.elements.length;
    let k = 1, ox = 0, oy = 0, patch = {};
    if (res.flow) {
      if (empty && res.height > doc.height) patch = { height: Math.round(res.height) };
      else if (!empty) { const top = Math.min(...res.elements.map((e) => e.y)); oy = -top + 40; }
    } else if (empty) {
      const s = Math.min(1, 4000 / Math.max(res.width, res.height));
      k = s; patch = { width: Math.round(res.width * s), height: Math.round(res.height * s) };
    } else {
      k = Math.min(1, (doc.width * 0.9) / res.width, (doc.height * 0.9) / res.height);
      ox = (doc.width - res.width * k) / 2; oy = (doc.height - res.height * k) / 2;
    }
    const g = res.elements.length > 1 ? uid() : undefined;
    const created = res.elements.map((e) => {
      const { blend, ...rest } = e;
      const c = { rotation: 0, ...rest, ...(blend ? { blend } : {}), id: uid(), groupId: empty ? undefined : g, x: Math.round(e.x * k + ox), y: Math.round(e.y * k + oy) };
      if (c.width) c.width = Math.round(c.width * k);
      if (c.height) c.height = Math.round(c.height * k);
      if (c.fontSize) c.fontSize = Math.max(6, Math.round(c.fontSize * k));
      return c;
    });
    commit((d) => ({ ...d, ...patch, elements: [...d.elements, ...created] }));
    selectIds(created.map((c) => c.id));
    const what = { psd: 'PSD', pdf: 'PDF', docx: 'DOCX' }[res.kind] || 'Файл';
    flash(`${what}: добавлено слоёв — ${created.length}${res.skipped ? `, пропущено пустых — ${res.skipped}` : ''}${patch.width ? '. Размер дизайна взят из файла' : ''}`);
  };

  const multiActions = {
    removeSel: () => { const ids = new Set(selIds); commit((d) => ({ ...d, elements: d.elements.filter((e) => !ids.has(e.id)) })); selectIds([]); },
    duplicateSel: () => {
      const map = {}; const copies = [];
      doc.elements.forEach((e) => { if (selIds.includes(e.id)) { const c = { ...structuredClone(e), id: uid(), x: e.x + 30, y: e.y + 30, locked: false }; if (e.groupId) { map[e.groupId] ||= uid(); c.groupId = map[e.groupId]; } copies.push(c); } });
      commit((d) => ({ ...d, elements: [...d.elements, ...copies] })); selectIds(copies.map((c) => c.id));
    },
    group: () => { if (selIds.length < 2) return; const g = uid(); updateMany(Object.fromEntries(selIds.map((id) => [id, { groupId: g }]))); flash('Сгруппировано: теперь двигается вместе'); },
    ungroup: () => { const ids = selIds.filter((id) => doc.elements.find((e) => e.id === id)?.groupId); if (!ids.length) return; updateMany(Object.fromEntries(ids.map((id) => [id, { groupId: undefined }]))); flash('Группа разобрана'); },
    alignSel: (where) => {
      if (selIds.length < 2) { actions.align(where); return; }
      const boxes = selIds.map((id) => [id, boxOf(id)]);
      const L = Math.min(...boxes.map(([, b]) => b.x)), T = Math.min(...boxes.map(([, b]) => b.y));
      const Rr = Math.max(...boxes.map(([, b]) => b.x + b.width)), B = Math.max(...boxes.map(([, b]) => b.y + b.height));
      const patches = {};
      boxes.forEach(([id, b]) => {
        const el = doc.elements.find((e) => e.id === id);
        const dx = where === 'left' ? L - b.x : where === 'right' ? Rr - b.x - b.width : where === 'hcenter' ? (L + Rr) / 2 - b.x - b.width / 2 : 0;
        const dy = where === 'top' ? T - b.y : where === 'bottom' ? B - b.y - b.height : where === 'vcenter' ? (T + B) / 2 - b.y - b.height / 2 : 0;
        patches[id] = { x: Math.round(el.x + dx), y: Math.round(el.y + dy) };
      });
      updateMany(patches);
    },
    distribute: (axis) => {
      if (selIds.length < 3) { flash('Для распределения выберите хотя бы 3 элемента'); return; }
      const P = axis === 'h' ? ['x', 'width'] : ['y', 'height'];
      const boxes = selIds.map((id) => [id, boxOf(id)]).sort((a, b) => a[1][P[0]] - b[1][P[0]]);
      const start = boxes[0][1][P[0]]; const end = Math.max(...boxes.map(([, b]) => b[P[0]] + b[P[1]]));
      const gap = (end - start - boxes.reduce((s2, [, b]) => s2 + b[P[1]], 0)) / (boxes.length - 1);
      let cur = start; const patches = {};
      boxes.forEach(([id, b]) => { const el = doc.elements.find((e) => e.id === id); patches[id] = { [P[0]]: Math.round(el[P[0]] + cur - b[P[0]]) }; cur += b[P[1]] + gap; });
      updateMany(patches);
    },
    autoLayout: (dir, gap = 24, alignCross = 'start') => {
      if (selIds.length < 2) return;
      const P = dir === 'row' ? ['x', 'width', 'y', 'height'] : ['y', 'height', 'x', 'width'];
      const boxes = selIds.map((id) => [id, boxOf(id)]).sort((a, b) => a[1][P[0]] - b[1][P[0]]);
      let cur = boxes[0][1][P[0]]; const cross = Math.min(...boxes.map(([, b]) => b[P[2]]));
      const crossEnd = Math.max(...boxes.map(([, b]) => b[P[2]] + b[P[3]]));
      const patches = {};
      boxes.forEach(([id, b]) => {
        const el = doc.elements.find((e) => e.id === id);
        const c = alignCross === 'center' ? cross + (crossEnd - cross - b[P[3]]) / 2 : alignCross === 'end' ? crossEnd - b[P[3]] : cross;
        patches[id] = { [P[0]]: Math.round(el[P[0]] + cur - b[P[0]]), [P[2]]: Math.round(el[P[2]] + c - b[P[2]]) };
        cur += b[P[1]] + gap;
      });
      updateMany(patches);
    },
    tidy: (gap = 24) => {
      if (selIds.length < 2) return;
      const boxes = selIds.map((id) => [id, boxOf(id)]).sort((a, b) => a[1].y - b[1].y || a[1].x - b[1].x);
      const cols = Math.ceil(Math.sqrt(boxes.length));
      const cw = Math.max(...boxes.map(([, b]) => b.width)), ch = Math.max(...boxes.map(([, b]) => b.height));
      const x0 = Math.min(...boxes.map(([, b]) => b.x)), y0 = Math.min(...boxes.map(([, b]) => b.y));
      const patches = {};
      boxes.forEach(([id, b], i) => { const el = doc.elements.find((e) => e.id === id); const cx = x0 + (i % cols) * (cw + gap), cy = y0 + Math.floor(i / cols) * (ch + gap); patches[id] = { x: Math.round(el.x + cx - b.x), y: Math.round(el.y + cy - b.y) }; });
      updateMany(patches);
    },
    setForSel: (patch) => updateMany(Object.fromEntries(selIds.map((id) => [id, patch]))),
    copyStyle: () => {
      const src = doc.elements.find((e) => e.id === selectedId); if (!src) return;
      const KEYS = ['fill', 'stroke', 'strokeWidth', 'gradient', 'shadow', 'opacity', 'blend', 'fx', 'cornerRadius', 'fontFamily', 'fontSize', 'fontStyle', 'textDecoration', 'lineHeight', 'letterSpacing', 'align', 'textStroke', 'textStrokeWidth', 'frameStroke', 'frameStrokeWidth', 'dash'];
      styleClip.current = Object.fromEntries(KEYS.filter((k) => src[k] !== undefined).map((k) => [k, structuredClone(src[k])]));
      flash('Стиль скопирован. Ctrl+Alt+V — вставить на другой элемент');
    },
    pasteStyle: () => {
      const st = styleClip.current; if (!st || !selIds.length) return;
      const TEXT_ONLY = ['fontFamily', 'fontSize', 'fontStyle', 'textDecoration', 'lineHeight', 'letterSpacing', 'align', 'textStroke', 'textStrokeWidth'];
      updateMany(Object.fromEntries(selIds.map((id) => { const el = doc.elements.find((e) => e.id === id); const p2 = { ...st }; if (el.type !== 'text') TEXT_ONLY.forEach((k) => delete p2[k]); return [id, p2]; })));
      flash('Стиль вставлен');
    },
    docColors: (ids) => {
      const set2 = new Map();
      doc.elements.filter((e) => !ids || ids.includes(e.id)).forEach((e) => ['fill', 'stroke', 'textStroke', 'frameStroke'].forEach((k) => { const c = e[k]; if (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)) set2.set(c.toLowerCase(), (set2.get(c.toLowerCase()) || 0) + 1); }));
      return [...set2.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c).slice(0, 16);
    },
    replaceColor: (from, to, ids) => commit((d) => ({ ...d, elements: d.elements.map((e) => {
      if (ids && !ids.includes(e.id)) return e;
      const p2 = {}; ['fill', 'stroke', 'textStroke', 'frameStroke'].forEach((k) => { if (typeof e[k] === 'string' && e[k].toLowerCase() === from) p2[k] = to; });
      return Object.keys(p2).length ? { ...e, ...p2 } : e;
    }) })),
  };
  const actions = {
    ...multiActions,
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
      if (typing) return;
      const act = matchAction(ctl.mode, e);
      if (act && runShortcut(act)) { e.preventDefault(); return; }
      if (isMulti) {
        if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); actions.removeSel(); }
        else if (e.key === 'Escape') selectIds([]);
        else if (e.key.startsWith('Arrow')) {
          e.preventDefault(); const s2 = e.shiftKey ? 10 : 1;
          const dx = e.key === 'ArrowLeft' ? -s2 : e.key === 'ArrowRight' ? s2 : 0; const dy = e.key === 'ArrowUp' ? -s2 : e.key === 'ArrowDown' ? s2 : 0;
          updateMany(Object.fromEntries(selIds.map((id) => { const el = doc.elements.find((x) => x.id === id); return [id, { x: el.x + dx, y: el.y + dy }]; })));
        }
        return;
      }
      if (!selected) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); actions.remove(); }
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

  function runShortcut(act) {
    const base = { opacity: 1, rotation: 0 };
    const sel = selIds.length;
    const one = selected;
    switch (act) {
      case 'addText': add({ ...base, type: 'text', text: 'Новый текст', fontFamily: 'Inter', fontSize: 64, width: 600, fill: '#111111', align: 'left', fontStyle: 'bold', lineHeight: 1.2 }); return true;
      case 'addRect': add({ ...base, type: 'rect', width: 400, height: 260, fill: '#0B7CFC', cornerRadius: 0 }); return true;
      case 'addEllipse': add({ ...base, type: 'ellipse', width: 300, height: 300, fill: '#0B7CFC' }); return true;
      case 'addLine': add({ ...base, type: 'line', points: [0, 0, 600, 0], stroke: '#111111', strokeWidth: 4 }); return true;
      case 'duplicate': if (!sel) return false; isMulti ? actions.duplicateSel() : actions.duplicate(); return true;
      case 'group': if (sel < 2) return false; actions.group(); return true;
      case 'ungroup': if (!sel) return false; actions.ungroup(); return true;
      case 'forward': case 'backward': case 'front': case 'back': if (!one) return false; actions.order({ forward: 'up', backward: 'down', front: 'top', back: 'bottom' }[act]); return true;
      case 'hide': if (!sel) return false; actions.setForSel({ visible: false }); selectIds([]); flash('Скрыто. Вернуть — глаз в списке слоёв'); return true;
      case 'lock': if (!sel) return false; { const locked = !doc.elements.find((e) => e.id === selIds[0])?.locked; actions.setForSel({ locked }); flash(locked ? 'Закреплено' : 'Откреплено'); } return true;
      case 'selectAll': selectIds(doc.elements.filter((e) => e.visible !== false && !e.locked).map((e) => e.id)); return true;
      case 'copyStyle': if (!selectedId) return false; actions.copyStyle(); return true;
      case 'pasteStyle': if (!sel) return false; actions.pasteStyle(); return true;
      case 'alignLeft': case 'alignRight': case 'alignTop': case 'alignBottom': case 'alignH': case 'alignV':
        if (!sel) return false; actions.alignSel({ alignLeft: 'left', alignRight: 'right', alignTop: 'top', alignBottom: 'bottom', alignH: 'hcenter', alignV: 'vcenter' }[act]); return true;
      case 'distH': actions.distribute('h'); return true;
      case 'distV': actions.distribute('v'); return true;
      case 'autoLayout': if (sel < 2) return false; { const bs = selIds.map(boxOf); const wide = Math.max(...bs.map((b) => b.x + b.width)) - Math.min(...bs.map((b) => b.x)); const tall = Math.max(...bs.map((b) => b.y + b.height)) - Math.min(...bs.map((b) => b.y)); actions.autoLayout(wide > tall ? 'row' : 'column'); } return true;
      case 'tidy': actions.tidy(); return true;
      case 'zoomIn': setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2))); return true;
      case 'zoomOut': setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2))); return true;
      case 'zoomFit': setZoom(1); return true;
      case 'zoom100': setZoom(Math.max(0.1, 1 / fit)); return true;
      default:
        if (act.startsWith('opacity:') && sel) { const n = Number(act.slice(8)); actions.setForSel({ opacity: n === 0 ? 1 : n / 10 }); return true; }
        return false;
    }
  }

  const savingRef = useRef(null);
  const persist = async (extra = {}) => {
    if (!doc) return;
    const id = workId || uid();
    if (!workId) setWorkId(id);
    const thumb = pageIndex(doc) === 0 ? stageApi.current?.toThumb(360) : await docThumb(pageDoc(doc, 0), null, 360).catch(() => stageApi.current?.toThumb(360));
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
      return true;
    } catch (e) {
      const m = /function|does not exist|column/i.test(e.message) ? 'база устарела, главному редактору нужно заново запустить schema.sql в Supabase' : e.message;
      setToast(`Архив не сохранил работу: ${m}`); setTimeout(() => setToast(''), 7000);
      return false;
    }
  };
  const archiveNow = async () => {
    setExportOpen(false);
    const canvas = await renderFinal('архив', exportOpts.mult);
    await addToArchive(canvas, false);
  };
  const archiveIfNeeded = (canvas) => { if (toArchive) addToArchive(canvas, true); };

  const download = async () => {
    const { format, mult, quality } = exportOpts;
    const type = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' }[format];
    const canvas = await renderFinal(format, mult);
    if (toArchive) addToArchive(canvas, false);
    const blob = await toBlob(canvas, type, quality);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(title || 'cnd').replace(/[\\/:*?"<>|]+/g, '_')}.${format}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setExportOpen(false);
  };

  const [allBusy, setAllBusy] = useState('');
  const exportAll = async (kind) => {
    const total = pageCount(doc); const start = pageIndex(doc);
    setEditingId(null); setSelectedId(null); setExportOpen(false);
    let exportId = '';
    try { const rec = await api.logExport({ workId, title, format: `${kind}-${total}стр`, watermark: WATERMARK_STYLES[styleNow] || styleNow }); exportId = rec?.id || ''; } catch {}
    const mult = kind === 'pdf' ? Math.max(1, exportOpts.mult) : exportOpts.mult;
    const out = [];
    try {
      for (let i = 0; i < total; i++) {
        setAllBusy(`Готовлю страницу ${i + 1} из ${total}…`);
        setDocState((d) => goPage(d, i));
        await new Promise((r) => setTimeout(r, 60));
        await stageApi.current.ready();
        const canvas = stageApi.current.toCanvas(mult);
        await applyWatermark(canvas, { author: session.nickname, exportId, opacity: settings.watermarkOpacity, corner: settings.watermarkCorner, style: styleNow, avoid: [] });
        if (i === 0) archiveIfNeeded(canvas);
        if (kind === 'pdf') out.push({ jpeg: await canvasJpeg(canvas, Math.max(0.85, exportOpts.quality)), pxW: canvas.width, pxH: canvas.height, width: doc.width, height: doc.height });
        else out.push(await toBlob(canvas, 'image/png'));
      }
      setAllBusy('Собираю файл…');
      const base = (title || 'cnd').replace(/[\\/:*?"<>|]+/g, '_');
      let blob, name;
      if (kind === 'pdf') { blob = makePdf(out, { title: title || 'CND' }); name = `${base}.pdf`; }
      else {
        const { default: JSZip } = await import('jszip');
        const zip = new JSZip();
        out.forEach((b, i) => zip.file(`${String(i + 1).padStart(2, '0')}.png`, b));
        blob = await zip.generateAsync({ type: 'blob' }); name = `${base}.zip`;
      }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 8000);
      flash(`Готово: ${total} стр. в ${kind.toUpperCase()}`);
    } catch (e) { flash(`Не получилось: ${e.message}`); }
    setDocState((d) => goPage(d, start));
    setAllBusy('');
  };

  const [animPlaying, setAnimPlaying] = useState(false);
  const animRef = useRef(null);
  const stopAnim = () => { const r = animRef.current; if (r) { cancelAnimationFrame(r.raf); r.anim.restore(); animRef.current = null; } setAnimPlaying(false); };
  const playAnim = async () => {
    if (animRef.current) { stopAnim(); return; }
    setEditingId(null); setSelectedId(null);
    await new Promise((r) => setTimeout(r, 60));
    const anim = makeAnimator(stageApi.current.stage(), doc); const { dur } = timingOf(doc);
    const t0 = performance.now(); setAnimPlaying(true);
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      if (t > dur + 0.6) { stopAnim(); return; }
      anim.apply(Math.min(t, dur)); animRef.current.raf = requestAnimationFrame(tick);
    };
    animRef.current = { anim, raf: requestAnimationFrame(tick) };
  };
  useEffect(() => () => stopAnim(), []);
  const exportAnim = async (kind) => {
    stopAnim(); setEditingId(null); setSelectedId(null); setExportOpen(false);
    const { dur, fps } = timingOf(doc);
    const maxSide = kind === 'gif' ? 720 : 1080;
    const mult = Math.min(1, maxSide / Math.max(doc.width, doc.height));
    let exportId = '';
    try { const rec = await api.logExport({ workId, title, format: kind === 'gif' ? 'gif' : 'видео', watermark: WATERMARK_STYLES[styleNow] || styleNow }); exportId = rec?.id || ''; } catch {}
    const n = Math.max(2, Math.round(dur * fps)); const frames = [];
    try {
      setAllBusy('Готовлю кадры…');
      await new Promise((r) => setTimeout(r, 60));
      await stageApi.current.ready();
      const anim = makeAnimator(stageApi.current.stage(), doc);
      try {
        for (let i = 0; i < n; i++) {
          if (i % 4 === 0) { setAllBusy(`Кадр ${i + 1} из ${n}…`); await new Promise((r) => setTimeout(r, 0)); }
          anim.apply((i / (n - 1)) * dur);
          const c = stageApi.current.toCanvas(mult);
          await applyWatermark(c, { author: session.nickname, exportId, opacity: settings.watermarkOpacity, corner: settings.watermarkCorner, style: styleNow, avoid: [] });
          frames.push(c);
        }
      } finally { anim.restore(); }
      if (toArchive) addToArchive(frames[frames.length - 1], true);
      setAllBusy(kind === 'gif' ? 'Собираю GIF…' : 'Записываю видео…');
      const w = frames[0].width, h = frames[0].height;
      const base = (title || 'cnd').replace(/[\\/:*?"<>|]+/g, '_');
      let blob, name;
      if (kind === 'gif') { blob = await encodeGif(frames, w, h, Math.round(1000 / fps)); name = `${base}.gif`; }
      else { const v = await encodeVideo(frames, w, h, fps); blob = v.blob; name = `${base}.${v.ext}`; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 8000);
      flash(`Готово: ${name}`);
    } catch (e) { flash(`Не получилось: ${e.message}`); }
    setAllBusy('');
  };
  const autoAnimate = (seq) => commit((d) => {
    let i = 0;
    return { ...d, anim: { ...timingOf(d) }, elements: d.elements.map((e) => {
      if (e.locked || e.visible === false || (e.type === 'rect' && e.width >= d.width * 0.95 && e.height >= d.height * 0.95)) return e;
      const type = e.type === 'text' && e.fontSize < 40 ? 'fade' : seq[i % seq.length];
      return { ...e, anim: { ...DEFAULT_ANIM, type, delay: Math.round(Math.min(timingOf(d).dur * 0.7, (i++) * 0.25) * 10) / 10 } };
    }) };
  });

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
  const [myTpls, setMyTpls] = useState([]);
  const guessKind = () => (pageCount(doc) > 1 ? 'Журнал' : doc.width > doc.height ? 'Разворот' : doc.width === doc.height ? 'Пост' : 'Газета');
  const openTplForm = () => {
    setTplForm({ name: title, tags: '', kind: guessKind(), target: '' });
    api.listTemplates().then((list) => {
      const mine = list.filter((t) => !t.official && t.author === session.nickname);
      setMyTpls(mine);
      const src = mine.find((t) => t.id === doc.fromTpl);
      if (src) setTplForm((f) => f && ({ ...f, target: src.id, name: src.name, tags: (src.tags || []).join(', '), kind: src.kind || f.kind }));
    }).catch(() => setMyTpls([]));
  };
  const pickTarget = (id) => {
    const t = myTpls.find((x) => x.id === id);
    setTplForm((f) => (t ? { ...f, target: id, name: t.name, tags: (t.tags || []).join(', '), kind: t.kind || f.kind } : { ...f, target: '' }));
  };
  const saveAsTemplate = async () => {
    const name = tplForm.name.trim(); if (!name) { flash('Введите название шаблона'); return; }
    const tags = tplForm.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const target = tplForm.target;
    setTplForm(null);
    const d0 = pageCount(doc) > 1 ? withPages(doc, allPages(doc), 0) : doc;
    const { fromTpl, ...clean } = { ...d0, elements: d0.elements.map((e) => ({ ...e })) };
    const thumb = pageIndex(doc) === 0 ? stageApi.current.toThumb(360) : await docThumb(pageDoc(doc, 0), null, 360);
    try {
      const rec = await api.saveTemplate({ ...(target ? { id: target } : {}), name, tags, kind: (tplForm.kind || guessKind()).trim(), thumb, doc: clean });
      if (rec?.id) setDocState((d) => ({ ...d, fromTpl: rec.id }));
      touched.current = true;
      flash(target ? 'Шаблон обновлён у всех' : 'Шаблон опубликован — он в разделе «Ваши работы» в шаблонах');
    } catch (e) { flash(e.message); }
  };
  const TPL_KINDS = ['Газета', 'Журнал', 'Пост', 'Разворот', 'Сторис', 'Афиша', 'Quick', 'Стекло', 'Другое'];

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
        <button className="hide-phone" onClick={openTplForm} title="Опубликовать дизайн как шаблон для коллег"><BookmarkPlus size={16} /> <span className="lbl">В шаблоны</span></button>
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
              <button style={{ width: '100%', marginTop: 6 }} onClick={archiveNow} title="Положить работу в ленту архива без скачивания"><FolderArchive size={16} /> Только в архив</button>
              <button className="primary" style={{ width: '100%', marginTop: 10 }} onClick={download}><Download size={16} /> {pageCount(doc) > 1 ? `Скачать страницу ${pageIndex(doc) + 1}` : 'Скачать файл'}</button>
              {pageCount(doc) > 1 && (
                <div className="row" style={{ gap: 6, marginTop: 6 }}>
                  <button className="grow" onClick={() => exportAll('pdf')} title="Все страницы одним PDF"><FileText size={16} /> Весь PDF</button>
                  <button className="grow" onClick={() => exportAll('zip')} title="Все страницы картинками в ZIP"><FolderArchive size={16} /> ZIP ({pageCount(doc)})</button>
                </div>
              )}
              {hasAnims(doc) && (
                <div className="row" style={{ gap: 6, marginTop: 6 }}>
                  <button className="grow" onClick={() => exportAnim('gif')} title="Анимация в GIF"><Film size={16} /> GIF</button>
                  <button className="grow" onClick={() => exportAnim('video')} title="Анимация в видео WebM"><Film size={16} /> Видео</button>
                </div>
              )}
              <button style={{ width: '100%', marginTop: 6 }} onClick={copyToClipboard}><Copy size={16} /> Копировать в буфер (PNG)</button>
              {mobile && <button style={{ width: '100%', marginTop: 6 }} onClick={() => { setExportOpen(false); openTplForm(); }}><BookmarkPlus size={16} /> Опубликовать как шаблон</button>}
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
          {tab === 'magazine' && <MagazinePanel doc={doc} add={add} flash={flash}
            replaceDoc={(d) => { commit(d); setSelectedId(null); }}
            addAllPages={(fn) => commit((d) => applyToAllPages(d, fn))} />}
          {tab === 'anim' && <AnimPanel doc={doc} selected={selected} update={update} playing={animPlaying} play={playAnim} exportAnim={exportAnim} busy={!!allBusy}
            setTiming={(p) => commit((d) => ({ ...d, anim: { ...timingOf(d), ...p } }))} autoAnimate={autoAnimate} />}
          {tab === 'text' && <TextPanel add={add} />}
          {tab === 'photos' && <PhotosPanel addImageFile={addImageFile} uploads={uploads} addImage={addImage} importResult={importResult} docW={doc.width} pendingImport={pendingImport} clearPending={() => setPendingImport(null)} />}
          {tab === 'elements' && <ElementsPanel add={add} addImage={addImage} flash={flash} openPoser={(skin, mode = 'body') => setPoserSkin({ skin, mode })} />}
          {tab === 'brand' && <BrandPanel addImage={addImage} applyColor={applyColor} applyFont={applyFont} />}
          {tab !== 'photos' && <input id="photo-file" type="file" accept="image/*" hidden onChange={(e) => { [...e.target.files].forEach((f) => addImageFile(f)); e.target.value = ''; }} />}
        </div>
        <div className="work-col">
        <div className="workspace" ref={wsRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const target = stageApi.current?.elementAt(e.clientX, e.clientY);
            const ph = doc.elements.find((x) => x.id === target && isFrame(x));
            const files = [...e.dataTransfer.files];
            const doc0 = files.find((f) => importKind(f));
            if (doc0) { setPendingImport(doc0); setTab('photos'); if (mobile) setSheet('drawer'); }
            files.filter((f) => !importKind(f)).forEach((f, i) => addImageFile(f, i === 0 && ph ? ph.id : null));
          }}>
          <div className="stage-shadow" style={{ position: 'relative' }}>
            <CanvasStage ref={stageApi} doc={doc} scale={scale} selectedId={selectedId} selectedIds={selIds} onSelect={pick}
              onChangeMany={updateMany} onMarquee={(ids, add) => selectIds(add ? [...selIds, ...ids.flatMap(groupOf)] : ids.flatMap(groupOf))}
              onChange={update} onEditText={setEditingId} editingId={editingId} fontTick={fontTick} pageNo={pageIndex(doc) + 1} pageTotal={pageCount(doc)} />
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
        <PageBar pages={allPages(doc)} current={pageIndex(doc)} thumbs={pageThumbs} ratio={`${doc.width} / ${doc.height}`}
          onGo={switchPage} onAdd={pageOps.add} onDuplicate={pageOps.duplicate} onDelete={pageOps.remove} onMove={pageOps.move} />
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
        <PropsPanel doc={doc} el={selected} update={update} updateDoc={updateDoc} actions={actions} select={setSelectedId} selectedId={selectedId}
          multi={isMulti ? selIds : null} ctl={ctl} />
        </div>
      </div>
      {allBusy && <div className="busy-overlay"><div className="card">{allBusy}</div></div>}
      {imageTool && selected?.type === 'image' && (() => {
        const Tool = imageTool === 'bg' ? BgRemoveModal : UpscaleModal;
        return <Tool el={selected} onClose={() => setImageTool(null)} onApply={(src, orig) => { update(selected.id, { src, origSrc: orig }); setImageTool(null); flash(imageTool === 'bg' ? 'Фон убран' : 'Качество улучшено'); }} />;
      })()}
      {poserSkin && <SkinPoser skin={poserSkin.skin} mode={poserSkin.mode} onClose={() => setPoserSkin(null)} onInsert={(url, m) => { setPoserSkin(null); addImage(url, { name: m === 'head' ? '3D-голова' : '3D-персонаж' }); }} />}
      {tplForm && (
        <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && setTplForm(null)}>
          <form className="modal" style={{ maxWidth: 420 }} onSubmit={(e) => { e.preventDefault(); saveAsTemplate(); }}>
            <h2>{tplForm.target ? 'Обновить шаблон' : 'Сохранить как шаблон'}</h2>
            <p className="small muted">{tplForm.target ? 'Шаблон заменится у всех: коллеги увидят новую версию.' : 'Шаблон появится в общей библиотеке, коллеги найдут его поиском.'}</p>
            {myTpls.length > 0 && (<>
              <label htmlFor="tpl-target">Куда</label>
              <select id="tpl-target" value={tplForm.target} onChange={(e) => pickTarget(e.target.value)}>
                <option value="">Новый шаблон</option>
                {myTpls.map((t) => <option key={t.id} value={t.id}>Обновить «{t.name}»</option>)}
              </select>
            </>)}
            <label htmlFor="tpl-name">Название</label>
            <input id="tpl-name" autoFocus value={tplForm.name} onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })} />
            <label htmlFor="tpl-tags">Теги через запятую</label>
            <input id="tpl-tags" placeholder="газета, новости, срочно" value={tplForm.tags} onChange={(e) => setTplForm({ ...tplForm, tags: e.target.value })} />
            <label htmlFor="tpl-kind">Раздел</label>
            <input id="tpl-kind" list="tpl-kinds" value={tplForm.kind} onChange={(e) => setTplForm({ ...tplForm, kind: e.target.value })} />
            <datalist id="tpl-kinds">{TPL_KINDS.map((k) => <option key={k} value={k} />)}</datalist>
            <div className="row" style={{ marginTop: 14 }}>
              <button type="submit" className="primary">{tplForm.target ? 'Обновить у всех' : 'Опубликовать шаблон'}</button>
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

