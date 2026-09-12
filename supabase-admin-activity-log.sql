-- Run this once in Supabase Dashboard -> SQL Editor.
-- Stores a readable audit trail for admin changes.

create table if not exists public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text not null default 'Unknown member',
  actor_role text not null default 'unknown',
  action text not null check (action in ('created', 'updated', 'deleted', 'visibility_changed', 'role_changed')),
  section text not null,
  item_name text not null default '',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_log_created_at_idx
  on public.admin_activity_log (created_at desc);

alter table public.admin_activity_log enable row level security;
grant select, insert on table public.admin_activity_log to authenticated;

drop policy if exists "Staff can read admin activity" on public.admin_activity_log;
drop policy if exists "Staff can create admin activity" on public.admin_activity_log;

create policy "Staff can read admin activity"
on public.admin_activity_log
for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and (
        profiles.role in ('owner', 'admin', 'gamemod')
        or exists (
          select 1 from public.custom_roles
          where custom_roles.name = profiles.role
            and cardinality(custom_roles.permissions) > 0
        )
      )
  )
);

create policy "Staff can create admin activity"
on public.admin_activity_log
for insert
to authenticated
with check (actor_id = auth.uid());
