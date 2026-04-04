-- Fixes Supabase Security Advisor: "Exposed Auth Users" + "Security Definer View" on staff_directory.
-- The view joins auth.users; it must not be readable by anon/authenticated via PostgREST.
-- App code uses SUPABASE_SERVICE_ROLE_KEY only (server-side).

drop view if exists public.staff_directory;

-- security_invoker (PG15+): view runs with caller privileges; anon/authenticated still cannot read auth.users.
create view public.staff_directory
with (security_invoker = true)
as
select
  p.user_id,
  p.display_name,
  p.is_owner,
  u.email::text as email
from public.staff_profiles p
join auth.users u on u.id = p.user_id;

comment on view public.staff_directory is 'Staff list for service-role API only; do not grant to anon/authenticated.';

-- Remove any default/public access (PostgREST exposes granted objects in API)
revoke all on public.staff_directory from public;
revoke all on public.staff_directory from anon;
revoke all on public.staff_directory from authenticated;

-- Service role is what createSupabaseAdmin() uses in Next.js API routes
grant select on public.staff_directory to service_role;
