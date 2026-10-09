-- Orders, manual payment verification, order state machine, stock, COD.
begin;

do $$
declare
  alice constant uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  bob   constant uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  admin constant uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

  p_esp     uuid; p_line uuid; p_arm uuid; p_weather uuid; p_ecg uuid; p_digital uuid;
  addr_a    uuid; addr_b uuid;
  ord_a     uuid; ord_b uuid; ord_cod uuid;
  pay_a     uuid; pay_cod uuid;
  v_total   int;
  v_stock   int;
begin
  select id into p_esp     from public.products where slug = 'esp32-home-automation-kit';
  select id into p_line    from public.products where slug = 'line-follower-robot-kit';
  select id into p_arm     from public.products where slug = 'robotic-arm-4dof-kit';
  select id into p_weather from public.products where slug = 'arduino-weather-station-kit';
  select id into p_ecg     from public.products where slug = 'ecg-sensor-kit';
  select id into p_digital from public.products where slug = 'face-recognition-attendance-system';

  -- =============================================================== alice: UPI order for 2 ESP32 kits
  perform test.as_user(alice);
  insert into public.addresses (user_id, recipient_name, phone, line1, city, state, pincode, is_default)
  values (alice, 'Alice', '9876543210', '12 MG Road', 'Bengaluru', 'Karnataka', '560001', true) returning id into addr_a;
  insert into public.cart_items (user_id, product_id, quantity) values (alice, p_esp, 2);

  -- no address -> refused for physical goods
  perform test.throws('select public.place_order(null, ''upi'')', 'address_required');
  ord_a := public.place_order(addr_a, 'upi');

  perform test.as_postgres();
  select total_paise into v_total from public.orders where id = ord_a;
  perform test.assert(v_total = 439800, 'total computed server-side from DB prices (2 x 219900, free shipping): got ' || v_total);
  perform test.assert((select status from public.orders where id = ord_a) = 'pending_payment', 'UPI order starts pending_payment');
  perform test.assert((select shipping_address ->> 'city' from public.orders where id = ord_a) = 'Bengaluru', 'address snapshot stored');
  perform test.assert((select quantity_on_hand from public.inventory where product_id = p_esp) = 38, 'stock reserved atomically (40 -> 38)');
  perform test.assert(test.count('select 1 from public.cart_items where user_id = ''' || alice || '''') = 0, 'cart emptied');
  perform test.assert(test.count('select 1 from public.inventory_movements where order_id = ''' || ord_a || ''' and delta = -2') = 1, 'stock movement recorded');
  perform test.assert((select order_number from public.orders where id = ord_a) ~ '^NX[0-9]{4}[0-9]{6}$', 'order number format');

  -- =============================================================== customers cannot forge orders or payments
  perform test.as_user(alice);
  perform test.throws('update public.orders set status = ''paid'' where id = ''' || ord_a || '''', '42501');
  perform test.throws('update public.orders set total_paise = 1, subtotal_paise = 1 where id = ''' || ord_a || '''', '42501');
  perform test.throws('insert into public.payments (order_id, method, status, amount_paise, utr_reference, verified_at) values (''' || ord_a || ''', ''upi'', ''verified'', 1, ''FAKE123456'', now())', '42501');
  perform test.throws('insert into public.orders (user_id, status, payment_method, subtotal_paise, total_paise, has_physical) values (''' || alice || ''', ''paid'', ''upi'', 0, 0, false)', '42501');
  perform test.throws('select public.admin_verify_payment(gen_random_uuid(), 1)', 'forbidden');
  perform test.throws('select public.admin_set_order_status(''' || ord_a || ''', ''completed'')', 'forbidden');
  perform test.throws('select public.admin_adjust_stock(''' || p_esp || ''', 1000, ''restock'')', 'forbidden');

  -- claim validation
  perform test.throws('select public.submit_payment_claim(''' || ord_a || ''', ''bad ref!'', ''Alice'')', 'invalid_reference');
  perform test.throws('select public.submit_payment_claim(''' || ord_a || ''', ''UTR1234567890'', ''A'')', 'invalid_payer_name');
  perform test.throws('select public.submit_payment_claim(''' || ord_a || ''', ''UTR1234567890'', ''Alice'', ''' || bob || '/x/proof.png'')', 'invalid_proof_path');

  pay_a := public.submit_payment_claim(ord_a, 'UTR1234567890', 'Alice Customer', alice || '/' || ord_a || '/proof.png');
  perform test.assert((select status from public.orders where id = ord_a) = 'payment_submitted', 'claim moves order to payment_submitted');
  perform test.assert((select status from public.payments where id = pay_a) = 'submitted', 'claim is NOT verified');
  perform test.assert((select amount_paise from public.payments where id = pay_a) = 439800, 'claim amount comes from the order, not the customer');
  perform test.throws('select public.submit_payment_claim(''' || ord_a || ''', ''UTR0000000001'', ''Alice'')', 'order_not_awaiting_payment');

  -- =============================================================== bob: a reference cannot back two orders
  perform test.as_user(bob);
  insert into public.addresses (user_id, recipient_name, phone, line1, city, state, pincode)
  values (bob, 'Bob', '9812345678', '5 Park St', 'Kolkata', 'West Bengal', '700016') returning id into addr_b;
  insert into public.cart_items (user_id, product_id, quantity) values (bob, p_line, 1);
  ord_b := public.place_order(addr_b, 'bank_transfer');
  perform test.throws('select public.submit_payment_claim(''' || ord_b || ''', ''utr1234567890'', ''Bob'')', 'reference_already_used');   -- case-insensitive
  perform test.assert(test.count('select 1 from public.orders') = 1, 'bob sees only his own order');
  perform test.assert(test.count('select 1 from public.payments') = 0, 'bob cannot see alice''s payment');
  perform test.throws('select public.cancel_order(''' || ord_a || ''')', 'order_not_found');                 -- not bob's order

  -- =============================================================== admin: reject, then verify
  perform test.as_user(admin);
  perform test.assert(test.count('select 1 from public.orders') = 2, 'admin sees every order');
  perform test.throws('select public.admin_reject_payment(''' || pay_a || ''', ''x'')', 'reason_required');
  perform public.admin_reject_payment(pay_a, 'Amount not found in bank statement');
  perform test.assert((select status from public.orders where id = ord_a) = 'pending_payment', 'rejection returns order to pending_payment');
  perform test.assert((select status from public.payments where id = pay_a) = 'rejected', 'payment rejected');

  perform test.as_user(alice);
  perform test.assert((select count(*) from public.order_status_history where order_id = ord_a) >= 3, 'customer can follow order history');
  pay_a := public.submit_payment_claim(ord_a, 'UTR9999999999', 'Alice Customer');
  perform test.as_user(admin);
  perform test.throws('select public.admin_verify_payment(''' || pay_a || ''', 439799)', 'amount_mismatch');
  perform test.throws('select public.admin_set_order_status(''' || ord_a || ''', ''paid'')', 'use_payment_workflow');
  perform public.admin_verify_payment(pay_a, 439800, 'Matched against HDFC statement');
  perform test.assert((select status from public.orders where id = ord_a) = 'paid', 'order paid after staff verification');
  perform test.assert((select verified_by from public.payments where id = pay_a) = admin, 'verifier recorded');
  perform test.throws('select public.admin_verify_payment(''' || pay_a || ''', 439800)', 'payment_not_awaiting_verification');   -- no double verify

  -- =============================================================== state machine
  perform test.throws('select public.admin_set_order_status(''' || ord_a || ''', ''delivered'')', 'invalid_order_transition');
  perform test.throws('select public.admin_set_order_status(''' || ord_a || ''', ''completed'')', 'invalid_order_transition');
  perform test.throws('select public.admin_upsert_shipment(''' || ord_a || ''', ''shipped'')', 'order_not_ready_to_ship');
  perform public.admin_set_order_status(ord_a, 'processing', 'Packing');
  perform public.admin_upsert_shipment(ord_a, 'shipped', 'Delhivery', 'DLV123456789', 'https://track.example.test/DLV123456789');
  perform test.assert((select status from public.orders where id = ord_a) = 'shipped', 'shipment dispatch moves order to shipped');

  perform test.as_user(alice);
  perform test.assert((select tracking_number from public.shipments where order_id = ord_a) = 'DLV123456789', 'customer sees own tracking');
  perform test.as_user(bob);
  perform test.assert(test.count('select 1 from public.shipments') = 0, 'bob cannot see alice''s shipment');
  perform test.as_user(admin);
  perform public.admin_upsert_shipment(ord_a, 'delivered');
  perform test.assert((select status from public.orders where id = ord_a) = 'delivered', 'delivered shipment moves order to delivered');
  perform public.admin_set_order_status(ord_a, 'completed');
  perform test.throws('update public.orders set total_paise = 1, subtotal_paise = 1 where id = ''' || ord_a || '''', '42501');   -- not even admin writes orders directly

  -- =============================================================== stock: no overselling, cancel returns stock
  perform test.as_user(bob);
  insert into public.cart_items (user_id, product_id, quantity) values (bob, p_arm, 9);          -- only 8 in stock
  perform test.throws('select public.place_order(''' || addr_b || ''', ''upi'')', 'insufficient_stock');
  perform test.assert((select count(*) from public.cart_items where user_id = bob) = 1, 'failed order keeps the cart');
  perform test.as_postgres();
  perform test.assert((select quantity_on_hand from public.inventory where product_id = p_arm) = 8, 'failed order did not touch stock');
  perform test.as_user(bob);
  delete from public.cart_items where user_id = bob;

  -- bob cancels his unpaid line-follower order -> stock restored (25 minus 1 reserved, plus 1 back)
  perform test.as_postgres();
  perform test.assert((select quantity_on_hand from public.inventory where product_id = p_line) = 24, 'line follower reserved (25 -> 24)');
  perform test.as_user(bob);
  perform public.cancel_order(ord_b);
  perform test.as_postgres();
  perform test.assert((select quantity_on_hand from public.inventory where product_id = p_line) = 25, 'cancel returns stock');
  perform test.assert((select status from public.orders where id = ord_b) = 'cancelled', 'order cancelled');
  perform test.as_user(bob);
  perform test.throws('select public.cancel_order(''' || ord_b || ''')', 'order_not_cancellable');

  -- =============================================================== COD rules
  insert into public.cart_items (user_id, product_id, quantity) values (bob, p_digital, 1);
  perform test.throws('select public.place_order(null, ''cod'')', 'cod_not_available_for_digital');
  delete from public.cart_items where user_id = bob;

  insert into public.cart_items (user_id, product_id, quantity) values (bob, p_arm, 1);            -- INR 6,499 > COD cap of INR 5,000
  perform test.throws('select public.place_order(''' || addr_b || ''', ''cod'')', 'cod_limit_exceeded');
  delete from public.cart_items where user_id = bob;

  insert into public.cart_items (user_id, product_id, quantity) values (bob, p_ecg, 1);            -- not COD-eligible
  perform test.throws('select public.place_order(''' || addr_b || ''', ''cod'')', 'cod_not_eligible');
  delete from public.cart_items where user_id = bob;

  -- Raise the free-shipping threshold (rolled back with this test) so the shipping fee path is exercised:
  -- the seed threshold is INR 999, and every seeded kit costs more than that.
  perform test.as_postgres();
  update public.store_settings set value = '200000'::jsonb where key = 'free_shipping_threshold_paise';
  perform test.as_user(bob);
  insert into public.cart_items (user_id, product_id, quantity) values (bob, p_weather, 1);        -- INR 1,299 + INR 60 shipping
  ord_cod := public.place_order(addr_b, 'cod');
  perform test.assert((select total_paise from public.orders where id = ord_cod) = 135900, 'COD total includes shipping below the free threshold');
  perform test.assert((select status from public.orders where id = ord_cod) = 'pending_confirmation', 'COD order waits for staff confirmation');
  select id into pay_cod from public.payments where order_id = ord_cod;
  perform test.assert((select status from public.payments where id = pay_cod) = 'pending', 'COD payment row is pending');
  perform test.throws('select public.submit_payment_claim(''' || ord_cod || ''', ''UTR5555555555'', ''Bob'')', 'order_not_awaiting_payment');

  perform test.as_user(admin);
  perform test.throws('select public.admin_verify_payment(''' || pay_cod || ''', 135900)', 'cod_not_ready_for_verification');   -- cash not collected yet
  perform public.admin_set_order_status(ord_cod, 'processing');
  perform public.admin_upsert_shipment(ord_cod, 'shipped', 'India Post', 'EE123456789IN');
  perform public.admin_upsert_shipment(ord_cod, 'delivered');
  perform public.admin_verify_payment(pay_cod, 135900, 'Cash collected by courier');
  perform test.assert((select status from public.payments where id = pay_cod) = 'verified', 'COD payment verified after delivery');
  perform public.admin_set_order_status(ord_cod, 'completed');

  -- =============================================================== refund
  perform public.admin_set_order_status(ord_a, 'refunded', 'Customer returned the goods');
  perform test.assert((select status from public.payments where order_id = ord_a and status = 'refunded') is not null, 'refund marks the payment refunded');
  perform test.as_postgres();
  perform test.assert((select quantity_on_hand from public.inventory where product_id = p_esp) = 38,
                      'goods already shipped are not auto-restocked on refund');

  -- =============================================================== manual stock adjustment is ledgered
  perform test.as_user(admin);
  v_stock := public.admin_adjust_stock(p_esp, 10, 'restock', 'Supplier delivery');
  perform test.assert(v_stock = 48, 'restock applied');
  perform test.throws('select public.admin_adjust_stock(''' || p_esp || ''', -1000, ''correction'')', '23514');     -- cannot go negative
  perform test.assert(test.count('select 1 from public.inventory_movements where reason = ''restock''') = 1, 'restock recorded in the ledger');

  raise notice 'PASS t_03: checkout, payments, state machine, stock, COD';
end $$;

rollback;
