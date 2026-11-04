import { BRAND } from '../lib/brand.js';
import { roleLabel } from '../lib/util.js';

export default function TopBar({ session, left, logout, children }) {
  return (
    <div className="topbar">
      <img className="logo" src={BRAND.iconWhite} alt="CND" />
      {children}
      <div className="grow" />
      <span className="who">{session.nickname} · {roleLabel(session.role)} · осталось {left}</span>
      <button onClick={logout}>Выйти</button>
    </div>
  );
}
