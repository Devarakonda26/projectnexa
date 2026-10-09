import { Suspense } from "react";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin · New product", robots: { index: false } };

async function Form() {
  await requireAdmin("/admin/products/new");
  const supabase = await createClient();
  const [{ data: branches }, { data: categories }] = await Promise.all([
    supabase.from("branches").select("id, name").order("sort_order"),
    supabase.from("categories").select("id, name, branch_id").order("name"),
  ]);
  return <ProductForm branches={branches ?? []} categories={categories ?? []} />;
}

export default function NewProductPage() {
  return (
    <main>
      <h1 className="mb-4 text-2xl font-semibold">New product</h1>
      <Suspense fallback={<p className="text-sm">Loading…</p>}><Form /></Suspense>
    </main>
  );
}
