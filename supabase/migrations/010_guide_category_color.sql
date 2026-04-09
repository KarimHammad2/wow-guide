-- Tile accent for catalog categories (matches Category.color in app: primary | accent | muted).

alter table if exists public.guide_categories
  add column if not exists category_color text not null default 'primary';

alter table public.guide_categories
  drop constraint if exists guide_categories_category_color_check;

alter table public.guide_categories
  add constraint guide_categories_category_color_check
  check (category_color in ('primary', 'accent', 'muted'));

comment on column public.guide_categories.category_color is 'Guide tile accent: primary, accent, or muted.';
