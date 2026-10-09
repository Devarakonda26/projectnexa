import { z } from "zod";

/**
 * Pure environment parsing. No secrets are read here and nothing is imported
 * from `server-only`, so these functions are unit-testable.
 *
 * - `parsePublicEnv`  : values that are safe to ship to the browser (NEXT_PUBLIC_*).
 * - `parseServerEnv`  : values that must NEVER reach browser code.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, "anon key looks too short"),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, "service role key looks too short"),

  // Private Storage buckets (created by the migrations; never public).
  STORAGE_BUCKET_PRODUCT_FILES: z.string().min(3).default("product-files"),
  STORAGE_BUCKET_PAYMENT_PROOFS: z.string().min(3).default("payment-proofs"),
  STORAGE_BUCKET_REQUEST_ATTACHMENTS: z.string().min(3).default("request-attachments"),

  // Signed download links live this long (seconds).
  DOWNLOAD_URL_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(120),

  // Manual payment details shown to customers at checkout (not secrets).
  PAYMENT_UPI_ID: z.string().min(3),
  PAYMENT_UPI_PAYEE_NAME: z.string().min(2),
  PAYMENT_BANK_ACCOUNT_NAME: z.string().optional(),
  PAYMENT_BANK_ACCOUNT_NUMBER: z.string().optional(),
  PAYMENT_BANK_IFSC: z.string().optional(),
  PAYMENT_BANK_NAME: z.string().optional(),
});

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

type Source = Record<string, string | undefined>;

function format(error: z.ZodError): string {
  // Report variable names and reasons only, never the offending values.
  return error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
}

export function parsePublicEnv(source: Source): PublicEnv {
  const result = publicSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid public environment: ${format(result.error)}`);
  }
  return result.data;
}

export function parseServerEnv(source: Source): ServerEnv {
  const result = serverSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid server environment: ${format(result.error)}`);
  }
  return result.data;
}
