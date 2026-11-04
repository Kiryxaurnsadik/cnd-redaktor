import { useEffect, useState } from 'react';
import { api } from './api/index.js';
import Login from './components/Login.jsx';
import Home from './components/Home.jsx';
import Admin from './components/Admin.jsx';
import Editor from './components/Editor.jsx';
import { formatLeft } from './lib/util.js';

export default function App() {
  const [session, setSession] = useState(undefined);
  const [screen, setScreen] = useState({ name: 'home' });

  useEffect(() => { api.restore().then(setSession).catch(() => setSession(null)); }, []);

  // Автовыход, когда истекают 42 часа
  useEffect(() => {
    if (!session?.expiresAt) return;
    const t = setInterval(() => {
      if (session.expiresAt < Date.now()) { api.logout(); setSession(null); }
    }, 30000);
    return () => clearInterval(t);
  }, [session]);

  if (session === undefined) return <div className="login-wrap" />;
  if (!session) return <Login onLogin={setSession} />;

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

  if (screen.name === 'editor') return <Editor {...common} open={screen} />;
  if (screen.name === 'admin') return <Admin {...common} />;
  return <Home {...common} />;
}
