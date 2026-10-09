-- ProjectNexa migration 5/6: least-privilege grants and Row Level Security.
--
-- Model
--   anon           : may read the public catalogue only.
--   authenticated  : a signed-in user. Admins are ordinary `authenticated` users whose profiles.role = 'admin';
--                    every admin capability is gated by RLS (is_admin()) or an RPC that calls require_admin().
--   service_role   : server-only key, bypasses RLS. Used just for signing storage URLs and similar chores.
-- RLS is enabled on EVERY table. A table without a matching policy is unreadable.

-- ------------------------------------------------------------ start from zero
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

-- ------------------------------------------------------------ enable RLS everywhere
alter table public.profiles              enable row level security;
alter table public.branches              enable row level security;
alter table public.categories            enable row level security;
alter table public.products              enable row level security;
alter table public.product_files         enable row level security;
alter table public.inventory             enable row level security;
alter table public.inventory_movements   enable row level security;
alter table public.addresses             enable row level security;
alter table public.cart_items            enable row level security;
alter table public.store_settings        enable row level security;
alter table public.orders                enable row level security;
alter table public.order_items           enable row level security;
alter table public.payments              enable row level security;
alter table public.shipments             enable row level security;
alter table public.order_status_history  enable row level security;
alter table public.audit_log             enable row level security;
alter table public.custom_requests       enable row level security;
alter table public.request_admin_notes   enable row level security;
alter table public.request_attachments   enable row level security;
alter table public.request_quotes        enable row level security;
alter table public.request_milestones    enable row level security;

-- ------------------------------------------------------------ public catalogue (anon + authenticated)
grant select on public.branches, public.categories, public.products, public.store_settings to anon, authenticated;

create policy branches_public_read   on public.branches   for select to anon, authenticated using (is_active or public.is_admin());
create policy categories_public_read on public.categories for select to anon, authenticated using (is_active or public.is_admin());
create policy products_public_read   on public.products   for select to anon, authenticated using (status = 'published' or public.is_admin());
create policy settings_public_read   on public.store_settings for select to anon, authenticated using (true);

-- Exact stock counts are private. Shoppers only see in-stock / low-stock flags through this view.
-- (The view runs with its owner's rights on purpose so it can read `inventory`; it exposes booleans only.)
create view public.public_stock_status as
  select p.id as product_id,
         (i.quantity_on_hand > 0) as in_stock,
         (i.quantity_on_hand > 0 and i.quantity_on_hand <= i.low_stock_threshold) as low_stock
    from public.products p
    join public.inventory i on i.product_id = p.id
   where p.status = 'published';
grant select on public.public_stock_status to anon, authenticated;

-- ------------------------------------------------------------ admin catalogue management
grant insert, update, delete on public.branches, public.categories, public.products, public.product_files to authenticated;
grant insert, update, delete on public.inventory to authenticated;
grant select on public.inventory, public.inventory_movements, public.product_files to authenticated;
grant insert, update on public.store_settings to authenticated;

create policy branches_admin_write   on public.branches   for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy categories_admin_write on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy products_admin_write   on public.products   for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy settings_admin_write   on public.store_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy inventory_admin_all    on public.inventory  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy movements_admin_read   on public.inventory_movements for select to authenticated using (public.is_admin());

-- Download rows are visible to staff, or to a customer whose payment for that product is VERIFIED.
create policy product_files_read on public.product_files for select to authenticated
  using (public.is_admin() or public.has_download_access(product_id));
create policy product_files_admin_write on public.product_files for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------ profiles
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;   -- `role` is deliberately not updatable

create policy profiles_read_own   on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_read_admin on public.profiles for select to authenticated using (public.is_admin());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ------------------------------------------------------------ addresses & cart (owner only)
grant select, insert, update, delete on public.addresses to authenticated;
create policy addresses_owner on public.addresses for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy addresses_admin_read on public.addresses for select to authenticated using (public.is_admin());

grant select, insert, update (quantity), delete on public.cart_items to authenticated;
create policy cart_owner_read   on public.cart_items for select to authenticated using (user_id = (select auth.uid()));
create policy cart_owner_delete on public.cart_items for delete to authenticated using (user_id = (select auth.uid()));
create policy cart_owner_insert on public.cart_items for insert to authenticated
  with check (user_id = (select auth.uid())
              and exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));
create policy cart_owner_update on public.cart_items for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ------------------------------------------------------------ orders & payments: READ ONLY for everyone
-- All writes happen through the SECURITY DEFINER RPCs in migration 4.
grant select on public.orders, public.order_items, public.payments, public.shipments, public.order_status_history
  to authenticated;

create policy orders_read_own   on public.orders for select to authenticated using (user_id = (select auth.uid()));
create policy orders_read_admin on public.orders for select to authenticated using (public.is_admin());

create policy order_items_read on public.order_items for select to authenticated
  using (public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
create policy payments_read on public.payments for select to authenticated
  using (public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
create policy shipments_read on public.shipments for select to authenticated
  using (public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
create policy history_read on public.order_status_history for select to authenticated
  using (public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));

-- ------------------------------------------------------------ audit log: staff read only
grant select on public.audit_log to authenticated;
create policy audit_admin_read on public.audit_log for select to authenticated using (public.is_admin());

-- ------------------------------------------------------------ custom requests
grant select, insert on public.custom_requests to authenticated;
grant update on public.custom_requests to authenticated;     -- RLS limits UPDATE to staff
create policy requests_read_own   on public.custom_requests for select to authenticated using (user_id = (select auth.uid()));
create policy requests_read_admin on public.custom_requests for select to authenticated using (public.is_admin());
create policy requests_insert_own on public.custom_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'submitted');
create policy requests_admin_update on public.custom_requests for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.request_admin_notes to authenticated;
create policy request_notes_admin on public.request_admin_notes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select, insert on public.request_attachments to authenticated;
create policy attachments_read on public.request_attachments for select to authenticated
  using (public.is_admin() or exists (select 1 from public.custom_requests r where r.id = request_id and r.user_id = (select auth.uid())));
create policy attachments_insert_own on public.request_attachments for insert to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and storage_path like ((select auth.uid())::text || '/' || request_id::text || '/%')
    and exists (select 1 from public.custom_requests r
                 where r.id = request_id and r.user_id = (select auth.uid())
                   and r.status in ('submitted', 'under_review', 'quoted', 'accepted', 'in_progress')));

grant select, insert, update, delete on public.request_quotes to authenticated;
create policy quotes_read_own on public.request_quotes for select to authenticated
  using (status <> 'draft' and exists (select 1 from public.custom_requests r where r.id = request_id and r.user_id = (select auth.uid())));
create policy quotes_admin_all on public.request_quotes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.request_milestones to authenticated;
create policy milestones_read_own on public.request_milestones for select to authenticated
  using (exists (select 1 from public.custom_requests r where r.id = request_id and r.user_id = (select auth.uid())));
create policy milestones_admin_all on public.request_milestones for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------ function execute rights
-- Nothing below is callable by `anon`. Admin RPCs are callable by signed-in users but reject non-admins inside.
grant execute on function public.is_admin()                                        to anon, authenticated;
grant execute on function public.has_download_access(uuid)                         to authenticated;
grant execute on function public.place_order(uuid, public.payment_method, text)    to authenticated;
grant execute on function public.submit_payment_claim(uuid, text, text, text)      to authenticated;
grant execute on function public.cancel_order(uuid)                                to authenticated;
grant execute on function public.respond_to_quote(uuid, boolean)                   to authenticated;
grant execute on function public.approve_milestone(uuid)                           to authenticated;
grant execute on function public.cancel_custom_request(uuid)                       to authenticated;
grant execute on function public.admin_verify_payment(uuid, int, text)             to authenticated;
grant execute on function public.admin_reject_payment(uuid, text)                  to authenticated;
grant execute on function public.admin_set_order_status(uuid, public.order_status, text) to authenticated;
grant execute on function public.admin_upsert_shipment(uuid, public.shipment_status, text, text, text) to authenticated;
grant execute on function public.admin_adjust_stock(uuid, int, text, text)         to authenticated;
grant execute on function public.admin_mark_milestone_paid(uuid, text)             to authenticated;
-- RLS policies call is_admin()/has_download_access(), so those two must stay executable for the roles that run policies.
-- Trigger functions and require_admin() keep no direct grants: triggers run as the table owner.
