-- Audit trail integrity and a structural scan of grants / RLS that fails if a future migration leaves something open.
begin;

do $$
declare
  alice constant uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  admin constant uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  p_esp uuid; p_before int; v_leaky text; v_rows int;
begin
  select id into p_esp from public.products where slug = 'esp32-home-automation-kit';

  -- ---------- audit entries carry the acting admin and the old/new values
  perform test.as_postgres();
  select count(*) into p_before from public.audit_log;
  perform test.as_user(admin);
  update public.products set price_paise = 229900 where id = p_esp;
  perform public.admin_adjust_stock(p_esp, 5, 'restock', 'audit test');
  perform test.as_postgres();
  perform test.assert((select details -> 'price_paise' ->> 'old' from public.audit_log
                        where action = 'products.update' and entity_id = p_esp::text order by id desc limit 1) = '219900',
                      'price change audited with old value');
  perform test.assert((select details -> 'price_paise' ->> 'new' from public.audit_log
                        where action = 'products.update' and entity_id = p_esp::text order by id desc limit 1) = '229900',
                      'price change audited with new value');
  perform test.assert((select actor_id from public.audit_log where action = 'products.update' and entity_id = p_esp::text order by id desc limit 1) = admin,
                      'audit records the acting admin');
  perform test.assert(test.count('select 1 from public.audit_log where action = ''inventory.update'' and entity_id = ''' || p_esp || '''') = 1,
                      'stock change audited');
  -- touching only updated_at must not create noise
  select count(*) into v_rows from public.audit_log;
  update public.products set updated_at = now() where id = p_esp;
  perform test.assert((select count(*) from public.audit_log) = v_rows, 'no-op updates are not audited');

  -- ---------- audit log is append-only, even for the table owner
  perform test.throws('update public.audit_log set action = ''tampered''', 'append-only');
  perform test.throws('delete from public.audit_log', 'append-only');
  perform test.throws('truncate public.audit_log', 'append-only');

  perform test.as_user(alice);
  perform test.assert(test.count('select 1 from public.audit_log') = 0, 'customers cannot read the audit log');
  perform test.throws('insert into public.audit_log (action, entity_type) values (''x'', ''y'')', '42501');
  perform test.as_anon();
  perform test.throws('select * from public.audit_log', '42501');
  perform test.as_user(admin);
  perform test.assert(test.count('select 1 from public.audit_log') > 0, 'admins can read the audit log');
  perform test.throws('delete from public.audit_log', '42501');

  -- ---------- structural: RLS must be on for every table in public
  perform test.as_postgres();
  select string_agg(c.relname, ', ') into v_leaky
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
  perform test.assert(v_leaky is null, 'every public table has RLS enabled; missing: ' || coalesce(v_leaky, ''));

  -- ---------- structural: anon may only SELECT the public catalogue
  select string_agg(table_name || ':' || privilege_type, ', ') into v_leaky
    from information_schema.role_table_grants
   where grantee = 'anon' and table_schema = 'public'
     and not (privilege_type = 'SELECT' and table_name in ('branches', 'categories', 'products', 'store_settings', 'public_stock_status'));
  perform test.assert(v_leaky is null, 'anon has unexpected table privileges: ' || coalesce(v_leaky, ''));

  -- ---------- structural: customers can never write the money / state tables directly
  select string_agg(table_name || ':' || privilege_type, ', ') into v_leaky
    from information_schema.role_table_grants
   where grantee = 'authenticated' and table_schema = 'public'
     and table_name in ('orders', 'order_items', 'payments', 'shipments', 'order_status_history', 'audit_log', 'inventory_movements')
     and privilege_type <> 'SELECT';
  perform test.assert(v_leaky is null, 'authenticated can write protected tables: ' || coalesce(v_leaky, ''));

  -- ---------- structural: no column-level UPDATE on profiles.role
  perform test.assert(not has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE'), 'profiles.role not updatable by users');

  -- ---------- structural: function execute allow-list
  select string_agg(p.proname, ', ') into v_leaky
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and has_function_privilege('anon', p.oid, 'EXECUTE')
     and p.proname not in ('is_admin');
  perform test.assert(v_leaky is null, 'anon can execute: ' || coalesce(v_leaky, ''));

  select string_agg(p.proname, ', ') into v_leaky
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and has_function_privilege('authenticated', p.oid, 'EXECUTE')
     and p.proname not in ('is_admin', 'has_download_access', 'place_order', 'submit_payment_claim', 'cancel_order',
                           'respond_to_quote', 'approve_milestone', 'cancel_custom_request', 'admin_verify_payment',
                           'admin_reject_payment', 'admin_set_order_status', 'admin_upsert_shipment',
                           'admin_adjust_stock', 'admin_mark_milestone_paid');
  perform test.assert(v_leaky is null, 'authenticated can execute unexpected functions: ' || coalesce(v_leaky, ''));

  -- ---------- structural: every SECURITY DEFINER function pins its search_path
  select string_agg(p.proname, ', ') into v_leaky
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) cfg where cfg like 'search_path=%');
  perform test.assert(v_leaky is null, 'SECURITY DEFINER without fixed search_path: ' || coalesce(v_leaky, ''));

  raise notice 'PASS t_07: audit trail and structural grants';
end $$;

rollback;
