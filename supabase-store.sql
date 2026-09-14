-- Run once in Supabase Dashboard -> SQL Editor.
-- Replaces old store content with editable Minecraft products.

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
              or 'store' = any(custom_role.permissions)
            )
        )
      )
  );
$$;

revoke all on function public.is_site_page_staff() from public;
grant execute on function public.is_site_page_staff() to authenticated;

delete from public.site_page_items
where page_key = 'store';

insert into public.site_page_items
  (page_key, item_type, title, description, extra, sort_order, is_visible)
values
  ('store', 'store', 'VIP', 'A strong starting rank with useful network perks.', '{"category":"ranks","price":"99","badge":"POPULAR","features":"VIP prefix\nSpecial chat color\nCosmetic perks"}', 10, true),
  ('store', 'store', 'VIP+', 'An upgraded rank for players who want more.', '{"category":"ranks","price":"149","badge":"","features":"VIP+ prefix\nExtra cosmetics\nAdditional commands"}', 20, true),
  ('store', 'store', 'Diamond', 'A premium rank for dedicated players.', '{"category":"ranks","price":"199","badge":"","features":"Diamond prefix\nExclusive cosmetics\nPremium chat perks"}', 30, true),
  ('store', 'store', 'Grand Master', 'The highest tier Butterfly network rank.', '{"category":"ranks","price":"699","badge":"ULTIMATE","features":"Grand Master prefix\nMaximum rank perks\nExclusive effects"}', 40, true),
  ('store', 'store', 'Common Key', 'Open a common crate and discover a reward.', '{"category":"keys","price":"29","badge":"","features":"1 Common Key\nRandom rewards"}', 10, true),
  ('store', 'store', 'Rare Key', 'A key with better reward possibilities.', '{"category":"keys","price":"49","badge":"","features":"1 Rare Key\nRare rewards"}', 20, true),
  ('store', 'store', 'Legendary Key', 'Unlock the legendary reward pool.', '{"category":"keys","price":"129","badge":"RARE","features":"1 Legendary Key\nLegendary rewards"}', 30, true),
  ('store', 'store', '500 Coins', 'A quick boost for your in-game balance.', '{"category":"coins","price":"49","badge":"","features":"500 Coins\nInstant delivery"}', 10, true),
  ('store', 'store', '2,500 Coins', 'A popular coin package for active players.', '{"category":"coins","price":"199","badge":"POPULAR","features":"2,500 Coins\nInstant delivery"}', 20, true),
  ('store', 'store', '10,000 Coins', 'The best value coin package.', '{"category":"coins","price":"599","badge":"BEST VALUE","features":"10,000 Coins\nInstant delivery"}', 30, true),
  ('store', 'store', 'Sky Wings', 'Stand out with a bright cosmetic wing set.', '{"category":"wings","price":"149","badge":"","features":"Wing cosmetic\nLobby visibility\nNo gameplay advantage"}', 10, true),
  ('store', 'store', 'Butterfly Wings', 'A signature cosmetic for Butterfly players.', '{"category":"wings","price":"249","badge":"POPULAR","features":"Exclusive wing cosmetic\nLobby visibility\nParticle effect"}', 20, true),
  ('store', 'store', 'Eternal Wings', 'A premium wing set for collectors.', '{"category":"wings","price":"399","badge":"ELITE","features":"Elite wing cosmetic\nExclusive particles\nCollector badge"}', 30, true);