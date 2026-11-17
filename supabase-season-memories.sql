-- Run once in Supabase Dashboard -> SQL Editor.
-- Season records reuse public.seasons. Media stays on external URLs; no Storage bucket is created.

create table if not exists public.season_memory_sections (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  title text not null,
  description text not null default '',
  section_type text not null default 'gallery'
    check (section_type in ('gallery', 'teams', 'custom')),
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists season_memory_sections_season_order_idx
  on public.season_memory_sections (season_id, sort_order);

create table if not exists public.season_memory_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.season_memory_sections(id) on delete cascade,
  title text not null default '',
  description text not null default '',
  item_type text not null default 'image'
    check (item_type in ('image', 'video', 'team', 'text')),
  media_url text not null default ''
    check (media_url = '' or media_url ~ '^https?://'),
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint season_memory_media_url_required
    check (item_type not in ('image', 'video') or length(trim(media_url)) > 0)
);

create index if not exists season_memory_items_section_order_idx
  on public.season_memory_items (section_id, sort_order);

create or replace function public.is_memories_staff()
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
              'memories' = any(custom_role.permissions)
              or 'settings' = any(custom_role.permissions)
            )
        )
      )
  );
$$;

revoke all on function public.is_memories_staff() from public;
grant execute on function public.is_memories_staff() to authenticated;

alter table public.season_memory_sections enable row level security;
alter table public.season_memory_items enable row level security;

grant select on public.season_memory_sections, public.season_memory_items
  to anon, authenticated;
grant insert, update, delete on public.season_memory_sections, public.season_memory_items
  to authenticated;

drop policy if exists "Public can read visible season memory sections"
  on public.season_memory_sections;
drop policy if exists "Staff can manage season memory sections"
  on public.season_memory_sections;
drop policy if exists "Public can read visible season memory items"
  on public.season_memory_items;
drop policy if exists "Staff can manage season memory items"
  on public.season_memory_items;

create policy "Public can read visible season memory sections"
on public.season_memory_sections
for select
to anon, authenticated
using (is_visible = true);

create policy "Staff can manage season memory sections"
on public.season_memory_sections
for all
to authenticated
using (public.is_memories_staff())
with check (public.is_memories_staff());

create policy "Public can read visible season memory items"
on public.season_memory_items
for select
to anon, authenticated
using (
  is_visible = true
  and exists (
    select 1
    from public.season_memory_sections section
    where section.id = season_memory_items.section_id
      and section.is_visible = true
  )
);

create policy "Staff can manage season memory items"
on public.season_memory_items
for all
to authenticated
using (public.is_memories_staff())
with check (public.is_memories_staff());
