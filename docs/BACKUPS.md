# Backups and recovery

What must survive a disaster: the **database** (orders, payments, customers, audit log) and **Storage** objects (product files, payment
proofs, request attachments, product images).

## Database
- **Supabase paid plans** include daily backups; Point-in-Time Recovery is an optional add-on. The free tier has no managed backups, so do not run a live store on it without your own.
- Independent copy (recommended, free): a scheduled `pg_dump` of the production database to storage *outside* Supabase, e.g. nightly:
  ```bash
  pg_dump "$SUPABASE_DB_URL" --format=custom --no-owner --file="nexa-$(date +%F).dump"
  ```
  Keep at least 7 daily + 4 weekly copies, encrypted at rest (the dump contains personal data and payment references).
- The audit log is part of the database; it is restored with it.

## Storage
- Backups of the database do **not** include Storage files. Mirror the buckets regularly (Supabase CLI `supabase storage cp -r`, or the S3-compatible endpoint with `rclone`/`aws s3 sync`), especially `product-files`.
- Keep the original product files in your own archive too; they are your source of truth.

## Restore drill (do this before launch, then quarterly)
1. Create a scratch Supabase project or a local Postgres.
2. Restore the dump: `pg_restore --clean --if-exists --no-owner -d "$SCRATCH_DB_URL" nexa-YYYY-MM-DD.dump`.
3. Run `npm run test:db` style checks or at least count orders/payments and open a few orders in a local build pointed at the scratch project.
4. Record how long it took and what was missing.

## Secrets
Store the Supabase service-role key, DB password and `.env` values in a password manager; if a key leaks, rotate it in the Supabase dashboard and redeploy.
