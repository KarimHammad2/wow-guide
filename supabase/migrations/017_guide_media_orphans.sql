-- Soft-delete ledger for guide-media objects. Storage files stay until a cron
-- prune job confirms they are still unreferenced after a 14-day grace period.

create table if not exists public.guide_media_orphans (
  path text primary key,
  first_orphaned_at timestamptz not null default now(),
  last_seen_url text,
  requested_by uuid references auth.users (id) on delete set null,
  category_ref jsonb
);

create index if not exists guide_media_orphans_first_orphaned_at_idx
  on public.guide_media_orphans (first_orphaned_at);

alter table public.guide_media_orphans enable row level security;

comment on table public.guide_media_orphans is
  'Soft-deleted guide-media objects waiting for a 14-day grace period before storage removal. Service role only.';
