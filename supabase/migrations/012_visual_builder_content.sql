-- Visual builder support: ownership, draft/publish workflow, and versioned JSON content.

alter table if exists public.building_guide_categories
  add column if not exists owner_user_id uuid,
  add column if not exists updated_by uuid,
  add column if not exists is_published boolean not null default true,
  add column if not exists draft_content jsonb;

create index if not exists building_guide_categories_owner_user_id_idx
  on public.building_guide_categories (owner_user_id);

create index if not exists building_guide_categories_building_slug_idx
  on public.building_guide_categories (building_id, category_slug);

comment on column public.building_guide_categories.owner_user_id is 'Authenticated owner of this category page.';
comment on column public.building_guide_categories.updated_by is 'Last authenticated user who modified draft/published content.';
comment on column public.building_guide_categories.is_published is 'Whether public page should render the published content payload.';
comment on column public.building_guide_categories.draft_content is 'Autosaved draft payload for visual builder (versioned block document).';
