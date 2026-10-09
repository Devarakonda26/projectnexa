-- Digital downloads are available ONLY after staff verify the payment, and only to the buyer.
begin;

do $$
declare
  alice constant uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  bob   constant uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  admin constant uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  p_dig uuid; p_other uuid; ord uuid; pay uuid;
begin
  select id into p_dig   from public.products where slug = 'face-recognition-attendance-system';
  select id into p_other from public.products where slug = 'mern-elearning-platform';

  perform test.as_user(admin);
  insert into public.product_files (product_id, storage_path, file_name, size_bytes, content_type)
  values (p_dig,   p_dig   || '/v1/project.zip', 'project.zip', 1048576, 'application/zip'),
         (p_other, p_other || '/v1/project.zip', 'project.zip', 2097152, 'application/zip');
  perform test.assert(test.count('select 1 from public.product_files') = 2, 'admin can manage download files');

  -- visitors and customers who have not paid see nothing
  perform test.as_anon();
  perform test.throws('select * from public.product_files', '42501');
  perform test.as_user(alice);
  perform test.assert(test.count('select 1 from public.product_files') = 0, 'unpaid customer sees no download rows');
  perform test.assert(public.has_download_access(p_dig) = false, 'no access before purchase');
  perform test.throws('insert into public.product_files (product_id, storage_path, file_name, size_bytes, content_type) values (''' || p_dig || ''', ''x/y.zip'', ''y.zip'', 1, ''application/zip'')', '42501');

  -- buy it (digital goods need no address)
  insert into public.cart_items (user_id, product_id, quantity) values (alice, p_dig, 5);   -- quantity is ignored for digital goods
  ord := public.place_order(null, 'upi');
  perform test.assert((select total_paise from public.orders where id = ord) = 249900, 'digital quantity forced to 1; no shipping');
  perform test.assert((select has_physical from public.orders where id = ord) = false, 'digital order has no physical items');
  perform test.assert(public.has_download_access(p_dig) = false, 'ordering alone grants nothing');

  pay := public.submit_payment_claim(ord, 'UPIREF000111', 'Alice Customer');
  perform test.assert(public.has_download_access(p_dig) = false, 'a CLAIMED payment grants nothing');
  perform test.assert(test.count('select 1 from public.product_files') = 0, 'claimed payment still shows no files');

  -- staff verify -> access opens for exactly the purchased product
  perform test.as_user(admin);
  perform public.admin_verify_payment(pay, 249900);
  perform test.assert((select status from public.orders where id = ord) = 'completed', 'verified digital order completes');

  perform test.as_user(alice);
  perform test.assert(public.has_download_access(p_dig) = true, 'access after verification');
  perform test.assert(public.has_download_access(p_other) = false, 'no access to products she did not buy');
  perform test.assert(test.count('select 1 from public.product_files') = 1, 'sees only the purchased product''s file');
  perform test.assert((select file_name from public.product_files) = 'project.zip', 'correct file row');

  -- other customers get nothing
  perform test.as_user(bob);
  perform test.assert(public.has_download_access(p_dig) = false, 'bob has no access to alice''s purchase');
  perform test.assert(test.count('select 1 from public.product_files') = 0, 'bob sees no download rows');

  -- double purchase is refused
  perform test.as_user(alice);
  insert into public.cart_items (user_id, product_id, quantity) values (alice, p_dig, 1);
  perform test.throws('select public.place_order(null, ''upi'')', 'already_purchased');

  -- refund revokes access
  perform test.as_user(admin);
  perform public.admin_set_order_status(ord, 'refunded', 'Refund issued');
  perform test.as_user(alice);
  perform test.assert(public.has_download_access(p_dig) = false, 'refund revokes download access');
  perform test.assert(test.count('select 1 from public.product_files') = 0, 'file rows hidden after refund');

  raise notice 'PASS t_04: digital downloads gated on verified payment';
end $$;

rollback;
