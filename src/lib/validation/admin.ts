import { z } from "zod";
import { optionalText, rupees, slug, text, uuid } from "./common";

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
  .optional()
  .transform((v) => v === "on" || v === "true");

const optionalRupees = (label: string) =>
  z.string().optional().transform((v) => (v?.trim() ? v : undefined)).pipe(rupees(label).optional());

const optionalInt = (label: string, min: number, max: number) =>
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      const t = v?.trim();
      if (!t) return undefined;
      const n = Number(t);
      if (!/^\d{1,9}$/.test(t) || n < min || n > max) {
        ctx.addIssue({ code: "custom", message: `${label} must be a whole number from ${min} to ${max}` });
        return z.NEVER;
      }
      return n;
    });

/** "esp32, iot ,wifi" -> ["esp32","iot","wifi"] (deduplicated, max 30 items of 40 chars). */
const tagList = (label: string) =>
  z
    .string()
    .optional()
    .transform((v) =>
      [...new Set((v ?? "").split(",").map((s) => s.replace(/[\u0000-\u001f\u007f]/g, "").trim()).filter(Boolean))],
    )
    .pipe(z.array(z.string().max(40, `${label}: each item must be at most 40 characters`)).max(30, `${label}: at most 30 items`));

export const productSchema = z
  .object({
    title: text(3, 160, "Title"),
    slug,
    summary: text(10, 300, "Summary"),
    description: optionalText(20000, "Description"),
    productType: z.enum(["digital", "hardware"], { error: "Choose a product type" }),
    status: z.enum(["draft", "published", "archived"]),
    branchId: uuid,
    categoryId: z.union([uuid, z.literal("")]).optional().transform((v) => (v ? v : null)),
    price: rupees("Price"),
    mrp: optionalRupees("MRP"),
    difficulty: z.union([z.enum(["beginner", "intermediate", "advanced"]), z.literal("")]).optional().transform((v) => (v ? v : null)),
    techStack: tagList("Tech stack"),
    tags: tagList("Tags"),
    weightGrams: optionalInt("Weight", 1, 100000),
    codEligible: checkbox,
    isFeatured: checkbox,
    initialStock: optionalInt("Opening stock", 0, 100000),
    lowStockThreshold: optionalInt("Low-stock threshold", 0, 100000),
  })
  .superRefine((v, ctx) => {
    if (v.mrp !== undefined && v.mrp < v.price) ctx.addIssue({ code: "custom", path: ["mrp"], message: "MRP must be at least the price" });
    if (v.codEligible && v.productType !== "hardware") ctx.addIssue({ code: "custom", path: ["codEligible"], message: "Cash on delivery is only for hardware" });
  });

export const branchSchema = z.object({
  name: text(2, 80, "Name"),
  shortName: text(2, 20, "Short name"),
  slug,
  description: optionalText(500, "Description"),
  sortOrder: optionalInt("Sort order", 0, 10000),
  isActive: checkbox,
});

export const categorySchema = z.object({
  branchId: uuid,
  name: text(2, 80, "Name"),
  slug,
  description: optionalText(500, "Description"),
  sortOrder: optionalInt("Sort order", 0, 10000),
  isActive: checkbox,
});

export const verifyPaymentSchema = z.object({
  paymentId: uuid,
  receivedAmount: rupees("Amount received"),
  note: optionalText(300, "Note"),
});
export const rejectPaymentSchema = z.object({ paymentId: uuid, reason: text(3, 300, "Reason") });

export const orderStatusSchema = z.object({
  orderId: uuid,
  status: z.enum(["pending_confirmation", "processing", "shipped", "delivered", "completed", "cancelled", "refunded"]),
  note: optionalText(300, "Note"),
});

export const shipmentSchema = z.object({
  orderId: uuid,
  status: z.enum(["preparing", "shipped", "in_transit", "out_for_delivery", "delivered", "returned"]),
  carrier: optionalText(80, "Carrier"),
  trackingNumber: optionalText(80, "Tracking number"),
  trackingUrl: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined))
    .pipe(z.url({ protocol: /^https?$/, error: "Enter a full http(s) link" }).max(500).optional()),
});

export const stockAdjustSchema = z.object({
  productId: uuid,
  delta: z.coerce.number({ error: "Enter a number" }).int().refine((n) => n !== 0, "Change cannot be zero").refine((n) => Math.abs(n) <= 100000, "Too large"),
  reason: z.enum(["restock", "manual_adjustment", "correction"]),
  note: optionalText(300, "Note"),
});

export const requestStatusSchema = z.object({
  requestId: uuid,
  status: z.enum(["under_review", "in_progress", "completed", "rejected"]),
});
export const adminNoteSchema = z.object({ requestId: uuid, note: text(1, 2000, "Note") });

export const quoteSchema = z.object({
  requestId: uuid,
  amount: rupees("Quote amount"),
  scope: text(10, 5000, "Scope"),
  deliveryDays: optionalInt("Delivery days", 1, 365),
  validUntil: z.string().optional().transform((v) => (v?.trim() ? v : undefined)).pipe(z.iso.date("Enter a valid date").optional()),
  send: checkbox,
});

export const milestoneSchema = z.object({
  requestId: uuid,
  title: text(3, 160, "Title"),
  description: optionalText(2000, "Description"),
  amount: z.string().optional().transform((v) => (v?.trim() ? v : "0")).pipe(rupees("Amount")),
  dueDate: z.string().optional().transform((v) => (v?.trim() ? v : undefined)).pipe(z.iso.date("Enter a valid date").optional()),
});
export const milestoneStatusSchema = z.object({
  requestId: uuid,
  milestoneId: uuid,
  status: z.enum(["pending", "in_progress", "submitted"]),
});
export const milestonePaidSchema = z.object({ requestId: uuid, milestoneId: uuid, reference: text(3, 60, "Payment reference") });
