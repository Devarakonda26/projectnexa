import type { ProductCard } from "./queries";

type Kind = Pick<ProductCard, "product_type" | "is_quote_only">;

export function productKindLabel(p: Kind): string {
  if (p.is_quote_only) return "Custom project";
  return p.product_type === "digital" ? "Digital project" : "Hardware kit";
}

/** Tailwind classes for the small type badge. */
export function productKindTone(p: Kind): string {
  if (p.is_quote_only) return "bg-violet-100 text-violet-900";
  return p.product_type === "digital" ? "bg-blue-100 text-blue-900" : "bg-emerald-100 text-emerald-900";
}

export const DIFFICULTY_LABEL = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" } as const;
