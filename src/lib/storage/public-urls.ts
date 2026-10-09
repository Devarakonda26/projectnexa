import { publicEnv } from "@/lib/env.public";

/** Public product images live in the public `product-images` bucket. Only call with paths from the products table. */
export function productImageUrl(path: string | null | undefined): string | null {
  if (!path || path.includes("..") || path.startsWith("/")) return null;
  const base = publicEnv().NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/product-images/${path.split("/").map(encodeURIComponent).join("/")}`;
}
