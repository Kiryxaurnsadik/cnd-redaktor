import { BRAND_COLORS, FONTS } from '../lib/brand.js';

function Color({ label, value, onChange }) {
  return (
    <>
      <label>{label}</label>
      <div className="row">
        <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} style={{ width: 52 }} />
        <input value={value || ''} onChange={(e) => onChange(e.target.value)} />
      </div>
      <div className="swatches">
        {BRAND_COLORS.map((c) => <button key={c.value} className="swatch" title={c.name} style={{ background: c.value }} onClick={() => onChange(c.value)} />)}
      </div>
    </>
  );
}

const num = (v) => Math.round(Number(v) * 10) / 10;
const TYPE_NAMES = { text: 'Текст', rect: 'Фигура', ellipse: 'Круг', line: 'Линия', image: 'Картинка', placeholder: 'Рамка для фото' };

export function elName(e) {
  if (e.name) return e.name;
  if (e.type === 'text') return e.text.slice(0, 28) || 'Текст';
  return TYPE_NAMES[e.type] || e.type;
}

export default function PropsPanel({ doc, el, update, updateDoc, actions, select, selectedId }) {
  const set = (patch) => update(el.id, patch);
  const toggleStyle = (part) => {
    const cur = new Set((el.fontStyle || 'normal').split(' ').filter((x) => x !== 'normal'));
    cur.has(part) ? cur.delete(part) : cur.add(part);
    set({ fontStyle: [...cur].sort().join(' ') || 'normal' });
  };
  return (
    <div className="props">
      {!el && (
        <>
          <h3>Документ</h3>
          <div className="muted small">{doc.width} × {doc.height} px</div>
          <div className="two">
            <div><label>Ширина</label><input type="number" value={doc.width} onChange={(e) => updateDoc({ width: Math.max(50, Number(e.target.value)) })} /></div>
            <div><label>Высота</label><input type="number" value={doc.height} onChange={(e) => updateDoc({ height: Math.max(50, Number(e.target.value)) })} /></div>
          </div>
          <Color label="Фон" value={doc.background} onChange={(v) => updateDoc({ background: v })} />
        </>
      )}
      {el && (
        <>
          <div className="row"><h3 className="grow" style={{ margin: 0 }}>{TYPE_NAMES[el.type]}</h3>
            <button className="small" title="Дублировать (Ctrl+D)" onClick={actions.duplicate}>⧉</button>
            <button className="small danger" title="Удалить (Delete)" onClick={actions.remove}>🗑</button>
          </div>
          {el.type === 'text' && (
            <>
              <label>Текст (двойной клик по тексту — править на холсте)</label>
              <textarea rows={4} value={el.text} onChange={(e) => set({ text: e.target.value })} />
              <label>Шрифт</label>
              <select value={el.fontFamily} onChange={(e) => set({ fontFamily: e.target.value })}>
                {FONTS.map((f) => <option key={f} style={{ fontFamily: f }}>{f}</option>)}
              </select>
              <div className="two">
                <div><label>Размер</label><input type="number" value={num(el.fontSize)} onChange={(e) => set({ fontSize: Number(e.target.value) })} /></div>
                <div><label>Межстрочный</label><input type="number" step="0.05" value={el.lineHeight || 1.2} onChange={(e) => set({ lineHeight: Number(e.target.value) })} /></div>
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <button className={el.fontStyle?.includes('bold') ? 'primary' : ''} onClick={() => toggleStyle('bold')}><b>Ж</b></button>
                <button className={el.fontStyle?.includes('italic') ? 'primary' : ''} onClick={() => toggleStyle('italic')}><i>К</i></button>
                <button className={el.textDecoration === 'underline' ? 'primary' : ''} onClick={() => set({ textDecoration: el.textDecoration === 'underline' ? '' : 'underline' })}><u>Ч</u></button>
                <button onClick={() => set({ text: el.text === el.text.toUpperCase() ? el.text.toLowerCase() : el.text.toUpperCase() })}>Аа</button>
                <button className={el.shadow ? 'primary' : ''} title="Тень" onClick={() => set({ shadow: !el.shadow })}>Т</button>
              </div>
              <label>Выравнивание</label>
              <select value={el.align} onChange={(e) => set({ align: e.target.value })}>
                <option value="left">По левому краю</option><option value="center">По центру</option>
                <option value="right">По правому краю</option><option value="justify">По ширине</option>
              </select>
              <label>Межбуквенный: {el.letterSpacing || 0}</label>
              <input type="range" min="-5" max="30" value={el.letterSpacing || 0} onChange={(e) => set({ letterSpacing: Number(e.target.value) })} />
              <Color label="Цвет текста" value={el.fill} onChange={(v) => set({ fill: v })} />
            </>
          )}
          {['rect', 'ellipse', 'placeholder'].includes(el.type) && (
            <>
              <Color label="Заливка" value={el.fill} onChange={(v) => set({ fill: v })} />
              {el.type !== 'ellipse' && (<><label>Скругление</label><input type="number" value={el.cornerRadius || 0} onChange={(e) => set({ cornerRadius: Number(e.target.value) })} /></>)}
              {el.type !== 'placeholder' && (<div className="two">
                <div><label>Обводка</label><input type="color" value={el.stroke || '#000000'} onChange={(e) => set({ stroke: e.target.value })} /></div>
                <div><label>Толщина</label><input type="number" value={el.strokeWidth || 0} onChange={(e) => set({ strokeWidth: Number(e.target.value) })} /></div>
              </div>)}
              {el.type === 'placeholder' && (<><label>Подпись</label><input value={el.label || ''} onChange={(e) => set({ label: e.target.value })} />
                <button className="primary" style={{ marginTop: 10, width: '100%' }} onClick={actions.pickPhotoForPlaceholder}>Вставить фото сюда</button></>)}
            </>
          )}
          {el.type === 'line' && (
            <>
              <Color label="Цвет" value={el.stroke} onChange={(v) => set({ stroke: v })} />
              <label>Толщина</label><input type="number" value={el.strokeWidth} onChange={(e) => set({ strokeWidth: Number(e.target.value) })} />
              <label className="row"><input type="checkbox" style={{ width: 'auto' }} checked={!!el.dash} onChange={(e) => set({ dash: e.target.checked })} /> Пунктир</label>
            </>
          )}
          {el.type === 'image' && (
            <div className="row wrap" style={{ marginTop: 8 }}>
              <button onClick={actions.fitImage}>Растянуть на холст</button>
              <button onClick={actions.resetRatio}>Исходные пропорции</button>
            </div>
          )}
          <div className="two">
            <div><label>X</label><input type="number" value={num(el.x)} onChange={(e) => set({ x: Number(e.target.value) })} /></div>
            <div><label>Y</label><input type="number" value={num(el.y)} onChange={(e) => set({ y: Number(e.target.value) })} /></div>
            {el.type !== 'line' && <div><label>Ширина</label><input type="number" value={num(el.width)} onChange={(e) => set({ width: Number(e.target.value) })} /></div>}
            {!['text', 'line'].includes(el.type) && <div><label>Высота</label><input type="number" value={num(el.height)} onChange={(e) => set({ height: Number(e.target.value) })} /></div>}
            <div><label>Поворот</label><input type="number" value={num(el.rotation || 0)} onChange={(e) => set({ rotation: Number(e.target.value) })} /></div>
          </div>
          <label>Прозрачность: {Math.round((el.opacity ?? 1) * 100)}%</label>
          <input type="range" min="0" max="1" step="0.05" value={el.opacity ?? 1} onChange={(e) => set({ opacity: Number(e.target.value) })} />
          <div className="row wrap" style={{ marginTop: 10 }}>
            <button className="small" onClick={() => actions.order('top')}>Наверх</button>
            <button className="small" onClick={() => actions.order('up')}>Выше</button>
            <button className="small" onClick={() => actions.order('down')}>Ниже</button>
            <button className="small" onClick={() => actions.order('bottom')}>Вниз</button>
            <button className="small" onClick={() => actions.center()}>По центру</button>
          </div>
        </>
      )}
      <h3 style={{ marginTop: 20 }}>Слои</h3>
      {[...doc.elements].reverse().map((e) => (
        <div key={e.id} className={`layer ${e.id === selectedId ? 'sel' : ''}`} onClick={() => select(e.id)}>
          <span className="name" style={{ opacity: e.visible === false ? 0.4 : 1 }}>{elName(e)}</span>
          <button title="Показать/скрыть" onClick={(ev) => { ev.stopPropagation(); update(e.id, { visible: e.visible === false }); }}>{e.visible === false ? '◌' : '👁'}</button>
          <button title="Закрепить" onClick={(ev) => { ev.stopPropagation(); update(e.id, { locked: !e.locked }); }}>{e.locked ? '🔒' : '🔓'}</button>
        </div>
      ))}
      {!doc.elements.length && <p className="muted small">Добавьте текст, фото или элементы слева.</p>}
    </div>
  );
}
