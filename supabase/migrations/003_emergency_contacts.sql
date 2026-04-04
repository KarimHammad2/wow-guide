-- Emergency contacts for admin + public guest UI (phone / email).

create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  phone text not null,
  email text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.emergency_contacts enable row level security;

create policy "Anyone can read emergency contacts"
  on public.emergency_contacts
  for select
  using (true);

comment on table public.emergency_contacts is 'WOW emergency list; mutations via service-role API only.';

-- Seed default row when table is empty (edit in admin UI as needed)
insert into public.emergency_contacts (label, phone, email, sort_order)
select 'Primary Emergency', '+41 552 33 33', 'mail@wowliving.ch', 0
where not exists (select 1 from public.emergency_contacts limit 1);
