import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/dal";
import { REQUEST_STATUS_LABEL, type RequestStatus } from "@/lib/requests/labels";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin · Custom requests", robots: { index: false } };

async function List() {
  await requireAdmin("/admin/requests");
  const supabase = await createClient();
  const { data } = await supabase.from("custom_requests").select("id, request_number, title, status, created_at, deadline, branch:branches(short_name)").order("created_at", { ascending: false }).limit(200);
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr><th className="p-3">Request</th><th className="p-3">Branch</th><th className="p-3">Status</th><th className="p-3">Needed by</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {(data ?? []).map((r) => (
            <tr key={r.id}>
              <td className="p-3"><Link href={`/admin/requests/${r.id}`} className="font-medium text-blue-800 underline">{r.title}</Link><span className="ml-2 text-xs text-slate-500">{r.request_number}</span></td>
              <td className="p-3">{(r.branch as unknown as { short_name: string } | null)?.short_name}</td>
              <td className="p-3">{REQUEST_STATUS_LABEL[r.status as RequestStatus]}</td>
              <td className="p-3">{r.deadline ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminRequestsPage() {
  return <main><h1 className="mb-4 text-2xl font-semibold">Custom project requests</h1><Suspense fallback={<p className="text-sm">Loading…</p>}><List /></Suspense></main>;
}
