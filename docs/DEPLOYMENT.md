# Deployment

Nothing has been deployed by the build process. Creating a Supabase project, a hosting account, a domain or any paid plan is
your decision; do each step yourself or explicitly ask for help with it.

## Go-live checklist

**Database / Supabase**
- [ ] All migrations in `supabase/migrations/` applied in order on the production project. Seed data (`seed.sql`) is **sample data**: skip it or delete the sample products before launch.
- [ ] Buckets exist and are as expected: `product-images` public; `product-files`, `payment-proofs`, `request-attachments` **private** (Storage dashboard).
- [ ] Row Level Security is enabled on every `public` table (the DB test suite scans for this; also check the dashboard's Security Advisor).
- [ ] Auth → URL Configuration: Site URL = production URL; Redirect URLs include `https://<domain>/auth/callback`.
- [ ] Auth → Email: configure **custom SMTP** (the built-in sender is heavily rate limited and meant for testing). Customise the confirmation/reset templates.
- [ ] Auth → Providers → Email: require email confirmation; set a minimum password length of 10 or more; review rate limits; consider CAPTCHA on sign-up.
- [ ] First admin created ([ADMIN.md](ADMIN.md)).
- [ ] Backups configured and a restore rehearsed ([BACKUPS.md](BACKUPS.md)).

**Hosting (any Node 22 host, e.g. Vercel, a VPS, a container platform)**
- [ ] Environment variables set in the host's secret manager (see README). `SUPABASE_SERVICE_ROLE_KEY` only as a server secret.
- [ ] `NEXT_PUBLIC_*` values are present at **build** time (they are inlined into the bundle).
- [ ] HTTPS only. The app sends HSTS, CSP and other headers in production (`next.config.ts`).
- [ ] Server Actions accept bodies up to 22 MB (payment proofs, request attachments); make sure your host/proxy allows that. Large product files go directly to Supabase Storage, not through the server.
- [ ] If a proxy or CDN sits in front of the app, set `experimental.serverActions.allowedOrigins` in `next.config.ts` to your public domain, otherwise Server Actions may be rejected as cross-origin.
- [ ] Region: choose the Supabase region closest to your customers (e.g. Mumbai) to keep latency low.

**Business**
- [ ] Real UPI ID / bank details in the environment; place a test order and pay a small amount to yourself end to end.
- [ ] Review store settings in the `store_settings` table: shipping fee, free-shipping threshold, COD limit (paise).
- [ ] Publish privacy policy, terms, refund/cancellation and shipping pages, and any GST/invoicing details your business needs (not included in v1; take advice from your accountant).

## Release process

1. `npm run check` and `npm run test:db` pass.
2. New migrations are **new files** (never edit an applied migration); apply to staging first, then production.
3. Deploy the app after the migration is applied.
