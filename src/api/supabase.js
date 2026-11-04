// Боевой бэкенд: Supabase. Все действия идут через функции из supabase/schema.sql.
import { createClient } from '@supabase/supabase-js';
import { TOKEN_HOURS } from '../lib/util.js';

const SESSION_KEY = 'cnd_session_v1';

export function createSupabaseApi(url, anonKey) {
  const sb = createClient(url, anonKey, { auth: { persistSession: false } });
  const secret = () => localStorage.getItem(SESSION_KEY);

  async function rpc(fn, args = {}, { withSession = true } = {}) {
    const params = withSession ? { p_session: secret(), ...args } : args;
    const { data, error } = await sb.rpc(fn, params);
    if (error) throw new Error(error.message || 'Ошибка сервера');
    if (data && data.error) throw new Error(data.error);
    return data;
  }

  return {
    mode: 'supabase',
    demoHint: '',

    async restore() {
      if (!secret()) return null;
      try { return await rpc('cnd_restore'); } catch { localStorage.removeItem(SESSION_KEY); return null; }
    },
    async login({ token, nickname, idPhoto }) {
      const s = await rpc('cnd_login', {
        p_code: token, p_nickname: nickname, p_id_photo: idPhoto, p_user_agent: navigator.userAgent,
      }, { withSession: false });
      localStorage.setItem(SESSION_KEY, s.secret);
      const { secret: _, ...session } = s;
      return session;
    },
    async logout() {
      try { await rpc('cnd_logout'); } catch { /* всё равно выходим */ }
      localStorage.removeItem(SESSION_KEY);
    },

    issueToken: ({ nickname, role, hours = TOKEN_HOURS, note = '', maxUses = null }) =>
      rpc('cnd_issue_token', { p_nickname: nickname, p_role: role, p_hours: hours, p_note: note, p_max_uses: maxUses }),
    listTokens: () => rpc('cnd_list_tokens'),
    revokeToken: (id) => rpc('cnd_revoke_token', { p_id: id }),
    extendToken: (id, hours = TOKEN_HOURS) => rpc('cnd_extend_token', { p_id: id, p_hours: hours }),

    listLogins: () => rpc('cnd_list_logins'),
    setLoginStatus: (id, status) => rpc('cnd_set_login_status', { p_id: id, p_status: status }),

    getSettings: () => rpc('cnd_get_settings'),
    saveSettings: (data) => rpc('cnd_save_settings', { p_data: data }),

    listWorks: ({ all = false } = {}) => rpc('cnd_list_works', { p_all: all }),
    getWork: (id) => rpc('cnd_get_work', { p_id: id }),
    saveWork: (work) => rpc('cnd_save_work', { p_work: work }),
    deleteWork: (id) => rpc('cnd_delete_work', { p_id: id }),

    listTemplates: () => rpc('cnd_list_templates'),
    saveTemplate: (tpl) => rpc('cnd_save_template', { p_tpl: tpl }),
    useTemplate: (id) => rpc('cnd_use_template', { p_id: id }),
    updateTemplate: (id, patch) => rpc('cnd_update_template', { p_id: id, p_patch: patch }),
    deleteTemplate: (id) => rpc('cnd_delete_template', { p_id: id }),

    logExport: ({ workId, title, format, watermark }) =>
      rpc('cnd_log_export', { p_work_id: workId, p_title: title, p_format: format, p_watermark: watermark }),
    listExports: () => rpc('cnd_list_exports'),

    listFonts: () => rpc('cnd_list_fonts'),
    saveFont: ({ family, data }) => rpc('cnd_save_font', { p_family: family, p_data: data }),
    deleteFont: (id) => rpc('cnd_delete_font', { p_id: id }),

    archiveAdd: (item) => rpc('cnd_archive_add', { p_item: item }),
    archiveList: ({ q = '', before = null, limit = 40 } = {}) => rpc('cnd_archive_list', { p_q: q, p_before: before, p_limit: limit }),
    archiveGet: (id) => rpc('cnd_archive_get', { p_id: id }),
    archiveDelete: (id) => rpc('cnd_archive_delete', { p_id: id }),
  };
}
