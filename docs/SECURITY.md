# Security model

Defence in depth: the **database** is the last line, the **server** is the main one, the **browser** is never trusted.

| Concern | How it is handled | Where |
| --- | --- | --- |
| Admin authorization | Every admin page calls `requireAdmin()`; every admin Server Action goes through `withAdmin()`; both read identity from Supabase Auth (`getUser`) and the role from `profiles`. Non-admins get a 404. The Proxy redirect is only a convenience. | `src/lib/auth/dal.ts`, `src/lib/admin/run.ts` |
| Admin rights re-checked in the DB | Every admin RPC starts with `require_admin()`; admin tables have admin-only RLS policies. Admin actions run with the admin's own session, not the service role. | migrations 4, 5 |
| Role escalation | `profiles.role` is not updatable by clients (column grants + trigger). Sign-up metadata can never set a role. First admin is created in SQL only. | migrations 4, 5; `t_02` |
| Payment trust | Customers cannot write `payments` or set `orders.status`. They call `submit_payment_claim()`, which stores a *claim* and copies the amount from the order. Only `admin_verify_payment()` (admin, amount must equal the order total) marks it paid. A reference can back only one live payment. | migration 4; `t_03` |
| Prices / totals | `place_order()` recomputes everything from the `products` table and `store_settings`; the browser sends only an address id, a method and a note. | migration 4 |
| Overselling | Stock is decremented atomically with a `WHERE quantity_on_hand >= n` guard inside the order transaction. | migration 4; `t_03` |
| Digital downloads | `has_download_access()` requires a *verified* payment on the caller's own, non-cancelled, non-refunded order. The route handler checks it as the user, then mints a 120 s signed URL. The `product-files` bucket has no customer policy. Non-owners get a 404. | `src/app/downloads`, migration 4; `t_04` |
| Row Level Security | RLS on every table, `revoke all` baseline, minimal grants; a test scans for tables without RLS and functions executable by `anon`. | migration 5; `t_07` |
| Secrets | Service-role key only in `env.server.ts` / `service.ts` (both `server-only`), used only by `storage/signed-urls.ts`. A test fails the build if other files import it or if a `NEXT_PUBLIC_*` name looks secret. | `tests/security-hygiene.test.ts` |
| Uploads | Size, extension, declared MIME **and** file signature (magic bytes) are checked server-side; names are sanitised; storage paths are `<user id>/<parent id>/...` enforced by storage RLS; buckets also enforce size/MIME. Payment proofs and attachments are private. | `src/lib/uploads`, migration 6; `t_06` |
| Input validation | zod schemas for every form; money is integer paise; the DB repeats key checks (`check` constraints). | `src/lib/validation` |
| Open redirects | `next` parameters pass through `safeNextPath()` (same-site paths only). | `src/lib/auth/redirects.ts` |
| Account enumeration | Sign-in, sign-up and reset forms give the same answer whether or not an email exists. | `src/app/(auth)/actions.ts` |
| XSS | React escapes output; product descriptions are plain text; tracking links must be http(s); CSP limits scripts/frames/forms/connections. | `next.config.ts` |
| Audit | Triggers write an append-only `audit_log` (price, stock, payment, order status, role, request changes); updates/deletes are blocked, including for admins. | migration 4; `t_07` |
| Headers | CSP, HSTS (prod), `nosniff`, `X-Frame-Options: DENY`, strict referrer policy, permissions policy. | `next.config.ts` |

## Known limits (please read)

- The CSP allows `'unsafe-inline'` scripts because Next.js injects inline hydration scripts and a nonce would make every page dynamic. Tighten later if needed.
- No application-level rate limiting beyond Supabase Auth's own limits. Put the site behind Cloudflare/Vercel firewall rules for production, and enable CAPTCHA on sign-up in Supabase.
- Product files uploaded by staff are verified by file signature and type but are **not virus-scanned**. Staff are trusted; do not upload files you have not built or checked.
- Proof screenshots are stored as uploaded (no image re-encoding).
- Customer data (names, phones, addresses, payment references) is personal data. Decide retention and deletion rules and publish a privacy policy (India's DPDP Act may apply to you; get advice).
- Email confirmation and password reset depend on correct Supabase Auth configuration (see DEPLOYMENT.md).
