// Если крадёте, то крадите ради реально хороших людей
import { ArrowLeft, FolderOpen, IdCard, ImageDown, KeyRound, LogIn, MessageSquare, Plus, ScrollText, Search, Settings2, Stamp, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/index.js';
import TopBar from './TopBar.jsx';
import { DURATION_PRESETS, MAX_TOKEN_HOURS, ROLES, TOKEN_HOURS, formatDate, formatHours, formatLeft, isAdmin, normalizeNick, roleLabel } from '../lib/util.js';
import Countdown from './Countdown.jsx';
import { WATERMARK_STYLES, applyWatermark, readMark } from '../lib/watermark.js';
import { DISCORD_EVENTS, isWebhook, postToDiscord } from '../lib/discord.js';

function useNow(ms = 30000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

function Tokens({ session, flash }) {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ nickname: '', role: 'intern', amount: TOKEN_HOURS, unit: 'h', note: '', group: false, maxUses: 10 });
  const hours = Math.min(MAX_TOKEN_HOURS, Math.max(1, Math.round((Number(form.amount) || 0) * (form.unit === 'd' ? 24 : 1)))) || TOKEN_HOURS;
  const [issued, setIssued] = useState(null);
  const now = useNow();
  const reload = () => api.listTokens().then(setList).catch((e) => flash(e.message));
  useEffect(() => { reload(); }, []);

  const roles = Object.entries(ROLES).filter(([k]) => isAdmin(session.role) || ['intern', 'journalist'].includes(k));
  const issue = async (e) => {
    e.preventDefault();
    if (!form.group && !form.nickname.trim()) { flash('Укажите ник, на который выдаётся токен'); return; }
    try {
      const t = await api.issueToken({
        nickname: form.group ? null : form.nickname, role: form.role, hours,
        note: form.note, maxUses: form.group ? Number(form.maxUses) || null : null,
      });
      setIssued(t); setForm({ ...form, nickname: '', note: '' }); reload();
    } catch (err) { flash(err.message); }
  };
  const message = issued && `Токен доступа CND: ${issued.code}\nНик: ${issued.nickname || 'любой (групповой)'} · Роль: ${roleLabel(issued.role)}\nДействует до ${formatDate(issued.expiresAt)} (${formatLeft(issued.expiresAt - Date.now())})\nВход: ${location.origin + location.pathname}`;

  return (
    <div className="row wrap" style={{ alignItems: 'flex-start', gap: 16 }}>
      <form className="card" style={{ width: 340 }} onSubmit={issue}>
        <h3>Выдать токен</h3>
        <label className="row"><input type="checkbox" style={{ width: 'auto' }} checked={form.group} onChange={(e) => setForm({ ...form, group: e.target.checked })} /> Групповой (на собрание, обучение)</label>
        {!form.group && (<><label>Никнейм сотрудника</label>
          <input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="Имя_Фамилия" /></>)}
        {form.group && (<><label>Лимит входов</label>
          <input type="number" min="1" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} /></>)}
        <label>Роль</label>
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          {roles.map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
        </select>
        <label>Срок действия</label>
        <div className="row">
          <input type="number" min="1" step="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ width: 110 }} />
          <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
            <option value="h">часов</option>
            <option value="d">дней</option>
          </select>
        </div>
        <div className="chips">
          {DURATION_PRESETS.map((h) => (
            <button type="button" key={h} className={`chip ${hours === h ? 'on' : ''}`}
              onClick={() => setForm({ ...form, amount: h % 24 || h === 42 ? h : h / 24, unit: h % 24 || h === 42 ? 'h' : 'd' })}>{formatHours(h)}</button>
          ))}
        </div>
        <p className="small muted">Итого: {formatHours(hours)}, до {formatDate(Date.now() + hours * 3600000)}. Максимум 90 дней.</p>
        <label>Заметка</label>
        <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="например: новый стажёр" />
        <button className="primary" style={{ marginTop: 12, width: '100%' }}>Создать токен</button>
        {issued && (
          <div style={{ marginTop: 14 }}>
            <div className="code">{issued.code}</div>
            <p className="small muted">Код показывается один раз — в базе хранится только его хеш.</p>
            <div className="row">
              <button type="button" onClick={() => { navigator.clipboard.writeText(issued.code); flash('Код скопирован'); }}>Копировать код</button>
              <button type="button" onClick={() => { navigator.clipboard.writeText(message); flash('Сообщение скопировано'); }}>Копировать сообщение</button>
            </div>
          </div>
        )}
      </form>
      <div className="card grow table-wrap" style={{ minWidth: 320 }}>
        <h3>Токены</h3>
        <table>
          <thead><tr><th>Ник</th><th>Роль</th><th>Код</th><th>Осталось</th><th>До</th><th>Входов</th><th>Выдал</th><th /></tr></thead>
          <tbody>
            {list.map((t) => {
              const leftMs = t.expiresAt ? t.expiresAt - now : Infinity;
              const status = t.revoked ? <span className="badge bad">отозван</span> : leftMs <= 0 ? <span className="badge">истёк</span>
                : <Countdown to={t.expiresAt} className="badge" />;
              return (
                <tr key={t.id}>
                  <td>{t.nickname || <i className="muted">групповой</i>}<div className="muted small">{t.note}</div></td>
                  <td>{roleLabel(t.role)}</td>
                  <td className="muted small">…{t.codeHint || '----'}</td>
                  <td>{status}</td>
                  <td className="small muted">{formatDate(t.expiresAt)}</td>
                  <td>{t.uses}{t.maxUses ? ` / ${t.maxUses}` : ''}</td>
                  <td className="small">{t.issuedBy}<div className="muted">{formatDate(t.createdAt)}</div></td>
                  <td className="row">
                    {[42, 24, 168].map((h) => <button key={h} className="small" title={`Продлить на ${formatHours(h)}`} onClick={() => api.extendToken(t.id, h).then(reload).then(() => flash(`Продлено на ${formatHours(h)}`))}>+{formatHours(h)}</button>)}
                    {!t.revoked && <button className="small danger" onClick={() => api.revokeToken(t.id).then(reload)}>Отозвать</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Logins({ flash }) {
  const [list, setList] = useState([]);
  const [zoom, setZoom] = useState(null);
  const [filter, setFilter] = useState('');
  const reload = () => api.listLogins().then(setList).catch((e) => flash(e.message));
  useEffect(() => { reload(); }, []);

  const suspicious = useMemo(() => {
    const byToken = {};
    list.forEach((l) => { if (l.tokenId) (byToken[l.tokenId] ||= new Set()).add(normalizeNick(l.nickname)); });
    return new Set(Object.entries(byToken).filter(([, s]) => s.size > 1).map(([k]) => k));
  }, [list]);

  const shown = list.filter((l) => !filter || normalizeNick(l.nickname).includes(normalizeNick(filter)));
  const setStatus = (id, s) => api.setLoginStatus(id, s).then(reload);
  const exportCsv = () => {
    const rows = [['Время', 'Ник', 'Ник токена', 'Роль', 'Статус', 'Причина', 'Браузер']].concat(
      list.map((l) => [formatDate(l.at), l.nickname, l.token?.nickname || '', l.token ? roleLabel(l.token.role) : '', l.status, l.reason, l.userAgent]));
    const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'cnd-logins.csv'; a.click();
  };

  return (
    <div className="card table-wrap">
      <div className="row" style={{ marginBottom: 10 }}>
        <h3 className="grow" style={{ margin: 0 }}>Журнал входов</h3>
        <input style={{ maxWidth: 220 }} placeholder="Фильтр по нику" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <button onClick={exportCsv}>Выгрузить в Excel (CSV)</button>
        <button onClick={reload}>Обновить</button>
      </div>
      <table>
        <thead><tr><th>Удостоверение</th><th>Ник</th><th>Токен</th><th>Время</th><th>Статус</th><th /></tr></thead>
        <tbody>
          {shown.map((l) => (
            <tr key={l.id}>
              <td>{l.idPhoto ? <img className="id" src={l.idPhoto} alt="" onClick={() => setZoom(l.idPhoto)} /> : '—'}</td>
              <td><b>{l.nickname}</b>{suspicious.has(l.tokenId) && <div><span className="badge bad">по токену входили разные ники</span></div>}</td>
              <td className="small">{l.token ? <>{l.token.nickname || 'групповой'} · {roleLabel(l.token.role)}</> : <span className="muted">не найден</span>}</td>
              <td className="small">{formatDate(l.at)}<div className="muted" title={l.userAgent}>{(l.userAgent || '').slice(0, 40)}</div></td>
              <td>{l.status === 'approved' ? <span className="badge ok">подтверждён</span> : l.status === 'rejected' ? <span className="badge bad">отклонён</span> : <span className="badge warn">ждёт проверки</span>}
                {l.reason && <div className="small muted">{l.reason}</div>}</td>
              <td className="row">
                {l.status !== 'approved' && l.tokenId && <button className="small" onClick={() => setStatus(l.id, 'approved')}>Подтвердить</button>}
                {l.status !== 'rejected' && <button className="small danger" onClick={() => setStatus(l.id, 'rejected')}>Отклонить и выкинуть</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!shown.length && <p className="muted">Входов пока нет.</p>}
      {zoom && <div className="modal-back" onClick={() => setZoom(null)}><img src={zoom} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', imageRendering: 'pixelated' }} /></div>}
    </div>
  );
}

function Works({ go, flash }) {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const reload = () => api.listWorks({ all: true }).then(setList).catch((e) => flash(e.message));
  useEffect(() => { reload(); }, []);
  const sorted = [...list].filter((w) => !q || `${w.title} ${w.author}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.updatedAt - a.updatedAt);
  return (
    <div className="card table-wrap">
      <div className="row wrap" style={{ marginBottom: 10 }}>
        <h3 className="grow" style={{ margin: 0 }}>Работы сотрудников</h3>
        <div className="search"><Search size={16} /><input placeholder="Название или автор" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <p className="small muted">Все работы фракции. Откройте любую, чтобы поправить, скачать или отправить в Discord.</p>
      <table>
        <thead><tr><th>Превью</th><th>Название</th><th>Автор</th><th>Изменено</th><th /></tr></thead>
        <tbody>
          {sorted.map((w) => (
            <tr key={w.id}>
              <td>{w.thumb && <img src={w.thumb} alt="" style={{ width: 90, borderRadius: 4 }} />}</td>
              <td><b>{w.title || 'Без названия'}</b></td>
              <td>{w.author}</td>
              <td className="small">{formatDate(w.updatedAt)}</td>
              <td><button className="small" onClick={() => go({ name: 'editor', workId: w.id })}>Открыть</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!sorted.length && <p className="muted">Работ пока нет.</p>}
    </div>
  );
}

function Exports({ flash }) {
  const [list, setList] = useState([]);
  const [found, setFound] = useState(null);
  useEffect(() => { api.listExports().then(setList).catch((e) => flash(e.message)); }, []);
  const check = async (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const mark = await readMark(url).catch(() => null);
    const rec = mark && list.find((e) => e.id === mark.exportId);
    setFound(mark ? { ...mark, rec } : { none: true });
  };
  return (
    <div className="row wrap" style={{ alignItems: 'flex-start', gap: 16 }}>
      <div className="card" style={{ width: 340 }}>
        <h3>Чья это работа?</h3>
        <p className="small muted">Загрузите PNG, скачанный или скопированный с сайта. Сайт прочитает невидимую метку автора.</p>
        <input type="file" accept="image/png" onChange={(e) => check(e.target.files[0])} />
        {found?.none && <p className="error">Метка не найдена (картинку пересжали или она сделана не на сайте).</p>}
        {found?.author && <p>Автор: <b>{found.author}</b>{found.rec && <><br />Экспорт: {formatDate(found.rec.at)} · «{found.rec.title}»</>}</p>}
      </div>
      <div className="card grow table-wrap">
        <h3>Журнал экспортов</h3>
        <table>
          <thead><tr><th>Время</th><th>Автор</th><th>Работа</th><th>Формат</th><th>Знак</th></tr></thead>
          <tbody>{list.map((e) => (
            <tr key={e.id}><td className="small">{formatDate(e.at)}</td><td>{e.author}</td><td>{e.title}</td><td>{e.format}</td><td className="small">{e.watermark}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function WatermarkPreview({ s }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const c = document.createElement('canvas'); c.width = 800; c.height = 500;
      const ctx = c.getContext('2d');
      const g = ctx.createLinearGradient(0, 0, 800, 500); g.addColorStop(0, '#2c4a73'); g.addColorStop(1, '#9fb8d6');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 800, 500);
      ctx.fillStyle = '#ffffff'; ctx.font = '700 46px Montserrat, Inter, sans-serif'; ctx.fillText('Пример работы', 50, 110);
      ctx.font = '400 24px Inter, sans-serif'; ctx.fillText('Так знак будет выглядеть на картинке', 50, 150);
      await applyWatermark(c, { author: 'Kirill_Burnside', opacity: s.watermarkOpacity, corner: s.watermarkCorner, style: s.watermarkStyle || 'corner' });
      if (alive) setUrl(c.toDataURL('image/jpeg', 0.85));
    })();
    return () => { alive = false; };
  }, [s.watermarkOpacity, s.watermarkCorner, s.watermarkStyle]);
  return url ? <img src={url} alt="Пример водяного знака" style={{ width: '100%', borderRadius: 8, marginTop: 10, border: '1px solid var(--line)' }} /> : null;
}

const SET_SECTIONS = [['login', 'Вход', LogIn], ['watermark', 'Водяной знак', Stamp], ['discord', 'Discord', MessageSquare], ['positions', 'Должности', IdCard]];

function Settings({ flash }) {
  const [s, setS] = useState(null);
  const [saved, setSaved] = useState(null);
  const [sec, setSec] = useState('login');
  const [testing, setTesting] = useState(-1);
  useEffect(() => {
    api.getSettings().then((d) => {
      const v = { watermarkStyle: 'corner', watermarkChoice: true, discordWebhook: '', discordChannels: [], discordEvents: {}, positions: [], ...d };
      if (!v.discordChannels.length && v.discordWebhook) v.discordChannels = [{ name: 'основной', url: v.discordWebhook }];
      setS(v); setSaved(JSON.stringify(v));
    });
  }, []);
  if (!s) return null;
  const dirty = JSON.stringify(s) !== saved;
  const save = () => api.saveSettings(s).then(() => { setSaved(JSON.stringify(s)); flash('Настройки сохранены'); }).catch((e) => flash(e.message));
  const setPos = (i, patch) => setS({ ...s, positions: s.positions.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const setCh = (i, patch) => setS({ ...s, discordChannels: s.discordChannels.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const test = async (i) => {
    setTesting(i);
    try { await postToDiscord(s.discordChannels[i].url, { content: '✅ CND Редактор подключён к этому каналу.' }); flash(`Тест отправлен в «${s.discordChannels[i].name}»`); }
    catch (e) { flash(e.message); }
    setTesting(-1);
  };
  const notifyIdx = s.discordChannels.findIndex((c) => c.url && c.url === s.discordWebhook);

  return (
    <div className="set-layout">
      <nav className="set-nav card" style={{ padding: 8 }}>
        {SET_SECTIONS.map(([k, l, Ico]) => <button key={k} className={sec === k ? 'on' : ''} onClick={() => setSec(k)}><Ico size={16} /> {l}</button>)}
      </nav>
      <div className="set-body">
        {sec === 'login' && (
          <div className="card">
            <h3>Вход на сайт</h3>
            <label>Проверка удостоверений</label>
            <div className="seg">
              <button className={s.loginMode === 'instant' ? 'on' : ''} onClick={() => setS({ ...s, loginMode: 'instant' })}>Вход сразу, проверка позже</button>
              <button className={s.loginMode === 'approval' ? 'on' : ''} onClick={() => setS({ ...s, loginMode: 'approval' })}>Только после одобрения</button>
            </div>
            <p className="small muted">{s.loginMode === 'approval' ? 'Сотрудник ждёт, пока админ или редактор одобрит его вход в «Журнале входов».' : 'Сотрудник входит сразу, а удостоверение можно проверить позже в «Журнале входов».'} Админы всегда входят без удостоверения и без одобрения.</p>
          </div>
        )}
        {sec === 'watermark' && (
          <div className="card">
            <h3>Водяной знак</h3>
            <div className="row wrap" style={{ alignItems: 'flex-start', gap: 20 }}>
              <div style={{ flex: '1 1 260px' }}>
                <label>Вид по умолчанию</label>
                <select value={s.watermarkStyle} onChange={(e) => setS({ ...s, watermarkStyle: e.target.value })}>
                  {Object.entries(WATERMARK_STYLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <label>Положение</label>
                <select value={s.watermarkCorner} onChange={(e) => setS({ ...s, watermarkCorner: e.target.value })}>
                  <option value="br">Справа снизу</option><option value="bl">Слева снизу</option>
                  <option value="tr">Справа сверху</option><option value="tl">Слева сверху</option>
                </select>
                <label>Непрозрачность: {Math.round(s.watermarkOpacity * 100)}%</label>
                <input type="range" min="0.3" max="1" step="0.05" value={s.watermarkOpacity} onChange={(e) => setS({ ...s, watermarkOpacity: Number(e.target.value) })} />
                <label className="toggle" style={{ marginTop: 10 }}>
                  <input type="checkbox" checked={!!s.watermarkChoice} onChange={(e) => setS({ ...s, watermarkChoice: e.target.checked })} />
                  <span className="sw" aria-hidden="true" />
                  <span className="grow"><b>Сотрудники выбирают вид сами</b><span className="small muted">В меню «Скачать». Убрать знак всё равно нельзя.</span></span>
                </label>
              </div>
              <div style={{ flex: '1 1 300px' }}><label>Как это выглядит</label><WatermarkPreview s={s} /></div>
            </div>
          </div>
        )}
        {sec === 'discord' && (
          <div className="card">
            <h3>Каналы Discord</h3>
            <p className="small muted">Редакторы и админы отправляют готовые работы в эти каналы прямо из меню «Скачать». Остальные сотрудники ссылки не видят.<br />
              Как получить ссылку: Discord → настройки канала → Интеграции → Вебхуки → «Новый вебхук» → «Копировать URL».</p>
            {s.discordChannels.map((c, i) => (
              <div key={i} className="channel-row">
                <input style={{ width: 160 }} placeholder="Название, напр. новости" value={c.name} onChange={(e) => setCh(i, { name: e.target.value })} />
                <input className="grow" placeholder="https://discord.com/api/webhooks/…" value={c.url} onChange={(e) => setCh(i, { url: e.target.value.trim() })} />
                <button disabled={!isWebhook(c.url) || testing === i} onClick={() => test(i)}>{testing === i ? '…' : 'Проверить'}</button>
                <button className="icon danger" title="Убрать канал" onClick={() => setS({ ...s, discordChannels: s.discordChannels.filter((_, j) => j !== i), discordWebhook: notifyIdx === i ? '' : s.discordWebhook })}><Trash2 size={15} /></button>
                {c.url && !isWebhook(c.url) && <div className="error" style={{ width: '100%' }}>Ссылка должна начинаться с https://discord.com/api/webhooks/</div>}
              </div>
            ))}
            <button style={{ marginTop: 8 }} onClick={() => setS({ ...s, discordChannels: [...s.discordChannels, { name: '', url: '' }] })}><Plus size={16} /> Добавить канал</button>

            <h3 style={{ marginTop: 22 }}>Служебные уведомления</h3>
            <label>Канал для уведомлений</label>
            <select value={notifyIdx} onChange={(e) => { const i = Number(e.target.value); setS({ ...s, discordWebhook: i >= 0 ? s.discordChannels[i].url : '' }); }}>
              <option value={-1}>Не присылать</option>
              {s.discordChannels.map((c, i) => isWebhook(c.url) && <option key={i} value={i}>#{c.name || `канал ${i + 1}`}</option>)}
            </select>
            {notifyIdx >= 0 && Object.entries(DISCORD_EVENTS).map(([k, v]) => (
              <label key={k} className="toggle">
                <input type="checkbox" checked={!!s.discordEvents?.[k]} onChange={(e) => setS({ ...s, discordEvents: { ...s.discordEvents, [k]: e.target.checked } })} />
                <span className="sw" aria-hidden="true" /><span className="grow"><b>{v}</b></span>
              </label>
            ))}
          </div>
        )}
        {sec === 'positions' && (
          <div className="card">
            <h3>Должности → доступ</h3>
            <p className="small muted">Пригодится для автоматического чтения удостоверений: должность с карточки превратится в роль на сайте.</p>
            <table>
              <thead><tr><th>Должность на удостоверении</th><th>Роль на сайте</th><th /></tr></thead>
              <tbody>
                {s.positions.map((p, i) => (
                  <tr key={i}>
                    <td><input value={p.name} onChange={(e) => setPos(i, { name: e.target.value })} /></td>
                    <td><select value={p.role} onChange={(e) => setPos(i, { role: e.target.value })}>
                      {Object.entries(ROLES).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
                      <option value="none">Без доступа</option>
                    </select></td>
                    <td><button className="icon danger" onClick={() => setS({ ...s, positions: s.positions.filter((_, j) => j !== i) })}><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button style={{ marginTop: 8 }} onClick={() => setS({ ...s, positions: [...s.positions, { name: '', role: 'intern' }] })}><Plus size={16} /> Должность</button>
          </div>
        )}
        {dirty && (
          <div className="savebar">
            <span className="grow">Есть несохранённые изменения</span>
            <button onClick={() => setS(JSON.parse(saved))}>Отменить</button>
            <button className="primary" onClick={save}>Сохранить</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Admin({ session, logout, left, go }) {
  const [tab, setTab] = useState('tokens');
  const [toast, setToast] = useState('');
  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };
  const tabs = [['tokens', 'Токены', KeyRound], ['logins', 'Журнал входов', ScrollText], ['works', 'Работы сотрудников', FolderOpen], ['exports', 'Экспорты', ImageDown], ...(isAdmin(session.role) ? [['settings', 'Настройки', Settings2]] : [])];
  return (
    <>
      <TopBar session={session} left={left} logout={logout} help="admin">
        <button onClick={() => go({ name: 'home' })}><ArrowLeft size={16} /> К работам</button>
        <span className="brand-name">Админка</span>
      </TopBar>
      <div className="page" style={{ maxWidth: 1400 }}>
        <div className="tabs">{tabs.map(([k, t, Ico]) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}><Ico size={16} /> {t}</button>)}</div>
        {tab === 'tokens' && <Tokens session={session} flash={flash} />}
        {tab === 'logins' && <Logins flash={flash} />}
        {tab === 'works' && <Works go={go} flash={flash} />}
        {tab === 'exports' && <Exports flash={flash} />}
        {tab === 'settings' && <Settings flash={flash} />}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
