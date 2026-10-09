import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin · Audit log", robots: { index: false } };

async function Content() {
  await requireAdmin("/admin/audit");
  const supabase = await createClient();
  const { data } = await supabase.from("audit_log").select("id, actor_id, actor_role, action, entity_type, entity_id, details, created_at").order("id", { ascending: false }).limit(200);
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 uppercase text-slate-600"><tr><th className="p-2">When (IST)</th><th className="p-2">Action</th><th className="p-2">Entity</th><th className="p-2">Actor</th><th className="p-2">Details</th></tr></thead>
        <tbody className="divide-y divide-slate-100 align-top">
          {(data ?? []).map((a) => (
            <tr key={a.id}>
              <td className="whitespace-nowrap p-2">{new Date(a.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "medium" })}</td>
              <td className="p-2 font-medium">{a.action}</td>
              <td className="p-2">{a.entity_type} <span className="font-mono text-slate-500">{a.entity_id?.slice(0, 8)}</span></td>
              <td className="p-2">{a.actor_role ?? "system"} <span className="font-mono text-slate-500">{a.actor_id?.slice(0, 8)}</span></td>
              <td className="max-w-md p-2"><code className="break-words text-[11px]">{JSON.stringify(a.details).slice(0, 400)}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminAuditPage() {
  return <main><h1 className="mb-1 text-2xl font-semibold">Audit log</h1><p className="mb-4 text-sm text-slate-600">Append-only. Written by database triggers; no screen or API can edit or delete entries.</p><Suspense fallback={<p className="text-sm">Loading…</p>}><Content /></Suspense></main>;
}
