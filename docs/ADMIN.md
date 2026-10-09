# Operating the store

## Create the first admin

Admin rights live in `profiles.role`. They cannot be granted from the website, the API or the anon/authenticated database roles
(a trigger and column privileges block it). Only someone with direct database access can do it:

1. Sign up on the site with the admin's email and confirm the email.
2. In the Supabase **SQL Editor** (runs as `postgres`), run:

```sql
update public.profiles set role = 'admin'
 where id = (select id from auth.users where email = 'owner@example.com');
```

The change is recorded in `audit_log`. To remove admin rights, set `role = 'customer'`. Use a strong, unique password and enable
MFA on the Supabase account itself.

## Daily work

**Verify a payment** (`/admin/payments`): open your bank/UPI app, find the credit that matches the reference, type the amount you
actually received and press *Mark as received*. The database refuses if it differs from the order total. *Reject* needs a reason;
the customer sees it and can resubmit. A customer-submitted reference is only a claim: nothing is paid or downloadable until you verify it.
The same reference cannot be used for two orders.

**COD orders**: confirm with the customer by phone, then set *Being prepared* on the order page. Verify the COD payment after delivery.

**Ship hardware** (`/admin/orders/<id>`): set the status to *Being prepared*, then add carrier/tracking and set *Shipped*.
Stock is reserved when the order is placed and returned automatically if the order is cancelled or refunded.

**Products** (`/admin/products`): create, set status *Published* to show it. For digital products upload the file on the product page
(private; only customers with a verified payment get a short-lived link). Archive instead of deleting - sold items must keep their history.

**Stock** (`/admin/inventory`): enter +N for a restock or -N for a correction. Customers only ever see In stock / Only a few left / Out of stock.

**Custom requests** (`/admin/requests`): review, write a quote (draft or send), add milestones, mark each ready for review, and record the
payment reference when money arrives. Internal notes are never shown to the customer.

**Audit log** (`/admin/audit`): who changed what and when (prices, stock, payments, order status, roles). It cannot be edited from the app.
