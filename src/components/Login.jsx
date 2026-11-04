// Если крадёте, то крадите ради реально хороших людей
import { useEffect, useState } from 'react';
import { api } from '../api/index.js';
import { BRAND } from '../lib/brand.js';
import { compressImage } from '../lib/util.js';
import { ImagePlus, KeyRound, LogIn, User } from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';
import { Credit } from './Help.jsx';

const REMEMBER_KEY = 'cnd_remember_v1';
function readRemembered() {
  try { return JSON.parse(localStorage.getItem(REMEMBER_KEY)) || null; } catch { return null; }
}
function writeRemembered(v) {
  try { if (v) localStorage.setItem(REMEMBER_KEY, JSON.stringify(v)); else localStorage.removeItem(REMEMBER_KEY); }
  catch { try { localStorage.setItem(REMEMBER_KEY, JSON.stringify({ ...v, photo: null })); } catch {} }
}

export default function Login({ onLogin }) {
  const saved = readRemembered();
  const [token, setToken] = useState(saved?.token || '');
  const [nickname, setNickname] = useState(saved?.nickname || '');
  const [photo, setPhoto] = useState(saved?.photo || null);
  const [remember, setRemember] = useState(true);
  const [hasSaved, setHasSaved] = useState(!!saved);
  const [over, setOver] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const takeFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) { setError('Нужна картинка: скриншот удостоверения'); return; }
    setError('');
    setPhoto(await compressImage(file, 1000, 0.85));
  };

  useEffect(() => {
    const onPaste = (e) => {
      const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
      if (item) { e.preventDefault(); takeFile(item.getAsFile()); }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!token.trim() || !nickname.trim()) { setError('Введите токен и никнейм'); return; }
    setBusy(true);
    try {
      const s = await api.login({ token, nickname, idPhoto: photo });
      writeRemembered(remember ? { token: token.trim(), nickname: nickname.trim(), photo } : null);
      onLogin(s);
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="login-wrap">
      <div className="login-corner"><ThemeToggle /></div>
      <form className="card login" onSubmit={submit}>
        <img className="logo" src={BRAND.horizontal} alt="California NewsDay" />
        <h2 style={{ textAlign: 'center' }}>Вход для сотрудников</h2>
        <p className="muted small" style={{ textAlign: 'center', marginTop: -6 }}>Редактор статей и постов California NewsDay</p>
        <label className="row" style={{ color: 'var(--muted)' }}><KeyRound size={14} /> Токен доступа</label>
        <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="CND-XXXX-XXXX" autoFocus={!saved}
          style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '.05em' }} />
        <label className="row" style={{ color: 'var(--muted)' }}><User size={14} /> Игровой никнейм</label>
        <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Имя_Фамилия" />
        <label>Скриншот удостоверения CND <span className="muted small">(админу не нужен)</span></label>
        <div className={`drop ${over ? 'over' : ''}`}
          onClick={() => document.getElementById('id-file').click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); takeFile(e.dataTransfer.files[0]); }}>
          {photo ? <img src={photo} alt="Удостоверение" /> : <><ImagePlus size={26} /><span>Перетащите скриншот, нажмите или вставьте <kbd>Ctrl</kbd>+<kbd>V</kbd></span></>}
        </div>
        <input id="id-file" type="file" accept="image/*" hidden onChange={(e) => takeFile(e.target.files[0])} />
        <p className="muted small">Только игровое удостоверение из Minecraft. Реальные документы не загружайте.</p>
        <label className="row" style={{ gap: 8, marginTop: 4 }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Запомнить меня на этом устройстве
        </label>
        {hasSaved && (
          <p className="muted small" style={{ marginTop: 2 }}>
            Данные для входа подставлены с прошлого раза.{' '}
            <button type="button" className="linkish" onClick={() => { writeRemembered(null); setHasSaved(false); setToken(''); setNickname(''); setPhoto(null); }}>Забыть</button>
          </p>
        )}
        {error && <div className="error">{error}</div>}
        <button className="primary" style={{ width: '100%', marginTop: 12 }} disabled={busy}><LogIn size={17} />{busy ? 'Проверяем…' : 'Войти'}</button>
        {api.demoHint && <p className="muted small" style={{ textAlign: 'center' }}>Бета, демо-режим. {api.demoHint}</p>}
      </form>
      <Credit />
    </div>
  );
}
