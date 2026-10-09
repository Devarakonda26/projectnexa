import Link from "next/link";
import { Suspense } from "react";
import { Pagination } from "@/components/shop/Pagination";
import { ProductGrid } from "@/components/shop/ProductCard";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SORT_OPTIONS, listingHref, parseListingParams } from "@/lib/catalogue/filters";
import { getBranch, listBranches, searchProducts } from "@/lib/catalogue/queries";

export const metadata = {
  title: "Engineering projects & kits",
  description: "Browse digital engineering projects, hardware kits and custom-built solutions by branch, domain and type.",
};

const SORT_LABEL: Record<(typeof SORT_OPTIONS)[number], string> = {
  featured: "Featured",
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
};

const TYPE_TABS = [
  { value: "", label: "All" },
  { value: "digital", label: "Digital projects" },
  { value: "hardware", label: "Hardware kits" },
  { value: "custom", label: "Custom projects" },
] as const;

const field = "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600";

async function Listing({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = parseListingParams(await searchParams);
  const [branches, result, current] = await Promise.all([
    listBranches(),
    searchProducts(params),
    params.branch ? getBranch(params.branch) : Promise.resolve(null),
  ]);
  const activeFilters = [params.q, params.branch, params.category, params.type, params.difficulty, params.min, params.max].filter((v) => v !== undefined && v !== "").length;

  const filters = (
    <form method="get" action="/products" className="space-y-4 text-sm">
      <input type="hidden" name="type" value={params.type ?? ""} />
      <div>
        <label htmlFor="q" className="mb-1 block font-medium text-slate-800">Search</label>
        <input id="q" name="q" type="search" defaultValue={params.q ?? ""} maxLength={100} placeholder="Title, topic or technology" className={field} />
      </div>
      <div>
        <label htmlFor="branch" className="mb-1 block font-medium text-slate-800">Engineering branch</label>
        <select id="branch" name="branch" defaultValue={params.branch ?? ""} className={field}>
          <option value="">All branches</option>
          {branches.map((b) => <option key={b.id} value={b.slug}>{b.short_name} – {b.name}</option>)}
        </select>
      </div>
      {current && current.categories.length ? (
        <div>
          <label htmlFor="category" className="mb-1 block font-medium text-slate-800">Domain</label>
          <select id="category" name="category" defaultValue={params.category ?? ""} className={field}>
            <option value="">All domains</option>
            {current.categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
      ) : null}
      <div>
        <label htmlFor="difficulty" className="mb-1 block font-medium text-slate-800">Difficulty</label>
        <select id="difficulty" name="difficulty" defaultValue={params.difficulty ?? ""} className={field}>
          <option value="">Any</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="min" className="mb-1 block font-medium text-slate-800">Min ₹</label>
          <input id="min" name="min" type="number" inputMode="numeric" min={0} max={1000000} defaultValue={params.min ?? ""} className={field} />
        </div>
        <div>
          <label htmlFor="max" className="mb-1 block font-medium text-slate-800">Max ₹</label>
          <input id="max" name="max" type="number" inputMode="numeric" min={0} max={1000000} defaultValue={params.max ?? ""} className={field} />
        </div>
      </div>
      <div>
        <label htmlFor="sort" className="mb-1 block font-medium text-slate-800">Sort by</label>
        <select id="sort" name="sort" defaultValue={params.sort ?? "featured"} className={field}>
          {SORT_OPTIONS.map((s) => <option key={s} value={s}>{SORT_LABEL[s]}</option>)}
        </select>
      </div>
      <button className="w-full rounded-lg bg-blue-600 px-3 py-2.5 font-semibold text-white hover:bg-blue-700">Apply filters</button>
      <Link href="/products" className="block text-center font-medium text-blue-700 underline">Clear all</Link>
    </form>
  );

  return (
    <>
      <nav aria-label="Project type" className="mb-6 flex flex-wrap gap-2">
        {TYPE_TABS.map((t) => {
          const active = (params.type ?? "") === t.value;
          return (
            <Link
              key={t.value}
              href={listingHref("/products", { ...params, type: (t.value || undefined) as typeof params.type, page: 1 })}
              aria-current={active ? "page" : undefined}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700"}`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
        <aside className="lg:self-start">
          <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden" open={activeFilters > 1}>
            <summary className="cursor-pointer text-sm font-semibold text-slate-900">
              Filters &amp; sorting{activeFilters ? ` (${activeFilters})` : ""}
            </summary>
            <div className="mt-4">{filters}</div>
          </details>
          <div className="hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:block">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Filters</h2>
            {filters}
          </div>
        </aside>

        <section aria-live="polite" aria-label="Results">
          <p className="mb-4 text-sm text-slate-600">
            {result.total} {result.total === 1 ? "result" : "results"}
            {params.q ? <> for “{params.q}”</> : null}
          </p>
          {result.products.length ? (
            <ProductGrid products={result.products} />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h2 className="text-lg font-semibold text-slate-900">Nothing matches these filters</h2>
              <p className="mt-2 text-sm text-slate-600">Try removing a filter or using a shorter search. Can&rsquo;t find what you need? We build to order.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link href="/products" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">Clear filters</Link>
                <Link href="/custom-projects/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Request a custom project</Link>
              </div>
            </div>
          )}
          <Pagination base="/products" params={params} total={result.total} pageSize={result.pageSize} />
        </section>
      </div>
    </>
  );
}

function ListingSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading projects">
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200" />)}
    </div>
  );
}

export default function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Projects & kits" }]} />
      <h1 className="mb-1 text-3xl font-bold tracking-tight text-slate-900">Engineering projects &amp; kits</h1>
      <p className="mb-6 max-w-2xl text-slate-600">Digital projects, practical hardware kits and custom-built solutions across every engineering branch.</p>
      <Suspense fallback={<ListingSkeleton />}>
        <Listing searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
