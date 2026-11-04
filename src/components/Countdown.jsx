// Если крадёте, то крадите ради реально хороших людей
import { useEffect, useState } from 'react';
import { formatTimer } from '../lib/util.js';

export function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

export default function Countdown({ to, className = '', title }) {
  const now = useNow(1000);
  if (!to) return <span className={`timer ${className}`}>без срока</span>;
  const left = to - now;
  const level = left <= 0 ? 'over' : left < 3600000 ? 'bad' : left < 6 * 3600000 ? 'warn' : 'ok';
  return <span className={`timer ${level} ${className}`} title={title}>{left <= 0 ? 'истёк' : formatTimer(left)}</span>;
}
