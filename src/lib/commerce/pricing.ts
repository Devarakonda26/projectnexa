/**
 * Display-only estimate of what checkout will charge. The database (`place_order`) recomputes everything from the
 * products table and store_settings, so a mistake here can never change what a customer is billed.
 * Rules mirrored from place_order: digital items are quantity 1, shipping applies to hardware only,
 * free shipping at/above the threshold, COD needs all-hardware + every item cod_eligible + total within the limit.
 */
export type CartLine = { priceP: number; quantity: number; type: "digital" | "hardware"; codEligible: boolean };
export type Settings = { shippingFlatPaise: number; freeShippingThresholdPaise: number; codMaxTotalPaise: number };

export type Totals = {
  subtotalPaise: number;
  shippingPaise: number;
  totalPaise: number;
  hasPhysical: boolean;
  hasDigital: boolean;
  codAvailable: boolean;
  codReason: string | null;
};

export function computeTotals(lines: CartLine[], s: Settings): Totals {
  const subtotalPaise = lines.reduce((sum, l) => sum + l.priceP * (l.type === "digital" ? 1 : l.quantity), 0);
  const hasPhysical = lines.some((l) => l.type === "hardware");
  const hasDigital = lines.some((l) => l.type === "digital");
  const shippingPaise = hasPhysical ? (s.freeShippingThresholdPaise > 0 && subtotalPaise >= s.freeShippingThresholdPaise ? 0 : s.shippingFlatPaise) : 0;
  const totalPaise = subtotalPaise + shippingPaise;

  let codReason: string | null = null;
  if (!hasPhysical) codReason = "Cash on delivery is only for hardware kits.";
  else if (hasDigital) codReason = "Cash on delivery is not available when your cart has digital downloads.";
  else if (lines.some((l) => !l.codEligible)) codReason = "One or more items are not eligible for cash on delivery.";
  else if (totalPaise > s.codMaxTotalPaise) codReason = "This order is above the cash-on-delivery limit.";

  return { subtotalPaise, shippingPaise, totalPaise, hasPhysical, hasDigital, codAvailable: codReason === null, codReason };
}
