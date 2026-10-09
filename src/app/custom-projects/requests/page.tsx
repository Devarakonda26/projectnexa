import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/dal";
import { REQUEST_STATUS_LABEL } from "@/lib/requests/labels";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "My custom project requests" };

async function List() {
  const user = await requireUser("/custom-projects/requests");
  const supabase = await createClient();
  const { data } = await supabase.from("custom_requests").select("id, request_number, title, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
  if (!data?.length) return <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-600">No requests yet. <Link href="/custom-projects/new" className="text-blue-800 underline">Start one</Link></p>;
  return (
    <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
      {data.map((r) => (
        <li key={r.id}>
          <Link href={`/custom-projects/requests/${r.id}`} className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-slate-50">
            <span><span className="font-medium">{r.title}</span><span className="ml-3 text-sm text-slate-600">{r.request_number}</span></span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-sm">{REQUEST_STATUS_LABEL[r.status as keyof typeof REQUEST_STATUS_LABEL]}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function RequestsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My custom project requests</h1>
        <Link href="/custom-projects/new" className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800">New request</Link>
      </div>
      <Suspense fallback={<p className="text-sm">Loading…</p>}><List /></Suspense>
    </main>
  );
}
