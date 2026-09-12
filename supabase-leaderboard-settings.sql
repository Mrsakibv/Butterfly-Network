-- Run once in Supabase Dashboard -> SQL Editor.
-- These fields only prepare the site for a future Paper/Spigot bridge.
-- No server secret is stored here.

alter table public.site_settings
  add column if not exists leaderboard_api_url text not null default '',
  add column if not exists leaderboard_enabled boolean not null default false,
  add column if not exists leaderboard_refresh_seconds integer not null default 60,
  add column if not exists leaderboard_server_id text not null default 'main',
  add column if not exists leaderboard_categories text not null default 'playtime,money,kills,wins',
  add column if not exists leaderboard_sync_mode text not null default 'polling',
  add column if not exists leaderboard_fallback_mode text not null default 'dummy';

create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  server_id text not null default 'main',
  category text not null,
  username text not null,
  avatar_url text not null default '',
  score text not null default '',
  raw_value numeric not null default 0,
  badge text not null default '',
  guild text not null default '',
  updated_at timestamptz not null default now(),
  unique (server_id, category, username)
);

alter table public.leaderboard_entries enable row level security;
grant select on public.leaderboard_entries to anon, authenticated;

drop policy if exists "Public can read leaderboard entries" on public.leaderboard_entries;
create policy "Public can read leaderboard entries"
on public.leaderboard_entries
for select
to anon, authenticated
using (true);

create table if not exists public.leaderboard_categories (
  id uuid primary key default gen_random_uuid(),
  category_id text not null unique,
  display_name text not null,
  stat_key text not null,
  description text not null default '',
  icon_name text not null default 'trophy',
  sort_order integer not null default 999,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leaderboard_categories enable row level security;
grant select on public.leaderboard_categories to anon, authenticated;
grant insert, update, delete on public.leaderboard_categories to authenticated;

create or replace function public.is_leaderboard_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (
        role in ('owner', 'admin')
        or exists (
          select 1 from public.custom_roles custom_role
          where custom_role.name = profiles.role
            and ('leaderboard' = any(custom_role.permissions) or 'settings' = any(custom_role.permissions))
        )
      )
  );
$$;

revoke all on function public.is_leaderboard_staff() from public;
grant execute on function public.is_leaderboard_staff() to authenticated;

drop policy if exists "Public can read active leaderboard categories" on public.leaderboard_categories;
drop policy if exists "Staff can read leaderboard categories" on public.leaderboard_categories;
drop policy if exists "Staff can create leaderboard categories" on public.leaderboard_categories;
drop policy if exists "Staff can update leaderboard categories" on public.leaderboard_categories;
drop policy if exists "Staff can delete leaderboard categories" on public.leaderboard_categories;

create policy "Public can read active leaderboard categories"
on public.leaderboard_categories for select to anon, authenticated using (is_active = true);
create policy "Staff can read leaderboard categories"
on public.leaderboard_categories for select to authenticated using (public.is_leaderboard_staff());
create policy "Staff can create leaderboard categories"
on public.leaderboard_categories for insert to authenticated with check (public.is_leaderboard_staff());
create policy "Staff can update leaderboard categories"
on public.leaderboard_categories for update to authenticated using (public.is_leaderboard_staff()) with check (public.is_leaderboard_staff());
create policy "Staff can delete leaderboard categories"
on public.leaderboard_categories for delete to authenticated using (public.is_leaderboard_staff());