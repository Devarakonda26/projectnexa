-- Storage bucket configuration and object policies.
begin;

do $$
declare
  alice constant uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  bob   constant uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  admin constant uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  ord   constant uuid := '11111111-1111-4111-8111-111111111111';
begin
  -- ---------- bucket configuration
  perform test.assert((select public from storage.buckets where id = 'product-images') = true,  'product-images is public');
  perform test.assert((select public from storage.buckets where id = 'product-files') = false,  'product-files is PRIVATE');
  perform test.assert((select public from storage.buckets where id = 'payment-proofs') = false, 'payment-proofs is PRIVATE');
  perform test.assert((select public from storage.buckets where id = 'request-attachments') = false, 'request-attachments is PRIVATE');
  perform test.assert((select file_size_limit from storage.buckets where id = 'payment-proofs') = 5242880, 'payment proofs capped at 5 MB');
  perform test.assert(not coalesce((select allowed_mime_types @> array['application/x-msdownload'] from storage.buckets where id = 'request-attachments'), true),
                      'executables are not an allowed attachment type');
  perform test.assert(not coalesce((select allowed_mime_types && array['text/html', 'image/svg+xml'] from storage.buckets where id = 'product-images'), true),
                      'HTML/SVG are not allowed as public images');
  perform test.assert((select allowed_mime_types is not null from storage.buckets where id = 'product-images'),
                      'every bucket has a MIME allow-list');

  -- ---------- payment proofs: write-once into your own folder
  perform test.as_user(alice);
  insert into storage.objects (bucket_id, name, owner) values ('payment-proofs', alice || '/' || ord || '/proof.png', alice);
  perform test.throws('insert into storage.objects (bucket_id, name, owner) values (''payment-proofs'', ''' || bob || '/' || ord || '/proof.png'', ''' || alice || ''')', '42501');
  perform test.throws('insert into storage.objects (bucket_id, name, owner) values (''payment-proofs'', ''proof.png'', ''' || alice || ''')', '42501');   -- no folder
  perform test.assert(test.count('select 1 from storage.objects where bucket_id = ''payment-proofs''') = 1, 'alice reads her proof');

  update storage.objects set name = alice || '/' || ord || '/replaced.png' where bucket_id = 'payment-proofs';
  delete from storage.objects where bucket_id = 'payment-proofs';
  perform test.as_postgres();
  perform test.assert(test.count('select 1 from storage.objects where bucket_id = ''payment-proofs'' and name like ''%/proof.png''') = 1,
                      'customer cannot overwrite or delete submitted proof');

  perform test.as_user(bob);
  perform test.assert(test.count('select 1 from storage.objects where bucket_id = ''payment-proofs''') = 0, 'bob cannot read alice''s proof');
  perform test.as_user(admin);
  perform test.assert(test.count('select 1 from storage.objects where bucket_id = ''payment-proofs''') = 1, 'admin can review proofs');
  perform test.as_anon();
  perform test.assert(test.count('select 1 from storage.objects where bucket_id = ''payment-proofs''') = 0, 'anonymous sees no proofs');

  -- ---------- request attachments: same pattern
  perform test.as_user(alice);
  insert into storage.objects (bucket_id, name, owner) values ('request-attachments', alice || '/' || ord || '/spec.pdf', alice);
  perform test.throws('insert into storage.objects (bucket_id, name, owner) values (''request-attachments'', ''' || bob || '/' || ord || '/spec.pdf'', ''' || alice || ''')', '42501');
  perform test.as_user(bob);
  perform test.assert(test.count('select 1 from storage.objects where bucket_id = ''request-attachments''') = 0, 'bob cannot read alice''s attachments');

  -- ---------- product files: customers never get bucket access, even after buying
  perform test.as_user(admin);
  insert into storage.objects (bucket_id, name, owner) values ('product-files', 'p1/v1/project.zip', admin);
  perform test.as_user(alice);
  perform test.assert(test.count('select 1 from storage.objects where bucket_id = ''product-files''') = 0, 'customers cannot list private product files');
  perform test.throws('insert into storage.objects (bucket_id, name, owner) values (''product-files'', ''evil/x.zip'', ''' || alice || ''')', '42501');
  perform test.as_anon();
  perform test.assert(test.count('select 1 from storage.objects where bucket_id = ''product-files''') = 0, 'anonymous cannot list product files');
  perform test.as_service();
  perform test.assert(test.count('select 1 from storage.objects where bucket_id = ''product-files''') = 1,
                      'service role (server only) can sign URLs after the entitlement check');

  -- ---------- product images: public read, staff write
  perform test.as_user(admin);
  insert into storage.objects (bucket_id, name, owner) values ('product-images', 'covers/esp32.webp', admin);
  perform test.as_anon();
  perform test.assert(test.count('select 1 from storage.objects where bucket_id = ''product-images''') = 1, 'anyone can view product images');
  perform test.throws('insert into storage.objects (bucket_id, name) values (''product-images'', ''covers/evil.webp'')', '42501');
  perform test.as_user(alice);
  perform test.throws('insert into storage.objects (bucket_id, name, owner) values (''product-images'', ''covers/evil.webp'', ''' || alice || ''')', '42501');

  raise notice 'PASS t_06: storage policies';
end $$;

rollback;
