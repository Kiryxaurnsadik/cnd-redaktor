import { useEffect, useState } from 'react';
import { api } from '../api/index.js';
import { BRAND } from '../lib/brand.js';
import { compressImage } from '../lib/util.js';

export default function Login({ onLogin }) {
  const [token, setToken] = useState('');
  const [nickname, setNickname] = useState('');
  const [photo, setPhoto] = useState(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const takeFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) { setError('Нужна картинка: скриншот удостоверения'); return; }
    setError('');
    setPhoto(await compressImage(file, 1000, 0.85));
  };

  // Ctrl+V — вставка скриншота из буфера обмена
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
    if (!photo) { setError('Приложите скриншот удостоверения CND'); return; }
    setBusy(true);
    try {
      onLogin(await api.login({ token, nickname, idPhoto: photo }));
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="login-wrap">
      <form className="card login" onSubmit={submit}>
        <img className="logo" src={BRAND.horizontal} alt="California NewsDay" />
        <h2 style={{ textAlign: 'center' }}>Вход для сотрудников</h2>
        <label>Токен доступа</label>
        <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="CND-XXXX-XXXX" autoFocus
          style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '.05em' }} />
        <label>Игровой никнейм</label>
        <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Имя_Фамилия" />
        <label>Скриншот удостоверения CND</label>
        <div className={`drop ${over ? 'over' : ''}`}
          onClick={() => document.getElementById('id-file').click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); takeFile(e.dataTransfer.files[0]); }}>
          {photo ? <img src={photo} alt="Удостоверение" /> : <>Перетащите скриншот, нажмите или вставьте <b>Ctrl+V</b></>}
        </div>
        <input id="id-file" type="file" accept="image/*" hidden onChange={(e) => takeFile(e.target.files[0])} />
        <p className="muted small">Только игровое удостоверение из Minecraft. Реальные документы не загружайте.</p>
        {error && <div className="error">{error}</div>}
        <button className="primary" style={{ width: '100%', marginTop: 12 }} disabled={busy}>{busy ? 'Проверяем…' : 'Войти'}</button>
        {api.demoHint && <p className="muted small" style={{ textAlign: 'center' }}>Бета, демо-режим. {api.demoHint}</p>}
      </form>
    </div>
  );
}
