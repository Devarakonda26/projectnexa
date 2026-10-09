-- ProjectNexa migration 4/6: business rules enforced inside the database.
--
-- Conventions
--  * Every SECURITY DEFINER function pins `search_path` and checks auth.uid() / is_admin() itself.
--  * Execute permissions are locked down in migration 5 (nothing is callable by `anon`).
--  * Customers never write orders / payments / shipments directly. They call the RPCs below,
--    so a customer can never set their own payment status.

-- ============================================================ helpers
create function public.is_admin() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

create function public.require_admin() returns void
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden: admin only' using errcode = '42501';
  end if;
end $$;

create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ============================================================ profiles
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  -- Signup metadata is attacker-controlled. Copy ONLY name and phone, each validated; the role is always 'customer'.
  insert into public.profiles (id, full_name, phone, role)
  values (new.id,
          nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 120), ''),
          case when (new.raw_user_meta_data ->> 'phone') ~ '^[6-9][0-9]{9}$' then new.raw_user_meta_data ->> 'phone' end,
          'customer')
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only SQL / service-role sessions (auth.uid() is null) may change a role.
create function public.prevent_role_change() returns trigger
language plpgsql as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'role changes are not permitted from user sessions' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger profiles_prevent_role_change
  before update of role on public.profiles
  for each row execute function public.prevent_role_change();

-- ============================================================ catalogue
create function public.products_set_search_vector() returns trigger
language plpgsql as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.summary, '') || ' ' ||
                                    coalesce(array_to_string(new.tags, ' '), '') || ' ' ||
                                    coalesce(array_to_string(new.tech_stack, ' '), '')), 'B');
  return new;
end $$;

create trigger products_search_vector
  before insert or update of title, summary, tags, tech_stack on public.products
  for each row execute function public.products_set_search_vector();

-- Inventory rows only make sense for hardware.
create function public.inventory_hardware_only() returns trigger
language plpgsql as $$
begin
  if not exists (select 1 from public.products p where p.id = new.product_id and p.product_type = 'hardware') then
    raise exception 'inventory is only tracked for hardware products' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger inventory_hardware_only
  before insert on public.inventory
  for each row execute function public.inventory_hardware_only();

-- Any manual change to quantity_on_hand is recorded in the movement ledger.
create function public.inventory_log_manual_change() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'UPDATE' and new.quantity_on_hand is distinct from old.quantity_on_hand
     and coalesce(current_setting('app.inventory_internal', true), '') <> 'on' then
    insert into public.inventory_movements (product_id, delta, reason, note, created_by)
    values (new.product_id, new.quantity_on_hand - old.quantity_on_hand, 'manual_adjustment',
            nullif(current_setting('app.inventory_note', true), ''), auth.uid());
  end if;
  return new;
end $$;

create trigger inventory_manual_change
  after update of quantity_on_hand on public.inventory
  for each row execute function public.inventory_log_manual_change();

-- ============================================================ audit
create function public.audit_row_change() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_id    text;
  v_diff  jsonb;
  v_key   text := coalesce(tg_argv[0], 'id');
begin
  if tg_op = 'INSERT' then
    v_id := to_jsonb(new) ->> v_key;
    v_diff := to_jsonb(new) - 'search_vector';
  elsif tg_op = 'DELETE' then
    v_id := to_jsonb(old) ->> v_key;
    v_diff := to_jsonb(old) - 'search_vector';
  else
    v_id := to_jsonb(new) ->> v_key;
    select coalesce(jsonb_object_agg(n.key, jsonb_build_object('old', o.value, 'new', n.value)), '{}'::jsonb)
      into v_diff
      from jsonb_each(to_jsonb(new)) n
      left join jsonb_each(to_jsonb(old)) o on o.key = n.key
     where n.value is distinct from o.value
       and n.key not in ('updated_at', 'search_vector');
    if v_diff = '{}'::jsonb then
      return new;
    end if;
  end if;

  insert into public.audit_log (actor_id, actor_role, action, entity_type, entity_id, details)
  values (auth.uid(), coalesce(auth.role(), current_user::text),
          tg_table_name || '.' || lower(tg_op), tg_table_name, v_id, v_diff);

  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

create function public.audit_log_immutable() returns trigger
language plpgsql as $$
begin
  raise exception 'audit_log is append-only' using errcode = '42501';
end $$;

create trigger audit_log_no_update before update or delete on public.audit_log
  for each row execute function public.audit_log_immutable();
create trigger audit_log_no_truncate before truncate on public.audit_log
  for each statement execute function public.audit_log_immutable();

create trigger audit_products      after insert or update or delete on public.products           for each row execute function public.audit_row_change();
create trigger audit_product_files after insert or update or delete on public.product_files      for each row execute function public.audit_row_change();
create trigger audit_inventory     after insert or update or delete on public.inventory          for each row execute function public.audit_row_change('product_id');
create trigger audit_branches      after insert or update or delete on public.branches           for each row execute function public.audit_row_change();
create trigger audit_categories    after insert or update or delete on public.categories         for each row execute function public.audit_row_change();
create trigger audit_settings      after insert or update or delete on public.store_settings     for each row execute function public.audit_row_change('key');
create trigger audit_orders        after update or delete on public.orders                       for each row execute function public.audit_row_change();
create trigger audit_payments      after insert or update or delete on public.payments           for each row execute function public.audit_row_change();
create trigger audit_shipments     after insert or update or delete on public.shipments          for each row execute function public.audit_row_change();
create trigger audit_requests      after update or delete on public.custom_requests              for each row execute function public.audit_row_change();
create trigger audit_quotes        after insert or update or delete on public.request_quotes     for each row execute function public.audit_row_change();
create trigger audit_milestones    after insert or update or delete on public.request_milestones for each row execute function public.audit_row_change();
create trigger audit_profile_role  after update of role on public.profiles
  for each row when (old.role is distinct from new.role) execute function public.audit_row_change();

-- ============================================================ order state machine
create function public.order_transition_allowed(
  p_from public.order_status, p_to public.order_status,
  p_method public.payment_method, p_has_physical boolean
) returns boolean language plpgsql immutable as $$
begin
  return case
    when p_from = 'pending_payment'      and p_to = 'payment_submitted' then p_method <> 'cod'
    when p_from = 'pending_payment'      and p_to = 'cancelled'         then true
    when p_from = 'payment_submitted'    and p_to = 'paid'              then p_method <> 'cod'
    when p_from = 'payment_submitted'    and p_to = 'pending_payment'   then p_method <> 'cod'   -- payment rejected
    when p_from = 'pending_confirmation' and p_to = 'processing'        then p_method = 'cod'
    when p_from = 'pending_confirmation' and p_to = 'cancelled'         then p_method = 'cod'
    when p_from = 'paid'                 and p_to = 'processing'        then p_has_physical
    when p_from = 'paid'                 and p_to = 'completed'         then not p_has_physical
    when p_from = 'processing'           and p_to = 'shipped'           then p_has_physical
    when p_from = 'processing'           and p_to = 'cancelled'         then p_method = 'cod'
    when p_from = 'shipped'              and p_to = 'delivered'         then true
    when p_from = 'delivered'            and p_to = 'completed'         then true
    when p_to = 'refunded' and p_from in ('paid', 'processing', 'shipped', 'delivered', 'completed') then true
    else false
  end;
end $$;

create function public.enforce_order_rules() returns trigger
language plpgsql as $$
begin
  -- Money and ownership are frozen once the order exists.
  if new.user_id <> old.user_id or new.subtotal_paise <> old.subtotal_paise
     or new.shipping_paise <> old.shipping_paise or new.total_paise <> old.total_paise
     or new.payment_method <> old.payment_method or new.has_physical <> old.has_physical then
    raise exception 'order money, owner and payment method are immutable' using errcode = '42501';
  end if;

  if new.status is distinct from old.status then
    if not public.order_transition_allowed(old.status, new.status, old.payment_method, old.has_physical) then
      raise exception 'invalid_order_transition: % -> %', old.status, new.status using errcode = 'P0001';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger orders_enforce_rules
  before update on public.orders
  for each row execute function public.enforce_order_rules();

create function public.order_after_status_change() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  r record;
begin
  insert into public.order_status_history (order_id, from_status, to_status, changed_by, note)
  values (new.id, old.status, new.status, auth.uid(), nullif(current_setting('app.order_note', true), ''));

  -- Return stock for physical goods that never left the building.
  if (new.status = 'cancelled')
     or (new.status = 'refunded' and old.status in ('paid', 'processing')) then
    perform set_config('app.inventory_internal', 'on', true);
    for r in
      select oi.product_id, oi.quantity
        from public.order_items oi
       where oi.order_id = new.id and oi.product_type = 'hardware'
       order by oi.product_id
    loop
      update public.inventory set quantity_on_hand = quantity_on_hand + r.quantity, updated_at = now()
       where product_id = r.product_id;
      insert into public.inventory_movements (product_id, delta, reason, order_id, created_by)
      values (r.product_id, r.quantity,
              case when new.status = 'cancelled' then 'order_cancelled' else 'order_refunded' end,
              new.id, auth.uid());
    end loop;
    perform set_config('app.inventory_internal', '', true);
  end if;
  return new;
end $$;

create trigger orders_after_status_change
  after update of status on public.orders
  for each row when (old.status is distinct from new.status)
  execute function public.order_after_status_change();

-- ============================================================ custom request state machine
create function public.enforce_request_rules() returns trigger
language plpgsql as $$
begin
  if new.user_id <> old.user_id then
    raise exception 'request owner is immutable' using errcode = '42501';
  end if;
  if new.status is distinct from old.status and not (
       (old.status = 'submitted'    and new.status in ('under_review', 'quoted', 'rejected', 'cancelled'))
    or (old.status = 'under_review' and new.status in ('quoted', 'rejected', 'cancelled'))
    or (old.status = 'quoted'       and new.status in ('accepted', 'under_review', 'rejected', 'cancelled'))
    or (old.status = 'accepted'     and new.status in ('in_progress', 'cancelled'))
    or (old.status = 'in_progress'  and new.status in ('completed', 'cancelled'))) then
    raise exception 'invalid_request_transition: % -> %', old.status, new.status using errcode = 'P0001';
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger requests_enforce_rules
  before update on public.custom_requests
  for each row execute function public.enforce_request_rules();

-- Runs as the table owner, so the customer needs no privilege on the sequence.
create function public.assign_request_number() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.request_number :=
    'CR' || to_char(now() at time zone 'Asia/Kolkata', 'YYMM')
         || lpad(nextval('public.request_number_seq')::text, 5, '0');
  return new;
end $$;

create trigger requests_assign_number
  before insert on public.custom_requests
  for each row execute function public.assign_request_number();

-- Sending a quote moves the request to "quoted".
create function public.quote_sent_updates_request() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  -- OLD does not exist on INSERT, so branch on the operation instead of using `or`.
  if new.status = 'sent' then
    if tg_op = 'UPDATE' and old.status = 'sent' then
      return new;
    end if;
    update public.custom_requests set status = 'quoted'
     where id = new.request_id and status in ('submitted', 'under_review');
  end if;
  return new;
end $$;

create trigger quotes_sent_updates_request
  after insert or update of status on public.request_quotes
  for each row execute function public.quote_sent_updates_request();

-- generic updated_at maintenance
create trigger touch_profiles   before update on public.profiles   for each row execute function public.touch_updated_at();
create trigger touch_branches   before update on public.branches   for each row execute function public.touch_updated_at();
create trigger touch_categories before update on public.categories for each row execute function public.touch_updated_at();
create trigger touch_products   before update on public.products   for each row execute function public.touch_updated_at();
create trigger touch_addresses  before update on public.addresses  for each row execute function public.touch_updated_at();
create trigger touch_payments   before update on public.payments   for each row execute function public.touch_updated_at();
create trigger touch_shipments  before update on public.shipments  for each row execute function public.touch_updated_at();

-- ============================================================ customer RPCs
create function public.has_download_access(p_product_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
      from public.order_items oi
      join public.orders   o on o.id = oi.order_id
      join public.payments p on p.order_id = o.id
     where oi.product_id = p_product_id
       and oi.product_type = 'digital'
       and o.user_id = auth.uid()
       and p.status = 'verified'
       and o.status not in ('cancelled', 'refunded')
  );
$$;

create function public.place_order(
  p_address_id uuid, p_method public.payment_method, p_notes text default null
) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid          uuid := auth.uid();
  v_order_id     uuid;
  v_subtotal     bigint;
  v_has_physical boolean;
  v_has_digital  boolean;
  v_shipping     int := 0;
  v_total        bigint;
  v_addr         jsonb;
  v_email        text;
  v_phone        text;
  v_flat         int;
  v_free_from    int;
  v_cod_max      int;
  r              record;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- Serialise concurrent submissions from the same customer.
  perform 1 from public.cart_items where user_id = v_uid for update;

  if not exists (select 1 from public.cart_items where user_id = v_uid) then
    raise exception 'cart_empty' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.cart_items ci join public.products p on p.id = ci.product_id
     where ci.user_id = v_uid and p.status <> 'published') then
    raise exception 'product_unavailable' using errcode = 'P0001';
  end if;

  -- Prices come from the products table only. Digital items are always quantity 1.
  select sum(p.price_paise::bigint * (case when p.product_type = 'digital' then 1 else ci.quantity end)),
         coalesce(bool_or(p.product_type = 'hardware'), false),
         coalesce(bool_or(p.product_type = 'digital'), false)
    into v_subtotal, v_has_physical, v_has_digital
    from public.cart_items ci join public.products p on p.id = ci.product_id
   where ci.user_id = v_uid;

  -- Do not sell the same download twice.
  for r in
    select p.id from public.cart_items ci join public.products p on p.id = ci.product_id
     where ci.user_id = v_uid and p.product_type = 'digital'
  loop
    if public.has_download_access(r.id) then
      raise exception 'already_purchased' using errcode = 'P0001';
    end if;
  end loop;

  select coalesce((select (value #>> '{}')::int from public.store_settings where key = 'shipping_flat_paise'), 0),
         coalesce((select (value #>> '{}')::int from public.store_settings where key = 'free_shipping_threshold_paise'), 0),
         coalesce((select (value #>> '{}')::int from public.store_settings where key = 'cod_max_total_paise'), 0)
    into v_flat, v_free_from, v_cod_max;

  if v_has_physical then
    select jsonb_build_object(
             'recipient_name', a.recipient_name, 'phone', a.phone, 'line1', a.line1, 'line2', a.line2,
             'landmark', a.landmark, 'city', a.city, 'state', a.state, 'pincode', a.pincode)
      into v_addr
      from public.addresses a where a.id = p_address_id and a.user_id = v_uid;
    if v_addr is null then
      raise exception 'address_required' using errcode = 'P0001';
    end if;
    v_shipping := case when v_subtotal >= v_free_from and v_free_from > 0 then 0 else v_flat end;
  end if;
  v_total := v_subtotal + v_shipping;

  if p_method = 'cod' then
    if v_has_digital then
      raise exception 'cod_not_available_for_digital' using errcode = 'P0001';
    end if;
    if exists (
      select 1 from public.cart_items ci join public.products p on p.id = ci.product_id
       where ci.user_id = v_uid and not p.cod_eligible) then
      raise exception 'cod_not_eligible' using errcode = 'P0001';
    end if;
    if v_total > v_cod_max then
      raise exception 'cod_limit_exceeded' using errcode = 'P0001';
    end if;
  end if;

  -- Reserve stock atomically; the WHERE clause makes overselling impossible.
  perform set_config('app.inventory_internal', 'on', true);
  for r in
    select ci.product_id, ci.quantity, p.title
      from public.cart_items ci join public.products p on p.id = ci.product_id
     where ci.user_id = v_uid and p.product_type = 'hardware'
     order by ci.product_id
  loop
    update public.inventory
       set quantity_on_hand = quantity_on_hand - r.quantity, updated_at = now()
     where product_id = r.product_id and quantity_on_hand >= r.quantity;
    if not found then
      raise exception 'insufficient_stock: %', r.title using errcode = 'P0001';
    end if;
  end loop;
  perform set_config('app.inventory_internal', '', true);

  select u.email into v_email from auth.users u where u.id = v_uid;
  select pr.phone into v_phone from public.profiles pr where pr.id = v_uid;

  insert into public.orders (user_id, status, payment_method, subtotal_paise, shipping_paise, total_paise,
                             has_physical, shipping_address, contact_email, contact_phone, customer_notes)
  values (v_uid, case when p_method = 'cod' then 'pending_confirmation' else 'pending_payment' end::public.order_status,
          p_method, v_subtotal, v_shipping, v_total, v_has_physical, v_addr, v_email, v_phone,
          nullif(btrim(p_notes), ''))
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, title_snapshot, product_type,
                                  unit_price_paise, quantity, line_total_paise)
  select v_order_id, p.id, p.title, p.product_type, p.price_paise,
         (case when p.product_type = 'digital' then 1 else ci.quantity end)::smallint,
         p.price_paise * (case when p.product_type = 'digital' then 1 else ci.quantity end)
    from public.cart_items ci join public.products p on p.id = ci.product_id
   where ci.user_id = v_uid;

  insert into public.inventory_movements (product_id, delta, reason, order_id, created_by)
  select oi.product_id, -oi.quantity, 'order_placed', v_order_id, v_uid
    from public.order_items oi where oi.order_id = v_order_id and oi.product_type = 'hardware';

  insert into public.order_status_history (order_id, from_status, to_status, changed_by)
  select id, null, status, v_uid from public.orders where id = v_order_id;

  if p_method = 'cod' then
    insert into public.payments (order_id, method, status, amount_paise)
    values (v_order_id, 'cod', 'pending', v_total);
  end if;

  delete from public.cart_items where user_id = v_uid;
  return v_order_id;
end $$;

-- The ONLY way a customer can touch a payment: submit a claim that staff must verify.
create function public.submit_payment_claim(
  p_order_id uuid, p_utr text, p_payer_name text, p_proof_path text default null
) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid   uuid := auth.uid();
  v_order public.orders%rowtype;
  v_id    uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_order from public.orders where id = p_order_id and user_id = v_uid for update;
  if not found then
    raise exception 'order_not_found' using errcode = 'P0001';
  end if;
  if v_order.payment_method = 'cod' or v_order.status <> 'pending_payment' then
    raise exception 'order_not_awaiting_payment' using errcode = 'P0001';
  end if;
  if p_utr is null or p_utr !~ '^[A-Za-z0-9]{6,30}$' then
    raise exception 'invalid_reference' using errcode = '22023';
  end if;
  if p_payer_name is null or char_length(btrim(p_payer_name)) not between 2 and 120 then
    raise exception 'invalid_payer_name' using errcode = '22023';
  end if;
  -- A proof file must live in the caller's own folder for this order.
  if p_proof_path is not null and p_proof_path not like (v_uid::text || '/' || p_order_id::text || '/%') then
    raise exception 'invalid_proof_path' using errcode = '22023';
  end if;

  begin
    insert into public.payments (order_id, method, status, amount_paise, utr_reference, payer_name,
                                 proof_path, submitted_at)
    values (p_order_id, v_order.payment_method, 'submitted', v_order.total_paise, p_utr,
            btrim(p_payer_name), p_proof_path, now())
    returning id into v_id;
  exception when unique_violation then
    raise exception 'reference_already_used' using errcode = 'P0001';
  end;

  update public.orders set status = 'payment_submitted' where id = p_order_id;
  return v_id;
end $$;

create function public.cancel_order(p_order_id uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_order public.orders%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select * into v_order from public.orders where id = p_order_id and user_id = auth.uid() for update;
  if not found then
    raise exception 'order_not_found' using errcode = 'P0001';
  end if;
  if v_order.status not in ('pending_payment', 'pending_confirmation') then
    raise exception 'order_not_cancellable' using errcode = 'P0001';
  end if;
  perform set_config('app.order_note', 'Cancelled by customer', true);
  update public.orders set status = 'cancelled' where id = p_order_id;
end $$;

create function public.respond_to_quote(p_quote_id uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_quote public.request_quotes%rowtype;
  v_req   public.custom_requests%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select q.* into v_quote from public.request_quotes q
    join public.custom_requests r on r.id = q.request_id
   where q.id = p_quote_id and r.user_id = auth.uid()
     and q.status <> 'draft'            -- drafts are invisible to customers, so they do not exist for this RPC either
     for update of q;
  if not found then
    raise exception 'quote_not_found' using errcode = 'P0001';
  end if;
  select * into v_req from public.custom_requests where id = v_quote.request_id for update;

  if v_quote.status <> 'sent' then
    raise exception 'quote_not_open' using errcode = 'P0001';
  end if;
  if v_quote.valid_until is not null and v_quote.valid_until < current_date then
    update public.request_quotes set status = 'expired', responded_at = now() where id = p_quote_id;
    return;   -- commit the expiry; the app reports the quote as expired
  end if;

  if p_accept then
    update public.request_quotes set status = 'accepted', responded_at = now() where id = p_quote_id;
    update public.request_quotes set status = 'declined', responded_at = now()
     where request_id = v_quote.request_id and id <> p_quote_id and status = 'sent';
    update public.custom_requests set status = 'accepted' where id = v_quote.request_id and status = 'quoted';
  else
    update public.request_quotes set status = 'declined', responded_at = now() where id = p_quote_id;
    update public.custom_requests set status = 'under_review'
     where id = v_quote.request_id and status = 'quoted'
       and not exists (select 1 from public.request_quotes q2
                        where q2.request_id = v_quote.request_id and q2.status = 'sent');
  end if;
end $$;

create function public.approve_milestone(p_milestone_id uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  update public.request_milestones m
     set status = 'approved', approved_at = now()
    from public.custom_requests r
   where m.id = p_milestone_id and r.id = m.request_id and r.user_id = auth.uid()
     and m.status = 'submitted';
  if not found then
    raise exception 'milestone_not_approvable' using errcode = 'P0001';
  end if;
end $$;

create function public.cancel_custom_request(p_request_id uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  update public.custom_requests set status = 'cancelled'
   where id = p_request_id and user_id = auth.uid() and status in ('submitted', 'under_review', 'quoted');
  if not found then
    raise exception 'request_not_cancellable' using errcode = 'P0001';
  end if;
end $$;

-- ============================================================ admin RPCs
create function public.admin_verify_payment(p_payment_id uuid, p_received_paise int, p_note text default null)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_pay   public.payments%rowtype;
  v_order public.orders%rowtype;
begin
  perform public.require_admin();

  select * into v_pay from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'payment_not_found' using errcode = 'P0001';
  end if;
  select * into v_order from public.orders where id = v_pay.order_id for update;

  if p_received_paise is distinct from v_order.total_paise then
    raise exception 'amount_mismatch' using errcode = 'P0001';
  end if;

  if v_pay.method = 'cod' then
    -- Cash is collected at the door, so the order must already be delivered.
    if v_pay.status <> 'pending' or v_order.status <> 'delivered' then
      raise exception 'cod_not_ready_for_verification' using errcode = 'P0001';
    end if;
  elsif v_pay.status <> 'submitted' or v_order.status <> 'payment_submitted' then
    raise exception 'payment_not_awaiting_verification' using errcode = 'P0001';
  end if;

  update public.payments set status = 'verified', verified_by = auth.uid(), verified_at = now()
   where id = p_payment_id;

  if v_pay.method <> 'cod' then
    perform set_config('app.order_note', coalesce(nullif(btrim(p_note), ''), 'Payment verified by staff'), true);
    update public.orders set status = 'paid' where id = v_order.id;
    if not v_order.has_physical then
      perform set_config('app.order_note', 'Digital order fulfilled', true);
      update public.orders set status = 'completed' where id = v_order.id;
    end if;
  end if;
end $$;

create function public.admin_reject_payment(p_payment_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_pay public.payments%rowtype;
begin
  perform public.require_admin();
  if p_reason is null or char_length(btrim(p_reason)) not between 3 and 300 then
    raise exception 'reason_required' using errcode = '22023';
  end if;

  select * into v_pay from public.payments where id = p_payment_id for update;
  if not found or v_pay.status <> 'submitted' then
    raise exception 'payment_not_awaiting_verification' using errcode = 'P0001';
  end if;

  update public.payments set status = 'rejected', rejection_reason = btrim(p_reason) where id = p_payment_id;
  perform set_config('app.order_note', 'Payment rejected: ' || btrim(p_reason), true);
  update public.orders set status = 'pending_payment' where id = v_pay.order_id;
end $$;

create function public.admin_set_order_status(p_order_id uuid, p_status public.order_status, p_note text default null)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.require_admin();
  if p_status in ('paid', 'payment_submitted') then
    raise exception 'use_payment_workflow' using errcode = 'P0001';
  end if;
  perform 1 from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found' using errcode = 'P0001';
  end if;

  perform set_config('app.order_note', nullif(btrim(p_note), ''), true);
  update public.orders set status = p_status where id = p_order_id;

  if p_status = 'refunded' then
    update public.payments set status = 'refunded' where order_id = p_order_id and status = 'verified';
  end if;
end $$;

create function public.admin_upsert_shipment(
  p_order_id uuid, p_status public.shipment_status,
  p_carrier text default null, p_tracking_number text default null, p_tracking_url text default null
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_order public.orders%rowtype;
begin
  perform public.require_admin();
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or not v_order.has_physical then
    raise exception 'order_has_no_shipment' using errcode = 'P0001';
  end if;
  if v_order.status not in ('processing', 'shipped', 'delivered') then
    raise exception 'order_not_ready_to_ship' using errcode = 'P0001';
  end if;

  insert into public.shipments (order_id, status, carrier, tracking_number, tracking_url,
                                shipped_at, delivered_at)
  values (p_order_id, p_status, nullif(btrim(p_carrier), ''), nullif(btrim(p_tracking_number), ''),
          nullif(btrim(p_tracking_url), ''),
          case when p_status <> 'preparing' then now() end,
          case when p_status = 'delivered' then now() end)
  on conflict (order_id) do update
     set status = excluded.status,
         carrier = coalesce(excluded.carrier, public.shipments.carrier),
         tracking_number = coalesce(excluded.tracking_number, public.shipments.tracking_number),
         tracking_url = coalesce(excluded.tracking_url, public.shipments.tracking_url),
         shipped_at = coalesce(public.shipments.shipped_at, excluded.shipped_at),
         delivered_at = coalesce(public.shipments.delivered_at, excluded.delivered_at);

  -- Keep the order status in step with the shipment.
  if p_status in ('shipped', 'in_transit', 'out_for_delivery', 'delivered') and v_order.status = 'processing' then
    perform set_config('app.order_note', 'Shipment dispatched', true);
    update public.orders set status = 'shipped' where id = p_order_id;
    v_order.status := 'shipped';
  end if;
  if p_status = 'delivered' and v_order.status = 'shipped' then
    perform set_config('app.order_note', 'Shipment delivered', true);
    update public.orders set status = 'delivered' where id = p_order_id;
  end if;
end $$;

create function public.admin_adjust_stock(p_product_id uuid, p_delta int, p_reason text, p_note text default null)
returns int
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_qty int;
begin
  perform public.require_admin();
  if p_delta = 0 or p_reason not in ('restock', 'manual_adjustment', 'correction') then
    raise exception 'invalid_adjustment' using errcode = '22023';
  end if;

  perform set_config('app.inventory_internal', 'on', true);
  update public.inventory set quantity_on_hand = quantity_on_hand + p_delta, updated_at = now()
   where product_id = p_product_id returning quantity_on_hand into v_qty;
  perform set_config('app.inventory_internal', '', true);
  -- (PERFORM resets FOUND, so test the returned value instead.) A negative result
  -- is rejected by the CHECK (quantity_on_hand >= 0) constraint itself.
  if v_qty is null then
    raise exception 'inventory_row_missing' using errcode = 'P0001';
  end if;

  insert into public.inventory_movements (product_id, delta, reason, note, created_by)
  values (p_product_id, p_delta, p_reason, nullif(btrim(p_note), ''), auth.uid());
  return v_qty;
end $$;

create function public.admin_mark_milestone_paid(p_milestone_id uuid, p_reference text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.require_admin();
  if p_reference is null or char_length(btrim(p_reference)) not between 3 and 60 then
    raise exception 'reference_required' using errcode = '22023';
  end if;
  update public.request_milestones
     set is_paid = true, paid_reference = btrim(p_reference), paid_marked_by = auth.uid(), paid_marked_at = now()
   where id = p_milestone_id and not is_paid;
  if not found then
    raise exception 'milestone_not_found_or_already_paid' using errcode = 'P0001';
  end if;
end $$;
