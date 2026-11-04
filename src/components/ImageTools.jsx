// Если крадёте, то крадите ради реально хороших людей
import { useEffect, useRef, useState } from 'react';
import { Pipette, Sparkles, Wand2, X } from 'lucide-react';
import { UPSCALE_MODES, pickColor, removeBackground, upscaleImage } from '../lib/imagetools.js';
import { loadImage } from '../lib/util.js';

function Preview({ src, onPick, picking }) {
  const ref = useRef(null);
  const click = (e) => {
    if (!picking) return;
    const r = ref.current.getBoundingClientRect();
    onPick((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  };
  return (
    <div className="imgtool-view">
      {src ? <img ref={ref} src={src} alt="" onClick={click} style={{ cursor: picking ? 'crosshair' : 'default' }} /> : <div className="muted small">Обработка…</div>}
    </div>
  );
}

export function BgRemoveModal({ el, onApply, onClose }) {
  const original = el.origSrc || el.src;
  const [tol, setTol] = useState(40);
  const [feather, setFeather] = useState(1);
  const [everywhere, setEverywhere] = useState(false);
  const [auto, setAuto] = useState(true);
  const [picks, setPicks] = useState([]);
  const [picking, setPicking] = useState(false);
  const [out, setOut] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const job = useRef(0);

  useEffect(() => {
    const id = ++job.current; setBusy(true);
    const t = setTimeout(() => {
      removeBackground(original, { tolerance: tol, feather, everywhere, picks, auto })
        .then((u) => { if (id === job.current) { setOut(u); setErr(''); } })
        .catch((e) => id === job.current && setErr(e.message || 'Не получилось'))
        .finally(() => id === job.current && setBusy(false));
    }, 180);
    return () => clearTimeout(t);
  }, [original, tol, feather, everywhere, picks, auto]);

  const onPick = async (x, y) => {
    const color = await pickColor(original, x, y);
    setPicks((p) => [...p, { x, y, color }]); setPicking(false);
  };

  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal imgtool" role="dialog" aria-label="Убрать фон">
        <div className="row" style={{ marginBottom: 12 }}>
          <Wand2 size={20} color="var(--brand)" />
          <h2 className="grow" style={{ margin: 0 }}>Убрать фон</h2>
          <button className="icon ghost" onClick={onClose} aria-label="Закрыть"><X size={18} /></button>
        </div>
        <div className="imgtool-body">
          <div>
            <div className="imgtool-pair">
              <Preview src={original} picking={picking} onPick={onPick} />
              <Preview src={busy && !out ? '' : out} />
            </div>
            <p className="small muted">{picking ? 'Кликните по цвету фона на левой картинке.' : 'Слева оригинал, справа результат на прозрачном фоне.'}</p>
          </div>
          <div>
            <label className="row" style={{ gap: 8 }}><input type="checkbox" style={{ width: 'auto' }} checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Найти фон по краям картинки</label>
            <label>Точность: {tol}</label>
            <input type="range" min="4" max="140" value={tol} onChange={(e) => setTol(Number(e.target.value))} />
            <p className="small muted" style={{ marginTop: 0 }}>Больше — убирает больше похожих цветов.</p>
            <label>Края: {feather} px</label>
            <input type="range" min="0" max="4" value={feather} onChange={(e) => setFeather(Number(e.target.value))} />
            <button style={{ marginTop: 10, width: '100%' }} className={picking ? 'primary' : ''} onClick={() => setPicking((p) => !p)}><Pipette size={16} /> {picking ? 'Кликните по фону…' : 'Пипетка: выбрать цвет фона'}</button>
            {!!picks.length && (
              <div className="row" style={{ marginTop: 8, flexWrap: 'wrap', gap: 6 }}>
                {picks.map((p, i) => <span key={i} className="swatch" style={{ background: `rgb(${p.color.join(',')})` }} />)}
                <button className="small" onClick={() => setPicks([])}>Сбросить цвета</button>
              </div>
            )}
            <label className="row" style={{ gap: 8, marginTop: 10 }}><input type="checkbox" style={{ width: 'auto' }} checked={everywhere} onChange={(e) => setEverywhere(e.target.checked)} /> Убирать эти цвета везде, а не только снаружи</label>
            {err && <div className="error">{err}</div>}
            <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={onClose}>Отмена</button>
              <button className="primary" disabled={busy || !out} onClick={() => onApply(out, original)}>{busy ? 'Считаю…' : 'Применить'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UpscaleModal({ el, onApply, onClose }) {
  const [factor, setFactor] = useState(2);
  const [mode, setMode] = useState('photo');
  const [size, setSize] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { loadImage(el.src).then((i) => setSize([i.width, i.height])).catch(() => {}); }, [el.src]);
  const run = async () => {
    setBusy(true); setErr('');
    try { const r = await upscaleImage(el.src, factor, mode); onApply(r.src, el.origSrc || el.src); }
    catch (e) { setErr(e.message || 'Не получилось'); setBusy(false); }
  };
  const target = size && [Math.round(size[0] * factor), Math.round(size[1] * factor)];
  const capped = target && Math.max(...target) > 3200;
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460 }} role="dialog" aria-label="Улучшить качество">
        <div className="row" style={{ marginBottom: 12 }}>
          <Sparkles size={20} color="var(--brand)" />
          <h2 className="grow" style={{ margin: 0 }}>Улучшить качество</h2>
          <button className="icon ghost" onClick={onClose} aria-label="Закрыть"><X size={18} /></button>
        </div>
        <label>Увеличить</label>
        <div className="seg">
          {[2, 3, 4].map((f) => <button key={f} className={factor === f ? 'on' : ''} onClick={() => setFactor(f)}>{f}×</button>)}
        </div>
        <label>Что на картинке</label>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          {Object.entries(UPSCALE_MODES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        {size && <p className="small muted">Сейчас {size[0]}×{size[1]} px, станет {capped ? 'до 3200 px по большей стороне' : `${target[0]}×${target[1]} px`}. Размер на листе не меняется, картинка становится чётче.</p>}
        {err && <div className="error">{err}</div>}
        <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
          <button onClick={onClose}>Отмена</button>
          <button className="primary" disabled={busy} onClick={run}>{busy ? 'Улучшаю…' : 'Улучшить'}</button>
        </div>
      </div>
    </div>
  );
}
