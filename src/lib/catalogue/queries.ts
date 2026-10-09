import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, type ListingParams } from "./filters";
import { toPrefixTsQuery } from "./search";

export type Branch = { id: string; slug: string; name: string; short_name: string; description: string | null };
export type Category = { id: string; branch_id: string; slug: string; name: string };

export type ProductCard = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  product_type: "digital" | "hardware";
  /** Custom services: shown with "Request a quote" instead of a cart button. */
  is_quote_only: boolean;
  /** Demonstration listing (not a real, built product). */
  is_sample: boolean;
  price_paise: number;
  mrp_paise: number | null;
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  tech_stack: string[];
  cover_image_path: string | null;
  is_featured: boolean;
  branch: { slug: string; short_name: string } | null;
  category?: { slug: string; name: string } | null;
  stock?: { in_stock: boolean; low_stock: boolean } | null;
};

const CARD_COLUMNS =
  "id, slug, title, summary, product_type, is_quote_only, is_sample, price_paise, mrp_paise, difficulty, tech_stack, cover_image_path, is_featured, branch:branches(slug, short_name), category:categories(slug, name)";

/** Public client: anon key + cookies, RLS limits everything to published rows. */
export async function listBranches(): Promise<Branch[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("branches")
    .select("id, slug, name, short_name, description")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  return (data ?? []) as Branch[];
}

export async function getBranch(slug: string) {
  const supabase = await createClient();
  const { data: branch } = await supabase
    .from("branches")
    .select("id, slug, name, short_name, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!branch) return null;
  const { data: categories } = await supabase
    .from("categories")
    .select("id, branch_id, slug, name")
    .eq("branch_id", branch.id)
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  return { branch: branch as Branch, categories: (categories ?? []) as Category[] };
}

async function attachStock(cards: ProductCard[]): Promise<ProductCard[]> {
  const hardwareIds = cards.filter((c) => c.product_type === "hardware").map((c) => c.id);
  if (hardwareIds.length === 0) return cards;
  const supabase = await createClient();
  const { data } = await supabase.from("public_stock_status").select("product_id, in_stock, low_stock").in("product_id", hardwareIds);
  const byId = new Map((data ?? []).map((r) => [r.product_id as string, { in_stock: !!r.in_stock, low_stock: !!r.low_stock }]));
  return cards.map((c) => (c.product_type === "hardware" ? { ...c, stock: byId.get(c.id) ?? { in_stock: false, low_stock: false } } : c));
}

export async function listFeatured(limit = 8): Promise<ProductCard[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(CARD_COLUMNS)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return attachStock((data ?? []) as unknown as ProductCard[]);
}

/** Featured hardware kits (the "Featured hardware kits" home-page section). */
export async function listFeaturedKits(limit = 4): Promise<ProductCard[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(CARD_COLUMNS)
    .eq("status", "published")
    .eq("product_type", "hardware")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return attachStock((data ?? []) as unknown as ProductCard[]);
}

/** Other published products from the same branch (same domain first), never the product itself. */
export async function listRelated(product: { id: string; branchSlug: string | null; categorySlug: string | null }, limit = 4): Promise<ProductCard[]> {
  if (!product.branchSlug) return [];
  const found = await getBranch(product.branchSlug);
  if (!found) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(CARD_COLUMNS)
    .eq("status", "published")
    .eq("branch_id", found.branch.id)
    .neq("id", product.id)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit + 8);
  const rows = (data ?? []) as unknown as ProductCard[];
  rows.sort((x, y) => Number(y.category?.slug === product.categorySlug) - Number(x.category?.slug === product.categorySlug));
  return attachStock(rows.slice(0, limit));
}

export async function searchProducts(params: ListingParams) {
  const supabase = await createClient();
  let branchId: string | undefined;
  let categoryId: string | undefined;

  if (params.branch) {
    const found = await getBranch(params.branch);
    if (!found) return { products: [], total: 0, pageSize: PAGE_SIZE };
    branchId = found.branch.id;
    if (params.category) {
      categoryId = found.categories.find((c) => c.slug === params.category)?.id;
      if (!categoryId) return { products: [], total: 0, pageSize: PAGE_SIZE };
    }
  }

  let query = supabase.from("products").select(CARD_COLUMNS, { count: "exact" }).eq("status", "published");
  if (branchId) query = query.eq("branch_id", branchId);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (params.type === "custom") query = query.eq("is_quote_only", true);
  else if (params.type === "digital") query = query.eq("product_type", "digital").eq("is_quote_only", false);
  else if (params.type === "hardware") query = query.eq("product_type", "hardware");
  if (params.difficulty) query = query.eq("difficulty", params.difficulty);
  if (params.min !== undefined) query = query.gte("price_paise", params.min * 100);
  if (params.max !== undefined) query = query.lte("price_paise", params.max * 100);

  const ts = params.q ? toPrefixTsQuery(params.q) : null;
  if (ts) query = query.textSearch("search_vector", ts, { config: "simple" });

  switch (params.sort) {
    case "price_asc": query = query.order("price_paise", { ascending: true }); break;
    case "price_desc": query = query.order("price_paise", { ascending: false }); break;
    case "newest": query = query.order("created_at", { ascending: false }); break;
    default: query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
  }
  query = query.order("id"); // stable pagination

  const from = (params.page - 1) * PAGE_SIZE;
  const { data, count } = await query.range(from, from + PAGE_SIZE - 1);
  return { products: await attachStock((data ?? []) as unknown as ProductCard[]), total: count ?? 0, pageSize: PAGE_SIZE };
}

export type ProductDetail = ProductCard & {
  description: string;
  cod_eligible: boolean;
  weight_grams: number | null;
  tags: string[];
  sku: string | null;
  subdomain: string | null;
  estimated_time: string | null;
  features: string[];
  deliverables: string[];
  software_requirements: string[];
  hardware_requirements: string[];
  faq: { q: string; a: string }[];
  gallery_paths: string[];
};

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(`${CARD_COLUMNS}, description, weight_grams, cod_eligible, tags, sku, subdomain, estimated_time, features, deliverables, software_requirements, hardware_requirements, faq, gallery_paths`)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return null;
  const detail = data as unknown as ProductDetail;
  const [withStock] = await attachStock([detail]);
  return { ...detail, stock: withStock.stock };
}
