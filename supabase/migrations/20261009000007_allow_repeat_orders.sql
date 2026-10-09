-- Allow customers to order the same item (including digital projects) more than once.
-- Replaces place_order() without the "already_purchased" guard. Grants are kept by CREATE OR REPLACE.

create or replace function public.place_order(
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

  -- Repeat purchases of the same project are allowed (customers may buy it again).

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
