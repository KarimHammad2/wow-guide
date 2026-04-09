-- Converge schema guarantees across environments and add audit consistency.

alter table if exists public.cities
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.emergency_contacts
  add column if not exists updated_at timestamptz not null default now();

-- Backfill null/blank category slugs deterministically, then enforce constraints.
with normalized as (
  select
    id,
    building_id,
    trim(both '-' from regexp_replace(lower(
      coalesce(
        nullif(category_slug, ''),
        nullif(category ->> 'slug', ''),
        nullif(category ->> 'title', ''),
        'section'
      )
    ), '[^a-z0-9]+', '-', 'g')) as base_slug
  from public.building_guide_categories
),
ranked as (
  select
    id,
    case
      when row_number() over (partition by building_id, base_slug order by id) = 1
        then base_slug
      else base_slug || '-' || row_number() over (partition by building_id, base_slug order by id)
    end as deduped_slug
  from normalized
)
update public.building_guide_categories bgc
set category_slug = ranked.deduped_slug
from ranked
where bgc.id = ranked.id
  and (bgc.category_slug is null or btrim(bgc.category_slug) = '');

alter table if exists public.building_guide_categories
  alter column category_slug set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'building_guide_categories_building_id_category_slug_key'
      and conrelid = 'public.building_guide_categories'::regclass
  ) then
    alter table public.building_guide_categories
      add constraint building_guide_categories_building_id_category_slug_key
      unique (building_id, category_slug);
  end if;
end $$;

create unique index if not exists buildings_app_path_unique_idx
  on public.buildings (app_path)
  where app_path <> '';

create unique index if not exists building_guide_categories_building_slug_unique_idx
  on public.building_guide_categories (building_id, category_slug);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_buildings on public.buildings;
create trigger set_updated_at_buildings
before update on public.buildings
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_building_guide_categories on public.building_guide_categories;
create trigger set_updated_at_building_guide_categories
before update on public.building_guide_categories
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_cities on public.cities;
create trigger set_updated_at_cities
before update on public.cities
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_emergency_contacts on public.emergency_contacts;
create trigger set_updated_at_emergency_contacts
before update on public.emergency_contacts
for each row
execute function public.set_updated_at();

-- Staff directory must stay service-role-only.
do $$
begin
  if has_table_privilege('anon', 'public.staff_directory', 'SELECT')
    or has_table_privilege('authenticated', 'public.staff_directory', 'SELECT') then
    raise exception 'public.staff_directory must not be readable by anon/authenticated roles';
  end if;
end $$;
