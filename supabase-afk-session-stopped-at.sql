-- Run in Supabase Dashboard -> SQL Editor.
-- Adds the session end timestamp used by the AFK session RPCs.

alter table public.afk_sessions
  add column if not exists stopped_at timestamptz;

alter table public.afk_sessions
  drop constraint if exists afk_sessions_status_check;

alter table public.afk_sessions
  add constraint afk_sessions_status_check
  check (status in ('active', 'paused', 'completed', 'expired', 'stopped'));
