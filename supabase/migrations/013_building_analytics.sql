-- Building page analytics: raw visit events for consented visitors.

create table if not exists public.building_page_visits (
  id uuid primary key default gen_random_uuid(),
  building_id text not null references public.buildings (id) on delete cascade,
  visitor_id text not null,
  pathname text not null,
  page_title text not null default '',
  page_type text not null,
  category_slug text,
  referrer text not null default '',
  visited_at timestamptz not null default now()
);

create index if not exists building_page_visits_building_id_visited_at_idx
  on public.building_page_visits (building_id, visited_at desc);

create index if not exists building_page_visits_visitor_id_idx
  on public.building_page_visits (visitor_id);

create index if not exists building_page_visits_pathname_idx
  on public.building_page_visits (pathname);

create index if not exists building_page_visits_category_slug_idx
  on public.building_page_visits (category_slug);

alter table public.building_page_visits enable row level security;

comment on table public.building_page_visits is 'Consented building page-view events used to power the admin analytics dashboard.';
