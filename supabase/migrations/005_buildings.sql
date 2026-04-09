-- Buildings and per-building guide categories (JSON). Mutations via service-role API only.

create table if not exists public.buildings (
  id text primary key,
  name text not null,
  address text not null default '',
  city text not null default '',
  app_path text not null default '',
  country text not null default 'Switzerland',
  image_url text not null default '',
  emergency_phone text not null default '',
  support_email text not null default '',
  welcome_message text not null default '',
  google_maps_url text not null default '',
  quiet_hours text not null default '',
  good_to_know text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.building_guide_categories (
  id uuid primary key default gen_random_uuid(),
  building_id text not null references public.buildings (id) on delete cascade,
  category_slug text not null,
  sort_order integer not null,
  category jsonb not null,
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (building_id, category_slug)
);

create index if not exists building_guide_categories_building_id_idx
  on public.building_guide_categories (building_id);

alter table public.buildings enable row level security;
alter table public.building_guide_categories enable row level security;

create policy "Anyone can read buildings"
  on public.buildings
  for select
  using (true);

create policy "Anyone can read building guide categories"
  on public.building_guide_categories
  for select
  using (true);

comment on table public.buildings is 'WOW buildings; mutations via service-role API only.';
comment on table public.building_guide_categories is 'Guide sections per building; mutations via service-role API only.';
