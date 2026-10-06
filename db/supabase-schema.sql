-- ============================================================
-- 云同步表结构（Supabase SQL Editor 里整段执行一次）
-- 通道一 · 同步码：只存密文，表禁止直读，只能走受控函数
-- 通道二 · 账号：RLS 按 auth.uid() 隔离
-- ============================================================

-- ---------- 通道一 · 同步码 ----------
create table if not exists public.sync_codes (
  code_hash   text primary key,
  payload     text not null,
  iv          text not null,
  size        integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '180 days')
);

alter table public.sync_codes enable row level security;
-- 表本身不给 anon/authenticated 任何直读直写权限（只能通过下面的函数）
revoke all on public.sync_codes from anon, authenticated;

-- 写入：校验 hash 长度、密文体积，并做「同一码 5 秒内只能写一次」的最小限流
create or replace function public.sync_save(p_hash text, p_payload text, p_iv text, p_size integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare last_at timestamptz;
begin
  if p_hash is null or length(p_hash) <> 64 then
    raise exception 'bad hash';
  end if;
  if p_payload is null or length(p_payload) > 350000 then
    raise exception 'payload too large';
  end if;
  if coalesce(p_size, 0) > 262144 then
    raise exception 'payload too large';
  end if;
  select updated_at into last_at from sync_codes where code_hash = p_hash;
  if last_at is not null and now() - last_at < interval '5 seconds' then
    raise exception 'too frequent';
  end if;
  insert into sync_codes (code_hash, payload, iv, size)
  values (p_hash, p_payload, p_iv, coalesce(p_size, 0))
  on conflict (code_hash) do update
    set payload = excluded.payload,
        iv = excluded.iv,
        size = excluded.size,
        updated_at = now(),
        expires_at = now() + interval '180 days';
end $$;

-- 读取：只有拿着 code_hash 才能取到那一行（hash 来自 100bit 同步码，无法枚举）
create or replace function public.sync_load(p_hash text)
returns table(payload text, iv text, updated_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select c.payload, c.iv, c.updated_at
  from sync_codes c
  where c.code_hash = p_hash and c.expires_at > now();
$$;

-- 删除：重新生成同步码时作废旧码
create or replace function public.sync_drop(p_hash text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from sync_codes where code_hash = p_hash;
$$;

revoke all on function public.sync_save(text, text, text, integer) from public;
revoke all on function public.sync_load(text) from public;
revoke all on function public.sync_drop(text) from public;
grant execute on function public.sync_save(text, text, text, integer) to anon, authenticated;
grant execute on function public.sync_load(text) to anon, authenticated;
grant execute on function public.sync_drop(text) to anon, authenticated;

-- ---------- 通道二 · 账号数据 ----------
create table if not exists public.user_data (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  payload     jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  device      text
);

alter table public.user_data enable row level security;

drop policy if exists ud_select on public.user_data;
create policy ud_select on public.user_data
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists ud_insert on public.user_data;
create policy ud_insert on public.user_data
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists ud_update on public.user_data;
create policy ud_update on public.user_data
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists ud_delete on public.user_data;
create policy ud_delete on public.user_data
  for delete to authenticated using (auth.uid() = user_id);

-- updated_at 由触发器维护（客户端不传时间戳，避免改本机时间作弊）
create or replace function public.touch_user_data()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_touch_user_data on public.user_data;
create trigger trg_touch_user_data
  before insert or update on public.user_data
  for each row execute function public.touch_user_data();

-- ---------- 维护（可选，需要时手动跑） ----------
-- 清理超过 180 天未更新的同步码：
-- delete from public.sync_codes where expires_at < now();

-- 自检：下面两条应分别返回 0 行（说明没泄漏）与函数存在
-- select * from public.sync_codes limit 1;
-- select proname from pg_proc where proname in ('sync_save','sync_load','sync_drop');
