-- The storefront search query (PostgREST textSearch => to_tsquery('simple', ...)) works for anonymous visitors
-- and only ever returns published products.
begin;

do $$
declare
  v_hits int; v_draft uuid;
begin
  perform test.as_postgres();
  insert into public.products (slug, title, summary, product_type, status, branch_id, price_paise)
    select 'secret-draft-weather', 'Secret weather draft', 'A draft that must never be visible to shoppers',
           'digital', 'draft', id, 10000 from public.branches limit 1
    returning id into v_draft;

  perform test.as_anon();
  select count(*) into v_hits from public.products where search_vector @@ to_tsquery('simple', 'weath:*');
  perform test.assert(v_hits >= 1, 'prefix search finds published weather products');
  perform test.assert(not exists (select 1 from public.products where id = v_draft), 'anon cannot see the draft product');
  perform test.assert(test.count('select 1 from public.products where search_vector @@ to_tsquery(''simple'', ''secret:*'')') = 0,
                      'draft not reachable via search');

  select count(*) into v_hits from public.products where search_vector @@ to_tsquery('simple', 'esp32:* & kit:*');
  perform test.assert(v_hits >= 1, 'multi-term AND prefix search works');

  perform test.assert(test.count('select 1 from public.products where search_vector @@ to_tsquery(''simple'', ''zzzzqq:*'')') = 0,
                      'no false positives');

  -- stock flags are booleans only; no exact quantities exposed
  perform test.assert(test.count('select 1 from public.public_stock_status') >= 1, 'stock status readable by anon');
  perform test.assert((select count(*) from information_schema.columns
                        where table_schema = 'public' and table_name = 'public_stock_status' and column_name ilike '%quantity%') = 0,
                      'stock view exposes no quantity column');
end $$;

rollback;
do $$ begin raise notice 'PASS t_09: catalogue search'; end $$;
