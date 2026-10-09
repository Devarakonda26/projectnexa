import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

async function Overview() {
  const admin = await requireAdmin("/admin");
  const supabase = await createClient();
  const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;

  const [toVerify, cod, toShip, requests, inv] = await Promise.all([
    count(supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "submitted")),
    count(supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending_confirmation")),
    count(supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["paid", "processing"]).eq("has_physical", true)),
    count(supabase.from("custom_requests").select("id", { count: "exact", head: true }).in("status", ["submitted", "under_review"])),
    supabase.from("inventory").select("quantity_on_hand, low_stock_threshold"),
  ]);
  const low = (inv.data ?? []).filter((r) => r.quantity_on_hand <= r.low_stock_threshold).length;

  const cards: [string, number, string][] = [
    ["Payments to verify", toVerify, "/admin/payments"],
    ["COD orders to confirm", cod, "/admin/orders?status=pending_confirmation"],
    ["Orders to pack / ship", toShip, "/admin/orders?status=processing"],
    ["New custom requests", requests, "/admin/requests"],
    ["Low or out of stock", low, "/admin/inventory"],
  ];
  return (
    <>
      <p className="mb-4 text-sm text-slate-600">Signed in as {admin.email}</p>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, n, href]) => (
          <li key={label}>
            <Link href={href} className="block rounded-lg border border-slate-200 bg-white p-5 hover:border-blue-700">
              <p className="text-3xl font-bold">{n}</p>
              <p className="text-sm text-slate-600">{label}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function AdminPage() {
  return (
    <main>
      <h1 className="mb-4 text-2xl font-semibold">Admin dashboard</h1>
      <Suspense fallback={<p className="text-sm">Loading…</p>}><Overview /></Suspense>
    </main>
  );
}
