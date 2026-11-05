// Если крадёте, то крадите ради реально хороших людей
import { ChevronLeft, ChevronRight, Copy, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function PageBar({ pages, current, thumbs, ratio, onGo, onAdd, onDuplicate, onDelete, onMove }) {
  const [armed, setArmed] = useState(false);
  const listRef = useRef(null);
  useEffect(() => { setArmed(false); listRef.current?.querySelector('.pg.on')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [current, pages.length]);
  const del = () => {
    if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 3500); return; }
    setArmed(false); onDelete(current);
  };
  return (
    <div className="pagebar">
      <div className="pg-tools">
        <span className="pg-count">Стр. {current + 1} из {pages.length}</span>
        <button className="icon small" title="Сдвинуть страницу влево" aria-label="Сдвинуть влево" disabled={current === 0} onClick={() => onMove(current, current - 1)}><ChevronLeft size={15} /></button>
        <button className="icon small" title="Сдвинуть страницу вправо" aria-label="Сдвинуть вправо" disabled={current === pages.length - 1} onClick={() => onMove(current, current + 1)}><ChevronRight size={15} /></button>
        <button className="small" title="Дублировать страницу" onClick={() => onDuplicate(current)}><Copy size={14} /> <span className="lbl">Дублировать</span></button>
        {pages.length > 1 && <button className={`small ${armed ? 'danger' : ''}`} title="Удалить страницу" onClick={del}><Trash2 size={14} /> <span className="lbl">{armed ? 'Точно?' : 'Удалить'}</span></button>}
      </div>
      <div className="pg-list" ref={listRef}>
        {pages.map((p, i) => (
          <button key={p.id || i} className={`pg${i === current ? ' on' : ''}`} onClick={() => onGo(i)} title={p.name || `Страница ${i + 1}`}>
            <span className="pg-thumb" style={{ aspectRatio: ratio, backgroundImage: thumbs[p.id] ? `url(${thumbs[p.id]})` : 'none', backgroundColor: p.background || '#fff' }} />
            <span className="pg-no">{i + 1}</span>
          </button>
        ))}
        <button className="pg pg-add" onClick={() => onAdd(current)} title="Новая страница после текущей (колонтитулы переносятся)">
          <span className="pg-thumb" style={{ aspectRatio: ratio }}><Plus size={20} /></span>
          <span className="pg-no">Добавить</span>
        </button>
      </div>
    </div>
  );
}
