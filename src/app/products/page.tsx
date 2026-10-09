import Link from "next/link";
import { Suspense } from "react";
import { Pagination } from "@/components/shop/Pagination";
import { ProductGrid } from "@/components/shop/ProductCard";
import { SORT_OPTIONS, parseListingParams } from "@/lib/catalogue/filters";
import { listBranches, searchProducts, getBranch } from "@/lib/catalogue/queries";

export const metadata = { title: "Projects & kits" };

const SORT_LABEL: Record<(typeof SORT_OPTIONS)[number], string> = {
  featured: "Featured",
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
};

async function Listing({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = parseListingParams(await searchParams);
  const [branches, result, current] = await Promise.all([
    listBranches(),
    searchProducts(params),
    params.branch ? getBranch(params.branch) : Promise.resolve(null),
  ]);
  const sel = "block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm";

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
      <form method="get" action="/products" className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 text-sm lg:self-start">
        <div>
          <label htmlFor="q" className="mb-1 block font-medium">Search</label>
          <input id="q" name="q" defaultValue={params.q ?? ""} maxLength={100} className={sel} />
        </div>
        <div>
          <label htmlFor="branch" className="mb-1 block font-medium">Branch</label>
          <select id="branch" name="branch" defaultValue={params.branch ?? ""} className={sel}>
            <option value="">All branches</option>
            {branches.map((b) => <option key={b.id} value={b.slug}>{b.short_name}</option>)}
          </select>
        </div>
        {current && current.categories.length ? (
          <div>
            <label htmlFor="category" className="mb-1 block font-medium">Category</label>
            <select id="category" name="category" defaultValue={params.category ?? ""} className={sel}>
              <option value="">All categories</option>
              {current.categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
        ) : null}
        <div>
          <label htmlFor="type" className="mb-1 block font-medium">Type</label>
          <select id="type" name="type" defaultValue={params.type ?? ""} className={sel}>
            <option value="">Digital and hardware</option>
            <option value="digital">Digital project</option>
            <option value="hardware">Hardware kit</option>
          </select>
        </div>
        <div>
          <label htmlFor="difficulty" className="mb-1 block font-medium">Difficulty</label>
          <select id="difficulty" name="difficulty" defaultValue={params.difficulty ?? ""} className={sel}>
            <option value="">Any</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="min" className="mb-1 block font-medium">Min ₹</label>
            <input id="min" name="min" type="number" min={0} max={1000000} defaultValue={params.min ?? ""} className={sel} />
          </div>
          <div>
            <label htmlFor="max" className="mb-1 block font-medium">Max ₹</label>
            <input id="max" name="max" type="number" min={0} max={1000000} defaultValue={params.max ?? ""} className={sel} />
          </div>
        </div>
        <div>
          <label htmlFor="sort" className="mb-1 block font-medium">Sort by</label>
          <select id="sort" name="sort" defaultValue={params.sort ?? "featured"} className={sel}>
            {SORT_OPTIONS.map((s) => <option key={s} value={s}>{SORT_LABEL[s]}</option>)}
          </select>
        </div>
        <button className="w-full rounded-md bg-blue-700 px-3 py-2 font-medium text-white hover:bg-blue-800">Apply filters</button>
        <Link href="/products" className="block text-center text-blue-800 underline">Clear all</Link>
      </form>

      <section aria-live="polite">
        <p className="mb-4 text-sm text-slate-600">
          {result.total} {result.total === 1 ? "result" : "results"}
          {params.q ? <> for “{params.q}”</> : null}
        </p>
        {result.products.length ? (
          <ProductGrid products={result.products} />
        ) : (
          <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-600">
            Nothing matches these filters. Try removing some, or <a href="/custom-projects" className="text-blue-800 underline">request a custom project</a>.
          </p>
        )}
        <Pagination base="/products" params={params} total={result.total} pageSize={result.pageSize} />
      </section>
    </div>
  );
}

export default function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Projects &amp; kits</h1>
      <Suspense fallback={<p className="text-sm">Loading…</p>}>
        <Listing searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
