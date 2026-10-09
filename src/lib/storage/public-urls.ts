import { publicEnv } from "@/lib/env.public";

/** Pictures shipped with the site (generated illustrations) live under /images and are served as static files. */
const LOCAL_IMAGE = /^\/images\/[a-z0-9][a-z0-9/_-]*\.(svg|webp|png|jpg)$/;

/**
 * Product pictures are either a static file shipped with the site ("/images/...") or an upload in the public
 * `product-images` bucket. Only call with paths from the products table.
 */
export function productImageUrl(path: string | null | undefined): string | null {
  if (!path || path.includes("..")) return null;
  if (path.startsWith("/")) return LOCAL_IMAGE.test(path) ? path : null;
  const base = publicEnv().NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/product-images/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export const PLACEHOLDER_IMAGE = "/images/placeholder.svg";
