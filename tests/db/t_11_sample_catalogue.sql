-- The sample catalogue: 43 listings (30 + 13), all flagged as samples, idempotent seed, and quote-only listings can never be bought.
begin;

do $$
declare
  alice constant uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  v_quote uuid; v_kit uuid; v_flat int;
begin
  perform test.as_postgres();
  perform test.assert((select count(*) from public.products where sku like 'PNX-%') = 43, '43 sample listings carry a PNX project id (30 from the brief + 13 extra)');
  perform test.assert((select count(*) from public.products where sku like 'PNX-%' and not is_sample) = 0, 'all of them are flagged is_sample');
  perform test.assert((select count(*) from public.products where is_sample and status <> 'published') = 0, 'samples are published');
  perform test.assert((select count(*) from public.products where sku like 'PNX-HK-%') = 16, '16 hardware kits');
  perform test.assert((select count(*) from public.products where sku like 'PNX-CU-%' and is_quote_only) = 1, 'one custom (quote-only) listing');
  perform test.assert((select count(distinct cover_image_path) from public.products where sku like 'PNX-%') = 43, 'every listing has its own picture');
  perform test.assert((select count(*) from public.products where sku like 'PNX-%'
                         and (cardinality(features) = 0 or cardinality(deliverables) = 0 or cardinality(tech_stack) = 0
                              or jsonb_array_length(faq) = 0 or estimated_time is null or subdomain is null or difficulty is null)) = 0,
                      'no sample listing is missing content');
  perform test.assert((select count(*) from public.products p join public.inventory i on i.product_id = p.id
                        where p.sku like 'PNX-HK-%' and i.quantity_on_hand > 0) = 0, 'sample kits do not claim stock');

  select id into v_quote from public.products where is_quote_only limit 1;
  select id into v_kit   from public.products where sku = 'PNX-HK-006';

  -- the quote-only listing cannot be added to a cart (RLS) ...
  perform test.as_user(alice);
  perform test.throws(format('insert into public.cart_items (user_id, product_id, quantity) values (%L, %L, 1)', alice, v_quote), '42501');
  -- ... while a normal published product still can
  insert into public.cart_items (user_id, product_id, quantity) values (alice, v_kit, 1);
  perform test.assert(test.count('select 1 from public.cart_items') = 1, 'normal products still go in the cart');

  -- ... and the database refuses it in an order even if a cart row somehow existed
  perform test.as_postgres();
  delete from public.cart_items where user_id = alice;
  insert into public.cart_items (user_id, product_id, quantity) values (alice, v_quote, 1);
  perform test.as_user(alice);
  perform test.throws('select public.place_order(null, ''upi'')', 'product_unavailable');

  raise notice 'PASS t_11: sample catalogue';
end $$;

rollback;
