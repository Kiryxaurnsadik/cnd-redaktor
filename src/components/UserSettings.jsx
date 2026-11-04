// Если крадёте, то крадите ради реально хороших людей
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Settings, X } from 'lucide-react';
import { usePrefs } from '../lib/prefs.js';
import { getThemeChoice, setThemeChoice } from '../lib/theme.js';
import { UI_ACCENTS, UI_BG_GRADIENTS, UI_FONTS } from '../lib/uitheme.js';
import { CONTROL_MODES } from '../lib/controls.js';
import { compressImage } from '../lib/util.js';
import '../lib/fonts.js';

function Toggle({ checked, onChange, title, hint }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="sw" aria-hidden="true" />
      <span className="grow"><b>{title}</b>{hint && <span className="small muted">{hint}</span>}</span>
    </label>
  );
}

export function UserSettingsModal({ onClose }) {
  const [p, set] = usePrefs();
  const [theme, setTheme] = useState(getThemeChoice());
  const [bgErr, setBgErr] = useState('');
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const pickTheme = (t) => { setTheme(t); setThemeChoice(t); };
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }} role="dialog" aria-label="Мои настройки">
        <div className="row" style={{ marginBottom: 6 }}>
          <Settings size={20} color="var(--brand)" />
          <h2 className="grow" style={{ margin: 0 }}>Мои настройки</h2>
          <button className="icon ghost" onClick={onClose} aria-label="Закрыть"><X size={18} /></button>
        </div>
        <p className="small muted">Сохраняются сразу и только в этом браузере.</p>

        <h3 className="set-h">Оформление</h3>
        <div className="seg">
          {[['light', 'Светлая'], ['dark', 'Тёмная'], ['system', 'Как в системе']].map(([k, l]) => (
            <button key={k} className={theme === k ? 'on' : ''} onClick={() => pickTheme(k)}>{l}</button>
          ))}
        </div>

        <h3 className="set-h">Цвет интерфейса</h3>
        <div className="accent-row">
          {UI_ACCENTS.map(([c, name]) => (
            <button key={c} className={`sw-btn ${(p.uiAccent || '#0B7CFC').toLowerCase() === c.toLowerCase() ? 'on' : ''}`} title={name} aria-label={name} style={{ background: c }} onClick={() => set({ uiAccent: c === '#0B7CFC' ? null : c })} />
          ))}
          <input type="color" title="Свой цвет" value={p.uiAccent || '#0B7CFC'} onChange={(e) => set({ uiAccent: e.target.value })} />
        </div>

        <h3 className="set-h">Шрифт интерфейса</h3>
        <select value={p.uiFont || 'Inter'} onChange={(e) => set({ uiFont: e.target.value })} style={{ fontFamily: p.uiFont || 'Inter' }}>
          {UI_FONTS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}{f === 'Inter' ? ' (обычный)' : ''}</option>)}
        </select>

        <h3 className="set-h">Фон интерфейса</h3>
        <div className="bg-row">
          <button className={!p.uiBg ? 'on' : ''} onClick={() => set({ uiBg: null })}>Обычный</button>
          {UI_BG_GRADIENTS.map((g) => <button key={g} className={p.uiBg?.value === g ? 'on' : ''} style={{ background: g }} aria-label="Градиентный фон" onClick={() => set({ uiBg: { type: 'gradient', value: g } })} />)}
          <button className={p.uiBg?.type === 'image' ? 'on' : ''} style={p.uiBg?.type === 'image' ? { backgroundImage: `url("${p.uiBg.value}")`, color: '#fff' } : {}} onClick={() => document.getElementById('ui-bg-file').click()}>Своя картинка…</button>
        </div>
        <input id="ui-bg-file" type="file" accept="image/*" hidden onChange={async (e) => {
          const f = e.target.files[0]; e.target.value = ''; if (!f) return;
          try { const url = await compressImage(f, 1600, 0.8, 'image/jpeg'); set({ uiBg: { type: 'image', value: url, dim: 0.35 } }); setBgErr(''); }
          catch { setBgErr('Не получилось сохранить картинку. Попробуйте файл поменьше.'); }
        }} />
        {p.uiBg?.type === 'image' && (<>
          <label>Затемнение картинки: {Math.round((p.uiBg.dim ?? 0.35) * 100)}%</label>
          <input type="range" min="0" max="0.85" step="0.05" value={p.uiBg.dim ?? 0.35} onChange={(e) => set({ uiBg: { ...p.uiBg, dim: Number(e.target.value) } })} />
        </>)}
        {bgErr && <div className="error">{bgErr}</div>}

        <h3 className="set-h">Управление</h3>
        <p className="small muted" style={{ marginTop: 0 }}>Какие горячие клавиши и инструменты показывать, чтобы не путаться.</p>
        <div className="mode-list">
          {Object.entries(CONTROL_MODES).map(([k, m]) => (
            <button key={k} className={(p.controls || 'canva') === k ? 'on' : ''} onClick={() => set({ controls: k })}>
              <b>{m.label}{k === 'canva' ? ' (по умолчанию)' : ''}</b><span>{m.hint}</span>
            </button>
          ))}
        </div>

        <h3 className="set-h">Помощь</h3>
        <Toggle checked={p.autoHelp} onChange={(v) => set({ autoHelp: v })} title="Открывать инструкцию после входа" hint="Выключите, если уже освоились" />
        <Toggle checked={p.tips} onChange={(v) => set({ tips: v })} title="Подсказки в редакторе" hint="Строка с советом внизу листа" />

        <h3 className="set-h">Скачивание</h3>
        <Toggle checked={p.archiveOnExport} onChange={(v) => set({ archiveOnExport: v })} title="Добавлять работы в ленту архива" hint="При скачивании, копировании и отправке в Discord" />
        <div className="two-col">
          <div>
            <label>Формат по умолчанию</label>
            <select value={p.exportFormat} onChange={(e) => set({ exportFormat: e.target.value })}>
              <option value="png">PNG</option><option value="jpg">JPG</option><option value="webp">WEBP</option>
            </select>
          </div>
          <div>
            <label>Размер</label>
            <select value={p.exportMult} onChange={(e) => set({ exportMult: Number(e.target.value) })}>
              <option value={1}>1×</option><option value={2}>2×</option><option value={0.5}>0.5×</option>
            </select>
          </div>
        </div>
        <div className="row" style={{ marginTop: 18, justifyContent: 'flex-end' }}>
          <button className="primary" onClick={onClose}>Готово</button>
        </div>
      </div>
    </div>
  );
}

export function UserSettingsButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="icon" title="Мои настройки" aria-label="Мои настройки" onClick={() => setOpen(true)}><Settings size={18} /></button>
      {open && createPortal(<UserSettingsModal onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}
