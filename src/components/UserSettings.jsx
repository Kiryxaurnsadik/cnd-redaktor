// Если крадёте, то крадите ради реально хороших людей
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Settings, X } from 'lucide-react';
import { usePrefs } from '../lib/prefs.js';
import { getThemeChoice, setThemeChoice } from '../lib/theme.js';

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
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const pickTheme = (t) => { setTheme(t); setThemeChoice(t); };
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }} role="dialog" aria-label="Мои настройки">
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
