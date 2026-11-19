-- Run in Supabase Dashboard -> SQL Editor to enable the Important Links section.
-- Existing flat links are kept and moved into a one-time "General" group.

create table if not exists public.admin_important_link_groups (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 100),
  subtitle text not null default '' check (char_length(subtitle) <= 240),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_important_links (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.admin_important_link_groups(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 100),
  description text not null default '' check (char_length(description) <= 240),
  url text not null check (
    char_length(url) <= 2048
    and url ~* '^https?://'
  ),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_important_link_features (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.admin_important_links(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 100),
  description text not null default '' check (char_length(description) <= 500),
  url text not null default '' check (
    url = ''
    or (
      char_length(url) <= 2048
      and url ~* '^https?://'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade the earlier single-list table without losing saved links.
alter table public.admin_important_links
  add column if not exists group_id uuid
  references public.admin_important_link_groups(id) on delete cascade;

alter table public.admin_important_links
  add column if not exists description text not null default '';

alter table public.admin_important_links
  add column if not exists urls jsonb not null default '[]'::jsonb;

update public.admin_important_links
  set urls =
    case
      when jsonb_array_length(urls) > 0 then urls
      when char_length(coalesce(url, '')) > 0 then jsonb_build_array(url)
      else '[]'::jsonb
    end
  where
    jsonb_array_length(urls) = 0
    and char_length(coalesce(url, '')) > 0;

alter table public.admin_important_link_features
  add column if not exists url text not null default '';

alter table public.admin_important_link_features
  drop constraint if exists admin_important_link_features_url_check;

alter table public.admin_important_link_features
  add constraint admin_important_link_features_url_check
  check (
    url = ''
    or (
      char_length(url) <= 2048
      and url ~* '^https?://'
    )
  );

do $$
declare
  default_group_id uuid;
begin
  if exists (
    select 1
    from public.admin_important_links
    where group_id is null
  ) then
    select id
      into default_group_id
      from public.admin_important_link_groups
      where title = 'General'
        and subtitle = 'Links saved before groups were added'
      limit 1;

    if default_group_id is null then
      insert into public.admin_important_link_groups (title, subtitle)
      values ('General', 'Links saved before groups were added')
      returning id into default_group_id;
    end if;

    update public.admin_important_links
      set group_id = default_group_id
      where group_id is null;
  end if;
end $$;

alter table public.admin_important_links
  alter column group_id set not null;

create index if not exists admin_important_link_groups_created_at_idx
  on public.admin_important_link_groups (created_at desc);

create index if not exists admin_important_links_group_created_at_idx
  on public.admin_important_links (group_id, created_at desc);

create index if not exists admin_important_link_features_link_created_at_idx
  on public.admin_important_link_features (link_id, created_at);

alter table public.admin_important_link_groups enable row level security;
alter table public.admin_important_links enable row level security;
alter table public.admin_important_link_features enable row level security;

grant select, insert, update, delete
  on table public.admin_important_link_groups to authenticated;
grant select, insert, update, delete
  on table public.admin_important_links to authenticated;
grant select, insert, update, delete
  on table public.admin_important_link_features to authenticated;

drop policy if exists "Dashboard staff can manage important links"
  on public.admin_important_links;
drop policy if exists "Important Links staff can manage groups"
  on public.admin_important_link_groups;
drop policy if exists "Important Links staff can manage links"
  on public.admin_important_links;
drop policy if exists "Important Links staff can manage features"
  on public.admin_important_link_features;

create policy "Important Links staff can manage groups"
on public.admin_important_link_groups
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and (
        profiles.role in ('owner', 'admin')
        or exists (
          select 1
          from public.custom_roles
          where custom_roles.name = profiles.role
            and 'importantlinks' = any(custom_roles.permissions)
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and (
        profiles.role in ('owner', 'admin')
        or exists (
          select 1
          from public.custom_roles
          where custom_roles.name = profiles.role
            and 'importantlinks' = any(custom_roles.permissions)
        )
      )
  )
);

create policy "Important Links staff can manage links"
on public.admin_important_links
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and (
        profiles.role in ('owner', 'admin')
        or exists (
          select 1
          from public.custom_roles
          where custom_roles.name = profiles.role
            and 'importantlinks' = any(custom_roles.permissions)
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and (
        profiles.role in ('owner', 'admin')
        or exists (
          select 1
          from public.custom_roles
          where custom_roles.name = profiles.role
            and 'importantlinks' = any(custom_roles.permissions)
        )
      )
  )
);

create policy "Important Links staff can manage features"
on public.admin_important_link_features
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and (
        profiles.role in ('owner', 'admin')
        or exists (
          select 1
          from public.custom_roles
          where custom_roles.name = profiles.role
            and 'importantlinks' = any(custom_roles.permissions)
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and (
        profiles.role in ('owner', 'admin')
        or exists (
          select 1
          from public.custom_roles
          where custom_roles.name = profiles.role
            and 'importantlinks' = any(custom_roles.permissions)
        )
      )
  )
);
