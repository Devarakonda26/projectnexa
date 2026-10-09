-- ProjectNexa migration 2/6: orders, items, payments, shipments, history, audit log.

create sequence public.order_number_seq   start 1001;
create sequence public.request_number_seq start 1001;

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique default (
                     'NX' || to_char(now() at time zone 'Asia/Kolkata', 'YYMM')
                          || lpad(nextval('public.order_number_seq')::text, 6, '0')),
  user_id          uuid not null references public.profiles (id) on delete restrict,
  status           public.order_status not null,
  payment_method   public.payment_method not null,
  subtotal_paise   int not null check (subtotal_paise >= 0),
  shipping_paise   int not null default 0 check (shipping_paise >= 0),
  total_paise      int not null check (total_paise >= 0),
  has_physical     boolean not null,
  shipping_address jsonb,        -- snapshot, so later address edits never rewrite history
  contact_email    text,
  contact_phone    text,
  customer_notes   text check (char_length(customer_notes) <= 500),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint orders_total_matches          check (total_paise = subtotal_paise + shipping_paise),
  constraint orders_physical_needs_address check (not has_physical or shipping_address is not null),
  constraint orders_cod_physical_only      check (payment_method <> 'cod' or has_physical)
);
create index orders_user_idx   on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);

create table public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  product_id       uuid not null references public.products (id) on delete restrict,
  title_snapshot   text not null,
  product_type     public.product_type not null,
  unit_price_paise int not null check (unit_price_paise >= 0),
  quantity         smallint not null check (quantity between 1 and 10),
  line_total_paise int not null,
  constraint order_items_line_total check (line_total_paise = unit_price_paise * quantity),
  unique (order_id, product_id)
);
create index order_items_product_idx on public.order_items (product_id);

-- A payment row is a CLAIM until staff verify it. Customers can never write this table directly.
create table public.payments (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id) on delete restrict,
  method            public.payment_method not null,
  status            public.payment_status not null default 'submitted',
  amount_paise      int not null check (amount_paise >= 0),  -- always copied from the order total, never from the customer
  utr_reference     text check (utr_reference ~ '^[A-Za-z0-9]{6,30}$'),
  payer_name        text check (char_length(payer_name) between 2 and 120),
  proof_path        text,
  submitted_at      timestamptz,
  verified_by       uuid references public.profiles (id) on delete set null,
  verified_at       timestamptz,
  rejection_reason  text check (char_length(rejection_reason) between 3 and 300),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint payments_verified_has_actor check (status <> 'verified' or (verified_at is not null)),
  constraint payments_claim_has_reference check (method = 'cod' or utr_reference is not null),
  constraint payments_rejected_has_reason check (status <> 'rejected' or rejection_reason is not null)
);
create index payments_order_idx on public.payments (order_id);
-- At most one live (submitted or verified) payment per order ...
create unique index payments_one_live_per_order on public.payments (order_id) where status in ('submitted', 'verified');
-- ... and a transaction reference can back only one live payment across the whole store.
create unique index payments_utr_unique_live on public.payments (lower(utr_reference))
  where status in ('submitted', 'verified') and utr_reference is not null;

create table public.shipments (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null unique references public.orders (id) on delete cascade,
  status           public.shipment_status not null default 'preparing',
  carrier          text check (char_length(carrier) <= 80),
  tracking_number  text check (char_length(tracking_number) <= 80),
  tracking_url     text check (tracking_url is null or tracking_url ~ '^https?://'),
  shipped_at       timestamptz,
  delivered_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.order_status_history (
  id           bigint generated always as identity primary key,
  order_id     uuid not null references public.orders (id) on delete cascade,
  from_status  public.order_status,
  to_status    public.order_status not null,
  changed_by   uuid,
  note         text check (char_length(note) <= 300),
  created_at   timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history (order_id, created_at);

-- Append-only record of sensitive changes. Written by triggers; never by clients.
create table public.audit_log (
  id           bigint generated always as identity primary key,
  actor_id     uuid,
  actor_role   text,
  action       text not null,
  entity_type  text not null,
  entity_id    text,
  details      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity_type, entity_id, created_at desc);
create index audit_log_actor_idx  on public.audit_log (actor_id, created_at desc);
