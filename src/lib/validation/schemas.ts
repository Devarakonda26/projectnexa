import { z } from "zod";
import { email, indianMobile, INDIAN_STATES, optionalText, pincode, rupees, text, uuid } from "./common";

// ---------------------------------------------------------------- auth
/** bcrypt (used by Supabase Auth) ignores everything after 72 bytes, so cap passwords there. */
const password = z
  .string({ error: "Password is required" })
  .min(10, "Use at least 10 characters")
  .refine((p) => new TextEncoder().encode(p).length <= 72, "Password is too long (72 bytes maximum)")
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), "Include at least one letter and one number");

export const signUpSchema = z.object({
  fullName: text(2, 120, "Full name"),
  email,
  password,
  phone: z.string().optional().transform((v) => (v?.trim() ? v : undefined)).pipe(indianMobile.optional()),
});

export const signInSchema = z.object({
  email,
  // Do not apply the strength rules on sign-in: older passwords must keep working.
  password: z.string({ error: "Password is required" }).min(1, "Password is required").max(200),
});

export const forgotPasswordSchema = z.object({ email });
export const newPasswordSchema = z.object({ password });

// ---------------------------------------------------------------- profile & address
export const profileSchema = z.object({
  fullName: text(2, 120, "Full name"),
  phone: z.string().optional().transform((v) => (v?.trim() ? v : undefined)).pipe(indianMobile.optional()),
});

export const addressSchema = z.object({
  label: text(1, 30, "Label").default("Home"),
  recipientName: text(2, 120, "Recipient name"),
  phone: indianMobile,
  line1: text(3, 200, "Address line 1"),
  line2: optionalText(200, "Address line 2"),
  landmark: optionalText(120, "Landmark"),
  city: text(2, 80, "City"),
  state: z.enum(INDIAN_STATES, { error: "Select a state" }),
  pincode,
  isDefault: z.union([z.literal("on"), z.literal("true"), z.literal("false"), z.undefined()]).transform((v) => v === "on" || v === "true"),
});

// ---------------------------------------------------------------- checkout & payments
export const placeOrderSchema = z.object({
  addressId: z.union([uuid, z.literal("")]).optional().transform((v) => (v ? v : null)),
  method: z.enum(["upi", "bank_transfer", "cod"], { error: "Choose a payment method" }),
  notes: optionalText(500, "Notes"),
});

/** UPI UTRs are 12 digits; bank references vary, so accept 6-30 letters/digits. */
export const paymentClaimSchema = z.object({
  orderId: uuid,
  utr: z
    .string({ error: "Transaction reference is required" })
    .trim()
    .regex(/^[A-Za-z0-9]{6,30}$/, "Enter the 12-digit UPI reference (UTR) or bank reference, letters and digits only"),
  payerName: text(2, 120, "Payer name"),
});

// ---------------------------------------------------------------- custom project request
export const customRequestSchema = z
  .object({
    title: text(5, 160, "Project title"),
    branchId: uuid,
    description: text(30, 5000, "Description"),
    requirements: optionalText(5000, "Requirements"),
    budgetMin: z.string().optional().transform((v) => (v?.trim() ? v : undefined)).pipe(rupees("Minimum budget").optional()),
    budgetMax: z.string().optional().transform((v) => (v?.trim() ? v : undefined)).pipe(rupees("Maximum budget").optional()),
    deadline: z
      .string()
      .optional()
      .transform((v) => (v?.trim() ? v : undefined))
      .pipe(z.iso.date("Enter a valid date").optional()),
  })
  .superRefine((v, ctx) => {
    if (v.budgetMin !== undefined && v.budgetMax !== undefined && v.budgetMin > v.budgetMax) {
      ctx.addIssue({ code: "custom", path: ["budgetMax"], message: "Maximum budget must be at least the minimum" });
    }
    if (v.deadline) {
      const d = new Date(v.deadline + "T00:00:00Z").getTime();
      const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z").getTime();
      if (d < today) ctx.addIssue({ code: "custom", path: ["deadline"], message: "Deadline cannot be in the past" });
      if (d > today + 730 * 86_400_000) ctx.addIssue({ code: "custom", path: ["deadline"], message: "Deadline must be within 2 years" });
    }
  });
