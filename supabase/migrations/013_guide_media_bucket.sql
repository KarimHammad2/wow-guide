-- Public bucket for editor uploads used by the visual builder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'guide-media',
  'guide-media',
  true,
  26214400,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read guide media" on storage.objects;
create policy "Public read guide media"
  on storage.objects
  for select
  to public
  using (bucket_id = 'guide-media');
