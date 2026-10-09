import { Suspense } from "react";
import { ActionForm, inputCls } from "@/components/admin/ActionForm";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { adjustStockAction } from "../actions";

export const metadata = { title: "Admin · Inventory", robots: { index: false } };

async function Stock() {
  await requireAdmin("/admin/inventory");
  const supabase = await createClient();
  const { data } = await supabase.from("inventory").select("product_id, quantity_on_hand, low_stock_threshold, product:products(title, status)").order("quantity_on_hand");
  const { data: moves } = await supabase.from("inventory_movements").select("id, product_id, delta, reason, note, created_at, product:products(title)").order("created_at", { ascending: false }).limit(20);
  return (
    <>
      <ul className="space-y-3">
        {(data ?? []).map((r) => {
          const p = r.product as unknown as { title: string; status: string } | null;
          const out = r.quantity_on_hand === 0;
          const low = !out && r.quantity_on_hand <= r.low_stock_threshold;
          return (
            <li key={r.product_id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{p?.title} <span className="text-xs text-slate-500">({p?.status})</span></p>
                <p className="text-sm"><strong>{r.quantity_on_hand}</strong> in stock {out ? <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-red-900">Out</span> : low ? <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-amber-900">Low</span> : null}</p>
              </div>
              <ActionForm action={adjustStockAction} submitLabel="Apply" className="mt-3 flex flex-wrap items-end gap-3">
                <input type="hidden" name="productId" value={r.product_id} />
                <div><label className="mb-1 block text-xs font-medium" htmlFor={`d-${r.product_id}`}>Change (+/-)</label><input id={`d-${r.product_id}`} name="delta" required inputMode="numeric" className={`${inputCls} w-24`} placeholder="+10" /></div>
                <div><label className="mb-1 block text-xs font-medium" htmlFor={`r-${r.product_id}`}>Reason</label>
                  <select id={`r-${r.product_id}`} name="reason" className={inputCls}><option value="restock">Restock</option><option value="correction">Stock count correction</option><option value="manual_adjustment">Other adjustment</option></select></div>
                <div><label className="mb-1 block text-xs font-medium" htmlFor={`n-${r.product_id}`}>Note</label><input id={`n-${r.product_id}`} name="note" maxLength={300} className={inputCls} /></div>
              </ActionForm>
            </li>
          );
        })}
      </ul>
      <h2 className="mb-2 mt-8 font-semibold">Recent stock movements</h2>
      <ul className="space-y-1 text-sm">
        {(moves ?? []).map((m) => <li key={m.id}>{new Date(m.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "short" })} · {(m.product as unknown as { title: string } | null)?.title} · {m.delta > 0 ? "+" : ""}{m.delta} · {m.reason.replaceAll("_", " ")}{m.note ? ` · ${m.note}` : ""}</li>)}
      </ul>
    </>
  );
}

export default function AdminInventoryPage() {
  return <main><h1 className="mb-4 text-2xl font-semibold">Inventory</h1><Suspense fallback={<p className="text-sm">Loading…</p>}><Stock /></Suspense></main>;
}
