import { describe, expect, it } from "vitest";
import { fieldErrors, normalizeIndianMobile } from "@/lib/validation/common";
import {
  addressSchema,
  customRequestSchema,
  paymentClaimSchema,
  placeOrderSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation/schemas";

const UUID = "7c1f0841-730b-42a6-8c1a-d13ccc09679c";

describe("normalizeIndianMobile", () => {
  it.each([
    ["9876543210", "9876543210"],
    ["98765 43210", "9876543210"],
    ["+91 98765-43210", "9876543210"],
    ["919876543210", "9876543210"],
    ["09876543210", "9876543210"],
  ])("accepts %j", (input, expected) => expect(normalizeIndianMobile(input)).toBe(expected));

  it.each(["", "12345", "5876543210", "98765432101", "abcdefghij", "+1 4155552671"])("rejects %j", (input) =>
    expect(normalizeIndianMobile(input)).toBeNull(),
  );
});

describe("signUpSchema", () => {
  const valid = { fullName: "  Asha Rao ", email: "  ASHA@Example.COM ", password: "correct-horse-9", phone: "" };

  it("normalises name and email and treats an empty phone as absent", () => {
    const r = signUpSchema.parse(valid);
    expect(r.fullName).toBe("Asha Rao");
    expect(r.email).toBe("asha@example.com");
    expect(r.phone).toBeUndefined();
  });

  it("rejects weak passwords", () => {
    for (const password of ["short1", "onlyletterslong", "1234567890123"]) {
      expect(signUpSchema.safeParse({ ...valid, password }).success).toBe(false);
    }
  });

  it("rejects passwords over bcrypt's 72-byte limit", () => {
    expect(signUpSchema.safeParse({ ...valid, password: "a1".repeat(40) }).success).toBe(false);
  });

  it("rejects invalid email and phone", () => {
    const r = signUpSchema.safeParse({ ...valid, email: "nope", phone: "123" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const errs = fieldErrors(r.error);
      expect(errs.email).toBeDefined();
      expect(errs.phone).toBeDefined();
    }
  });
});

describe("signInSchema", () => {
  it("does not apply strength rules to existing passwords", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });
  it("requires both fields", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "", password: "x" }).success).toBe(false);
  });
});

describe("addressSchema", () => {
  const valid = {
    recipientName: "Asha Rao", phone: "98765 43210", line1: "12 MG Road", city: "Bengaluru",
    state: "Karnataka", pincode: "560001", isDefault: "on",
  };

  it("accepts a valid address and normalises the phone", () => {
    const r = addressSchema.parse(valid);
    expect(r.phone).toBe("9876543210");
    expect(r.isDefault).toBe(true);
    expect(r.label).toBe("Home");
  });

  it("rejects unknown states and bad PIN codes", () => {
    expect(addressSchema.safeParse({ ...valid, state: "Atlantis" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...valid, pincode: "012345" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...valid, pincode: "56001" }).success).toBe(false);
  });

  it("strips control characters from free text", () => {
    const r = addressSchema.parse({ ...valid, line1: "12\u0000 MG\u0007 Road" });
    expect(r.line1).toBe("12 MG Road");
  });
});

describe("placeOrderSchema", () => {
  it("accepts the three manual payment methods", () => {
    for (const method of ["upi", "bank_transfer", "cod"]) {
      expect(placeOrderSchema.safeParse({ method, addressId: UUID }).success).toBe(true);
    }
  });
  it("rejects card / gateway methods and bad ids", () => {
    expect(placeOrderSchema.safeParse({ method: "card" }).success).toBe(false);
    expect(placeOrderSchema.safeParse({ method: "upi", addressId: "not-a-uuid" }).success).toBe(false);
  });
  it("treats an empty address id as none (digital-only orders)", () => {
    expect(placeOrderSchema.parse({ method: "upi", addressId: "" }).addressId).toBeNull();
  });
});

describe("paymentClaimSchema", () => {
  it("accepts a UPI UTR and bank reference", () => {
    expect(paymentClaimSchema.safeParse({ orderId: UUID, utr: "412345678901", payerName: "Asha Rao" }).success).toBe(true);
    expect(paymentClaimSchema.safeParse({ orderId: UUID, utr: "HDFCN2026100912", payerName: "Asha Rao" }).success).toBe(true);
  });
  it("rejects punctuation, short and over-long references", () => {
    for (const utr of ["12345", "abc def 123", "ref#12345678", "x".repeat(31), "<script>"]) {
      expect(paymentClaimSchema.safeParse({ orderId: UUID, utr, payerName: "Asha Rao" }).success).toBe(false);
    }
  });
  it("never accepts a customer-supplied amount or status", () => {
    const r = paymentClaimSchema.parse({ orderId: UUID, utr: "412345678901", payerName: "Asha Rao", status: "verified", amount: "1" });
    expect(r).not.toHaveProperty("status");
    expect(r).not.toHaveProperty("amount");
  });
});

describe("customRequestSchema", () => {
  const base = {
    title: "Self-balancing robot", branchId: UUID,
    description: "A self balancing two wheel robot with PID control and a phone app for tuning.",
  };

  it("converts rupee budgets to paise", () => {
    const r = customRequestSchema.parse({ ...base, budgetMin: "5,000", budgetMax: "10000.50" });
    expect(r.budgetMin).toBe(500000);
    expect(r.budgetMax).toBe(1000050);
  });

  it("rejects an inverted budget range", () => {
    const r = customRequestSchema.safeParse({ ...base, budgetMin: "9000", budgetMax: "1000" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).budgetMax).toBeDefined();
  });

  it("validates the deadline window", () => {
    const iso = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10);
    expect(customRequestSchema.safeParse({ ...base, deadline: iso(30) }).success).toBe(true);
    expect(customRequestSchema.safeParse({ ...base, deadline: iso(-3) }).success).toBe(false);
    expect(customRequestSchema.safeParse({ ...base, deadline: iso(900) }).success).toBe(false);
    expect(customRequestSchema.safeParse({ ...base, deadline: "2026-13-45" }).success).toBe(false);
  });

  it("enforces title and description lengths", () => {
    expect(customRequestSchema.safeParse({ ...base, title: "Hi" }).success).toBe(false);
    expect(customRequestSchema.safeParse({ ...base, description: "too short" }).success).toBe(false);
    expect(customRequestSchema.safeParse({ ...base, description: "x".repeat(5001) }).success).toBe(false);
  });
});
