-- Swiss cities for building assignment (admin-managed).

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null default 'Switzerland',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.cities enable row level security;

create policy "Anyone can read cities"
  on public.cities
  for select
  using (true);

comment on table public.cities is 'WOW city list for buildings; mutations via service-role API only.';

-- Seed when empty (Basel, Luzern, Schwyz, Zug, Zürich)
insert into public.cities (name, country, sort_order)
select v.name, v.country, v.sort_order
from (
  values
    ('Basel', 'Switzerland', 0),
    ('Luzern', 'Switzerland', 1),
    ('Schwyz', 'Switzerland', 2),
    ('Zug', 'Switzerland', 3),
    ('Zürich', 'Switzerland', 4)
) as v(name, country, sort_order)
where not exists (select 1 from public.cities limit 1);
