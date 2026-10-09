import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGrid } from "@/components/shop/ProductCard";
import { SmartImage } from "@/components/shop/SmartImage";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { branchImage } from "@/lib/branch-images";
import { parseListingParams } from "@/lib/catalogue/filters";
import { getBranch, searchProducts } from "@/lib/catalogue/queries";

async function BranchContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) notFound();
  const found = await getBranch(slug);
  if (!found) notFound();
  const { products, total } = await searchProducts(parseListingParams({ branch: slug, sort: "featured" }));
  return (
    <>
      <section className="bg-navy text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_20rem]">
          <div>
            <Breadcrumbs tone="dark" items={[{ label: "Home", href: "/" }, { label: "Engineering branches", href: "/branches" }, { label: found.branch.short_name }]} />
            <h1 className="mt-4 text-3xl font-bold tracking-tight">{found.branch.name}</h1>
            {found.branch.description ? <p className="mt-2 max-w-xl text-slate-300">{found.branch.description}</p> : null}
            {found.categories.length > 0 ? (
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Domains">
                {found.categories.map((c) => (
                  <li key={c.id}>
                    <Link href={`/products?branch=${slug}&category=${c.slug}`} className="inline-block rounded-full border border-white/25 px-3 py-1 text-sm text-white transition-colors hover:bg-white/10">{c.name}</Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <SmartImage src={branchImage(slug)} alt="" priority width={640} height={400} className="hidden w-full rounded-2xl border border-white/10 md:block" />
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {products.length ? (
          <>
            <ProductGrid products={products} />
            {total > products.length ? (
              <p className="mt-8"><Link href={`/products?branch=${slug}`} className="font-semibold text-blue-700 underline">See all {total} {found.branch.short_name} listings</Link></p>
            ) : null}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-slate-700">No projects in this branch yet.</p>
            <Link href="/custom-projects/new" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Request a custom project</Link>
          </div>
        )}
      </div>
    </>
  );
}

export default function BranchPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <main>
      <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10" aria-busy="true"><div className="h-40 animate-pulse rounded-2xl bg-slate-200" /></div>}>
        <BranchContent params={params} />
      </Suspense>
    </main>
  );
}
