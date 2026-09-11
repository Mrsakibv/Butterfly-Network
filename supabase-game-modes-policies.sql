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
