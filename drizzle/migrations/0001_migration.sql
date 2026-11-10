
create policy "members upload images" on storage.objects for insert to authenticated
  with check (bucket_id = 'menu-images' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy "members update images" on storage.objects for update to authenticated
  using (bucket_id = 'menu-images' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy "members delete images" on storage.objects for delete to authenticated
  using (bucket_id = 'menu-images' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy "members read images" on storage.objects for select to authenticated
  using (bucket_id = 'menu-images' and public.is_member(((storage.foldername(name))[1])::uuid));
