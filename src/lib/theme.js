// Тема оформления: светлая, тёмная или как в системе. Выбор хранится в браузере.
const KEY = 'cnd_theme';
const media = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: dark)') : null;

export function getThemeChoice() {
  try { return localStorage.getItem(KEY) || 'system'; } catch { return 'system'; }
}
export function resolveTheme(choice = getThemeChoice()) {
  return choice === 'system' ? (media?.matches ? 'dark' : 'light') : choice;
}
export function applyTheme(choice = getThemeChoice()) {
  document.documentElement.dataset.theme = resolveTheme(choice);
}
export function setThemeChoice(choice) {
  try { localStorage.setItem(KEY, choice); } catch { /* приватный режим */ }
  applyTheme(choice);
  window.dispatchEvent(new Event('cnd-theme'));
}
media?.addEventListener?.('change', () => applyTheme());
