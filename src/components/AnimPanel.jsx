// Если крадёте, то крадите ради реально хороших людей
import { Clapperboard, Eye, Film, Pause, Play, Wand2 } from 'lucide-react';
import { ANIMS, DEFAULT_ANIM, hasAnims, timingOf } from '../lib/anim.js';

const AUTO = ['fade', 'up', 'up', 'left', 'zoom', 'up'];

export default function AnimPanel({ doc, selected, update, setTiming, autoAnimate, playing, play, exportAnim, busy }) {
  const tm = timingOf(doc);
  const a = selected?.anim || { type: 'none', delay: 0, dur: 0.6 };
  const setA = (p) => update(selected.id, { anim: { ...DEFAULT_ANIM, ...a, ...p } });
  const list = doc.elements.filter((e) => e.anim && e.anim.type !== 'none');
  return (
    <>
      <h3><Clapperboard size={18} /> Анимация</h3>
      <p className="small muted">Выберите элемент на холсте и задайте ему анимацию. Потом скачайте всё как GIF или видео.</p>
      <div className="row" style={{ gap: 8 }}>
        <div className="grow"><label>Длина, с</label><input type="number" min={1} max={15} step={0.5} value={tm.dur} onChange={(e) => setTiming({ dur: Math.min(15, Math.max(1, Number(e.target.value) || 4)) })} /></div>
        <div className="grow"><label>Кадров в секунду</label>
          <select value={tm.fps} onChange={(e) => setTiming({ fps: Number(e.target.value) })}>{[8, 10, 12, 15, 20, 25].map((f) => <option key={f} value={f}>{f}</option>)}</select></div>
      </div>
      <p className="small muted" style={{ margin: '4px 0 0' }}>Итог: {tm.dur} с · {Math.round(tm.dur * tm.fps)} кадров{list.length ? ` · последняя анимация закончится на ${Math.max(...list.map((e) => (e.anim.delay || 0) + (e.anim.dur || 0.6))).toFixed(1)} с` : ''}</p>
      {selected ? (
        <div className="anim-box" style={{ marginTop: 10 }}>
          <label>Анимация «{selected.name || selected.text?.slice(0, 20) || selected.type}»</label>
          <select value={a.type} onChange={(e) => setA({ type: e.target.value })}>
            {Object.entries(ANIMS).filter(([k]) => k !== 'type' || selected.type === 'text').map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          {a.type !== 'none' && (<>
            <label>Начало: {Number(a.delay || 0).toFixed(1)} с</label>
            <input type="range" min={0} max={tm.dur} step={0.1} value={a.delay || 0} onChange={(e) => setA({ delay: Number(e.target.value) })} />
            <label>{ANIMS[a.type]?.loop ? 'Период' : 'Длительность'}: {Number(a.dur || 0.6).toFixed(1)} с</label>
            <input type="range" min={0.2} max={4} step={0.1} value={a.dur || 0.6} onChange={(e) => setA({ dur: Number(e.target.value) })} />
          </>)}
        </div>
      ) : <p className="small muted" style={{ marginTop: 10 }}>Ничего не выбрано.</p>}
      <button style={{ width: '100%', marginTop: 10 }} onClick={() => autoAnimate(AUTO)}><Wand2 size={16} /> Оживить всё по очереди</button>
      <button className="primary" style={{ width: '100%', marginTop: 6 }} disabled={!hasAnims(doc)} onClick={play}>{playing ? <><Pause size={16} /> Стоп</> : <><Play size={16} /> Просмотр</>}</button>
      <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
        <button className="grow" disabled={!hasAnims(doc) || busy} onClick={() => exportAnim('gif', true)} title="Собрать GIF и посмотреть перед скачиванием"><Eye size={16} /> Просмотр GIF</button>
        <button className="grow" disabled={!hasAnims(doc) || busy} onClick={() => exportAnim('gif')}><Film size={16} /> Скачать GIF</button>
        <button className="grow" disabled={!hasAnims(doc) || busy} onClick={() => exportAnim('video')}><Film size={16} /> Видео</button>
      </div>
      <p className="small muted">GIF до 720 px, видео WebM до 1080 px. Водяной знак ставится на каждый кадр.</p>
      {!!list.length && (<>
        <h4 className="set-h">Анимировано ({list.length})</h4>
        <div className="small">{list.sort((x, y) => (x.anim.delay || 0) - (y.anim.delay || 0)).map((e) => (
          <div key={e.id} className="row" style={{ justifyContent: 'space-between' }}><span>{e.name || e.text?.slice(0, 24) || e.type}</span><span className="muted">{ANIMS[e.anim.type]?.label} · {Number(e.anim.delay || 0).toFixed(1)} с</span></div>
        ))}</div>
      </>)}
    </>
  );
}
