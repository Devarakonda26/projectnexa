-- Richer product pages: sample/demo flag, SKU, content lists, FAQ, extra gallery images,
-- and "quote only" listings (custom services) that can never be put in a cart.

alter table public.products
  add column is_sample             boolean not null default false,
  add column is_quote_only         boolean not null default false,
  add column sku                   text check (sku is null or sku ~ '^[A-Z0-9][A-Z0-9-]{2,39}$'),
  add column subdomain             text check (subdomain is null or char_length(subdomain) <= 80),
  add column estimated_time        text check (estimated_time is null or char_length(estimated_time) <= 60),
  add column features              text[] not null default '{}' check (cardinality(features) <= 20),
  add column deliverables          text[] not null default '{}' check (cardinality(deliverables) <= 20),
  add column software_requirements text[] not null default '{}' check (cardinality(software_requirements) <= 20),
  add column hardware_requirements text[] not null default '{}' check (cardinality(hardware_requirements) <= 20),
  add column faq                   jsonb  not null default '[]'::jsonb check (jsonb_typeof(faq) = 'array' and jsonb_array_length(faq) <= 12),
  add column gallery_paths         text[] not null default '{}' check (cardinality(gallery_paths) <= 8);

create unique index products_sku_key on public.products (sku) where sku is not null;
create index products_sample_idx on public.products (is_sample) where is_sample;

-- Quote-only listings are requests for a service, not something you can buy off the shelf.
drop policy cart_owner_insert on public.cart_items;
create policy cart_owner_insert on public.cart_items for insert to authenticated
  with check (user_id = (select auth.uid())
              and exists (select 1 from public.products p
                           where p.id = product_id and p.status = 'published' and not p.is_quote_only));

-- The database also refuses to place an order for one (defence in depth for old carts).
create function public.reject_quote_only_in_order() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if exists (select 1 from public.products p where p.id = new.product_id and p.is_quote_only) then
    raise exception 'product_unavailable' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger order_items_no_quote_only
  before insert on public.order_items
  for each row execute function public.reject_quote_only_in_order();
revoke all on function public.reject_quote_only_in_order() from public, anon, authenticated;
