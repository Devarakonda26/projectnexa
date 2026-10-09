import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGrid } from "@/components/shop/ProductCard";
import { getBranch, searchProducts } from "@/lib/catalogue/queries";
import { parseListingParams } from "@/lib/catalogue/filters";

async function BranchContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) notFound();
  const found = await getBranch(slug);
  if (!found) notFound();
  const { products } = await searchProducts(parseListingParams({ branch: slug, sort: "featured" }));
  return (
    <>
      <h1 className="text-2xl font-semibold">{found.branch.name}</h1>
      {found.branch.description ? <p className="mt-1 text-slate-600">{found.branch.description}</p> : null}
      {found.categories.length > 0 ? (
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Categories">
          {found.categories.map((c) => (
            <li key={c.id}>
              <Link href={`/products?branch=${slug}&category=${c.slug}`} className="inline-block rounded-full border border-slate-300 bg-white px-3 py-1 text-sm hover:border-blue-700">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-6">
        {products.length ? <ProductGrid products={products} /> : <p className="text-slate-600">No projects in this branch yet.</p>}
        <p className="mt-6"><Link href={`/products?branch=${slug}`} className="text-blue-800 underline">See all {found.branch.short_name} projects</Link></p>
      </div>
    </>
  );
}

export default function BranchPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Suspense fallback={<p className="text-sm">Loading…</p>}>
        <BranchContent params={params} />
      </Suspense>
    </main>
  );
}
