-- Who can see and change what: anonymous visitors, customers, admins.
begin;

do $$
declare
  alice constant uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  bob   constant uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  admin constant uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  v_branch uuid;
  v_draft  uuid;
begin
  select id into v_branch from public.branches where slug = 'cse';

  -- ---------- anonymous visitor
  perform test.as_anon();
  perform test.assert(test.count('select 1 from public.products') >= 12, 'anon sees the published products');
  perform test.assert(test.count('select 1 from public.branches') >= 14, 'anon sees all branches');
  perform test.assert(test.count('select 1 from public.public_stock_status') >= 6, 'anon sees stock flags for hardware');
  perform test.assert((select in_stock from public.public_stock_status s join public.products p on p.id = s.product_id where p.slug = 'ecg-sensor-kit') = false,
                      'out-of-stock product flagged');
  perform test.assert((select low_stock from public.public_stock_status s join public.products p on p.id = s.product_id where p.slug = 'arduino-weather-station-kit') = true,
                      'low-stock product flagged');
  perform test.throws('select * from public.inventory',        '42501');   -- exact counts are private
  perform test.throws('select * from public.orders',           '42501');
  perform test.throws('select * from public.payments',         '42501');
  perform test.throws('select * from public.profiles',         '42501');
  perform test.throws('select * from public.audit_log',        '42501');
  perform test.throws('select * from public.product_files',    '42501');
  perform test.throws('select * from public.cart_items',       '42501');
  perform test.throws('insert into public.products (slug,title,summary,product_type,branch_id,price_paise) values (''x-x'',''Hack'',''hack hack hack'',''digital'',''' || v_branch || ''',1)', '42501');
  perform test.throws('select public.place_order(null, ''upi'')', '42501');
  perform test.throws('select public.admin_verify_payment(gen_random_uuid(), 1)', '42501');

  -- ---------- draft products are hidden from the public
  perform test.as_postgres();
  update public.products set status = 'draft' where slug = 'g3-building-staad-analysis';
  perform test.as_anon();
  perform test.assert(test.count('select 1 from public.products where slug = ''g3-building-staad-analysis''') = 0, 'draft product hidden from anon');
  perform test.as_user(alice);
  perform test.assert(test.count('select 1 from public.products where slug = ''g3-building-staad-analysis''') = 0, 'draft product hidden from customers');
  perform test.as_user(admin);
  perform test.assert(test.count('select 1 from public.products where slug = ''g3-building-staad-analysis''') = 1, 'admin sees draft products');

  -- ---------- customer cannot manage the catalogue
  perform test.as_user(alice);
  perform test.throws('insert into public.products (slug,title,summary,product_type,branch_id,price_paise) values (''x-x'',''Hack'',''hack hack hack'',''digital'',''' || v_branch || ''',1)', '42501');
  update public.products set price_paise = 1 where slug = 'mern-elearning-platform';
  perform test.as_postgres();
  perform test.assert((select price_paise from public.products where slug = 'mern-elearning-platform') = 349900,
                      'customer UPDATE on products changed nothing');
  perform test.as_user(alice);
  perform test.assert(test.count('select 1 from public.inventory') = 0, 'customer cannot read exact stock');
  perform test.throws('insert into public.branches (slug,name,short_name) values (''hack'',''Hack'',''HK'')', '42501');
  -- (UPDATE is granted to the `authenticated` role for admins; RLS then filters customers to zero rows.)
  update public.store_settings set value = '1'::jsonb where key = 'shipping_flat_paise';
  perform test.as_postgres();
  perform test.assert((select value from public.store_settings where key = 'shipping_flat_paise') = '6000'::jsonb,
                      'customer UPDATE on settings changed nothing');

  -- ---------- admin can manage the catalogue
  perform test.as_user(admin);
  insert into public.products (slug, title, summary, product_type, branch_id, price_paise)
  values ('admin-made-product', 'Admin Made Product', 'Created by the admin in a test.', 'digital', v_branch, 99900);
  update public.products set price_paise = 109900 where slug = 'admin-made-product';
  perform test.assert((select price_paise from public.products where slug = 'admin-made-product') = 109900, 'admin can edit products');
  insert into public.inventory (product_id, quantity_on_hand)
  select id, 5 from public.products where slug = 'esp32-home-automation-kit' on conflict do nothing;
  perform test.throws('insert into public.inventory (product_id, quantity_on_hand) select id, 5 from public.products where slug = ''admin-made-product''',
                      'only tracked for hardware');

  -- ---------- data constraints
  perform test.throws('update public.products set mrp_paise = 1 where slug = ''admin-made-product''', '23514');
  perform test.throws('update public.products set cod_eligible = true where slug = ''admin-made-product''', '23514');   -- COD only for hardware
  perform test.throws('update public.products set price_paise = -5 where slug = ''admin-made-product''', '23514');

  -- ---------- private data between customers
  perform test.as_user(alice);
  insert into public.addresses (user_id, recipient_name, phone, line1, city, state, pincode)
  values (alice, 'Alice', '9876543210', '12 MG Road', 'Bengaluru', 'Karnataka', '560001');
  perform test.as_user(bob);
  perform test.assert(test.count('select 1 from public.addresses') = 0, 'bob cannot see alice''s address');
  perform test.throws('insert into public.addresses (user_id, recipient_name, phone, line1, city, state, pincode) values (''' || alice || ''', ''Bob'', ''9876543210'', ''1 Street'', ''Pune'', ''MH'', ''411001'')',
                      '42501');                                                              -- cannot write into alice's account
  perform test.throws('insert into public.addresses (user_id, recipient_name, phone, line1, city, state, pincode) values (''' || bob || ''', ''Bob'', ''12345'', ''1 Street'', ''Pune'', ''MH'', ''411001'')',
                      '23514');                                                              -- invalid phone rejected
  perform test.throws('insert into public.addresses (user_id, recipient_name, phone, line1, city, state, pincode) values (''' || bob || ''', ''Bob'', ''9876543210'', ''1 Street'', ''Pune'', ''MH'', ''011001'')',
                      '23514');                                                              -- invalid pincode rejected
  perform test.as_user(admin);
  perform test.assert(test.count('select 1 from public.addresses') = 1, 'admin can read addresses to fulfil orders');

  -- ---------- cart rules
  -- A client that guesses a draft product's id must still be refused (the id is passed as a literal).
  perform test.as_postgres();
  select id into v_draft from public.products where slug = 'g3-building-staad-analysis';
  perform test.as_user(alice);
  perform test.throws('insert into public.cart_items (user_id, product_id) values (''' || alice || ''', ''' || v_draft || ''')',
                      '42501');                                                              -- draft product is not orderable
  perform test.throws('insert into public.cart_items (user_id, product_id, quantity) select ''' || alice || ''', id, 11 from public.products where slug = ''esp32-home-automation-kit''',
                      '23514');                                                              -- quantity cap

  raise notice 'PASS t_01: access control';
end $$;

rollback;
