// Если крадёте, то крадите ради реально хороших людей
import { LogOut } from 'lucide-react';
import { BRAND } from '../lib/brand.js';
import { roleLabel } from '../lib/util.js';
import Countdown from './Countdown.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { HelpButton } from './Help.jsx';
import { UserSettingsButton } from './UserSettings.jsx';

export function Who({ session, label, compact = false }) {
  return (
    <span className={`who ${compact ? 'compact' : ''}`} title={`${label || session.nickname} · ${roleLabel(session.role)} · время до окончания токена`}>
      <span>{label || `${session.nickname} · ${roleLabel(session.role)}`}</span>
      <Countdown to={session.expiresAt} />
    </span>
  );
}

export default function TopBar({ session, logout, children, help }) {
  return (
    <div className="topbar">
      <img className="logo" src={BRAND.iconWhite} alt="CND" />
      {children}
      <div className="grow" />
      <Who session={session} />
      <HelpButton start={help} role={session?.role} />
      <UserSettingsButton />
      <ThemeToggle />
      <button onClick={logout} title="Выйти"><LogOut size={16} /> Выйти</button>
    </div>
  );
}
