-- Only admins can change store settings; everyone can read them (checkout needs the shipping/COD numbers).
begin;

do $$
declare
  alice constant uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  admin constant uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  n int;
begin
  perform test.as_user(admin);
  update public.store_settings set value = '7500'::jsonb, updated_by = admin where key = 'shipping_flat_paise';
  get diagnostics n = row_count;
  perform test.assert(n = 1, 'admin can update a setting');
  perform test.assert((select (value #>> '{}')::int from public.store_settings where key = 'shipping_flat_paise') = 7500, 'new value stored');

  perform test.as_user(alice);
  update public.store_settings set value = '1'::jsonb where key = 'shipping_flat_paise';
  get diagnostics n = row_count;
  perform test.assert(n = 0, 'customer cannot update settings');
  perform test.assert((select (value #>> '{}')::int from public.store_settings where key = 'shipping_flat_paise') = 7500, 'customer sees the admin value');

  perform test.as_anon();
  perform test.assert(test.count('select 1 from public.store_settings') >= 3, 'settings readable by visitors');

  raise notice 'PASS t_10: store settings are admin-write only';
end $$;

rollback;
