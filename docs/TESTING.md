# Testing

## What runs

| Command | Count at last run | Covers |
| --- | --- | --- |
| `npm run typecheck` | clean | TypeScript strict |
| `npm run lint` | clean | ESLint (Next + React rules) |
| `npm test` | 162 tests, 10 files | env parsing (no value leaks), safe redirects, route guards, money/paise, validation schemas (incl. admin), upload validation (magic bytes, names), order-state rules, search-term sanitising, pricing/COD rules, DB-error mapping, **security hygiene** (service-role isolation, no secrets in client code, every admin page/action authorises) |
| `npm run build` | passes | production compile + prerender with cache components |
| `npm run test:db` | 10 SQL suites, all pass | real PostgreSQL 16: RLS per role (anon / customer / other customer / admin), profile & role escalation, checkout totals/shipping/COD rules, atomic stock reservation & restore, payment claim -> verify/reject (amount match, duplicate reference), download gating, custom requests/quotes/milestones, storage policies, audit log integrity, structural grant/RLS scan, SQL vs TypeScript state-machine parity (75-tuple golden file), catalogue search |

`npm run test:db` needs a disposable PostgreSQL 16 server where you are superuser:

```bash
PGHOST=localhost PGPORT=5432 PGUSER=postgres scripts/test-db.sh
```

It recreates database `nexa_test`, loads `tests/db/00_supabase_shim.sql` (minimal stand-ins for `auth.users`, `auth.uid()`, the Supabase roles and `storage.*`),
applies every migration and the seed, then runs `tests/db/t_*.sql`. Tests impersonate users with `set local role` + `request.jwt.claims`, exactly how PostgREST does.

Also checked manually against a production build with placeholder env values: public pages return 200; `/admin`, `/cart`, `/orders/...` redirect signed-out visitors to
`/login?next=...`; a forged auth cookie is not accepted; `?next=https://evil.example` is replaced by `/account`; security headers are present.

## What has NOT been tested (do these before taking real money)

1. **A real Supabase project.** The database tests use plain PostgreSQL plus a shim. Real Supabase behaviour is unverified for: Auth (sign-up emails, confirmation, reset links, cookie refresh), `getClaims`/`getUser`, Storage (signed URLs, signed upload tokens, `info`, bucket limits), PostgREST filter syntax used by the app, and the exact `auth.users` insert trigger path.
2. **The UI in a browser.** No end-to-end (Playwright) tests exist yet. Forms, `useActionState` flows, the file uploader, responsive layout (mobile/tablet/desktop), keyboard and screen-reader behaviour have been compiled and type-checked but not exercised.
3. **Admin product-file upload** (signed upload -> signature check via ranged read -> record). Written carefully, never run.
4. **Concurrency under load** beyond the SQL-level stock guard, and performance with realistic catalogue sizes.
5. **Email deliverability, SMTP, and Supabase Auth rate limits.**
6. `npm audit` could not reach the registry in the build sandbox; run it yourself and keep dependencies updated.

## Suggested next tests
- Create a Supabase project, apply migrations, run through: sign-up -> add to cart -> checkout (UPI) -> submit reference -> admin verifies -> download works; then repeat with a rejected payment, a COD order, and a custom request.
- Add Playwright smoke tests for those flows and run them in CI against a Supabase branch/project.
- Try the security checks by hand: open an admin URL as a customer (expect 404), request another customer's order id (expect 404), call `/downloads/<id>` for an unpaid product (expect 404).
