import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/dal";
import { formatINR } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin · Customers", robots: { index: false } };

async function Content() {
  await requireAdmin("/admin/customers");
  const supabase = await createClient();
  const [{ data: profiles }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, phone, role, created_at").order("created_at", { ascending: false }).limit(300),
    supabase.from("orders").select("user_id, total_paise, status").in("status", ["paid", "processing", "shipped", "delivered", "completed"]).limit(5000),
  ]);
  const spend = new Map<string, { n: number; total: number }>();
  for (const o of orders ?? []) {
    const cur = spend.get(o.user_id) ?? { n: 0, total: 0 };
    spend.set(o.user_id, { n: cur.n + 1, total: cur.total + o.total_paise });
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Role</th><th className="p-3">Joined</th><th className="p-3 text-right">Paid orders</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {(profiles ?? []).map((p) => {
            const s = spend.get(p.id);
            return (
              <tr key={p.id}>
                <td className="p-3">{p.full_name ?? "—"}</td><td className="p-3">{p.phone ?? "—"}</td><td className="p-3 capitalize">{p.role}</td>
                <td className="p-3">{new Date(p.created_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" })}</td>
                <td className="p-3 text-right">{s ? `${s.n} · ${formatINR(s.total)}` : "0"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="p-3 text-xs text-slate-600">Admin roles are granted only by a database administrator (see docs/ADMIN.md); there is no screen that can promote a user.</p>
    </div>
  );
}

export default function AdminCustomersPage() {
  return <main><h1 className="mb-4 text-2xl font-semibold">Customers</h1><Suspense fallback={<p className="text-sm">Loading…</p>}><Content /></Suspense></main>;
}
