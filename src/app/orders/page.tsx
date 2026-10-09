import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/dal";
import { formatINR } from "@/lib/money";
import { STATUS_LABEL } from "@/lib/orders/labels";
import type { OrderStatus } from "@/lib/orders/status";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "My orders" };

async function OrderList() {
  const user = await requireUser("/orders");
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, status, total_paise, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (!data?.length) {
    return <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-600">No orders yet. <Link href="/products" className="text-blue-800 underline">Browse projects</Link></p>;
  }
  return (
    <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
      {data.map((o) => (
        <li key={o.id}>
          <Link href={`/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-slate-50">
            <span>
              <span className="font-medium">{o.order_number}</span>
              <span className="ml-3 text-sm text-slate-600">{new Date(o.created_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" })}</span>
            </span>
            <span className="flex items-center gap-4 text-sm">
              <span className="rounded bg-slate-100 px-2 py-0.5">{STATUS_LABEL[o.status as OrderStatus]}</span>
              <span className="font-semibold">{formatINR(o.total_paise)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function OrdersPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">My orders</h1>
      <Suspense fallback={<p className="text-sm">Loading…</p>}>
        <OrderList />
      </Suspense>
    </main>
  );
}
