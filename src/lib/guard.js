// Если крадёте, то крадите ради реально хороших людей
const editable = (t) => t && (t.closest?.('input, textarea, select, [contenteditable="true"], .allow-copy'));

export function installGuard() {
  if (typeof window === 'undefined' || window.__cndGuard) return;
  window.__cndGuard = true;
  document.documentElement.classList.add('guarded');
  document.addEventListener('contextmenu', (e) => { if (!editable(e.target)) e.preventDefault(); });
  document.addEventListener('dragstart', (e) => { if (e.target?.tagName === 'IMG' && !e.target.closest('.allow-drag')) e.preventDefault(); });
  document.addEventListener('copy', (e) => {
    if (editable(e.target) || editable(document.activeElement)) return;
    const sel = String(window.getSelection?.() || '');
    if (sel.length > 200) { e.preventDefault(); e.clipboardData?.setData('text/plain', `${sel.slice(0, 200)}…\n© California NewsDay · Kirill_Burnside`); }
  });
  document.addEventListener('keydown', (e) => {
    const k = e.key?.toLowerCase(); const mod = e.ctrlKey || e.metaKey;
    if (e.key === 'F12' || (mod && !e.shiftKey && (k === 'u' || k === 's')) || (mod && e.shiftKey && (k === 'i' || k === 'j'))) e.preventDefault();
  }, true);
}
