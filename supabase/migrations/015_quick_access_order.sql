-- Per-building home "Quick Access" strip: links to existing guide categories.

alter table public.building_guide_categories
  add column if not exists quick_access_order smallint null;

comment on column public.building_guide_categories.quick_access_order is
  'When set, this section appears on the building home Quick Access row; lower values sort first.';

create index if not exists building_guide_categories_quick_access_idx
  on public.building_guide_categories (building_id, quick_access_order)
  where quick_access_order is not null;

-- Backfill common slugs so existing buildings get a Quick Access row without admin edits.
update public.building_guide_categories
set quick_access_order = 1
where quick_access_order is null
  and category_slug in ('check-in', 'check-in-out');

update public.building_guide_categories
set quick_access_order = 2
where quick_access_order is null
  and category_slug in ('internet', 'internet-tv');

update public.building_guide_categories
set quick_access_order = 3
where quick_access_order is null
  and category_slug = 'cleaning';

update public.building_guide_categories
set quick_access_order = 4
where quick_access_order is null
  and category_slug = 'parking';

update public.building_guide_categories
set quick_access_order = 4
where quick_access_order is null
  and category_slug = 'home-devices';
