-- Per-building flag: category is marked required for that building (e.g. compliance / must-read).

alter table if exists public.building_category_assignments
  add column if not exists is_required boolean not null default false;

comment on column public.building_category_assignments.is_required is 'When true, this category is flagged as required for the building (admin / future guest UX).';
