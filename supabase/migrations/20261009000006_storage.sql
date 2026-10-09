-- ProjectNexa migration 6/6: storage buckets and policies.
--
--  product-images       PUBLIC read (cover images), admin write.
--  product-files        PRIVATE. Staff only. Customers never get a bucket policy: the server checks
--                       has_download_access() and then issues a short-lived signed URL.
--  payment-proofs       PRIVATE. Customer may upload into  <their user id>/<order id>/...  (write-once).
--  request-attachments  PRIVATE. Customer may upload into <their user id>/<request id>/... (write-once).
-- Size limits and MIME allow-lists are enforced by the bucket itself, in addition to app-level checks.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('product-images',      'product-images',      true,  2097152,   array['image/png', 'image/jpeg', 'image/webp']),
  ('product-files',       'product-files',       false, 209715200, array['application/zip', 'application/x-zip-compressed',
                                                                         'application/pdf', 'application/x-7z-compressed',
                                                                         'application/gzip']),
  ('payment-proofs',      'payment-proofs',      false, 5242880,   array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
  ('request-attachments', 'request-attachments', false, 20971520,  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp',
                                                                         'application/zip', 'application/x-zip-compressed', 'text/plain',
                                                                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- product images: anyone may view, only staff may change
create policy product_images_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');
create policy product_images_admin_write on storage.objects for all to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

-- product files: staff only (customers use server-issued signed URLs)
create policy product_files_admin_all on storage.objects for all to authenticated
  using (bucket_id = 'product-files' and public.is_admin())
  with check (bucket_id = 'product-files' and public.is_admin());

-- payment proofs: upload into your own folder, read your own, staff read all. No update / delete for customers.
create policy payment_proofs_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy payment_proofs_read on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs'
         and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin()));
create policy payment_proofs_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());

-- request attachments: same pattern
create policy request_attachments_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'request-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy request_attachments_read on storage.objects for select to authenticated
  using (bucket_id = 'request-attachments'
         and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin()));
create policy request_attachments_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'request-attachments' and public.is_admin());
