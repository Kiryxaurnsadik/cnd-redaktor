-- Если крадёте, то крадите ради реально хороших людей
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists cnd_tokens (
  id uuid primary key default gen_random_uuid(),
  hash text not null unique,
  code_hint text,
  nickname text,
  role text not null,
  note text default '',
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked boolean not null default false,
  issued_by text,
  uses int not null default 0,
  max_uses int
);

create table if not exists cnd_logins (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  nickname text,
  token_id uuid references cnd_tokens(id) on delete set null,
  id_photo text,
  user_agent text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reason text default ''
);

alter table cnd_tokens drop constraint if exists cnd_tokens_role_check;
alter table cnd_tokens add constraint cnd_tokens_role_check check (role in ('intern','journalist','editor','senior','admin'));

create table if not exists cnd_sessions (
  id uuid primary key default gen_random_uuid(),
  secret_hash text not null unique,
  token_id uuid not null references cnd_tokens(id) on delete cascade,
  login_id uuid references cnd_logins(id) on delete set null,
  nickname text not null,
  role text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists cnd_works (
  id text primary key,
  author text not null,
  title text,
  status text not null default 'draft',
  thumb text,
  doc jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
alter table cnd_works add column if not exists deleted_at timestamptz;

create table if not exists cnd_templates (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  name text not null,
  tags text[] default '{}',
  kind text,
  thumb text,
  doc jsonb not null,
  official boolean not null default false,
  hidden boolean not null default false,
  uses int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists cnd_exports (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  author text,
  work_id text,
  title text,
  format text,
  watermark text
);

create table if not exists cnd_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb
);
insert into cnd_settings (id, data) values (1, jsonb_build_object(
  'loginMode','instant',
  'watermarkOpacity',0.85,
  'watermarkCorner','br',
  'watermarkStyle','corner',
  'watermarkChoice',true,
  'discordWebhook','',
  'discordChannels', '[]'::jsonb,
  'discordEvents', jsonb_build_object('logins',false,'tokens',false,'exports',false),
  'positions', jsonb_build_array(
    jsonb_build_object('name','стажер','role','intern'),
    jsonb_build_object('name','журналист','role','journalist'),
    jsonb_build_object('name','редактор','role','editor'),
    jsonb_build_object('name','главный редактор','role','admin'))
)) on conflict (id) do nothing;

alter table cnd_tokens enable row level security;
alter table cnd_logins enable row level security;
alter table cnd_sessions enable row level security;
alter table cnd_works enable row level security;
alter table cnd_templates enable row level security;
alter table cnd_exports enable row level security;
alter table cnd_settings enable row level security;

create or replace function cnd_norm_nick(s text) returns text language sql immutable as $$
  select regexp_replace(replace(lower(coalesce(s,'')), 'ё', 'е'), '[\s_\-.]+', '', 'g')
$$;

create or replace function cnd_norm_code(s text) returns text language plpgsql immutable as $$
declare raw text := regexp_replace(upper(coalesce(s,'')), '[^A-Z0-9]', '', 'g');
begin
  if left(raw, 3) = 'CND' then raw := substr(raw, 4); end if;
  return 'CND-' || substr(raw, 1, 4) || '-' || substr(raw, 5, 4);
end $$;

create or replace function cnd_hash(s text) returns text language sql immutable set search_path = public, extensions as $$
  select encode(digest(s, 'sha256'), 'hex')
$$;

create or replace function cnd_gen_code() returns text language plpgsql set search_path = public, extensions as $$
declare alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; b bytea := gen_random_bytes(8); s text := ''; i int;
begin
  for i in 0..7 loop s := s || substr(alphabet, (get_byte(b, i) % 32) + 1, 1); end loop;
  return 'CND-' || substr(s, 1, 4) || '-' || substr(s, 5, 4);
end $$;

create or replace function cnd_session(p_session text) returns cnd_sessions
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions; t cnd_tokens; l cnd_logins;
begin
  select * into s from cnd_sessions where secret_hash = cnd_hash(coalesce(p_session,''));
  if not found then raise exception 'Сессия не найдена, войдите заново'; end if;
  if s.expires_at is not null and s.expires_at < now() then raise exception 'Сессия истекла, войдите заново'; end if;
  select * into t from cnd_tokens where id = s.token_id;
  if t.revoked then raise exception 'Токен отозван'; end if;
  select * into l from cnd_logins where id = s.login_id;
  if found and l.status = 'rejected' then raise exception 'Вход отклонён администратором'; end if;
  return s;
end $$;

create or replace function cnd_manager(p_session text) returns cnd_sessions
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session);
begin
  if s.role not in ('editor','senior','admin') then raise exception 'Недостаточно прав'; end if;
  return s;
end $$;

create or replace function cnd_can(p_role text, p_perm text) returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select p_role = 'admin' or coalesce((select data->'permissions'->p_role from cnd_settings where id = 1), '[]'::jsonb) ? p_perm
$$;

create or replace function cnd_perm_list(p_role text) returns jsonb
language sql stable security definer set search_path = public, extensions as $$
  select case when p_role = 'admin'
    then '["tokens","logins","works","exports","templates","pin","archiveDelete","library","discord"]'::jsonb
    else coalesce((select data->'permissions'->p_role from cnd_settings where id = 1), '[]'::jsonb) end
$$;

create or replace function cnd_need(p_session text, p_perm text) returns cnd_sessions
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session);
begin
  if not cnd_can(s.role, p_perm) then raise exception 'Нет права на это действие — его выдаёт уровень 5 в Админке → Права'; end if;
  return s;
end $$;

create or replace function cnd_token_json(t cnd_tokens) returns jsonb language sql stable as $$
  select jsonb_build_object('id', t.id, 'nickname', t.nickname, 'role', t.role, 'note', t.note,
    'createdAt', (extract(epoch from t.created_at) * 1000)::bigint,
    'expiresAt', (extract(epoch from t.expires_at) * 1000)::bigint,
    'revoked', t.revoked, 'issuedBy', t.issued_by, 'uses', t.uses, 'maxUses', t.max_uses, 'codeHint', t.code_hint)
$$;

create or replace function cnd_bootstrap_admin(p_nickname text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare code text := cnd_gen_code();
begin
  if coalesce(trim(p_nickname), '') = '' then raise exception 'Укажите ник: select cnd_bootstrap_admin(''ВашНик'');'; end if;
  insert into cnd_tokens (hash, code_hint, nickname, role, note, expires_at, issued_by)
  values (cnd_hash(code), right(code, 4), trim(p_nickname), 'admin', 'выдан из SQL Editor', now() + interval '42 hours', 'система');
  return code;
end $$;
revoke execute on function cnd_bootstrap_admin(text) from public, anon, authenticated;

do $$ begin
  create extension if not exists pg_net;
exception when others then raise notice 'pg_net недоступен — уведомления в Discord отключены';
end $$;

create or replace function cnd_discord(p_event text, p_msg text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare d jsonb := (select data from cnd_settings where id = 1); hook text := coalesce(d->>'discordWebhook', '');
begin
  if hook !~ '^https://(discord|discordapp)\.com/api/webhooks/' then return; end if;
  if coalesce((d->'discordEvents'->>p_event)::boolean, false) is not true then return; end if;
  perform net.http_post(url := hook,
    body := jsonb_build_object('username', 'CND Редактор', 'content', left(p_msg, 1900)),
    headers := '{"Content-Type": "application/json"}'::jsonb);
exception when others then
  raise notice 'discord: %', sqlerrm;
end $$;
revoke execute on function cnd_discord(text, text) from public, anon, authenticated;

create or replace function cnd_login(p_code text, p_nickname text, p_id_photo text, p_user_agent text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare t cnd_tokens; lid uuid; secret text; st text; mode text; reason text := null; sid uuid;
begin
  select * into t from cnd_tokens where hash = cnd_hash(cnd_norm_code(p_code));
  if not found then reason := 'Токен не найден';
  elsif t.revoked then reason := 'Токен отозван';
  elsif t.expires_at is not null and t.expires_at < now() then reason := 'Срок действия токена истёк';
  elsif t.max_uses is not null and t.uses >= t.max_uses then reason := 'Лимит входов по токену исчерпан';
  elsif t.nickname is not null and cnd_norm_nick(t.nickname) <> cnd_norm_nick(p_nickname) then reason := 'Токен выдан на другой никнейм';
  elsif coalesce(p_id_photo, '') = '' and t.role <> 'admin' then reason := 'Нужно фото удостоверения (без него входит только админ)';
  end if;

  if reason is not null then
    insert into cnd_logins (nickname, token_id, id_photo, user_agent, status, reason)
    values (p_nickname, t.id, p_id_photo, p_user_agent, 'rejected', reason);
    perform cnd_discord('logins', format('⛔ Неудачный вход: **%s** — %s', p_nickname, reason));
    return jsonb_build_object('error', reason);
  end if;

  select data->>'loginMode' into mode from cnd_settings where id = 1;
  st := case when mode = 'approval' and t.role <> 'admin' then 'pending' else 'approved' end;
  insert into cnd_logins (nickname, token_id, id_photo, user_agent, status)
  values (p_nickname, t.id, p_id_photo, p_user_agent, st) returning id into lid;
  update cnd_tokens set uses = uses + 1 where id = t.id;
  perform cnd_discord('logins', format('🔑 Вход на сайт: **%s** (%s)%s', trim(p_nickname), t.role,
    case when st = 'pending' then ' — ждёт проверки удостоверения' else '' end));

  secret := encode(gen_random_bytes(24), 'hex');
  insert into cnd_sessions (secret_hash, token_id, login_id, nickname, role, expires_at)
  values (cnd_hash(secret), t.id, lid, trim(p_nickname), t.role, t.expires_at) returning id into sid;

  return jsonb_build_object('secret', secret, 'id', sid, 'tokenId', t.id, 'loginId', lid,
    'nickname', trim(p_nickname), 'role', t.role, 'pending', st = 'pending', 'perms', cnd_perm_list(t.role),
    'expiresAt', (extract(epoch from t.expires_at) * 1000)::bigint);
end $$;

create or replace function cnd_restore(p_session text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session); st text; mode text;
begin
  select status into st from cnd_logins where id = s.login_id;
  select data->>'loginMode' into mode from cnd_settings where id = 1;
  return jsonb_build_object('id', s.id, 'tokenId', s.token_id, 'loginId', s.login_id, 'nickname', s.nickname,
    'role', s.role, 'pending', (st = 'pending' and mode = 'approval'), 'perms', cnd_perm_list(s.role),
    'expiresAt', (extract(epoch from s.expires_at) * 1000)::bigint);
end $$;

create or replace function cnd_logout(p_session text) returns void
language sql security definer set search_path = public, extensions as $$
  delete from cnd_sessions where secret_hash = cnd_hash(coalesce(p_session,''))
$$;

create or replace function cnd_issue_token(p_session text, p_nickname text, p_role text, p_hours int, p_note text, p_max_uses int)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_need(p_session, 'tokens'); code text := cnd_gen_code(); t cnd_tokens;
begin
  if s.role <> 'admin' and p_role in ('editor','senior','admin') then
    raise exception 'Токены уровней 3–5 выдаёт только уровень 5';
  end if;
  insert into cnd_tokens (hash, code_hint, nickname, role, note, expires_at, issued_by, max_uses)
  values (cnd_hash(code), right(code, 4), nullif(trim(p_nickname), ''), p_role, coalesce(p_note, ''),
    now() + make_interval(hours => coalesce(p_hours, 42)), s.nickname, p_max_uses)
  returning * into t;
  perform cnd_discord('tokens', format('🎫 %s выдал(а) токен «%s» для **%s** на %s ч', s.nickname, p_role,
    coalesce(nullif(trim(p_nickname), ''), 'группы'), coalesce(p_hours, 42)));
  return cnd_token_json(t) || jsonb_build_object('code', code);
end $$;

create or replace function cnd_list_tokens(p_session text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform cnd_need(p_session, 'tokens');
  return coalesce((select jsonb_agg(cnd_token_json(t) order by t.created_at desc) from cnd_tokens t), '[]'::jsonb);
end $$;

create or replace function cnd_revoke_token(p_session text, p_id uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin perform cnd_need(p_session, 'tokens'); update cnd_tokens set revoked = true where id = p_id; end $$;

create or replace function cnd_set_token_role(p_session text, p_id uuid, p_role text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_need(p_session, 'tokens'); t cnd_tokens;
begin
  if p_role not in ('intern','journalist','editor','senior','admin') then raise exception 'Неизвестная должность'; end if;
  select * into t from cnd_tokens where id = p_id;
  if not found then raise exception 'Токен не найден'; end if;
  if t.id = s.token_id then raise exception 'Свою должность менять нельзя'; end if;
  if s.role <> 'admin' and (p_role in ('editor','senior','admin') or t.role in ('editor','senior','admin')) then
    raise exception 'Уровни 3–5 назначает только уровень 5';
  end if;
  update cnd_tokens set role = p_role where id = p_id;
  update cnd_sessions set role = p_role where token_id = p_id;
end $$;

create or replace function cnd_extend_token(p_session text, p_id uuid, p_hours int) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform cnd_need(p_session, 'tokens');
  update cnd_tokens set revoked = false,
    expires_at = greatest(now(), coalesce(expires_at, now())) + make_interval(hours => coalesce(p_hours, 42))
  where id = p_id;
  update cnd_sessions set expires_at = (select expires_at from cnd_tokens where id = p_id) where token_id = p_id;
end $$;

create or replace function cnd_list_logins(p_session text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform cnd_need(p_session, 'logins');
  delete from cnd_logins where at < now() - interval '30 days';
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', l.id, 'at', (extract(epoch from l.at) * 1000)::bigint, 'nickname', l.nickname, 'tokenId', l.token_id,
      'idPhoto', l.id_photo, 'userAgent', l.user_agent, 'status', l.status, 'reason', l.reason,
      'token', case when t.id is null then null else cnd_token_json(t) end) order by l.at desc)
    from (select * from cnd_logins order by at desc limit 300) l left join cnd_tokens t on t.id = l.token_id), '[]'::jsonb);
end $$;

create or replace function cnd_set_login_status(p_session text, p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin perform cnd_need(p_session, 'logins'); update cnd_logins set status = p_status where id = p_id; end $$;

create or replace function cnd_get_settings(p_session text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session); d jsonb := (select data from cnd_settings where id = 1);
begin
  if not cnd_can(s.role, 'discord') then d := d - 'discordWebhook' - 'discordChannels'; end if;
  return d;
end $$;

create or replace function cnd_save_settings(p_session text, p_data jsonb) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session);
begin
  if s.role <> 'admin' then raise exception 'Только для админа'; end if;
  update cnd_settings set data = data || p_data where id = 1;
end $$;

create or replace function cnd_work_json(w cnd_works, with_doc boolean) returns jsonb language sql stable as $$
  select jsonb_build_object('id', w.id, 'author', w.author, 'title', w.title, 'status', w.status, 'thumb', w.thumb,
    'createdAt', (extract(epoch from w.created_at) * 1000)::bigint, 'updatedAt', (extract(epoch from w.updated_at) * 1000)::bigint,
    'deletedAt', (extract(epoch from w.deleted_at) * 1000)::bigint)
    || case when with_doc then jsonb_build_object('doc', w.doc) else '{}'::jsonb end
$$;

create or replace function cnd_list_works(p_session text, p_all boolean) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session);
begin
  if p_all and not cnd_can(s.role, 'works') then raise exception 'Недостаточно прав'; end if;
  return coalesce((select jsonb_agg(cnd_work_json(w, false) order by w.updated_at desc)
    from cnd_works w where w.deleted_at is null and (p_all or w.author = s.nickname)), '[]'::jsonb);
end $$;

create or replace function cnd_get_work(p_session text, p_id text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session); w cnd_works;
begin
  select * into w from cnd_works where id = p_id and deleted_at is null;
  if not found then return null; end if;
  if w.author <> s.nickname and not cnd_can(s.role, 'works') then raise exception 'Чужая работа'; end if;
  return cnd_work_json(w, true);
end $$;

create or replace function cnd_save_work(p_session text, p_work jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session); w cnd_works;
begin
  select * into w from cnd_works where id = p_work->>'id';
  if found and w.author <> s.nickname and not cnd_can(s.role, 'works') then raise exception 'Чужая работа'; end if;
  insert into cnd_works (id, author, title, status, thumb, doc)
  values (p_work->>'id', s.nickname, p_work->>'title', 'draft', p_work->>'thumb', p_work->'doc')
  on conflict (id) do update set title = coalesce(excluded.title, cnd_works.title),
    thumb = coalesce(excluded.thumb, cnd_works.thumb), doc = coalesce(excluded.doc, cnd_works.doc), updated_at = now(), deleted_at = null
  returning * into w;
  return cnd_work_json(w, false);
end $$;

create or replace function cnd_delete_work(p_session text, p_id text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session);
begin
  update cnd_works set deleted_at = now()
  where id = p_id and deleted_at is null and (author = s.nickname or cnd_can(s.role, 'works'));
end $$;

create or replace function cnd_list_trash(p_session text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session);
begin
  delete from cnd_works where deleted_at is not null and deleted_at < now() - interval '30 days';
  return coalesce((select jsonb_agg(cnd_work_json(w, false) order by w.deleted_at desc)
    from cnd_works w where w.deleted_at is not null and (w.author = s.nickname or cnd_can(s.role, 'works'))), '[]'::jsonb);
end $$;

create or replace function cnd_restore_work(p_session text, p_id text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session);
begin
  update cnd_works set deleted_at = null, updated_at = now()
  where id = p_id and deleted_at is not null and (author = s.nickname or cnd_can(s.role, 'works'));
end $$;

create or replace function cnd_purge_work(p_session text, p_id text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session);
begin
  delete from cnd_works where id = p_id and deleted_at is not null and (author = s.nickname or cnd_can(s.role, 'works'));
end $$;

create or replace function cnd_tpl_json(t cnd_templates) returns jsonb language sql stable as $$
  select jsonb_build_object('id', t.id, 'author', t.author, 'name', t.name, 'tags', to_jsonb(t.tags), 'kind', t.kind,
    'thumb', t.thumb, 'doc', t.doc, 'official', t.official, 'hidden', t.hidden, 'uses', t.uses,
    'createdAt', (extract(epoch from t.created_at) * 1000)::bigint)
$$;

create or replace function cnd_list_templates(p_session text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session);
begin
  return coalesce((select jsonb_agg(cnd_tpl_json(t) || jsonb_build_object('pinned', t.pinned,
      'likes', (select count(*) from cnd_likes l where l.kind = 'template' and l.item_id = t.id),
      'liked', exists(select 1 from cnd_likes l where l.kind = 'template' and l.item_id = t.id and l.nickname = s.nickname))
    order by t.pinned desc, t.official desc, t.uses desc, t.created_at desc)
    from cnd_templates t where not t.hidden), '[]'::jsonb);
end $$;

create or replace function cnd_save_template(p_session text, p_tpl jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session); t cnd_templates;
begin
  if coalesce(p_tpl->>'id', '') <> '' then
    update cnd_templates set name = p_tpl->>'name', tags = coalesce(array(select jsonb_array_elements_text(p_tpl->'tags')), '{}'),
      kind = p_tpl->>'kind', thumb = p_tpl->>'thumb', doc = p_tpl->'doc'
    where id = (p_tpl->>'id')::uuid and (author = s.nickname or cnd_can(s.role, 'templates'))
    returning * into t;
    if not found then raise exception 'Обновлять шаблон может только его автор'; end if;
    return cnd_tpl_json(t);
  end if;
  insert into cnd_templates (author, name, tags, kind, thumb, doc)
  values (s.nickname, p_tpl->>'name', coalesce(array(select jsonb_array_elements_text(p_tpl->'tags')), '{}'),
    p_tpl->>'kind', p_tpl->>'thumb', p_tpl->'doc') returning * into t;
  return cnd_tpl_json(t);
end $$;

create or replace function cnd_use_template(p_session text, p_id uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin perform cnd_session(p_session); update cnd_templates set uses = uses + 1 where id = p_id; end $$;

create or replace function cnd_update_template(p_session text, p_id uuid, p_patch jsonb) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform cnd_need(p_session, 'templates');
  update cnd_templates set
    official = coalesce((p_patch->>'official')::boolean, official),
    hidden = coalesce((p_patch->>'hidden')::boolean, hidden)
  where id = p_id;
end $$;

create or replace function cnd_delete_template(p_session text, p_id uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session);
begin
  delete from cnd_templates where id = p_id and (author = s.nickname or cnd_can(s.role, 'templates'));
end $$;

create or replace function cnd_log_export(p_session text, p_work_id text, p_title text, p_format text, p_watermark text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session); e cnd_exports;
begin
  insert into cnd_exports (author, work_id, title, format, watermark)
  values (s.nickname, p_work_id, p_title, p_format, p_watermark) returning * into e;
  perform cnd_discord('exports', format('🖼 %s выгрузил(а) «%s» (%s, знак: %s)', s.nickname, coalesce(p_title, 'Без названия'), p_format, p_watermark));
  return jsonb_build_object('id', e.id, 'at', (extract(epoch from e.at) * 1000)::bigint, 'author', e.author);
end $$;

create or replace function cnd_list_exports(p_session text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform cnd_need(p_session, 'exports');
  return coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'at', (extract(epoch from e.at) * 1000)::bigint,
    'author', e.author, 'workId', e.work_id, 'title', e.title, 'format', e.format, 'watermark', e.watermark) order by e.at desc)
    from (select * from cnd_exports order by at desc limit 500) e), '[]'::jsonb);
end $$;

revoke execute on function cnd_session(text), cnd_manager(text) from public, anon, authenticated;

create table if not exists cnd_fonts (
  id uuid primary key default gen_random_uuid(),
  family text not null unique,
  author text,
  data text not null,
  created_at timestamptz not null default now()
);
alter table cnd_fonts enable row level security;

create or replace function cnd_list_fonts(p_session text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform cnd_session(p_session);
  return coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'family', f.family, 'author', f.author, 'data', f.data,
    'createdAt', (extract(epoch from f.created_at) * 1000)::bigint) order by f.family) from cnd_fonts f), '[]'::jsonb);
end $$;

create or replace function cnd_save_font(p_session text, p_family text, p_data text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session); f cnd_fonts;
begin
  if coalesce(trim(p_family), '') = '' then raise exception 'Укажите название шрифта'; end if;
  if length(p_data) > 4200000 then raise exception 'Файл шрифта больше 3 МБ'; end if;
  if p_data !~ '^data:(font|application)/' then raise exception 'Это не файл шрифта'; end if;
  insert into cnd_fonts (family, author, data) values (trim(p_family), s.nickname, p_data)
  on conflict (family) do update set data = excluded.data, author = excluded.author, created_at = now()
  returning * into f;
  return jsonb_build_object('id', f.id, 'family', f.family, 'author', f.author);
end $$;

create or replace function cnd_delete_font(p_session text, p_id uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session);
begin
  delete from cnd_fonts where id = p_id and (author = s.nickname or cnd_can(s.role, 'library'));
end $$;

create table if not exists cnd_elements (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  name text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);
alter table cnd_elements enable row level security;

create or replace function cnd_list_elements(p_session text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform cnd_session(p_session);
  return coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'name', e.name, 'author', e.author, 'data', e.data,
    'createdAt', (extract(epoch from e.created_at) * 1000)::bigint) order by e.created_at desc) from cnd_elements e), '[]'::jsonb);
end $$;

create or replace function cnd_save_element(p_session text, p_name text, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session); e cnd_elements;
begin
  if coalesce(trim(p_name), '') = '' then raise exception 'Укажите название элемента'; end if;
  if length(p_data::text) > 3000000 then raise exception 'Элемент больше 2 МБ'; end if;
  insert into cnd_elements (author, name, data) values (s.nickname, left(trim(p_name), 80), p_data) returning * into e;
  return jsonb_build_object('id', e.id, 'name', e.name, 'author', e.author, 'data', e.data,
    'createdAt', (extract(epoch from e.created_at) * 1000)::bigint);
end $$;

create or replace function cnd_delete_element(p_session text, p_id uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session);
begin
  delete from cnd_elements where id = p_id and (author = s.nickname or cnd_can(s.role, 'library'));
end $$;

create table if not exists cnd_archive (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  title text,
  work_id text,
  thumb text,
  image text,
  width int, height int,
  created_at timestamptz not null default now()
);
create index if not exists cnd_archive_created on cnd_archive (created_at desc);
alter table cnd_archive add column if not exists pinned boolean not null default false;
alter table cnd_templates add column if not exists pinned boolean not null default false;

create table if not exists cnd_likes (
  kind text not null check (kind in ('archive','template')),
  item_id uuid not null,
  nickname text not null,
  at timestamptz not null default now(),
  primary key (kind, item_id, nickname)
);
alter table cnd_likes enable row level security;
alter table cnd_archive enable row level security;

create or replace function cnd_archive_json(a cnd_archive, with_image boolean) returns jsonb language sql stable as $$
  select jsonb_build_object('id', a.id, 'author', a.author, 'title', a.title, 'workId', a.work_id, 'thumb', a.thumb,
    'width', a.width, 'height', a.height, 'at', (extract(epoch from a.created_at) * 1000)::bigint)
    || case when with_image then jsonb_build_object('image', a.image) else '{}'::jsonb end
$$;

create or replace function cnd_archive_add(p_session text, p_item jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session); a cnd_archive;
begin
  if length(coalesce(p_item->>'image', '')) > 2800000 then raise exception 'Картинка для архива слишком большая'; end if;
  if p_item->>'workId' is not null then
    select * into a from cnd_archive where work_id = p_item->>'workId' and author = s.nickname;
  end if;
  if found then
    update cnd_archive set title = p_item->>'title', thumb = p_item->>'thumb', image = p_item->>'image',
      width = (p_item->>'width')::int, height = (p_item->>'height')::int, created_at = now()
    where id = a.id returning * into a;
  else
    insert into cnd_archive (author, title, work_id, thumb, image, width, height)
    values (s.nickname, p_item->>'title', p_item->>'workId', p_item->>'thumb', p_item->>'image',
      (p_item->>'width')::int, (p_item->>'height')::int)
    returning * into a;
  end if;
  return cnd_archive_json(a, false);
end $$;

create or replace function cnd_archive_list(p_session text, p_q text, p_before bigint, p_limit int) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session);
begin
  return coalesce((select jsonb_agg(cnd_archive_json(a, false) || jsonb_build_object('pinned', a.pinned,
      'likes', (select count(*) from cnd_likes l where l.kind = 'archive' and l.item_id = a.id),
      'liked', exists(select 1 from cnd_likes l where l.kind = 'archive' and l.item_id = a.id and l.nickname = s.nickname))
    order by a.pinned desc, a.created_at desc) from (
    (select * from cnd_archive a where p_before is null and a.pinned
      and (coalesce(p_q, '') = '' or a.title ilike '%' || p_q || '%' or a.author ilike '%' || p_q || '%'))
    union all
    (select * from cnd_archive a
    where not a.pinned and (p_before is null or a.created_at < to_timestamp(p_before / 1000.0))
      and (coalesce(p_q, '') = '' or a.title ilike '%' || p_q || '%' or a.author ilike '%' || p_q || '%')
    order by a.created_at desc limit least(coalesce(p_limit, 40), 100))) a), '[]'::jsonb);
end $$;

create or replace function cnd_archive_get(p_session text, p_id uuid) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare a cnd_archive;
begin
  perform cnd_session(p_session);
  select * into a from cnd_archive where id = p_id;
  if not found then return null; end if;
  return cnd_archive_json(a, true);
end $$;

create or replace function cnd_archive_delete(p_session text, p_id uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session);
begin
  delete from cnd_archive where id = p_id and (author = s.nickname or cnd_can(s.role, 'archiveDelete'));
end $$;

create or replace function cnd_like(p_session text, p_kind text, p_id uuid, p_on boolean) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s cnd_sessions := cnd_session(p_session);
begin
  if p_kind not in ('archive','template') then raise exception 'Неизвестный тип'; end if;
  if p_on then
    insert into cnd_likes (kind, item_id, nickname) values (p_kind, p_id, s.nickname) on conflict do nothing;
  else
    delete from cnd_likes where kind = p_kind and item_id = p_id and nickname = s.nickname;
  end if;
  return jsonb_build_object('likes', (select count(*) from cnd_likes where kind = p_kind and item_id = p_id),
    'liked', exists(select 1 from cnd_likes where kind = p_kind and item_id = p_id and nickname = s.nickname));
end $$;

create or replace function cnd_pin(p_session text, p_kind text, p_id uuid, p_on boolean) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform cnd_need(p_session, 'pin');
  if p_kind = 'archive' then update cnd_archive set pinned = p_on where id = p_id;
  elsif p_kind = 'template' then update cnd_templates set pinned = p_on where id = p_id;
  else raise exception 'Неизвестный тип'; end if;
end $$;

revoke execute on function cnd_need(text, text) from public, anon, authenticated;
