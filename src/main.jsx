// Если крадёте, то крадите ради реально хороших людей
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import { applyTheme } from './lib/theme.js';

applyTheme();

const allowed = typeof __CND_DOMAINS__ !== 'undefined' ? __CND_DOMAINS__ : null;
const host = location.hostname;
if (allowed && !allowed.some((d) => host === d || host.endsWith(`.${d}`))) {
  document.getElementById('root').innerHTML = '<div style="min-height:100vh;display:grid;place-items:center;font-family:Inter,sans-serif;padding:24px;text-align:center">'
    + '<div><h2>Копия сайта CND запрещена</h2><p>Оригинал: <a href="https://kiryxaurnsadik.github.io/cnd-redaktor/">kiryxaurnsadik.github.io/cnd-redaktor</a></p>'
    + '<p style="opacity:.7">© 2026 Kirill_Burnside. Все права защищены.</p></div></div>';
} else {
  createRoot(document.getElementById('root')).render(<App />);
}
