import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/dal";
import { formatINR } from "@/lib/money";
import { STATUS_LABEL } from "@/lib/orders/labels";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders/status";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin · Orders", robots: { index: false } };

async function List({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin("/admin/orders");
  const { status } = await searchParams;
  const filter = ORDER_STATUSES.find((s) => s === status);
  const supabase = await createClient();
  let q = supabase.from("orders").select("id, order_number, status, total_paise, payment_method, contact_email, created_at").order("created_at", { ascending: false }).limit(200);
  if (filter) q = q.eq("status", filter);
  const { data } = await q;
  return (
    <>
      <form className="mb-4 flex gap-2" method="get">
        <label htmlFor="status" className="sr-only">Status</label>
        <select id="status" name="status" defaultValue={filter ?? ""} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">Filter</button>
      </form>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Status</th><th className="p-3">Method</th><th className="p-3 text-right">Total</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {(data ?? []).map((o) => (
              <tr key={o.id}>
                <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-medium text-blue-800 underline">{o.order_number}</Link></td>
                <td className="p-3">{o.contact_email}</td>
                <td className="p-3">{STATUS_LABEL[o.status as OrderStatus]}</td>
                <td className="p-3 uppercase">{o.payment_method.replace("_", " ")}</td>
                <td className="p-3 text-right">{formatINR(o.total_paise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  return (
    <main>
      <h1 className="mb-4 text-2xl font-semibold">Orders</h1>
      <Suspense fallback={<p className="text-sm">Loading…</p>}><List searchParams={searchParams} /></Suspense>
    </main>
  );
}
