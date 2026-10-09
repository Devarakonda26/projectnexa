/** All amounts are integer paise (1 INR = 100 paise). Floating-point rupees are never stored. */

const MAX_PAISE = 100_000_000; // INR 10,00,000 - matches the DB check on products

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const inrWhole = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function formatINR(paise: number): string {
  if (!Number.isInteger(paise)) throw new Error("formatINR expects integer paise");
  const rupees = paise / 100;
  return paise % 100 === 0 ? inrWhole.format(rupees) : inr.format(rupees);
}

/**
 * Parses text typed by an admin ("1,299", "1299.5", "₹ 1,299.50") into integer paise.
 * Returns null for anything ambiguous: negatives, more than 2 decimals, scientific notation, junk.
 */
export function parseRupeesToPaise(input: string): number | null {
  // Only a leading "₹" and surrounding spaces are tolerated. Spaces inside the number are ambiguous ("12 34"), so reject them.
  const trimmed = input.trim().replace(/^₹\s*/, "");
  // Plain digits, or digits with Indian (1,00,000) / Western (100,000) comma grouping. Malformed grouping like "1,2,3" is rejected.
  if (!/^(\d+|\d{1,3}(,\d{2,3})+)(\.\d{1,2})?$/.test(trimmed)) return null;
  const cleaned = trimmed.replace(/,/g, "");
  const [whole, fraction = ""] = cleaned.split(".");
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(paise) || paise > MAX_PAISE) return null;
  return paise;
}

export function percentOff(pricePaise: number, mrpPaise: number | null | undefined): number | null {
  if (!mrpPaise || mrpPaise <= pricePaise) return null;
  return Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100);
}
