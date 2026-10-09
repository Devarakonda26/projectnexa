import Link from "next/link";
import { Suspense } from "react";
import { ProductGrid } from "@/components/shop/ProductCard";
import { SearchBox } from "@/components/shop/SearchBox";
import { listBranches, listFeatured } from "@/lib/catalogue/queries";

async function BranchChips() {
  const branches = await listBranches();
  return (
    <ul className="flex flex-wrap gap-2">
      {branches.map((b) => (
        <li key={b.id}>
          <Link href={`/branches/${b.slug}`} className="inline-block rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium hover:border-blue-700 hover:text-blue-800">
            {b.short_name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function Featured() {
  const products = await listFeatured(8);
  if (products.length === 0) return <p className="text-slate-600">New projects are being added. Check back soon.</p>;
  return <ProductGrid products={products} />;
}

export default function Home() {
  return (
    <main>
      <section className="bg-blue-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
            Engineering projects, hardware kits and custom builds for your degree.
          </h1>
          <p className="mt-3 max-w-xl text-blue-100">
            Ready-made project packages, tested component kits delivered across India, or a project built to your brief.
          </p>
          <div className="mt-6 max-w-xl text-slate-900"><SearchBox /></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="mb-4 text-xl font-semibold">Browse by branch</h2>
        <Suspense fallback={<p className="text-sm text-slate-600">Loading branches…</p>}>
          <BranchChips />
        </Suspense>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Featured projects</h2>
          <Link href="/products" className="text-sm text-blue-800 underline">View all</Link>
        </div>
        <Suspense fallback={<p className="text-sm text-slate-600">Loading projects…</p>}>
          <Featured />
        </Suspense>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold">Need something built just for you?</h2>
          <p className="mt-1 text-slate-600">Describe your requirements, get a quotation, and track the project milestone by milestone.</p>
          <Link href="/custom-projects" className="mt-4 inline-block rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800">
            Request a custom project
          </Link>
        </div>
      </section>
    </main>
  );
}
