-- Run in Supabase Dashboard -> SQL Editor to enable rank comparisons.
-- Comparison features are managed separately from store product features.

create table if not exists public.rank_comparison_features (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists rank_comparison_features_name_lower_uidx
  on public.rank_comparison_features (lower(name));

create table if not exists public.rank_comparison_feature_products (
  feature_id uuid not null
    references public.rank_comparison_features(id) on delete cascade,
  product_id uuid not null
    references public.store_products(id) on delete cascade,
  details text not null default '',
  primary key (feature_id, product_id)
);

alter table public.rank_comparison_feature_products
  add column if not exists details text not null default '';

alter table public.rank_comparison_feature_products
  drop constraint if exists rank_comparison_feature_products_details_check;
alter table public.rank_comparison_feature_products
  add constraint rank_comparison_feature_products_details_check
  check (char_length(details) <= 240);

alter table public.rank_comparison_features enable row level security;
alter table public.rank_comparison_feature_products enable row level security;

grant select on public.rank_comparison_features to anon, authenticated;
grant insert, update, delete on public.rank_comparison_features to authenticated;
grant select on public.rank_comparison_feature_products to anon, authenticated;
grant insert, update, delete on public.rank_comparison_feature_products to authenticated;

drop policy if exists "Anyone can read rank comparison features"
  on public.rank_comparison_features;
create policy "Anyone can read rank comparison features"
  on public.rank_comparison_features
  for select to anon, authenticated
  using (true);

drop policy if exists "Store staff can manage rank comparison features"
  on public.rank_comparison_features;
create policy "Store staff can manage rank comparison features"
  on public.rank_comparison_features
  for all to authenticated
  using (public.is_site_page_staff())
  with check (public.is_site_page_staff());

drop policy if exists "Anyone can read rank comparison assignments"
  on public.rank_comparison_feature_products;
create policy "Anyone can read rank comparison assignments"
  on public.rank_comparison_feature_products
  for select to anon, authenticated
  using (true);

drop policy if exists "Store staff can manage rank comparison assignments"
  on public.rank_comparison_feature_products;
create policy "Store staff can manage rank comparison assignments"
  on public.rank_comparison_feature_products
  for all to authenticated
  using (public.is_site_page_staff())
  with check (public.is_site_page_staff());
