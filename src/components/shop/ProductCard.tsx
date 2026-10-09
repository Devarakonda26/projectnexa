import Link from "next/link";
import { formatINR, percentOff } from "@/lib/money";
import { productImageUrl } from "@/lib/storage/public-urls";
import type { ProductCard as Card } from "@/lib/catalogue/queries";

export function StockBadge({ stock }: { stock: Card["stock"] }) {
  if (!stock) return null;
  if (!stock.in_stock) return <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">Out of stock</span>;
  if (stock.low_stock) return <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">Only a few left</span>;
  return <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-900">In stock</span>;
}

export function ProductImage({ path, alt, className = "" }: { path: string | null; alt: string; className?: string }) {
  const src = productImageUrl(path);
  if (!src) {
    return (
      <div aria-hidden className={`flex items-center justify-center bg-slate-100 text-3xl text-slate-400 ${className}`}>
        ⚙
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={`object-cover ${className}`} />;
}

export function ProductCardView({ product }: { product: Card }) {
  const off = percentOff(product.price_paise, product.mrp_paise);
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <Link href={`/products/${product.slug}`} className="block">
        <ProductImage path={product.cover_image_path} alt="" className="aspect-[4/3] w-full" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="rounded bg-blue-50 px-2 py-0.5 font-medium text-blue-900">
            {product.product_type === "digital" ? "Digital project" : "Hardware kit"}
          </span>
          {product.branch ? <span>{product.branch.short_name}</span> : null}
          {product.difficulty ? <span className="capitalize">{product.difficulty}</span> : null}
        </div>
        <h3 className="font-semibold leading-snug">
          <Link href={`/products/${product.slug}`} className="hover:underline">{product.title}</Link>
        </h3>
        <p className="line-clamp-2 text-sm text-slate-600">{product.summary}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <p className="text-lg font-semibold">
            {formatINR(product.price_paise)}
            {off ? (
              <span className="ml-2 text-sm font-normal text-slate-500">
                <s>{formatINR(product.mrp_paise!)}</s> <span className="text-green-800">{off}% off</span>
              </span>
            ) : null}
          </p>
          <StockBadge stock={product.stock} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Card[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <li key={p.id}>
          <ProductCardView product={p} />
        </li>
      ))}
    </ul>
  );
}
