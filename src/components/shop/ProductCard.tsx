import Link from "next/link";
import { DIFFICULTY_LABEL, productKindLabel, productKindTone } from "@/lib/catalogue/labels";
import type { ProductCard as Card } from "@/lib/catalogue/queries";
import { formatINR, percentOff } from "@/lib/money";
import { PLACEHOLDER_IMAGE, productImageUrl } from "@/lib/storage/public-urls";
import { SmartImage } from "./SmartImage";

export function StockBadge({ stock, sample = false }: { stock: Card["stock"]; sample?: boolean }) {
  if (!stock) return null;
  if (!stock.in_stock && sample) return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Sample · stock not set</span>;
  if (!stock.in_stock) return <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">Out of stock</span>;
  if (stock.low_stock) return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">Only a few left</span>;
  return <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-900">In stock</span>;
}

export function ProductImage({ path, alt, className = "", priority = false }: { path: string | null; alt: string; className?: string; priority?: boolean }) {
  return <SmartImage src={productImageUrl(path) ?? PLACEHOLDER_IMAGE} alt={alt} className={`object-cover ${className}`} priority={priority} />;
}

export function PriceLine({ p, size = "md" }: { p: Pick<Card, "price_paise" | "mrp_paise" | "is_quote_only">; size?: "md" | "lg" }) {
  if (p.is_quote_only) return <p className={`${size === "lg" ? "text-2xl" : "text-base"} font-semibold text-slate-900`}>Quote on request</p>;
  const off = percentOff(p.price_paise, p.mrp_paise);
  return (
    <p className={`${size === "lg" ? "text-3xl" : "text-lg"} font-bold text-slate-900`}>
      {formatINR(p.price_paise)}
      {off ? (
        <span className={`ml-2 font-normal text-slate-500 ${size === "lg" ? "text-base" : "text-sm"}`}>
          <s>{formatINR(p.mrp_paise!)}</s> <span className="font-medium text-green-700">{off}% off</span>
        </span>
      ) : null}
    </p>
  );
}

export function ProductCardView({ product }: { product: Card }) {
  const href = `/products/${product.slug}`;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 motion-safe:hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg">
      <Link href={href} tabIndex={-1} aria-hidden="true" className="relative block overflow-hidden bg-navy">
        <ProductImage path={product.cover_image_path} alt="" className="aspect-[4/3] w-full transition-transform duration-300 motion-safe:group-hover:scale-[1.03]" />
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${productKindTone(product)}`}>{productKindLabel(product)}</span>
        {product.is_sample ? <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">Sample</span> : null}
      </Link>
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <p className="flex flex-wrap items-center gap-x-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          {product.branch ? <span className="text-blue-700">{product.branch.short_name}</span> : null}
          {product.category ? <><span aria-hidden="true">·</span><span>{product.category.name}</span></> : null}
          {product.difficulty ? <><span aria-hidden="true">·</span><span>{DIFFICULTY_LABEL[product.difficulty]}</span></> : null}
        </p>
        <h3 className="text-lg font-semibold leading-snug text-slate-900">
          <Link href={href} className="after:absolute after:inset-0 hover:text-blue-700">{product.title}</Link>
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">{product.summary}</p>
        {product.tech_stack.length ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Technologies">
            {product.tech_stack.slice(0, 3).map((t) => <li key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{t}</li>)}
            {product.tech_stack.length > 3 ? <li className="px-1 py-0.5 text-xs text-slate-500">+{product.tech_stack.length - 3}</li> : null}
          </ul>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <PriceLine p={product} />
          <StockBadge stock={product.stock} sample={product.is_sample} />
        </div>
        <span className="mt-1 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors group-hover:bg-blue-700">View details</span>
      </div>
    </article>
  );
}

/** `relative` is needed because the whole card is clickable through the title link's ::after. */
export function ProductGrid({ products }: { products: Card[] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <li key={p.id} className="relative">
          <ProductCardView product={p} />
        </li>
      ))}
    </ul>
  );
}
