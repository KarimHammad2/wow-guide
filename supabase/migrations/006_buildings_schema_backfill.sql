-- Backfill migration for environments where 004/005 tables already existed
-- before all current columns, constraints, and policies were introduced.

alter table if exists public.cities
  add column if not exists country text not null default 'Switzerland';

alter table if exists public.cities
  add column if not exists sort_order integer not null default 0;

alter table if exists public.cities
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.buildings
  add column if not exists address text not null default '';

alter table if exists public.buildings
  add column if not exists city text not null default '';

alter table if exists public.buildings
  add column if not exists app_path text not null default '';

alter table if exists public.buildings
  add column if not exists country text not null default 'Switzerland';

alter table if exists public.buildings
  add column if not exists image_url text not null default '';

alter table if exists public.buildings
  add column if not exists emergency_phone text not null default '';

alter table if exists public.buildings
  add column if not exists support_email text not null default '';

alter table if exists public.buildings
  add column if not exists welcome_message text not null default '';

alter table if exists public.buildings
  add column if not exists google_maps_url text not null default '';

alter table if exists public.buildings
  add column if not exists quiet_hours text not null default '';

alter table if exists public.buildings
  add column if not exists good_to_know text not null default '';

alter table if exists public.buildings
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.buildings
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists buildings_app_path_unique_idx
  on public.buildings (app_path)
  where app_path <> '';

alter table if exists public.building_guide_categories
  add column if not exists category_slug text;

alter table if exists public.building_guide_categories
  add column if not exists sort_order integer not null default 0;

alter table if exists public.building_guide_categories
  add column if not exists category jsonb not null default '{}'::jsonb;

alter table if exists public.building_guide_categories
  add column if not exists content jsonb not null default '{}'::jsonb;

alter table if exists public.building_guide_categories
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.building_guide_categories
  add column if not exists updated_at timestamptz not null default now();

create index if not exists building_guide_categories_building_id_idx
  on public.building_guide_categories (building_id);

create unique index if not exists building_guide_categories_building_slug_unique_idx
  on public.building_guide_categories (building_id, category_slug);

alter table if exists public.cities enable row level security;
alter table if exists public.buildings enable row level security;
alter table if exists public.building_guide_categories enable row level security;

drop policy if exists "Anyone can read cities" on public.cities;
create policy "Anyone can read cities"
  on public.cities
  for select
  using (true);

drop policy if exists "Anyone can read buildings" on public.buildings;
create policy "Anyone can read buildings"
  on public.buildings
  for select
  using (true);

drop policy if exists "Anyone can read building guide categories" on public.building_guide_categories;
create policy "Anyone can read building guide categories"
  on public.building_guide_categories
  for select
  using (true);
