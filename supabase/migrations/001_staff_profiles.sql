-- Run in Supabase SQL Editor or via CLI. After: create first auth user in Dashboard,
-- then: update public.staff_profiles set is_owner = true where user_id = '<uuid>';

create table if not exists public.staff_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  is_owner boolean not null default false
);

alter table public.staff_profiles enable row level security;

create policy "Staff can read own profile"
  on public.staff_profiles
  for select
  using (auth.uid() = user_id);

-- Optional: auto-create profile row for new auth users (invite flow also inserts/updates)
create or replace function public.handle_new_staff_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.staff_profiles (user_id, display_name, is_owner)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data->>'display_name', '')), ''),
    false
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_staff on auth.users;
create trigger on_auth_user_created_staff
  after insert on auth.users
  for each row execute procedure public.handle_new_staff_user();

-- Join auth.users for API listing (service role bypasses RLS)
create or replace view public.staff_directory as
select
  p.user_id,
  p.display_name,
  p.is_owner,
  u.email::text as email
from public.staff_profiles p
join auth.users u on u.id = p.user_id;

comment on table public.staff_profiles is 'WOW admin staff; set is_owner=true once for bootstrap user.';
