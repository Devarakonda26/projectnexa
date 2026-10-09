import { z } from "zod";
import { parseRupeesToPaise } from "@/lib/money";

/** Accepts "98765 43210", "+91-98765-43210", "098765 43210" and returns the 10-digit mobile number, or null. */
export function normalizeIndianMobile(input: string): string | null {
  let digits = input.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  else if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
] as const;

/** Trimmed, control-character-free text with explicit length limits. */
export const text = (min: number, max: number, label = "This field") =>
  z
    .string({ error: `${label} is required` })
    .transform((s) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim())
    .pipe(z.string().min(min, `${label} must be at least ${min} characters`).max(max, `${label} must be at most ${max} characters`));

export const optionalText = (max: number, label = "This field") =>
  z
    .string()
    .optional()
    .transform((s) => (s ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim())
    .pipe(z.string().max(max, `${label} must be at most ${max} characters`))
    .transform((s) => (s === "" ? undefined : s));

export const email = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address").max(254));

export const indianMobile = z
  .string({ error: "Mobile number is required" })
  .transform((s, ctx) => {
    const n = normalizeIndianMobile(s);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "Enter a valid 10-digit Indian mobile number" });
      return z.NEVER;
    }
    return n;
  });

export const pincode = z
  .string({ error: "PIN code is required" })
  .trim()
  .regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code");

export const uuid = z.uuid("Invalid identifier");

/** Admin-entered rupee amount -> integer paise. */
export const rupees = (label = "Amount") =>
  z.string({ error: `${label} is required` }).transform((s, ctx) => {
    const paise = parseRupeesToPaise(s);
    if (paise === null) {
      ctx.addIssue({ code: "custom", message: `${label} must be a valid amount like 1299 or 1299.50` });
      return z.NEVER;
    }
    return paise;
  });

export const slug = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

/** Flattens a ZodError into `{ field: ["message"] }` for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

export type FormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

/** Converts FormData into a plain object, keeping only string values (files are handled separately). */
export function formDataToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}
