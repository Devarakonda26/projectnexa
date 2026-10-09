import Link from "next/link";
import { listingHref, type ListingParams } from "@/lib/catalogue/filters";

export function Pagination({ base, params, total, pageSize }: { base: string; params: ListingParams; total: number; pageSize: number }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const link = (page: number) => listingHref(base, { ...params, page });
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-between text-sm">
      {params.page > 1 ? <Link href={link(params.page - 1)} className="rounded border px-3 py-1.5 hover:bg-slate-100">← Previous</Link> : <span />}
      <span>Page {Math.min(params.page, pages)} of {pages}</span>
      {params.page < pages ? <Link href={link(params.page + 1)} className="rounded border px-3 py-1.5 hover:bg-slate-100">Next →</Link> : <span />}
    </nav>
  );
}
