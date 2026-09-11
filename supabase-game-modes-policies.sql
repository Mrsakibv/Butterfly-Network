-- Run this once in Supabase Dashboard -> SQL Editor.
-- It allows staff users to manage game modes while visitors can read active modes.

create or replace function public.is_game_mode_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('owner', 'admin', 'gamemod')
  );
$$;

revoke all on function public.is_game_mode_staff() from public;
grant execute on function public.is_game_mode_staff() to authenticated;

alter table public.game_modes enable row level security;

alter table public.game_modes
add column if not exists icon_url text default '';

grant usage on schema public to anon, authenticated;
grant select on table public.game_modes to anon, authenticated;
grant insert, update, delete on table public.game_modes to authenticated;

drop policy if exists "Public can read active game modes" on public.game_modes;
drop policy if exists "Staff can read all game modes" on public.game_modes;
drop policy if exists "Staff can create game modes" on public.game_modes;
drop policy if exists "Staff can update game modes" on public.game_modes;
drop policy if exists "Staff can delete game modes" on public.game_modes;

create policy "Public can read active game modes"
on public.game_modes
for select
to anon, authenticated
using (is_active = true);

create policy "Staff can read all game modes"
on public.game_modes
for select
to authenticated
using (public.is_game_mode_staff());

create policy "Staff can create game modes"
on public.game_modes
for insert
to authenticated
with check (public.is_game_mode_staff());

create policy "Staff can update game modes"
on public.game_modes
for update
to authenticated
using (public.is_game_mode_staff())
with check (public.is_game_mode_staff());

create policy "Staff can delete game modes"
on public.game_modes
for delete
to authenticated
using (public.is_game_mode_staff());

-- Custom game mode icon storage.
insert into storage.buckets (id, name, public)
values ('game-mode-icons', 'game-mode-icons', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view game mode icons" on storage.objects;
drop policy if exists "Staff can upload game mode icons" on storage.objects;
drop policy if exists "Staff can update game mode icons" on storage.objects;
drop policy if exists "Staff can delete game mode icons" on storage.objects;

create policy "Public can view game mode icons"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'game-mode-icons');

create policy "Staff can upload game mode icons"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'game-mode-icons' and public.is_game_mode_staff());

create policy "Staff can update game mode icons"
on storage.objects
for update
to authenticated
using (bucket_id = 'game-mode-icons' and public.is_game_mode_staff())
with check (bucket_id = 'game-mode-icons' and public.is_game_mode_staff());

create policy "Staff can delete game mode icons"
on storage.objects
for delete
to authenticated
using (bucket_id = 'game-mode-icons' and public.is_game_mode_staff());

-- Custom admin roles and permissions.
create table if not exists public.custom_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  permissions text[] not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function public.is_game_mode_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (
        role in ('owner', 'admin', 'gamemod')
        or exists (
          select 1 from public.custom_roles custom_role
          where custom_role.name = profiles.role
            and cardinality(custom_role.permissions) > 0
        )
      )
  );
$$;

alter table public.custom_roles enable row level security;
grant select, insert, update, delete on table public.custom_roles to authenticated;

drop policy if exists "Staff can read custom roles" on public.custom_roles;
drop policy if exists "Owners can manage custom roles" on public.custom_roles;

create policy "Staff can read custom roles"
on public.custom_roles
for select
to authenticated
using (public.is_game_mode_staff());

create policy "Owners can manage custom roles"
on public.custom_roles
for all
to authenticated
using (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'))
with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));

-- Database-driven navigation and content pages.
create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  menu_label text not null,
  route text not null unique,
  menu_group text not null default 'more' check (menu_group in ('main', 'more')),
  sort_order integer not null default 999,
  is_visible boolean not null default true,
  page_type text not null default 'content' check (page_type in ('content', 'external')),
  content text not null default '',
  meta_title text not null default '',
  meta_description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_pages enable row level security;

grant select on table public.site_pages to anon, authenticated;
grant insert, update, delete on table public.site_pages to authenticated;

create or replace function public.is_site_page_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (
        role in ('owner', 'admin')
        or exists (
          select 1
          from public.custom_roles custom_role
          where custom_role.name = profiles.role
            and (
              'settings' = any(custom_role.permissions)
              or 'pages' = any(custom_role.permissions)
            )
        )
      )
  );
$$;

revoke all on function public.is_site_page_staff() from public;
grant execute on function public.is_site_page_staff() to authenticated;

drop policy if exists "Public can read visible site pages" on public.site_pages;
drop policy if exists "Staff can read all site pages" on public.site_pages;
drop policy if exists "Staff can create site pages" on public.site_pages;
drop policy if exists "Staff can update site pages" on public.site_pages;
drop policy if exists "Staff can delete site pages" on public.site_pages;

create policy "Public can read visible site pages"
on public.site_pages
for select
to anon, authenticated
using (is_visible = true);

create policy "Staff can read all site pages"
on public.site_pages
for select
to authenticated
using (public.is_site_page_staff());

create policy "Staff can create site pages"
on public.site_pages
for insert
to authenticated
with check (public.is_site_page_staff());

create policy "Staff can update site pages"
on public.site_pages
for update
to authenticated
using (public.is_site_page_staff())
with check (public.is_site_page_staff());

create policy "Staff can delete site pages"
on public.site_pages
for delete
to authenticated
using (public.is_site_page_staff());

-- Initial menu rows. These can be edited later from Admin -> Pages.
insert into public.site_pages (slug, title, menu_label, route, menu_group, sort_order)
values
  ('home', 'Home', 'Home', '/', 'main', 10),
  ('games', 'Games', 'Games', '/games', 'main', 20),
  ('leaderboard', 'Leaderboard', 'Leaderboard', '/leaderboard', 'main', 30),
  ('store', 'Store', 'Store', '/pricing', 'main', 40),
  ('terms', 'Terms', 'Terms', '/terms', 'more', 10),
  ('rules', 'Rules', 'Rules', '/rules', 'more', 20),
  ('contact', 'Contact', 'Contact', '/contact', 'more', 30),
  ('events', 'Events', 'Events', '/events', 'more', 40),
  ('gallery', 'Gallery', 'Gallery', '/gallery', 'more', 50),
  ('commands', 'Commands', 'Commands', '/commands', 'more', 60),
  ('vote', 'Vote', 'Vote', '/vote', 'more', 70)
on conflict (route) do nothing;

-- Structured content items for the More pages.
create table if not exists public.site_page_items (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  item_type text not null,
  title text not null default '',
  subtitle text not null default '',
  description text not null default '',
  image_url text not null default '',
  link_url text not null default '',
  extra jsonb not null default '{}'::jsonb,
  sort_order integer not null default 999,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_page_items enable row level security;

grant select on table public.site_page_items to anon, authenticated;
grant insert, update, delete on table public.site_page_items to authenticated;

drop policy if exists "Public can read visible page items" on public.site_page_items;
drop policy if exists "Staff can read all page items" on public.site_page_items;
drop policy if exists "Staff can create page items" on public.site_page_items;
drop policy if exists "Staff can update page items" on public.site_page_items;
drop policy if exists "Staff can delete page items" on public.site_page_items;

create policy "Public can read visible page items"
on public.site_page_items
for select
to anon, authenticated
using (is_visible = true);

create policy "Staff can read all page items"
on public.site_page_items
for select
to authenticated
using (public.is_site_page_staff());

create policy "Staff can create page items"
on public.site_page_items
for insert
to authenticated
with check (public.is_site_page_staff());

create policy "Staff can update page items"
on public.site_page_items
for update
to authenticated
using (public.is_site_page_staff())
with check (public.is_site_page_staff());

create policy "Staff can delete page items"
on public.site_page_items
for delete
to authenticated
using (public.is_site_page_staff());

-- Uploaded images used by editable page sections.
insert into storage.buckets (id, name, public)
values ('site-content', 'site-content', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view site content images" on storage.objects;
drop policy if exists "Staff can upload site content images" on storage.objects;
drop policy if exists "Staff can update site content images" on storage.objects;
drop policy if exists "Staff can delete site content images" on storage.objects;

create policy "Public can view site content images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'site-content');

create policy "Staff can upload site content images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'site-content' and public.is_site_page_staff());

create policy "Staff can update site content images"
on storage.objects
for update
to authenticated
using (bucket_id = 'site-content' and public.is_site_page_staff())
with check (bucket_id = 'site-content' and public.is_site_page_staff());

create policy "Staff can delete site content images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'site-content' and public.is_site_page_staff());
