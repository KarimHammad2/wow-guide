-- security_invoker views on PostgREST run with the `authenticator` session role, not `service_role`,
-- so joins to auth.users fail with: permission denied for table users.
-- Use a security definer view (PostgreSQL default when security_invoker is omitted); access stays
-- locked down via revokes — anon/authenticated cannot query this view at all.

drop view if exists public.staff_directory;

create view public.staff_directory
as
select
  p.user_id,
  p.display_name,
  p.is_owner,
  u.email::text as email
from public.staff_profiles p
join auth.users u on u.id = p.user_id;

comment on view public.staff_directory is 'Staff list for service-role API only; do not grant to anon/authenticated.';

revoke all on public.staff_directory from public;
revoke all on public.staff_directory from anon;
revoke all on public.staff_directory from authenticated;

grant select on public.staff_directory to service_role;
