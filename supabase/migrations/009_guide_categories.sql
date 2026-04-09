-- Reusable guide categories + per-building assignments. Mutations via service-role API.

create table if not exists public.guide_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  short_description text not null,
  icon_name text,
  icon_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guide_categories_slug_unique unique (slug),
  constraint guide_categories_icon_xor check (
    (icon_name is not null and btrim(icon_name) <> '' and icon_image_url is null)
    or (icon_name is null and icon_image_url is not null and btrim(icon_image_url) <> '')
  )
);

create index if not exists guide_categories_slug_idx on public.guide_categories (slug);

create table if not exists public.building_category_assignments (
  id uuid primary key default gen_random_uuid(),
  building_id text not null references public.buildings (id) on delete cascade,
  category_id uuid not null references public.guide_categories (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (building_id, category_id)
);

create index if not exists building_category_assignments_building_id_idx
  on public.building_category_assignments (building_id);

create index if not exists building_category_assignments_category_id_idx
  on public.building_category_assignments (category_id);

alter table public.guide_categories enable row level security;
alter table public.building_category_assignments enable row level security;

drop policy if exists "Anyone can read guide categories" on public.guide_categories;
create policy "Anyone can read guide categories"
  on public.guide_categories
  for select
  using (true);

drop policy if exists "Anyone can read building category assignments" on public.building_category_assignments;
create policy "Anyone can read building category assignments"
  on public.building_category_assignments
  for select
  using (true);

comment on table public.guide_categories is 'Reusable category catalog; mutations via service-role API only.';
comment on table public.building_category_assignments is 'Links buildings to catalog categories; mutations via service-role API only.';

drop trigger if exists set_updated_at_guide_categories on public.guide_categories;
create trigger set_updated_at_guide_categories
before update on public.guide_categories
for each row
execute function public.set_updated_at();

-- Public bucket for category icons (uploads via service role from admin API).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'category-icons',
  'category-icons',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read category icons" on storage.objects;
create policy "Public read category icons"
  on storage.objects
  for select
  to public
  using (bucket_id = 'category-icons');
