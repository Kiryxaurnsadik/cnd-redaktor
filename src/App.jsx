import { useEffect, useState } from 'react';
import { api } from './api/index.js';
import Login from './components/Login.jsx';
import Home from './components/Home.jsx';
import Admin from './components/Admin.jsx';
import Editor from './components/Editor.jsx';
import ArchivePage from './components/Archive.jsx';
import { HelpModal } from './components/Help.jsx';
import { getPrefs } from './lib/prefs.js';
import { loadCustomFonts } from './lib/fonts.js';
import { formatLeft } from './lib/util.js';

export default function App() {
  const [session, setSession] = useState(undefined);
  const [screen, setScreen] = useState({ name: 'home' });
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => { api.restore().then(setSession).catch(() => setSession(null)); }, []);

  // Автовыход, когда истекают 42 часа
  useEffect(() => {
    if (!session?.expiresAt) return;
    const t = setInterval(() => {
      if (session.expiresAt < Date.now()) { api.logout(); setSession(null); }
    }, 30000);
    return () => clearInterval(t);
  }, [session]);

  // Свои шрифты фракции нужны и в превью, и в редакторе
  useEffect(() => { if (session && !session.pending) loadCustomFonts(); }, [session?.id, session?.pending]);

  if (session === undefined) return <div className="login-wrap" />;
  // После удачного входа сразу показываем инструкцию (можно выключить в «Моих настройках»)
  const onLogin = (s) => { setSession(s); if (!s.pending && getPrefs().autoHelp) setHelpOpen(true); };

  if (!session) return <Login onLogin={onLogin} />;

  const logout = async () => { await api.logout(); setSession(null); setScreen({ name: 'home' }); };

  if (session.pending) {
    return (
      <div className="login-wrap">
        <div className="card login">
          <h2>Вход ждёт проверки</h2>
          <p className="muted">Администратор проверит ваше удостоверение. Обновите страницу после одобрения.</p>
          <div className="row">
            <button className="primary" onClick={() => api.restore().then(setSession)}>Проверить снова</button>
            <button onClick={logout}>Выйти</button>
          </div>
        </div>
      </div>
    );
  }

  const left = session.expiresAt ? formatLeft(session.expiresAt - Date.now()) : 'без срока';
  const common = { session, logout, left, go: setScreen };

  const page = screen.name === 'editor' ? <Editor {...common} open={screen} />
    : screen.name === 'admin' ? <Admin {...common} />
      : screen.name === 'archive' ? <ArchivePage {...common} />
        : <Home {...common} />;
  return (
    <>
      {page}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </>
  );
}
