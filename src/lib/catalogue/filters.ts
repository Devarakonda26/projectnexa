import { z } from "zod";

export const SORT_OPTIONS = ["featured", "newest", "price_asc", "price_desc"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(80);
const first = (v: unknown) => (Array.isArray(v) ? v[0] : v);
const opt = <T extends z.ZodType>(s: T) => z.preprocess(first, s.optional().catch(undefined));

export const PAGE_SIZE = 12;

export const listingParamsSchema = z.object({
  q: opt(z.string().trim().max(100)),
  branch: opt(slug),
  category: opt(slug),
  type: opt(z.enum(["digital", "hardware", "custom"])),
  difficulty: opt(z.enum(["beginner", "intermediate", "advanced"])),
  sort: opt(z.enum(SORT_OPTIONS)),
  page: z.preprocess(first, z.coerce.number().int().min(1).max(500).catch(1)),
  min: z.preprocess(first, z.coerce.number().int().min(0).max(1_000_000).optional().catch(undefined)),
  max: z.preprocess(first, z.coerce.number().int().min(0).max(1_000_000).optional().catch(undefined)),
});

export type ListingParams = z.output<typeof listingParamsSchema>;

/** Never throws: anything malformed in the URL falls back to a default instead of an error page. */
export function parseListingParams(raw: Record<string, string | string[] | undefined>): ListingParams {
  return listingParamsSchema.parse(raw);
}

/** Builds a query string, dropping empty/default values. */
export function listingHref(base: string, p: Partial<ListingParams>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || v === "" || (k === "page" && v === 1)) continue;
    usp.set(k, String(v));
  }
  const qs = usp.toString();
  return qs ? `${base}?${qs}` : base;
}
