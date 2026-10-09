import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCart } from "@/components/shop/AddToCart";
import { ProductImage, StockBadge } from "@/components/shop/ProductCard";
import { getProductBySlug } from "@/lib/catalogue/queries";
import { formatINR, percentOff } from "@/lib/money";

type Props = { params: Promise<{ slug: string }> };
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!SLUG.test(slug)) return {};
  const product = await getProductBySlug(slug);
  return product ? { title: product.title, description: product.summary } : {};
}

async function ProductContent({ params }: Props) {
  const { slug } = await params;
  if (!SLUG.test(slug)) notFound();
  const p = await getProductBySlug(slug);
  if (!p) notFound();

  const hardware = p.product_type === "hardware";
  const off = percentOff(p.price_paise, p.mrp_paise);
  const soldOut = hardware && p.stock ? !p.stock.in_stock : false;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <ProductImage path={p.cover_image_path} alt={p.title} className="aspect-[4/3] w-full rounded-lg" />
      <div>
        <p className="text-sm text-slate-600">
          {p.branch ? <Link href={`/branches/${p.branch.slug}`} className="underline">{p.branch.short_name}</Link> : null}
          {p.category ? <> · {p.category.name}</> : null}
          {p.difficulty ? <> · <span className="capitalize">{p.difficulty}</span></> : null}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{p.title}</h1>
        <p className="mt-2 text-slate-700">{p.summary}</p>
        <p className="mt-4 text-3xl font-bold">
          {formatINR(p.price_paise)}
          {off ? <span className="ml-3 text-base font-normal text-slate-500"><s>{formatINR(p.mrp_paise!)}</s> <span className="text-green-800">{off}% off</span></span> : null}
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
          {hardware ? <>Hardware kit · shipped across India <StockBadge stock={p.stock} /></> : "Digital project package · download after payment is verified"}
        </p>
        {hardware && p.cod_eligible ? <p className="mt-1 text-sm text-slate-600">Cash on delivery available for eligible orders.</p> : null}
        <div className="mt-6"><AddToCart productId={p.id} hardware={hardware} disabled={soldOut} returnTo={`/products/${p.slug}`} /></div>
        {p.tech_stack.length ? (
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Technologies">
            {p.tech_stack.map((t) => <li key={t} className="rounded bg-slate-100 px-2 py-1 text-xs">{t}</li>)}
          </ul>
        ) : null}
      </div>
      {p.description ? (
        <section className="md:col-span-2">
          <h2 className="mb-2 text-lg font-semibold">About this project</h2>
          {/* Plain text only: rendered as text, never as HTML. */}
          <div className="max-w-3xl whitespace-pre-line text-slate-800">{p.description}</div>
        </section>
      ) : null}
    </div>
  );
}

export default function ProductPage({ params }: Props) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Suspense fallback={<p className="text-sm">Loading…</p>}>
        <ProductContent params={params} />
      </Suspense>
    </main>
  );
}
