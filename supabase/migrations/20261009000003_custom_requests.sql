-- ProjectNexa migration 3/6: custom engineering project requests, quotes, milestones.

create table public.custom_requests (
  id               uuid primary key default gen_random_uuid(),
  -- Assigned by the assign_request_number() trigger (customers have no right to the sequence).
  request_number   text not null unique,
  user_id          uuid not null references public.profiles (id) on delete restrict,
  title            text not null check (char_length(title) between 5 and 160),
  branch_id        uuid not null references public.branches (id) on delete restrict,
  description      text not null check (char_length(description) between 30 and 5000),
  requirements     text check (char_length(requirements) <= 5000),
  budget_min_paise int check (budget_min_paise is null or budget_min_paise >= 0),
  budget_max_paise int check (budget_max_paise is null or budget_max_paise >= 0),
  deadline         date,
  status           public.request_status not null default 'submitted',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint custom_requests_budget_order check (
    budget_min_paise is null or budget_max_paise is null or budget_min_paise <= budget_max_paise)
);
create index custom_requests_user_idx   on public.custom_requests (user_id, created_at desc);
create index custom_requests_status_idx on public.custom_requests (status, created_at desc);

-- Staff-only notes, kept in their own table so a customer SELECT on the request can never expose them.
create table public.request_admin_notes (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.custom_requests (id) on delete cascade,
  author_id   uuid,
  note        text not null check (char_length(note) between 1 and 2000),
  created_at  timestamptz not null default now()
);

create table public.request_attachments (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid not null references public.custom_requests (id) on delete cascade,
  uploaded_by   uuid not null,
  storage_path  text not null unique,
  file_name     text not null check (char_length(file_name) between 1 and 200),
  size_bytes    bigint not null check (size_bytes > 0 and size_bytes <= 20971520),   -- 20 MB
  content_type  text not null check (content_type in (
                  'application/pdf', 'image/png', 'image/jpeg', 'image/webp',
                  'application/zip', 'application/x-zip-compressed', 'text/plain',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
  created_at    timestamptz not null default now()
);
create index request_attachments_request_idx on public.request_attachments (request_id);

create table public.request_quotes (
  id             uuid primary key default gen_random_uuid(),
  request_id     uuid not null references public.custom_requests (id) on delete cascade,
  amount_paise   int not null check (amount_paise > 0 and amount_paise <= 100000000),
  scope          text not null check (char_length(scope) between 10 and 5000),
  delivery_days  int check (delivery_days is null or delivery_days between 1 and 365),
  valid_until    date,
  status         public.quote_status not null default 'draft',
  created_by     uuid,
  created_at     timestamptz not null default now(),
  responded_at   timestamptz
);
create index request_quotes_request_idx on public.request_quotes (request_id);
create unique index request_quotes_one_accepted on public.request_quotes (request_id) where status = 'accepted';

create table public.request_milestones (
  id               uuid primary key default gen_random_uuid(),
  request_id       uuid not null references public.custom_requests (id) on delete cascade,
  title            text not null check (char_length(title) between 3 and 160),
  description      text check (char_length(description) <= 2000),
  amount_paise     int not null default 0 check (amount_paise >= 0),
  due_date         date,
  status           public.milestone_status not null default 'pending',
  sort_order       int not null default 100,
  submitted_at     timestamptz,
  approved_at      timestamptz,
  -- Milestone payments are verified OFFLINE by staff against the bank statement, then recorded here.
  is_paid          boolean not null default false,
  paid_reference   text check (char_length(paid_reference) <= 60),
  paid_marked_by   uuid,
  paid_marked_at   timestamptz,
  created_at       timestamptz not null default now(),
  constraint milestones_paid_has_reference check (not is_paid or paid_reference is not null)
);
create index request_milestones_request_idx on public.request_milestones (request_id, sort_order);
