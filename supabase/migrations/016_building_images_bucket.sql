-- Public bucket for building card / list photos (uploads via service role from admin API).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'building-images',
  'building-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read building images" on storage.objects;
create policy "Public read building images"
  on storage.objects
  for select
  to public
  using (bucket_id = 'building-images');
