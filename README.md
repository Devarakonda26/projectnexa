# ProjectNexa

Single-vendor, India-only store for engineering **digital project packages**, **hardware kits** and **custom-built projects**.
Next.js 16 (App Router) · TypeScript · Tailwind 4 · Supabase (Postgres, Auth, private Storage).

There is **no payment gateway** in v1. Customers pay by UPI or bank transfer and submit the transaction reference; staff verify it
against the bank statement. Eligible hardware can be ordered with cash on delivery. Only the company manages products; there is no
vendor registration.

> **Status:** feature-complete for v1 but **not yet verified against a real Supabase project or in a browser end-to-end**.
> See [docs/TESTING.md](docs/TESTING.md) for exactly what is and is not tested before you take real orders.

## Features

| Area | Where |
| --- | --- |
| Homepage (search, featured, branch chips) | `src/app/page.tsx` |
| Branch directory, listings, filters, search, product pages | `src/app/branches`, `src/app/products` |
| Cart, checkout (UPI / bank transfer / COD) | `src/app/cart`, `src/app/checkout` |
| Accounts, addresses, order history & tracking | `src/app/(auth)`, `src/app/account`, `src/app/orders` |
| Manual payment claim + staff verification | `src/app/orders/[id]`, `src/app/admin/payments` |
| Digital downloads (verified payment only) | `src/app/downloads/[productId]/route.ts` |
| Hardware stock, shipments | `src/app/admin/inventory`, `src/app/admin/orders/[id]` |
| Custom project requests (attachments, quotes, milestones) | `src/app/custom-projects`, `src/app/admin/requests` |
| Admin dashboard (products, categories, customers, orders, payments, inventory, requests, audit log) | `src/app/admin` |

## Local setup

Prerequisites: Node 22+, npm, a Supabase project (free tier is fine for testing) or the [Supabase CLI](https://supabase.com/docs/guides/cli) with Docker.

```bash
npm install
cp .env.example .env.local        # then fill in the values (see below)
```

### Option A - hosted Supabase project (simplest)

1. Create a project at supabase.com (this may involve billing choices; that is your decision).
2. In **SQL Editor**, run every file in `supabase/migrations/` in filename order, then `supabase/seed.sql` (sample branches, categories, products).
   Or with the CLI: `supabase link --project-ref <ref> && supabase db push`.
3. **Authentication → URL Configuration**: set *Site URL* to your site URL and add `<SITE_URL>/auth/callback` to *Redirect URLs*.
4. Copy the project URL, `anon` key and `service_role` key from **Project Settings → API** into `.env.local`.
5. `npm run dev`, open http://localhost:3000, sign up, confirm the email.
6. Make yourself an admin: follow [docs/ADMIN.md](docs/ADMIN.md).

### Option B - local Supabase (Docker)

```bash
supabase init            # once; creates supabase/config.toml and keeps the existing migrations/seed
supabase start           # prints the local API URL and keys
supabase db reset        # applies migrations + seed.sql
```

Use the printed URL/keys in `.env.local`. Local auth emails are visible in the Inbucket URL printed by `supabase start`.

## Environment variables

Defined and validated in `src/lib/env.schema.ts` (errors name the variable, never its value). Template: `.env.example`.

| Variable | Required | Secret | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | no | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | no | Public anon key (RLS protects the data) |
| `NEXT_PUBLIC_SITE_URL` | yes in prod | no | Used in email links, e.g. `https://projectnexa.in` |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | **YES** | Bypasses RLS. Server only; used solely to mint signed download URLs |
| `STORAGE_BUCKET_PRODUCT_FILES` / `_PAYMENT_PROOFS` / `_REQUEST_ATTACHMENTS` | no | no | Bucket names (defaults match the migrations) |
| `DOWNLOAD_URL_TTL_SECONDS` | no | no | Signed link lifetime, 30-3600 (default 120) |
| `PAYMENT_UPI_ID`, `PAYMENT_UPI_PAYEE_NAME` | yes | no | Shown to customers on UPI orders |
| `PAYMENT_BANK_ACCOUNT_NAME`, `_NUMBER`, `_IFSC`, `_NAME` | for bank transfer | no | Shown to customers on bank-transfer orders |

Never put the service-role key in a `NEXT_PUBLIC_*` variable. A test (`tests/security-hygiene.test.ts`) fails if it leaks into other modules.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / server |
| `npm run check` | Typecheck + lint + unit tests |
| `npm run test:db` | Database tests (RLS, state machine, payments, downloads, audit) on a disposable Postgres; see [docs/TESTING.md](docs/TESTING.md) |

## Documentation

- [docs/ADMIN.md](docs/ADMIN.md) - first admin, daily operations (verifying payments, shipping, quotes)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - go-live checklist and hosting notes
- [docs/BACKUPS.md](docs/BACKUPS.md) - backups and restore drills
- [docs/SECURITY.md](docs/SECURITY.md) - security model, what is enforced where
- [docs/TESTING.md](docs/TESTING.md) - what is tested, how to run it, known gaps

## Order lifecycle

```
UPI / bank:  pending_payment -> payment_submitted -> paid -> processing -> shipped -> delivered -> completed
                    |  (reject: back to pending_payment)       (digital-only: paid -> completed)
COD:         pending_confirmation -> processing -> shipped -> delivered -> completed
Cancelled: before payment is verified (and COD orders until shipped)   ·   Refunded: after payment
```

Illegal moves are rejected by a database trigger. `tests/golden/order-transitions.json` keeps the SQL rules and the TypeScript copy identical.
