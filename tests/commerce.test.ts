import { describe, expect, it } from "vitest";
import { computeTotals, type CartLine } from "@/lib/commerce/pricing";
import { friendlyDbError } from "@/lib/errors/db";

const S = { shippingFlatPaise: 6000, freeShippingThresholdPaise: 99900, codMaxTotalPaise: 500000 };
const hw = (priceP: number, quantity = 1, codEligible = true): CartLine => ({ priceP, quantity, type: "hardware", codEligible });
const dg = (priceP: number): CartLine => ({ priceP, quantity: 5, type: "digital", codEligible: false });

describe("computeTotals", () => {
  it("charges flat shipping below the threshold", () => {
    expect(computeTotals([hw(50000)], S)).toMatchObject({ subtotalPaise: 50000, shippingPaise: 6000, totalPaise: 56000 });
  });
  it("free shipping at the threshold", () => {
    expect(computeTotals([hw(99900)], S).shippingPaise).toBe(0);
  });
  it("digital-only carts have no shipping and digital quantity is always 1", () => {
    expect(computeTotals([dg(30000)], S)).toMatchObject({ subtotalPaise: 30000, shippingPaise: 0, hasPhysical: false });
  });
  it("COD only for all-hardware, eligible, within the limit", () => {
    expect(computeTotals([hw(20000, 2)], S).codAvailable).toBe(true);
    expect(computeTotals([hw(20000), dg(10000)], S).codAvailable).toBe(false);
    expect(computeTotals([hw(20000, 1, false)], S).codAvailable).toBe(false);
    expect(computeTotals([hw(600000)], S).codAvailable).toBe(false);
    expect(computeTotals([dg(10000)], S).codAvailable).toBe(false);
  });
});

describe("friendlyDbError", () => {
  it("maps known codes, including ones with a suffix", () => {
    expect(friendlyDbError("insufficient_stock: ESP32 kit")).toMatch(/out of stock/);
    expect(friendlyDbError("reference_already_used")).toMatch(/already been submitted/);
  });
  it("hides unknown internals", () => {
    expect(friendlyDbError('duplicate key value violates unique constraint "x"')).toBe("Something went wrong. Please try again.");
    expect(friendlyDbError(undefined)).toBe("Something went wrong. Please try again.");
  });
});
