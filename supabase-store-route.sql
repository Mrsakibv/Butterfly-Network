-- Run once in Supabase Dashboard -> SQL Editor.
-- Update the Store menu route to the new canonical URL.

update public.site_pages
set route = '/store'
where route = '/pricing';
