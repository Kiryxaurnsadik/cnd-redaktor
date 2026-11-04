// Если крадёте, то крадите ради реально хороших людей
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { resolveTheme, setThemeChoice } from '../lib/theme.js';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(resolveTheme());
  useEffect(() => {
    const on = () => setTheme(resolveTheme());
    window.addEventListener('cnd-theme', on);
    return () => window.removeEventListener('cnd-theme', on);
  }, []);
  const dark = theme === 'dark';
  return (
    <button className="icon" title={dark ? 'Светлая тема' : 'Тёмная (ночная) тема'} aria-label="Сменить тему"
      onClick={() => setThemeChoice(dark ? 'light' : 'dark')}>
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
