-- Read-only verification checks for schema hardening migration.

-- 1) category_slug must be non-null.
select count(*) as null_category_slug_count
from public.building_guide_categories
where category_slug is null or btrim(category_slug) = '';

-- 2) unique index must exist.
select indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'building_guide_categories'
  and indexname in ('building_guide_categories_building_slug_unique_idx');

-- 3) updated_at trigger coverage.
select event_object_table as table_name, trigger_name
from information_schema.triggers
where trigger_schema = 'public'
  and trigger_name in (
    'set_updated_at_buildings',
    'set_updated_at_building_guide_categories',
    'set_updated_at_cities',
    'set_updated_at_emergency_contacts',
    'set_updated_at_guide_categories'
  )
order by table_name;

-- 5) guide category catalog + assignments exist.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('guide_categories', 'building_category_assignments')
order by table_name;

-- 6) category-icons storage bucket.
select id, public
from storage.buckets
where id = 'category-icons';

-- 7) guide_categories.category_color (after migration 010).
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'guide_categories'
  and column_name = 'category_color';

-- 8) building_category_assignments.is_required (after migration 011).
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'building_category_assignments'
  and column_name = 'is_required';

-- 4) staff_directory must not be exposed to anon/authenticated.
select
  has_table_privilege('anon', 'public.staff_directory', 'SELECT') as anon_can_read_staff_directory,
  has_table_privilege('authenticated', 'public.staff_directory', 'SELECT') as authenticated_can_read_staff_directory,
  has_table_privilege('service_role', 'public.staff_directory', 'SELECT') as service_role_can_read_staff_directory;
