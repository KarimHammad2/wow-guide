-- Site-wide CMS pages (terms, privacy, etc.). Public read; mutations via service-role admin API only.

create table if not exists public.site_pages (
  slug text primary key,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_pages_updated_at_idx on public.site_pages (updated_at desc);

alter table public.site_pages enable row level security;

create policy "Anyone can read site pages"
  on public.site_pages
  for select
  using (true);

comment on table public.site_pages is 'Marketing/legal pages; slug is URL segment (e.g. terms -> /terms).';

drop trigger if exists set_updated_at_site_pages on public.site_pages;
create trigger set_updated_at_site_pages
before update on public.site_pages
for each row
execute function public.set_updated_at();
