// Если крадёте, то крадите ради реально хороших людей
import { postToDiscord } from '../lib/discord.js';
import { TOKEN_HOURS, generateTokenCode, normalizeNick, normalizeTokenCode, sha256, uid } from '../lib/util.js';

const KEY = 'cnd_demo_db_v1';
const SESSION_KEY = 'cnd_demo_session_v1';
const DEMO_ADMIN_CODE = 'CND-DEMO-ADMN';

function load() {
  try {
    const db = JSON.parse(localStorage.getItem(KEY));
    if (db) return db;
  } catch {}
  return null;
}
function save(db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch (e) {
    throw new Error('Не хватает места в браузере для демо-данных. Удалите старые работы.');
  }
}

async function db() {
  let d = load();
  if (!d) {
    d = {
      tokens: [{
        id: uid(), hash: await sha256(DEMO_ADMIN_CODE), nickname: 'Admin', role: 'admin',
        createdAt: Date.now(), expiresAt: null, revoked: false, issuedBy: 'система', note: 'демо-доступ',
        uses: 0, maxUses: null,
      }],
      logins: [], works: [], templates: [], exports: [],
      settings: {
        loginMode: 'instant',
        positions: [
          { name: 'стажер', role: 'intern' },
          { name: 'журналист', role: 'journalist' },
          { name: 'редактор', role: 'editor' },
          { name: 'главный редактор', role: 'admin' },
        ],
        watermarkOpacity: 0.85,
        watermarkCorner: 'br',
        watermarkStyle: 'corner',
        watermarkChoice: true,
        discordWebhook: '',
        discordChannels: [],
        discordEvents: { logins: false, tokens: false, exports: false },
      },
    };
    save(d);
  }
  return d;
}

function notify(settings, event, content) {
  if (settings.discordWebhook && settings.discordEvents?.[event]) postToDiscord(settings.discordWebhook, { content }).catch(() => {});
}

function requireSession() {
  const s = getSessionRaw();
  if (!s || s.expiresAt && s.expiresAt < Date.now()) throw new Error('Сессия истекла, войдите заново');
  return s;
}
function getSessionRaw() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}
const ALL_PERMS = ['tokens', 'logins', 'works', 'exports', 'templates', 'pin', 'archiveDelete', 'library', 'discord'];
let permCache = {};
function permsOf(role, settings = null) {
  if (role === 'admin') return ALL_PERMS;
  if (settings) permCache = settings.permissions || {};
  return permCache[role] || [];
}
function canDo(s, perm) { return !!s && permsOf(s.role).includes(perm); }
function need(perm) {
  const s = requireSession();
  if (!canDo(s, perm)) throw new Error('Нет права на это действие — его выдаёт главный редактор в Админке → Права');
  return s;
}
function likesOf(d, kind, id, me) {
  const l = (d.likes || []).filter((x) => x.kind === kind && x.id === id);
  return { likes: l.length, liked: l.some((x) => x.nickname === me) };
}

export const localApi = {
  mode: 'demo',
  demoHint: `Демо-доступ: токен ${DEMO_ADMIN_CODE}, ник Admin`,

  async restore() {
    const s = getSessionRaw();
    if (!s) return null;
    if (s.expiresAt && s.expiresAt < Date.now()) { localStorage.removeItem(SESSION_KEY); return null; }
    const d = await db();
    const t = d.tokens.find((x) => x.id === s.tokenId);
    if (!t || t.revoked) { localStorage.removeItem(SESSION_KEY); return null; }
    const login = d.logins.find((l) => l.id === s.loginId);
    if (login?.status === 'rejected') { localStorage.removeItem(SESSION_KEY); return null; }
    return { ...s, perms: permsOf(s.role, d.settings), pending: login?.status === 'pending' && d.settings.loginMode === 'approval' };
  },

  async login({ token, nickname, idPhoto }) {
    const d = await db();
    const code = normalizeTokenCode(token);
    const hash = await sha256(code);
    const t = d.tokens.find((x) => x.hash === hash);
    const log = {
      id: uid(), at: Date.now(), nickname, tokenId: t?.id || null, idPhoto,
      userAgent: navigator.userAgent, status: 'pending', reason: '',
    };
    const fail = (reason) => {
      log.status = 'rejected'; log.reason = reason; d.logins.unshift(log); save(d);
      throw new Error(reason);
    };
    if (!t) fail('Токен не найден');
    if (t.revoked) fail('Токен отозван');
    if (t.expiresAt && t.expiresAt < Date.now()) fail('Срок действия токена истёк');
    if (t.maxUses && t.uses >= t.maxUses) fail('Лимит входов по токену исчерпан');
    if (t.nickname && normalizeNick(t.nickname) !== normalizeNick(nickname)) fail('Токен выдан на другой никнейм');
    if (!idPhoto && t.role !== 'admin') fail('Нужно фото удостоверения (без него входит только админ)');
    t.uses = (t.uses || 0) + 1;
    log.status = d.settings.loginMode === 'approval' ? 'pending' : 'approved';
    if (t.role === 'admin') log.status = 'approved';
    d.logins.unshift(log);
    save(d);
    const session = {
      id: uid(), tokenId: t.id, loginId: log.id, nickname: nickname.trim(), role: t.role,
      expiresAt: t.expiresAt, createdAt: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ...session, perms: permsOf(t.role, d.settings), pending: log.status === 'pending' };
  },

  async logout() { localStorage.removeItem(SESSION_KEY); },

  async issueToken({ nickname, role, hours = TOKEN_HOURS, note = '', maxUses = null }) {
    await db().then((d) => permsOf('', d.settings));
    const s = need('tokens');
    if (s.role !== 'admin' && ['editor', 'admin'].includes(role)) throw new Error('Токены редакторов и админов выдаёт только главный редактор');
    const d = await db();
    const code = generateTokenCode();
    const t = {
      id: uid(), hash: await sha256(code), nickname: nickname?.trim() || null, role, note,
      createdAt: Date.now(), expiresAt: Date.now() + hours * 3600000, revoked: false,
      issuedBy: s.nickname, uses: 0, maxUses: maxUses || null, codeHint: code.slice(-4),
    };
    d.tokens.unshift(t); save(d);
    return { ...t, code };
  },
  async listTokens() { const d = await db(); permsOf('', d.settings); need('tokens'); return d.tokens; },
  async revokeToken(id) {
    const d = await db(); permsOf('', d.settings); need('tokens');
    const t = d.tokens.find((x) => x.id === id); if (t) t.revoked = true; save(d);
  },
  async extendToken(id, hours = TOKEN_HOURS) {
    const d = await db(); permsOf('', d.settings); need('tokens');
    const t = d.tokens.find((x) => x.id === id);
    if (t) { t.expiresAt = Math.max(Date.now(), t.expiresAt || Date.now()) + hours * 3600000; t.revoked = false; }
    save(d);
  },

  async listLogins() {
    const d = await db(); permsOf('', d.settings); need('logins');
    return d.logins.map((l) => ({ ...l, token: d.tokens.find((t) => t.id === l.tokenId) || null }));
  },
  async setLoginStatus(id, status) {
    const d = await db(); permsOf('', d.settings); need('logins');
    const l = d.logins.find((x) => x.id === id); if (l) l.status = status; save(d);
  },

  async getSettings() {
    const d = await db(); const s = getSessionRaw(); permsOf('', d.settings);
    const out = { ...d.settings };
    if (!canDo(s, 'discord')) { delete out.discordWebhook; delete out.discordChannels; }
    return out;
  },
  async saveSettings(settings) {
    const s = requireSession(); if (s.role !== 'admin') throw new Error('Только для админа');
    const d = await db(); d.settings = { ...d.settings, ...settings }; save(d);
  },

  async listWorks({ all = false } = {}) {
    const s = requireSession(); const d = await db(); permsOf('', d.settings);
    if (all) need('works');
    return d.works
      .filter((w) => !w.deletedAt && (all || w.author === s.nickname))
      .map(({ doc, ...meta }) => meta)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
  async getWork(id) { requireSession(); return (await db()).works.find((w) => w.id === id && !w.deletedAt) || null; },
  async saveWork(work) {
    const s = requireSession(); const d = await db();
    const i = d.works.findIndex((w) => w.id === work.id);
    const rec = { status: 'draft', ...(i >= 0 ? d.works[i] : { author: s.nickname, createdAt: Date.now() }), ...work, updatedAt: Date.now(), deletedAt: null };
    if (i >= 0) d.works[i] = rec; else d.works.unshift(rec);
    save(d);
    return rec;
  },
  async deleteWork(id) {
    const s = requireSession(); const d = await db();
    permsOf('', d.settings);
    const w = d.works.find((x) => x.id === id && (x.author === s.nickname || canDo(s, 'works')));
    if (w) { w.deletedAt = Date.now(); save(d); }
  },
  async listTrash() {
    const s = requireSession(); const d = await db();
    const cut = Date.now() - 30 * 864e5;
    const before = d.works.length;
    d.works = d.works.filter((w) => !w.deletedAt || w.deletedAt > cut);
    if (d.works.length !== before) save(d);
    return d.works
      .filter((w) => w.deletedAt && (w.author === s.nickname || canDo(s, 'works')))
      .map(({ doc, ...meta }) => meta)
      .sort((a, b) => b.deletedAt - a.deletedAt);
  },
  async restoreWork(id) {
    requireSession(); const d = await db();
    const w = d.works.find((x) => x.id === id); if (w) { w.deletedAt = null; w.updatedAt = Date.now(); save(d); }
  },
  async purgeWork(id) { requireSession(); const d = await db(); d.works = d.works.filter((w) => !(w.id === id && w.deletedAt)); save(d); },

  async listTemplates() {
    const s = requireSession(); const d = await db();
    return d.templates.filter((t) => !t.hidden).map((t) => ({ ...t, pinned: !!t.pinned, ...likesOf(d, 'template', t.id, s.nickname) }))
      .sort((a, b) => (b.pinned - a.pinned) || (b.official - a.official) || ((b.uses || 0) - (a.uses || 0)) || (b.createdAt - a.createdAt));
  },
  async saveTemplate(tpl) {
    const s = requireSession(); const d = await db();
    const rec = { id: uid(), author: s.nickname, createdAt: Date.now(), uses: 0, official: false, ...tpl };
    d.templates.unshift(rec); save(d); return rec;
  },
  async useTemplate(id) {
    const d = await db(); const t = d.templates.find((x) => x.id === id);
    if (t) { t.uses = (t.uses || 0) + 1; save(d); }
  },
  async updateTemplate(id, patch) {
    const d = await db(); permsOf('', d.settings); need('templates'); const t = d.templates.find((x) => x.id === id);
    if (t) Object.assign(t, patch); save(d);
  },
  async deleteTemplate(id) {
    const s = requireSession(); const d = await db();
    const t = d.templates.find((x) => x.id === id);
    permsOf('', d.settings);
    if (t && t.author !== s.nickname && !canDo(s, 'templates')) throw new Error('Можно удалять только свои шаблоны');
    d.templates = d.templates.filter((x) => x.id !== id); save(d);
  },

  async logExport({ workId, title, format, watermark }) {
    const s = requireSession(); const d = await db();
    const rec = { id: uid(), at: Date.now(), author: s.nickname, workId, title, format, watermark };
    d.exports.unshift(rec); d.exports = d.exports.slice(0, 500); save(d);
    return rec;
  },
  async listExports() { const d = await db(); permsOf('', d.settings); need('exports'); return d.exports; },

  async listFonts() { requireSession(); return (await db()).fonts || []; },
  async saveFont({ family, data }) {
    const s = requireSession(); const d = await db(); d.fonts = d.fonts || [];
    if (data.length > 4200000) throw new Error('Файл шрифта больше 3 МБ');
    const rec = { id: uid(), family: family.trim(), author: s.nickname, data, createdAt: Date.now() };
    d.fonts = [rec, ...d.fonts.filter((f) => f.family !== rec.family)];
    save(d); return rec;
  },
  async deleteFont(id) {
    const s = requireSession(); const d = await db();
    permsOf('', d.settings);
    d.fonts = (d.fonts || []).filter((f) => !(f.id === id && (f.author === s.nickname || canDo(s, 'library'))));
    save(d);
  },

  async listElements() { requireSession(); return (await db()).elements || []; },
  async saveElement({ name, data }) {
    const s = requireSession(); const d = await db(); d.elements = d.elements || [];
    if (JSON.stringify(data).length > 3000000) throw new Error('Элемент больше 2 МБ');
    const rec = { id: uid(), name: name.trim().slice(0, 80), author: s.nickname, data, createdAt: Date.now() };
    d.elements.unshift(rec); save(d); return rec;
  },
  async deleteElement(id) {
    const s = requireSession(); const d = await db();
    permsOf('', d.settings);
    d.elements = (d.elements || []).filter((e) => !(e.id === id && (e.author === s.nickname || canDo(s, 'library'))));
    save(d);
  },

  async archiveAdd(item) {
    const s = requireSession(); const d = await db(); d.archive = d.archive || [];
    const old = item.workId && d.archive.find((a) => a.workId === item.workId && a.author === s.nickname);
    const rec = { ...(old || { id: uid() }), ...item, author: s.nickname, at: Date.now() };
    d.archive = [rec, ...d.archive.filter((a) => a.id !== rec.id)];
    save(d); const { image, ...meta } = rec; return meta;
  },
  async archiveList({ q = '', before = null, limit = 40 } = {}) {
    const s = requireSession(); const d = await db();
    const ql = q.toLowerCase();
    const hit = (a) => !ql || `${a.title} ${a.author}`.toLowerCase().includes(ql);
    const pinned = before ? [] : (d.archive || []).filter((a) => a.pinned && hit(a));
    const rest = (d.archive || []).filter((a) => !a.pinned && (!before || a.at < before) && hit(a)).slice(0, limit);
    return [...pinned, ...rest].map(({ image, ...meta }) => ({ ...meta, pinned: !!meta.pinned, ...likesOf(d, 'archive', meta.id, s.nickname) }));
  },
  async archiveGet(id) { requireSession(); return (await db()).archive?.find((a) => a.id === id) || null; },
  async archiveDelete(id) {
    const s = requireSession(); const d = await db();
    permsOf('', d.settings);
    d.archive = (d.archive || []).filter((a) => !(a.id === id && (a.author === s.nickname || canDo(s, 'archiveDelete'))));
    save(d);
  },

  async like(kind, id, on) {
    const s = requireSession(); const d = await db(); d.likes = d.likes || [];
    d.likes = d.likes.filter((x) => !(x.kind === kind && x.id === id && x.nickname === s.nickname));
    if (on) d.likes.push({ kind, id, nickname: s.nickname, at: Date.now() });
    save(d); return likesOf(d, kind, id, s.nickname);
  },
  async pin(kind, id, on) {
    const d = await db(); permsOf('', d.settings); need('pin');
    const list = kind === 'archive' ? d.archive || [] : d.templates;
    const it = list.find((x) => x.id === id); if (it) it.pinned = !!on; save(d);
  },
};
