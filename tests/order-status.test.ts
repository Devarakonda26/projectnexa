import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  STATUS_LABEL,
  STATUS_TONE,
  adminNextStatuses,
  canCustomerCancel,
  isTransitionAllowed,
  trackingSteps,
  type OrderStatus,
  type PaymentMethod,
} from "@/lib/orders/status";

type Tuple = { from: OrderStatus; to: OrderStatus; method: PaymentMethod; physical: boolean };
const golden: Tuple[] = JSON.parse(readFileSync("tests/golden/order-transitions.json", "utf8"));

describe("TypeScript order transitions match the database (golden file)", () => {
  it("allows exactly the transitions the database allows", () => {
    const actual: Tuple[] = [];
    for (const from of ORDER_STATUSES)
      for (const to of ORDER_STATUSES)
        for (const method of PAYMENT_METHODS)
          for (const physical of [true, false])
            if (isTransitionAllowed(from, to, method, physical)) actual.push({ from, to, method, physical });

    const key = (t: Tuple) => `${t.from}|${t.to}|${t.method}|${t.physical}`;
    expect(actual.map(key).sort()).toEqual(golden.map(key).sort());
  });
});

describe("order status helpers", () => {
  it("has a label and tone for every status", () => {
    for (const s of ORDER_STATUSES) {
      expect(STATUS_LABEL[s]).toBeTruthy();
      expect(STATUS_TONE[s]).toBeTruthy();
    }
  });

  it("lets customers cancel only before any payment or confirmation", () => {
    expect(canCustomerCancel("pending_payment")).toBe(true);
    expect(canCustomerCancel("pending_confirmation")).toBe(true);
    for (const s of ORDER_STATUSES.filter((x) => x !== "pending_payment" && x !== "pending_confirmation")) {
      expect(canCustomerCancel(s)).toBe(false);
    }
  });

  it("never offers 'paid' or 'payment_submitted' as a manual admin choice", () => {
    for (const from of ORDER_STATUSES)
      for (const method of PAYMENT_METHODS)
        for (const physical of [true, false]) {
          const next = adminNextStatuses(from, method, physical);
          expect(next).not.toContain("paid");
          expect(next).not.toContain("payment_submitted");
        }
  });

  it("offers sensible next steps", () => {
    expect(adminNextStatuses("paid", "upi", true)).toEqual(["processing", "refunded"]);
    expect(adminNextStatuses("processing", "upi", true)).toEqual(["shipped", "refunded"]);
    expect(adminNextStatuses("pending_confirmation", "cod", true)).toEqual(["processing", "cancelled"]);
    expect(adminNextStatuses("cancelled", "upi", true)).toEqual([]);
  });

  it("builds tracking timelines per order type", () => {
    expect(trackingSteps("upi", false)).toEqual(["pending_payment", "payment_submitted", "completed"]);
    expect(trackingSteps("cod", true)[0]).toBe("pending_confirmation");
    expect(trackingSteps("bank_transfer", true)).toContain("paid");
  });
});
