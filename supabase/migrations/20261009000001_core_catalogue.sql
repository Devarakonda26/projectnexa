-- ProjectNexa migration 1/6: enums, profiles, catalogue, inventory, addresses, cart, settings.
-- All money is stored as integer paise (1 INR = 100 paise). Currency is INR only.

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------- enums
create type public.user_role        as enum ('customer', 'admin');
create type public.product_type     as enum ('digital', 'hardware');
create type public.product_status   as enum ('draft', 'published', 'archived');
create type public.difficulty_level as enum ('beginner', 'intermediate', 'advanced');

create type public.order_status as enum (
  'pending_payment',       -- UPI / bank transfer: waiting for customer to pay and submit a reference
  'pending_confirmation',  -- COD: waiting for staff to confirm the order
  'payment_submitted',     -- customer submitted a reference; waiting for staff to verify
  'paid',                  -- staff verified the money arrived
  'processing',            -- being prepared / packed
  'shipped',
  'delivered',
  'completed',
  'cancelled',
  'refunded'
);
create type public.payment_method   as enum ('upi', 'bank_transfer', 'cod');
create type public.payment_status   as enum ('pending', 'submitted', 'verified', 'rejected', 'refunded');
create type public.shipment_status  as enum ('preparing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'returned');
create type public.request_status   as enum ('submitted', 'under_review', 'quoted', 'accepted', 'in_progress', 'completed', 'rejected', 'cancelled');
create type public.quote_status     as enum ('draft', 'sent', 'accepted', 'declined', 'expired');
create type public.milestone_status as enum ('pending', 'in_progress', 'submitted', 'approved');

-- ---------------------------------------------------------------- profiles
-- One row per auth user. `role` can only be changed from SQL / service role
-- (enforced by a trigger and by column-level grants; see later migrations).
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (char_length(full_name) between 1 and 120),
  phone       text check (phone ~ '^[6-9][0-9]{9}$'),
  role        public.user_role not null default 'customer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- catalogue
create table public.branches (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name         text not null check (char_length(name) between 2 and 80),
  short_name   text not null check (char_length(short_name) between 2 and 20),
  description  text check (char_length(description) <= 500),
  sort_order   int  not null default 100,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- A "category" is a domain inside a branch (e.g. IoT inside ECE).
create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  branch_id    uuid not null references public.branches (id) on delete restrict,
  slug         text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name         text not null check (char_length(name) between 2 and 80),
  description  text check (char_length(description) <= 500),
  sort_order   int  not null default 100,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (branch_id, slug)
);

create table public.products (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title            text not null check (char_length(title) between 3 and 160),
  summary          text not null check (char_length(summary) between 10 and 300),
  description      text not null default '' check (char_length(description) <= 20000),
  product_type     public.product_type not null,
  status           public.product_status not null default 'draft',
  branch_id        uuid not null references public.branches (id) on delete restrict,
  category_id      uuid references public.categories (id) on delete restrict,
  price_paise      int not null check (price_paise between 0 and 100000000),
  mrp_paise        int check (mrp_paise is null or mrp_paise >= price_paise),
  difficulty       public.difficulty_level,
  tech_stack       text[] not null default '{}' check (cardinality(tech_stack) <= 30),
  tags             text[] not null default '{}' check (cardinality(tags) <= 30),
  cover_image_path text,
  weight_grams     int check (weight_grams is null or weight_grams > 0),
  cod_eligible     boolean not null default false,
  is_featured      boolean not null default false,
  search_vector    tsvector,
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint products_cod_hardware_only check (not cod_eligible or product_type = 'hardware')
);
create index products_search_idx   on public.products using gin (search_vector);
create index products_title_trgm   on public.products using gin (title extensions.gin_trgm_ops);
create index products_listing_idx  on public.products (status, branch_id, category_id);
create index products_featured_idx on public.products (is_featured) where status = 'published';
create index products_price_idx    on public.products (price_paise);

-- Downloadable files for digital products. Bytes live in a PRIVATE storage bucket.
create table public.product_files (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete cascade,
  storage_path  text not null unique,
  file_name     text not null check (char_length(file_name) between 1 and 200),
  size_bytes    bigint not null check (size_bytes > 0),
  content_type  text not null,
  version       int not null default 1 check (version > 0),
  created_at    timestamptz not null default now()
);
create index product_files_product_idx on public.product_files (product_id);

-- ---------------------------------------------------------------- inventory
create table public.inventory (
  product_id           uuid primary key references public.products (id) on delete cascade,
  quantity_on_hand     int not null default 0 check (quantity_on_hand >= 0),
  low_stock_threshold  int not null default 5 check (low_stock_threshold >= 0),
  updated_at           timestamptz not null default now()
);

create table public.inventory_movements (
  id          bigint generated always as identity primary key,
  product_id  uuid not null references public.products (id) on delete cascade,
  delta       int not null check (delta <> 0),
  reason      text not null check (reason in
                ('order_placed', 'order_cancelled', 'order_refunded', 'restock', 'manual_adjustment', 'correction')),
  order_id    uuid,
  note        text check (char_length(note) <= 300),
  created_by  uuid,
  created_at  timestamptz not null default now()
);
create index inventory_movements_product_idx on public.inventory_movements (product_id, created_at desc);

-- ---------------------------------------------------------------- addresses & cart
create table public.addresses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  label           text not null default 'Home' check (char_length(label) between 1 and 30),
  recipient_name  text not null check (char_length(recipient_name) between 2 and 120),
  phone           text not null check (phone ~ '^[6-9][0-9]{9}$'),
  line1           text not null check (char_length(line1) between 3 and 200),
  line2           text check (char_length(line2) <= 200),
  landmark        text check (char_length(landmark) <= 120),
  city            text not null check (char_length(city) between 2 and 80),
  state           text not null check (char_length(state) between 2 and 60),
  pincode         text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  is_default      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id);
create unique index addresses_one_default_idx on public.addresses (user_id) where is_default;

-- Server-side cart for signed-in customers (guests must sign in to add to cart).
create table public.cart_items (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  quantity    smallint not null default 1 check (quantity between 1 and 10),
  created_at  timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ---------------------------------------------------------------- store settings
create table public.store_settings (
  key          text primary key check (key ~ '^[a-z0-9_]+$'),
  value        jsonb not null,
  description  text,
  updated_at   timestamptz not null default now(),
  updated_by   uuid
);

insert into public.store_settings (key, value, description) values
  ('shipping_flat_paise',            '6000'::jsonb,   'Flat shipping fee for physical orders (paise)'),
  ('free_shipping_threshold_paise',  '99900'::jsonb,  'Physical-order subtotal at or above which shipping is free (paise)'),
  ('cod_max_total_paise',            '500000'::jsonb, 'Largest order total eligible for cash on delivery (paise)');
