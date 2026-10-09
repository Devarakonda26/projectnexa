import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/dal";
import { formatINR } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin · Products", robots: { index: false } };

async function List() {
  await requireAdmin("/admin/products");
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("id, title, slug, product_type, status, price_paise, is_featured, updated_at").order("updated_at", { ascending: false }).limit(300);
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr><th className="p-3">Title</th><th className="p-3">Type</th><th className="p-3">Status</th><th className="p-3">Price</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {(data ?? []).map((p) => (
            <tr key={p.id}>
              <td className="p-3"><Link href={`/admin/products/${p.id}`} className="font-medium text-blue-800 underline">{p.title}</Link>{p.is_featured ? <span className="ml-2 text-xs text-amber-800">★ featured</span> : null}</td>
              <td className="p-3 capitalize">{p.product_type}</td>
              <td className="p-3 capitalize">{p.status}</td>
              <td className="p-3">{formatINR(p.price_paise)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <main>
      <div className="mb-4 flex items-center justify-between"><h1 className="text-2xl font-semibold">Products</h1><Link href="/admin/products/new" className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800">New product</Link></div>
      <Suspense fallback={<p className="text-sm">Loading…</p>}><List /></Suspense>
    </main>
  );
}
