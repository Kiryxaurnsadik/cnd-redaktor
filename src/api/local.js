// Демо-бэкенд: всё хранится в localStorage этого браузера.
// Нужен, чтобы бету можно было потрогать без Supabase. Для фракции — Supabase (см. supabase.js).
import { postToDiscord } from '../lib/discord.js';
import { TOKEN_HOURS, generateTokenCode, normalizeNick, normalizeTokenCode, sha256, uid } from '../lib/util.js';

const KEY = 'cnd_demo_db_v1';
const SESSION_KEY = 'cnd_demo_session_v1';
const DEMO_ADMIN_CODE = 'CND-DEMO-ADMN';

function load() {
  try {
    const db = JSON.parse(localStorage.getItem(KEY));
    if (db) return db;
  } catch { /* пусто */ }
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
        loginMode: 'instant', // instant | approval
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

// В демо уведомления уходят из браузера; на Supabase их шлёт база
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
function requireManager() {
  const s = requireSession();
  if (!['editor', 'admin'].includes(s.role)) throw new Error('Недостаточно прав');
  return s;
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
    return { ...s, pending: login?.status === 'pending' && d.settings.loginMode === 'approval' };
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
    return { ...session, pending: log.status === 'pending' };
  },

  async logout() { localStorage.removeItem(SESSION_KEY); },

  // ---- токены
  async issueToken({ nickname, role, hours = TOKEN_HOURS, note = '', maxUses = null }) {
    const s = requireManager();
    if (s.role !== 'admin' && ['editor', 'admin'].includes(role)) throw new Error('Редактор может выдавать токены только стажёрам и журналистам');
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
  async listTokens() { requireManager(); return (await db()).tokens; },
  async revokeToken(id) {
    requireManager(); const d = await db();
    const t = d.tokens.find((x) => x.id === id); if (t) t.revoked = true; save(d);
  },
  async extendToken(id, hours = TOKEN_HOURS) {
    requireManager(); const d = await db();
    const t = d.tokens.find((x) => x.id === id);
    if (t) { t.expiresAt = Math.max(Date.now(), t.expiresAt || Date.now()) + hours * 3600000; t.revoked = false; }
    save(d);
  },

  // ---- журнал входов
  async listLogins() {
    requireManager(); const d = await db();
    return d.logins.map((l) => ({ ...l, token: d.tokens.find((t) => t.id === l.tokenId) || null }));
  },
  async setLoginStatus(id, status) {
    requireManager(); const d = await db();
    const l = d.logins.find((x) => x.id === id); if (l) l.status = status; save(d);
  },

  // ---- настройки
  async getSettings() {
    const d = await db(); const s = getSessionRaw();
    const out = { ...d.settings };
    if (!['editor', 'admin'].includes(s?.role)) { delete out.discordWebhook; delete out.discordChannels; }
    return out;
  },
  async saveSettings(settings) {
    const s = requireSession(); if (s.role !== 'admin') throw new Error('Только для админа');
    const d = await db(); d.settings = { ...d.settings, ...settings }; save(d);
  },

  // ---- работы
  async listWorks({ all = false } = {}) {
    const s = requireSession(); const d = await db();
    return d.works
      .filter((w) => all || w.author === s.nickname)
      .map(({ doc, ...meta }) => meta)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
  async getWork(id) { requireSession(); return (await db()).works.find((w) => w.id === id) || null; },
  async saveWork(work) {
    const s = requireSession(); const d = await db();
    const i = d.works.findIndex((w) => w.id === work.id);
    const rec = { status: 'draft', ...(i >= 0 ? d.works[i] : { author: s.nickname, createdAt: Date.now() }), ...work, updatedAt: Date.now() };
    if (i >= 0) d.works[i] = rec; else d.works.unshift(rec);
    save(d);
    return rec;
  },
  async deleteWork(id) { requireSession(); const d = await db(); d.works = d.works.filter((w) => w.id !== id); save(d); },

  // ---- шаблоны коллег
  async listTemplates() {
    requireSession(); const d = await db();
    return d.templates.filter((t) => !t.hidden);
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
    requireManager(); const d = await db(); const t = d.templates.find((x) => x.id === id);
    if (t) Object.assign(t, patch); save(d);
  },
  async deleteTemplate(id) {
    const s = requireSession(); const d = await db();
    const t = d.templates.find((x) => x.id === id);
    if (t && t.author !== s.nickname && !['editor', 'admin'].includes(s.role)) throw new Error('Можно удалять только свои шаблоны');
    d.templates = d.templates.filter((x) => x.id !== id); save(d);
  },

  // ---- журнал экспортов (для невидимой метки и статистики)
  async logExport({ workId, title, format, watermark }) {
    const s = requireSession(); const d = await db();
    const rec = { id: uid(), at: Date.now(), author: s.nickname, workId, title, format, watermark };
    d.exports.unshift(rec); d.exports = d.exports.slice(0, 500); save(d);
    return rec;
  },
  async listExports() { requireManager(); return (await db()).exports; },

  // ---- свои шрифты
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
    d.fonts = (d.fonts || []).filter((f) => !(f.id === id && (f.author === s.nickname || ['editor', 'admin'].includes(s.role))));
    save(d);
  },

  // ---- лента архива
  async archiveAdd(item) {
    const s = requireSession(); const d = await db(); d.archive = d.archive || [];
    const old = item.workId && d.archive.find((a) => a.workId === item.workId && a.author === s.nickname);
    const rec = { ...(old || { id: uid() }), ...item, author: s.nickname, at: Date.now() };
    d.archive = [rec, ...d.archive.filter((a) => a.id !== rec.id)];
    save(d); const { image, ...meta } = rec; return meta;
  },
  async archiveList({ q = '', before = null, limit = 40 } = {}) {
    requireSession(); const d = await db();
    const ql = q.toLowerCase();
    return (d.archive || []).filter((a) => (!before || a.at < before) && (!ql || `${a.title} ${a.author}`.toLowerCase().includes(ql)))
      .slice(0, limit).map(({ image, ...meta }) => meta);
  },
  async archiveGet(id) { requireSession(); return (await db()).archive?.find((a) => a.id === id) || null; },
  async archiveDelete(id) {
    const s = requireSession(); const d = await db();
    d.archive = (d.archive || []).filter((a) => !(a.id === id && (a.author === s.nickname || ['editor', 'admin'].includes(s.role))));
    save(d);
  },
};
