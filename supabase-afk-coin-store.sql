-- Run once in Supabase Dashboard -> SQL Editor.
-- Adds a second, AFK-wallet payment option while preserving BDT checkout.

alter table public.store_products
  add column if not exists coin_price bigint;

alter table public.store_products
  drop constraint if exists store_products_coin_price_check;

alter table public.store_products
  add constraint store_products_coin_price_check
  check (coin_price is null or coin_price > 0);

alter table public.store_orders
  add column if not exists currency text not null default 'BDT';

create or replace function public.purchase_store_product_with_coins(
  p_player_username text,
  p_product_id uuid
)
returns table (
  order_id uuid,
  order_number text,
  product_name text,
  player_username text,
  original_amount numeric,
  discount_amount numeric,
  final_amount numeric,
  payment_status text,
  delivery_status text,
  new_balance bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid := auth.uid();
  v_product public.store_products%rowtype;
  v_balance bigint;
  v_order_id uuid;
  v_order_number text;
  v_new_balance bigint;
begin
  if v_user_id is null then
    raise exception 'Login is required to spend Butterfly Coins.';
  end if;

  if p_player_username is null
     or length(trim(p_player_username)) < 3
     or length(trim(p_player_username)) > 16
     or trim(p_player_username) !~ '^[A-Za-z0-9_]+$'
  then
    raise exception 'Invalid Minecraft username.';
  end if;

  select *
  into v_product
  from public.store_products
  where id = p_product_id
    and is_active = true
  for update;

  if not found then
    raise exception 'Product is not available.';
  end if;

  if v_product.coin_price is null or v_product.coin_price <= 0 then
    raise exception 'This product cannot be purchased with Butterfly Coins.';
  end if;

  insert into public.afk_user_wallets (user_id)
  values (v_user_id)
  on conflict do nothing;

  select balance
  into v_balance
  from public.afk_user_wallets
  where user_id = v_user_id
  for update;

  if not found then
    raise exception 'Butterfly Coins wallet could not be loaded.';
  end if;

  if v_balance < v_product.coin_price then
    raise exception 'Not enough Butterfly Coins.';
  end if;

  v_new_balance := v_balance - v_product.coin_price;

  update public.afk_user_wallets
  set balance = v_new_balance,
      total_spent = total_spent + v_product.coin_price,
      updated_at = now()
  where user_id = v_user_id;

  v_order_number :=
    'BF-' ||
    upper(
      substr(
        md5(random()::text || clock_timestamp()::text || p_player_username),
        1,
        10
      )
    );

  insert into public.store_orders (
    order_number,
    player_username,
    product_id,
    original_amount,
    discount_amount,
    final_amount,
    payment_method,
    transaction_id,
    payment_status,
    delivery_status,
    user_id,
    currency
  )
  values (
    v_order_number,
    trim(p_player_username),
    p_product_id,
    v_product.coin_price,
    0,
    v_product.coin_price,
    'Butterfly Coins',
    null,
    'paid',
    'pending',
    v_user_id,
    'BFC'
  )
  returning id into v_order_id;

  insert into public.store_deliveries (
    order_id,
    player_username,
    commands,
    status
  )
  values (
    v_order_id,
    trim(p_player_username),
    coalesce(v_product.minecraft_commands, '[]'::jsonb),
    'pending'
  );

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
    -v_product.coin_price,
    v_new_balance,
    'store_purchase',
    'Store purchase: ' || v_product.name,
    v_order_id::text,
    jsonb_build_object(
      'order_id', v_order_id,
      'order_number', v_order_number,
      'product_id', p_product_id,
      'product_name', v_product.name
    )
  );

  return query
  select
    o.id,
    o.order_number,
    v_product.name,
    o.player_username,
    o.original_amount,
    o.discount_amount,
    o.final_amount,
    o.payment_status,
    o.delivery_status,
    v_new_balance
  from public.store_orders o
  where o.id = v_order_id;
end;
$function$;

revoke all on function public.purchase_store_product_with_coins(text, uuid)
  from public, anon;
grant execute on function public.purchase_store_product_with_coins(text, uuid)
  to authenticated;
