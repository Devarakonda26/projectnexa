import Link from "next/link";
import { listingHref, type ListingParams } from "@/lib/catalogue/filters";

export function Pagination({ base, params, total, pageSize }: { base: string; params: ListingParams; total: number; pageSize: number }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const link = (page: number) => listingHref(base, { ...params, page });
  const btn = "rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-800 hover:border-blue-400 hover:text-blue-700";
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-between text-sm">
      {params.page > 1 ? <Link href={link(params.page - 1)} className={btn}>← Previous</Link> : <span />}
      <span className="text-slate-600">Page {Math.min(params.page, pages)} of {pages}</span>
      {params.page < pages ? <Link href={link(params.page + 1)} className={btn}>Next →</Link> : <span />}
    </nav>
  );
}
