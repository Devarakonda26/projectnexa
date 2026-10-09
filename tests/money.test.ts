import { describe, expect, it } from "vitest";
import { formatINR, parseRupeesToPaise, percentOff } from "@/lib/money";

describe("formatINR", () => {
  it("uses Indian digit grouping", () => {
    expect(formatINR(129900)).toBe("₹1,299");
    expect(formatINR(10000000)).toBe("₹1,00,000");
    expect(formatINR(0)).toBe("₹0");
  });
  it("shows paise only when present", () => {
    expect(formatINR(129950)).toBe("₹1,299.50");
    expect(formatINR(5)).toBe("₹0.05");
  });
  it("refuses non-integer paise", () => {
    expect(() => formatINR(12.5)).toThrow();
  });
});

describe("parseRupeesToPaise", () => {
  it.each([
    ["1299", 129900],
    ["1,299", 129900],
    ["₹ 1,299.50", 129950],
    ["0.05", 5],
    ["10.5", 1050],
    ["1000000", 100000000],
    ["1,00,000", 10000000],
    ["100,000", 10000000],
    ["  ₹1,299  ", 129900],
  ])("parses %j", (input, expected) => expect(parseRupeesToPaise(input)).toBe(expected));

  it.each(["", "abc", "-5", "1.234", "1e3", "1299.", ".5", "1000000.01", "99999999999999999999", "12 34", "1,2,3", ",100", "1,,000", "1,299,", "₹₹5"])(
    "rejects %j",
    (input) => expect(parseRupeesToPaise(input)).toBeNull(),
  );

  it("avoids floating point error (19.99 is exactly 1999)", () => {
    expect(parseRupeesToPaise("19.99")).toBe(1999);
    expect(parseRupeesToPaise("0.1") ).toBe(10);
  });
});

describe("percentOff", () => {
  it("computes a rounded discount", () => {
    expect(percentOff(249900, 349900)).toBe(29);
  });
  it("returns null when there is no discount", () => {
    expect(percentOff(100, null)).toBeNull();
    expect(percentOff(100, 100)).toBeNull();
    expect(percentOff(100, 50)).toBeNull();
  });
});
