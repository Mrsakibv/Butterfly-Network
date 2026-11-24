-- Run in Supabase Dashboard -> SQL Editor.
-- Fixes AFK reward heartbeat RPCs that reference a nonexistent credited_seconds
-- field on the afk_sessions table record.

create table if not exists public.afk_user_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance bigint not null default 0,
  total_earned bigint not null default 0,
  total_spent bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.afk_coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount bigint not null,
  balance_after bigint not null,
  transaction_type text not null,
  description text,
  reference_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.afk_user_wallets
  add column if not exists total_earned bigint not null default 0,
  add column if not exists total_spent bigint not null default 0,
  add column if not exists updated_at timestamptz not null default now();

alter table public.afk_sessions
  add column if not exists stopped_at timestamptz;

create or replace function public.start_afk_session()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid := auth.uid();
  v_settings public.afk_settings%rowtype;
  v_session public.afk_sessions%rowtype;
begin
  if v_user_id is null then
    raise exception 'Login is required to start an AFK session.';
  end if;

  select *
  into v_settings
  from public.afk_settings
  where id = 'global';

  if not found or v_settings.enabled is not true then
    return jsonb_build_object(
      'success', false,
      'reason', 'AFK is currently disabled.'
    );
  end if;

  update public.afk_sessions
  set status = 'stopped',
      stopped_at = now()
  where user_id = v_user_id
    and status = 'active';

  insert into public.afk_sessions (
    user_id,
    started_at,
    last_heartbeat_at,
    status,
    active_seconds,
    reward_coins
  )
  values (
    v_user_id,
    now(),
    now(),
    'active',
    0,
    0
  )
  returning * into v_session;

  return jsonb_build_object(
    'success', true,
    'session_id', v_session.id,
    'status', v_session.status,
    'active_seconds', 0,
    'credited_seconds', 0,
    'credited_coins', 0
  );
end;
$function$;

create or replace function public.heartbeat_afk_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid := auth.uid();
  v_session public.afk_sessions%rowtype;
  v_settings public.afk_settings%rowtype;
  v_interval_seconds bigint;
  v_elapsed_seconds bigint;
  v_next_active_seconds bigint;
  v_old_intervals bigint;
  v_new_intervals bigint;
  v_earned_intervals bigint;
  v_credited_coins bigint;
  v_today_earned bigint;
  v_remaining_cap bigint;
  v_balance bigint;
begin
  if v_user_id is null then
    raise exception 'Login is required for AFK tracking.';
  end if;

  select *
  into v_session
  from public.afk_sessions
  where id = p_session_id
    and user_id = v_user_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'status', 'not_active',
      'reason', 'AFK session was not found.',
      'active_seconds', 0
    );
  end if;

  if v_session.status <> 'active' then
    return jsonb_build_object(
      'success', false,
      'status', v_session.status,
      'reason', 'AFK session is not active.',
      'active_seconds', coalesce(v_session.active_seconds, 0)
    );
  end if;

  select *
  into v_settings
  from public.afk_settings
  where id = 'global';

  if not found or v_settings.enabled is not true then
    update public.afk_sessions
    set status = 'stopped',
        stopped_at = now()
    where id = v_session.id;

    return jsonb_build_object(
      'success', false,
      'status', 'stopped',
      'reason', 'AFK is currently disabled.',
      'active_seconds', coalesce(v_session.active_seconds, 0)
    );
  end if;

  v_interval_seconds := greatest(coalesce(v_settings.minutes_per_reward, 1), 1) * 60;
  v_elapsed_seconds := greatest(
    0,
    floor(extract(epoch from (now() - v_session.last_heartbeat_at)))::bigint
  );
  v_next_active_seconds := coalesce(v_session.active_seconds, 0) + v_elapsed_seconds;

  v_old_intervals := floor(coalesce(v_session.active_seconds, 0)::numeric / v_interval_seconds)::bigint;
  v_new_intervals := floor(v_next_active_seconds::numeric / v_interval_seconds)::bigint;
  v_earned_intervals := greatest(v_new_intervals - v_old_intervals, 0);
  v_credited_coins := v_earned_intervals * greatest(coalesce(v_settings.coins_per_reward, 0), 0);

  select coalesce(sum(amount), 0)
  into v_today_earned
  from public.afk_coin_transactions
  where user_id = v_user_id
    and transaction_type = 'afk_reward'
    and created_at >= date_trunc('day', now());

  v_remaining_cap := greatest(
    coalesce(v_settings.daily_coin_cap, 0) - v_today_earned,
    0
  );
  v_credited_coins := least(v_credited_coins, v_remaining_cap);

  insert into public.afk_user_wallets (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  select balance
  into v_balance
  from public.afk_user_wallets
  where user_id = v_user_id
  for update;

  if v_credited_coins > 0 then
    v_balance := v_balance + v_credited_coins;

    update public.afk_user_wallets
    set balance = v_balance,
        total_earned = total_earned + v_credited_coins,
        updated_at = now()
    where user_id = v_user_id;

    insert into public.afk_coin_transactions (
      user_id,
      amount,
      balance_after,
      transaction_type,
      description,
      reference_id,
      metadata
    )
    values (
      v_user_id,
      v_credited_coins,
      v_balance,
      'afk_reward',
      'AFK reward interval',
      v_session.id::text,
      jsonb_build_object(
        'session_id', v_session.id,
        'active_seconds', v_next_active_seconds,
        'credited_seconds', v_earned_intervals * v_interval_seconds
      )
    );
  end if;

  update public.afk_sessions
  set active_seconds = v_next_active_seconds,
      last_heartbeat_at = now(),
      reward_coins = coalesce(reward_coins, 0) + v_credited_coins
  where id = v_session.id;

  return jsonb_build_object(
    'success', true,
    'session_id', v_session.id,
    'status', 'active',
    'active_seconds', v_next_active_seconds,
    'credited_seconds', v_earned_intervals * v_interval_seconds,
    'credited_coins', v_credited_coins,
    'new_balance', v_balance
  );
end;
$function$;

create or replace function public.stop_afk_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_heartbeat jsonb;
  v_session public.afk_sessions%rowtype;
  v_balance bigint;
begin
  v_heartbeat := public.heartbeat_afk_session(p_session_id);

  select *
  into v_session
  from public.afk_sessions
  where id = p_session_id
    and user_id = auth.uid();

  update public.afk_sessions
  set status = 'stopped',
      stopped_at = now()
  where id = p_session_id
    and user_id = auth.uid();

  select balance
  into v_balance
  from public.afk_user_wallets
  where user_id = auth.uid();

  return jsonb_build_object(
    'success', coalesce((v_heartbeat ->> 'success')::boolean, true),
    'session_id', p_session_id,
    'status', 'stopped',
    'active_seconds', coalesce(
      nullif(v_heartbeat ->> 'active_seconds', '')::bigint,
      coalesce(v_session.active_seconds, 0)
    ),
    'credited_seconds', coalesce(
      nullif(v_heartbeat ->> 'credited_seconds', '')::bigint,
      0
    ),
    'credited_coins', coalesce(
      nullif(v_heartbeat ->> 'credited_coins', '')::bigint,
      0
    ),
    'new_balance', v_balance
  );
end;
$function$;

grant execute on function public.start_afk_session() to authenticated;
grant execute on function public.heartbeat_afk_session(uuid) to authenticated;
grant execute on function public.stop_afk_session(uuid) to authenticated;
