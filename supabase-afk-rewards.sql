-- Run once in the Supabase SQL Editor.
-- This migration creates the complete AFK, mission, promo and mini-game reward system.

create table if not exists public.afk_settings (
  id text primary key,
  enabled boolean not null default true,
  minutes_per_reward integer not null default 10,
  coins_per_reward bigint not null default 10,
  daily_coin_cap bigint not null default 500,
  missions_enabled boolean not null default true,
  minigames_enabled boolean not null default true,
  promo_codes_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.afk_settings (
  id, enabled, minutes_per_reward, coins_per_reward, daily_coin_cap,
  missions_enabled, minigames_enabled, promo_codes_enabled
) values (
  'global', true, 10, 10, 500, true, true, true
) on conflict (id) do nothing;

create table if not exists public.afk_admin_config (
  config_key text primary key,
  config_value jsonb not null default '{}'::jsonb,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

insert into public.afk_admin_config (config_key, config_value)
values ('minigames', '{
  "tic_tac_toe":{"enabled":true,"reward_coins":10,"cooldown_minutes":1,"daily_limit":30},
  "rock_paper_scissors":{"enabled":true,"reward_coins":5,"cooldown_minutes":1,"daily_limit":30},
  "number_guessing":{"enabled":true,"reward_coins":10,"cooldown_minutes":2,"daily_limit":15},
  "memory_match":{"enabled":true,"reward_coins":25,"cooldown_minutes":5,"daily_limit":10},
  "reaction_challenge":{"enabled":true,"reward_coins":15,"cooldown_minutes":2,"daily_limit":20},
  "math_challenge":{"enabled":true,"reward_coins":10,"cooldown_minutes":1,"daily_limit":30},
  "higher_or_lower":{"enabled":true,"reward_coins":10,"cooldown_minutes":2,"daily_limit":15},
  "word_scramble":{"enabled":true,"reward_coins":15,"cooldown_minutes":2,"daily_limit":20}
}'::jsonb)
on conflict (config_key) do nothing;

create table if not exists public.afk_user_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance bigint not null default 0,
  total_earned bigint not null default 0,
  total_spent bigint not null default 0,
  updated_at timestamptz not null default now(),
  constraint afk_user_wallets_balance_check check (balance >= 0)
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

create index if not exists afk_coin_transactions_user_created_idx
  on public.afk_coin_transactions (user_id, created_at desc);

create table if not exists public.afk_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  last_heartbeat_at timestamptz not null default now(),
  stopped_at timestamptz,
  status text not null default 'active',
  active_seconds integer not null default 0,
  credited_seconds integer not null default 0,
  reward_coins bigint not null default 0,
  constraint afk_sessions_status_check check (status in ('active', 'stopped'))
);

create index if not exists afk_sessions_user_status_idx
  on public.afk_sessions (user_id, status);

create table if not exists public.afk_daily_missions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  mission_type text not null,
  target integer not null,
  reward_coins bigint not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.afk_mission_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id uuid not null references public.afk_daily_missions(id) on delete restrict,
  claim_date date not null,
  reward_coins bigint not null,
  progress integer not null default 0,
  target integer not null,
  claimed_at timestamptz not null default now(),
  unique (user_id, mission_id, claim_date)
);

create table if not exists public.afk_promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  reward_coins bigint not null,
  max_uses integer,
  used_count integer not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.afk_promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  promo_code_id uuid not null references public.afk_promo_codes(id) on delete cascade,
  reward_coins bigint not null,
  redeemed_at timestamptz not null default now(),
  unique (user_id, promo_code_id)
);

create table if not exists public.afk_minigame_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_key text not null,
  reward_coins bigint not null,
  claimed_at timestamptz not null default now()
);

create index if not exists afk_minigame_claims_user_game_idx
  on public.afk_minigame_claims (user_id, game_key, claimed_at desc);

alter table public.afk_admin_config enable row level security;
alter table public.afk_settings enable row level security;
alter table public.afk_user_wallets enable row level security;
alter table public.afk_coin_transactions enable row level security;
alter table public.afk_sessions enable row level security;
alter table public.afk_daily_missions enable row level security;
alter table public.afk_mission_claims enable row level security;
alter table public.afk_promo_codes enable row level security;
alter table public.afk_promo_redemptions enable row level security;
alter table public.afk_minigame_claims enable row level security;

drop policy if exists afk_admin_config_read on public.afk_admin_config;
create policy afk_admin_config_read on public.afk_admin_config
  for select to authenticated using (true);

drop policy if exists afk_settings_read on public.afk_settings;
create policy afk_settings_read on public.afk_settings
  for select to authenticated using (true);

drop policy if exists afk_wallet_owner_read on public.afk_user_wallets;
create policy afk_wallet_owner_read on public.afk_user_wallets
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists afk_transactions_owner_read on public.afk_coin_transactions;
create policy afk_transactions_owner_read on public.afk_coin_transactions
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists afk_sessions_owner_all on public.afk_sessions;
create policy afk_sessions_owner_all on public.afk_sessions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists afk_missions_read on public.afk_daily_missions;
create policy afk_missions_read on public.afk_daily_missions
  for select to authenticated using (is_active = true);

drop policy if exists afk_mission_claims_owner_read on public.afk_mission_claims;
create policy afk_mission_claims_owner_read on public.afk_mission_claims
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists afk_promo_redemptions_owner_read on public.afk_promo_redemptions;
create policy afk_promo_redemptions_owner_read on public.afk_promo_redemptions
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists afk_minigame_claims_owner_read on public.afk_minigame_claims;
create policy afk_minigame_claims_owner_read on public.afk_minigame_claims
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.start_afk_session()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user_id uuid := auth.uid();
  v_settings public.afk_settings%rowtype;
  v_session public.afk_sessions%rowtype;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'reason', 'login_required');
  end if;
  select * into v_settings from public.afk_settings where id = 'global';
  if not found or not v_settings.enabled then
    return jsonb_build_object('success', false, 'reason', 'afk_disabled');
  end if;

  update public.afk_sessions
  set status = 'stopped', stopped_at = now()
  where user_id = v_user_id and status = 'active';

  insert into public.afk_sessions (user_id)
  values (v_user_id)
  returning * into v_session;

  return jsonb_build_object(
    'success', true,
    'session_id', v_session.id,
    'status', v_session.status,
    'active_seconds', 0
  );
end;
$$;

create or replace function public.heartbeat_afk_session(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.afk_sessions%rowtype;
  v_settings public.afk_settings%rowtype;
  v_elapsed integer;
  v_new_active integer;
  v_claimable integer;
  v_wallet public.afk_user_wallets%rowtype;
  v_reward bigint := 0;
  v_today_start timestamptz := date_trunc('day', now());
  v_today_earned bigint;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'reason', 'login_required');
  end if;

  select * into v_session
  from public.afk_sessions
  where id = p_session_id and user_id = v_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'session_not_found');
  end if;
  if v_session.status <> 'active' then
    return jsonb_build_object('success', false, 'reason', 'session_inactive', 'status', v_session.status);
  end if;

  select * into v_settings from public.afk_settings where id = 'global';
  if not found or not v_settings.enabled then
    update public.afk_sessions set status = 'stopped', stopped_at = now()
    where id = p_session_id;
    return jsonb_build_object('success', false, 'reason', 'afk_disabled');
  end if;

  v_elapsed := least(greatest(extract(epoch from (now() - v_session.last_heartbeat_at))::integer, 1), 90);
  v_new_active := v_session.active_seconds + v_elapsed;

  insert into public.afk_user_wallets (user_id) values (v_user_id)
  on conflict (user_id) do nothing;

  select * into v_wallet
  from public.afk_user_wallets
  where user_id = v_user_id
  for update;

  select coalesce(sum(amount), 0) into v_today_earned
  from public.afk_coin_transactions
  where user_id = v_user_id
    and created_at >= v_today_start
    and amount > 0;

  v_claimable :=
    ((v_new_active / (greatest(v_settings.minutes_per_reward, 1) * 60))
    - (v_session.credited_seconds / (greatest(v_settings.minutes_per_reward, 1) * 60)))
    * v_settings.coins_per_reward;

  v_reward := greatest(coalesce(v_claimable, 0), 0);
  v_reward := least(v_reward, greatest(v_settings.daily_coin_cap - v_today_earned, 0));

  if v_reward > 0 then
    update public.afk_user_wallets
    set balance = balance + v_reward,
        total_earned = total_earned + v_reward,
        updated_at = now()
    where user_id = v_user_id;

    insert into public.afk_coin_transactions (
      user_id, amount, balance_after, transaction_type, description, reference_id
    ) values (
      v_user_id, v_reward, v_wallet.balance + v_reward,
      'afk_reward', 'AFK reward', p_session_id::text
    );

    select balance into v_wallet.balance
    from public.afk_user_wallets
    where user_id = v_user_id;
  end if;

  update public.afk_sessions
  set active_seconds = v_new_active,
      credited_seconds = case
        when v_reward > 0 then
          (v_new_active / (greatest(v_settings.minutes_per_reward, 1) * 60))
          * (greatest(v_settings.minutes_per_reward, 1) * 60)
        else credited_seconds
      end,
      reward_coins = reward_coins + v_reward,
      last_heartbeat_at = now()
  where id = p_session_id;

  return jsonb_build_object(
    'success', true,
    'session_id', p_session_id,
    'status', 'active',
    'active_seconds', v_new_active,
    'credited_seconds', v_new_active,
    'reward_coins', v_reward
  );
end;
$$;

create or replace function public.stop_afk_session(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.afk_sessions%rowtype;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'reason', 'login_required');
  end if;
  select * into v_session
  from public.afk_sessions
  where id = p_session_id and user_id = v_user_id
  for update;
  if not found then
    return jsonb_build_object('success', false, 'reason', 'session_not_found');
  end if;
  if v_session.status = 'active' then
    update public.afk_sessions
    set status = 'stopped', stopped_at = now()
    where id = p_session_id;
  end if;
  return jsonb_build_object(
    'success', true,
    'session_id', p_session_id,
    'status', 'stopped',
    'active_seconds', v_session.active_seconds
  );
end;
$$;

create or replace function public.claim_afk_minigame_reward(p_game_key text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user_id uuid := auth.uid();
  v_settings public.afk_settings%rowtype;
  v_config public.afk_admin_config%rowtype;
  v_game jsonb;
  v_enabled boolean;
  v_reward bigint;
  v_cooldown integer;
  v_daily_limit integer;
  v_claim_count integer;
  v_last_claim timestamptz;
  v_wallet public.afk_user_wallets%rowtype;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'reason', 'login_required');
  end if;

  select * into v_settings from public.afk_settings where id = 'global';
  if not found or not v_settings.enabled or not v_settings.minigames_enabled then
    return jsonb_build_object('success', false, 'reason', 'minigames_disabled');
  end if;

  select * into v_config
  from public.afk_admin_config
  where config_key = 'minigames';

  v_game := coalesce(v_config.config_value -> p_game_key, '{}'::jsonb);
  v_enabled := coalesce((v_game ->> 'enabled')::boolean, true);
  v_reward := greatest(coalesce((v_game ->> 'reward_coins')::bigint, 0), 0);
  v_cooldown := greatest(coalesce((v_game ->> 'cooldown_minutes')::integer, 1), 0);
  v_daily_limit := greatest(coalesce((v_game ->> 'daily_limit')::integer, 30), 0);

  if not v_enabled then
    return jsonb_build_object('success', false, 'reason', 'game_disabled');
  end if;
  if v_reward <= 0 then
    return jsonb_build_object('success', false, 'reason', 'reward_disabled');
  end if;

  select claimed_at into v_last_claim
  from public.afk_minigame_claims
  where user_id = v_user_id and game_key = p_game_key
  order by claimed_at desc limit 1;

  if v_last_claim is not null
     and v_last_claim + make_interval(mins => v_cooldown) > now()
  then
    return jsonb_build_object('success', false, 'reason', 'cooldown');
  end if;

  select count(*) into v_claim_count
  from public.afk_minigame_claims
  where user_id = v_user_id
    and game_key = p_game_key
    and claimed_at >= date_trunc('day', now());

  if v_claim_count >= v_daily_limit then
    return jsonb_build_object('success', false, 'reason', 'daily_limit');
  end if;

  insert into public.afk_user_wallets (user_id) values (v_user_id)
  on conflict (user_id) do nothing;

  select * into v_wallet
  from public.afk_user_wallets
  where user_id = v_user_id
  for update;

  update public.afk_user_wallets
  set balance = balance + v_reward,
      total_earned = total_earned + v_reward,
      updated_at = now()
  where user_id = v_user_id;

  insert into public.afk_minigame_claims (user_id, game_key, reward_coins)
  values (v_user_id, p_game_key, v_reward);

  insert into public.afk_coin_transactions (
    user_id, amount, balance_after, transaction_type, description, reference_id, metadata
  ) values (
    v_user_id, v_reward, v_wallet.balance + v_reward,
    'minigame_reward', 'Mini-game win: ' || p_game_key, p_game_key,
    jsonb_build_object('game_key', p_game_key)
  );

  return jsonb_build_object(
    'success', true,
    'reward_coins', v_reward,
    'new_balance', v_wallet.balance + v_reward
  );
end;
$$;

create or replace function public.claim_afk_daily_mission(p_mission_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user_id uuid := auth.uid();
  v_settings public.afk_settings%rowtype;
  v_mission public.afk_daily_missions%rowtype;
  v_today date := (now() at time zone 'UTC')::date;
  v_progress integer := 0;
  v_wallet public.afk_user_wallets%rowtype;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'reason', 'login_required');
  end if;

  select * into v_settings from public.afk_settings where id = 'global';
  if not found or not v_settings.enabled or not v_settings.missions_enabled then
    return jsonb_build_object('success', false, 'reason', 'missions_disabled');
  end if;

  select * into v_mission
  from public.afk_daily_missions
  where id = p_mission_id
    and is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now());

  if not found then
    return jsonb_build_object('success', false, 'reason', 'mission_inactive');
  end if;

  if exists (
    select 1 from public.afk_mission_claims
    where user_id = v_user_id and mission_id = p_mission_id and claim_date = v_today
  ) then
    return jsonb_build_object('success', false, 'reason', 'already_claimed');
  end if;

  if v_mission.mission_type = 'daily_visit' then
    select count(distinct date_trunc('day', started_at at time zone 'UTC'))::integer
    into v_progress
    from public.afk_sessions
    where user_id = v_user_id
      and (started_at at time zone 'UTC')::date = v_today;
  elsif v_mission.mission_type = 'afk_minutes' then
    select coalesce(floor(sum(active_seconds) / 60.0)::integer, 0)
    into v_progress
    from public.afk_sessions
    where user_id = v_user_id
      and (started_at at time zone 'UTC')::date = v_today;
  elsif v_mission.mission_type = 'minigame_wins' then
    select count(*)::integer into v_progress
    from public.afk_minigame_claims
    where user_id = v_user_id
      and claimed_at >= date_trunc('day', now());
  elsif v_mission.mission_type = 'games_played' then
    select count(*)::integer into v_progress
    from public.afk_minigame_claims
    where user_id = v_user_id
      and claimed_at >= date_trunc('day', now());
  else
    return jsonb_build_object('success', false, 'reason', 'unsupported_mission');
  end if;

  if v_progress < v_mission.target then
    return jsonb_build_object(
      'success', false,
      'reason', 'progress_incomplete',
      'progress', v_progress,
      'target', v_mission.target
    );
  end if;

  insert into public.afk_user_wallets (user_id) values (v_user_id)
  on conflict (user_id) do nothing;

  select * into v_wallet
  from public.afk_user_wallets
  where user_id = v_user_id
  for update;

  update public.afk_user_wallets
  set balance = balance + v_mission.reward_coins,
      total_earned = total_earned + v_mission.reward_coins,
      updated_at = now()
  where user_id = v_user_id;

  insert into public.afk_mission_claims (
    user_id, mission_id, claim_date, reward_coins, progress, target
  ) values (
    v_user_id, p_mission_id, v_today, v_mission.reward_coins, v_progress, v_mission.target
  );

  insert into public.afk_coin_transactions (
    user_id, amount, balance_after, transaction_type, description, reference_id, metadata
  ) values (
    v_user_id, v_mission.reward_coins, v_wallet.balance + v_mission.reward_coins,
    'mission_reward', 'Mission reward: ' || v_mission.title, p_mission_id::text,
    jsonb_build_object('mission_id', p_mission_id, 'progress', v_progress)
  );

  return jsonb_build_object(
    'success', true,
    'mission_id', p_mission_id,
    'reward_coins', v_mission.reward_coins,
    'new_balance', v_wallet.balance + v_mission.reward_coins,
    'progress', v_progress,
    'target', v_mission.target
  );
end;
$$;

create or replace function public.redeem_afk_promo_code(p_code text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user_id uuid := auth.uid();
  v_settings public.afk_settings%rowtype;
  v_promo public.afk_promo_codes%rowtype;
  v_wallet public.afk_user_wallets%rowtype;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'reason', 'login_required');
  end if;
  select * into v_settings from public.afk_settings where id = 'global';
  if not found or not v_settings.enabled or not v_settings.promo_codes_enabled then
    return jsonb_build_object('success', false, 'reason', 'promos_disabled');
  end if;
  if p_code is null or btrim(p_code) = '' then
    return jsonb_build_object('success', false, 'reason', 'empty_code');
  end if;

  select * into v_promo
  from public.afk_promo_codes
  where upper(code) = upper(btrim(p_code))
  for update;
  if not found then
    return jsonb_build_object('success', false, 'reason', 'invalid_code');
  end if;
  if not v_promo.is_active then
    return jsonb_build_object('success', false, 'reason', 'inactive_code');
  end if;
  if v_promo.expires_at is not null and v_promo.expires_at < now() then
    return jsonb_build_object('success', false, 'reason', 'expired_code');
  end if;
  if v_promo.max_uses is not null and v_promo.used_count >= v_promo.max_uses then
    return jsonb_build_object('success', false, 'reason', 'usage_limit_reached');
  end if;
  if exists (
    select 1 from public.afk_promo_redemptions
    where user_id = v_user_id and promo_code_id = v_promo.id
  ) then
    return jsonb_build_object('success', false, 'reason', 'already_redeemed');
  end if;

  insert into public.afk_user_wallets (user_id) values (v_user_id)
  on conflict (user_id) do nothing;
  select * into v_wallet
  from public.afk_user_wallets
  where user_id = v_user_id
  for update;

  update public.afk_user_wallets
  set balance = balance + v_promo.reward_coins,
      total_earned = total_earned + v_promo.reward_coins,
      updated_at = now()
  where user_id = v_user_id;

  update public.afk_promo_codes
  set used_count = used_count + 1
  where id = v_promo.id;

  insert into public.afk_promo_redemptions (user_id, promo_code_id, reward_coins)
  values (v_user_id, v_promo.id, v_promo.reward_coins);

  insert into public.afk_coin_transactions (
    user_id, amount, balance_after, transaction_type, description, reference_id, metadata
  ) values (
    v_user_id, v_promo.reward_coins, v_wallet.balance + v_promo.reward_coins,
    'promo_reward', 'Promo code: ' || v_promo.code, v_promo.id::text,
    jsonb_build_object('promo_code_id', v_promo.id)
  );

  return jsonb_build_object(
    'success', true,
    'reward_coins', v_promo.reward_coins,
    'new_balance', v_wallet.balance + v_promo.reward_coins
  );
end;
$$;

revoke all on function public.start_afk_session() from public, anon;
revoke all on function public.heartbeat_afk_session(uuid) from public, anon;
revoke all on function public.stop_afk_session(uuid) from public, anon;
revoke all on function public.claim_afk_minigame_reward(text) from public, anon;
revoke all on function public.claim_afk_daily_mission(uuid) from public, anon;
revoke all on function public.redeem_afk_promo_code(text) from public, anon;

grant execute on function public.start_afk_session() to authenticated;
grant execute on function public.heartbeat_afk_session(uuid) to authenticated;
grant execute on function public.stop_afk_session(uuid) to authenticated;
grant execute on function public.claim_afk_minigame_reward(text) to authenticated;
grant execute on function public.claim_afk_daily_mission(uuid) to authenticated;
grant execute on function public.redeem_afk_promo_code(text) to authenticated;
