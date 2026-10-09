-- The database order state machine must match tests/golden/order-transitions.json exactly.
-- (order-status.test.ts checks the TypeScript copy against the same file.)
\set golden `cat tests/golden/order-transitions.json`
begin;
-- psql does not interpolate inside $$ bodies, so hand the JSON over as a session setting.
select set_config('test.golden', :'golden', false);
do $$
declare
  v_golden jsonb := current_setting('test.golden')::jsonb;
  v_actual jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('from', f, 'to', t, 'method', m, 'physical', p) order by f, t, m, p), '[]'::jsonb)
    into v_actual
    from unnest(enum_range(null::public.order_status)) f,
         unnest(enum_range(null::public.order_status)) t,
         unnest(enum_range(null::public.payment_method)) m,
         (values (true), (false)) v(p)
   where public.order_transition_allowed(f, t, m, p);

  -- jsonb arrays compare element by element, so order matters; both sides are sorted the same way.
  perform test.assert(v_actual = v_golden,
    'order_transition_allowed() no longer matches tests/golden/order-transitions.json. '
    || 'If the change is intentional, regenerate the golden file and update src/lib/orders/status.ts.');

  -- terminal states have no way out except refund
  perform test.assert(not exists (select 1 from jsonb_array_elements(v_golden) e where e ->> 'from' = 'cancelled'), 'cancelled is terminal');
  perform test.assert(not exists (select 1 from jsonb_array_elements(v_golden) e where e ->> 'from' = 'refunded'), 'refunded is terminal');
  -- nothing may reach "paid" except through payment verification of a non-COD order
  perform test.assert(not exists (select 1 from jsonb_array_elements(v_golden) e where e ->> 'to' = 'paid' and e ->> 'method' = 'cod'), 'COD orders never become "paid"');
  perform test.assert(not exists (select 1 from jsonb_array_elements(v_golden) e where e ->> 'to' = 'paid' and e ->> 'from' <> 'payment_submitted'), '"paid" is reachable only from payment_submitted');
  raise notice 'PASS t_08: order transitions match the golden file (% tuples)', jsonb_array_length(v_golden);
end $$;
rollback;
