import { describe, expect, it } from "vitest";
import { orderStatusSchema, productSchema, shipmentSchema, stockAdjustSchema, verifyPaymentSchema } from "@/lib/validation/admin";

const B = "11111111-1111-4111-8111-111111111111";
const base = { title: "ESP32 kit", slug: "esp32-kit", summary: "A kit for learning IoT", productType: "hardware", status: "draft", branchId: B, price: "1,299.50" };

describe("productSchema", () => {
  it("parses rupees to paise and lists", () => {
    const r = productSchema.parse({ ...base, techStack: "esp32, iot , esp32", codEligible: "on", weightGrams: "250" });
    expect(r.price).toBe(129950);
    expect(r.techStack).toEqual(["esp32", "iot"]);
    expect(r.codEligible).toBe(true);
    expect(r.weightGrams).toBe(250);
  });
  it("rejects COD on digital products", () => {
    expect(productSchema.safeParse({ ...base, productType: "digital", codEligible: "on" }).success).toBe(false);
  });
  it("rejects MRP below price and bad slugs", () => {
    expect(productSchema.safeParse({ ...base, mrp: "100" }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, slug: "Bad Slug" }).success).toBe(false);
  });
  it("rejects negative / junk prices", () => {
    expect(productSchema.safeParse({ ...base, price: "-5" }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, price: "1e5" }).success).toBe(false);
  });
});

describe("workflow schemas", () => {
  it("verify requires a valid received amount", () => {
    expect(verifyPaymentSchema.parse({ paymentId: B, receivedAmount: "499" }).receivedAmount).toBe(49900);
    expect(verifyPaymentSchema.safeParse({ paymentId: B, receivedAmount: "abc" }).success).toBe(false);
  });
  it("order status cannot target payment-workflow states", () => {
    for (const s of ["paid", "payment_submitted", "pending_payment"]) {
      expect(orderStatusSchema.safeParse({ orderId: B, status: s }).success).toBe(false);
    }
    expect(orderStatusSchema.safeParse({ orderId: B, status: "shipped" }).success).toBe(true);
  });
  it("tracking links must be http(s)", () => {
    expect(shipmentSchema.safeParse({ orderId: B, status: "shipped", trackingUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(shipmentSchema.safeParse({ orderId: B, status: "shipped", trackingUrl: "https://courier.example/track/1" }).success).toBe(true);
  });
  it("stock changes must be non-zero integers", () => {
    expect(stockAdjustSchema.safeParse({ productId: B, delta: "0", reason: "restock" }).success).toBe(false);
    expect(stockAdjustSchema.safeParse({ productId: B, delta: "-3", reason: "correction" }).success).toBe(true);
    expect(stockAdjustSchema.safeParse({ productId: B, delta: "1.5", reason: "restock" }).success).toBe(false);
  });
});
