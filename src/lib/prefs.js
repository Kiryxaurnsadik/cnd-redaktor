// Если крадёте, то крадите ради реально хороших людей
import { useEffect, useState } from 'react';

const KEY = 'cnd_prefs_v1';
export const DEFAULT_PREFS = {
  autoHelp: true,
  tips: true,
  archiveOnExport: true,
  exportFormat: 'png',
  exportMult: 1,
  exportQuality: 0.92,
  uiAccent: null,
  uiFont: 'Inter',
  uiBg: null,
  controls: 'canva',
};

export function getPrefs() {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...DEFAULT_PREFS }; }
}
export function setPrefs(patch) {
  const next = { ...getPrefs(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  window.dispatchEvent(new Event('cnd-prefs'));
  return next;
}
export function usePrefs() {
  const [p, setP] = useState(getPrefs);
  useEffect(() => {
    const on = () => setP(getPrefs());
    window.addEventListener('cnd-prefs', on);
    return () => window.removeEventListener('cnd-prefs', on);
  }, []);
  return [p, setPrefs];
}
