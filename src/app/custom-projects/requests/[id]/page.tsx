import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddAttachments } from "@/components/shop/AddAttachments";
import { requireUser } from "@/lib/auth/dal";
import { formatINR } from "@/lib/money";
import { MILESTONE_STATUS_LABEL, REQUEST_STATUS_LABEL, customerCanCancelRequest, type RequestStatus } from "@/lib/requests/labels";
import { createClient } from "@/lib/supabase/server";
import { approveMilestoneAction, cancelRequestAction, respondToQuoteAction } from "../../actions";

export const metadata = { title: "Custom project request" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const date = (d: string | null) => (d ? new Date(d + (d.length === 10 ? "T00:00:00Z" : "")).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" }) : "—");

async function Content({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ attach?: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const user = await requireUser(`/custom-projects/requests/${id}`);
  const supabase = await createClient();

  const { data: req } = await supabase.from("custom_requests").select("*, branch:branches(name)").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!req) notFound();

  const [{ data: attachments }, { data: quotes }, { data: milestones }, sp] = await Promise.all([
    supabase.from("request_attachments").select("id, file_name, size_bytes, storage_path").eq("request_id", id).order("created_at"),
    supabase.from("request_quotes").select("id, amount_paise, scope, delivery_days, valid_until, status, created_at").eq("request_id", id).order("created_at", { ascending: false }),
    supabase.from("request_milestones").select("id, title, description, amount_paise, due_date, status, is_paid").eq("request_id", id).order("sort_order"),
    searchParams,
  ]);

  // Customers read their own files with a short-lived URL created under THEIR session (storage RLS applies).
  const links = await Promise.all(
    (attachments ?? []).map(async (a) => {
      const { data } = await supabase.storage.from("request-attachments").createSignedUrl(a.storage_path, 120, { download: a.file_name });
      return { ...a, url: data?.signedUrl ?? null };
    }),
  );

  const status = req.status as RequestStatus;
  const open = ["submitted", "under_review", "quoted", "accepted", "in_progress"].includes(status);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-600">{req.request_number} · {(req.branch as { name: string } | null)?.name}</p>
        <h1 className="text-2xl font-semibold">{req.title}</h1>
        <p className="mt-1"><span className="rounded bg-slate-100 px-2 py-0.5 text-sm font-medium">{REQUEST_STATUS_LABEL[status]}</span></p>
        {sp.attach === "partial" ? <p role="alert" className="mt-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">Your request was submitted, but some attachments could not be saved. You can add them again below.</p> : null}
      </div>

      <section className="space-y-2 text-sm">
        <h2 className="font-semibold">Your brief</h2>
        <p className="whitespace-pre-line">{req.description}</p>
        {req.requirements ? <p className="whitespace-pre-line text-slate-700"><strong>Requirements:</strong> {req.requirements}</p> : null}
        <p className="text-slate-600">
          Budget: {req.budget_min_paise !== null || req.budget_max_paise !== null ? `${req.budget_min_paise !== null ? formatINR(req.budget_min_paise) : "—"} to ${req.budget_max_paise !== null ? formatINR(req.budget_max_paise) : "—"}` : "not specified"} · Needed by: {date(req.deadline)}
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Attachments</h2>
        {links.length ? (
          <ul className="mb-3 space-y-1 text-sm">
            {links.map((a) => <li key={a.id}>{a.url ? <a href={a.url} className="text-blue-800 underline">{a.file_name}</a> : a.file_name} <span className="text-slate-500">({Math.ceil(a.size_bytes / 1024)} KB)</span></li>)}
          </ul>
        ) : <p className="mb-3 text-sm text-slate-600">No files attached.</p>}
        {open ? <AddAttachments requestId={id} /> : null}
      </section>

      {(quotes ?? []).length ? (
        <section>
          <h2 className="mb-2 font-semibold">Quotations</h2>
          <ul className="space-y-3">
            {(quotes ?? []).map((q) => (
              <li key={q.id} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                <p className="text-lg font-semibold">{formatINR(q.amount_paise)} <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs font-normal capitalize">{q.status}</span></p>
                <p className="mt-1 whitespace-pre-line">{q.scope}</p>
                <p className="mt-1 text-slate-600">{q.delivery_days ? `Delivery in ${q.delivery_days} days · ` : ""}{q.valid_until ? `Valid until ${date(q.valid_until)}` : ""}</p>
                {q.status === "sent" && status === "quoted" ? (
                  <form action={respondToQuoteAction} className="mt-3 flex gap-3">
                    <input type="hidden" name="quoteId" value={q.id} />
                    <input type="hidden" name="requestId" value={id} />
                    <button name="decision" value="accept" className="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800">Accept quote</button>
                    <button name="decision" value="decline" className="rounded-md border border-slate-300 px-4 py-2 hover:bg-slate-100">Decline</button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-600">After you accept, we will share payment details for each milestone. Payments are verified manually.</p>
        </section>
      ) : null}

      {(milestones ?? []).length ? (
        <section>
          <h2 className="mb-2 font-semibold">Milestones</h2>
          <ol className="space-y-3">
            {(milestones ?? []).map((m) => (
              <li key={m.id} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                <p className="font-medium">{m.title} <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs font-normal">{MILESTONE_STATUS_LABEL[m.status as keyof typeof MILESTONE_STATUS_LABEL]}</span>{m.is_paid ? <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs text-green-900">Paid</span> : null}</p>
                {m.description ? <p className="mt-1 text-slate-700">{m.description}</p> : null}
                <p className="mt-1 text-slate-600">{m.amount_paise ? formatINR(m.amount_paise) : "No payment due"} · Due {date(m.due_date)}</p>
                {m.status === "submitted" ? (
                  <form action={approveMilestoneAction} className="mt-2">
                    <input type="hidden" name="milestoneId" value={m.id} />
                    <input type="hidden" name="requestId" value={id} />
                    <button className="rounded-md bg-green-700 px-3 py-1.5 font-medium text-white hover:bg-green-800">Approve milestone</button>
                  </form>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {customerCanCancelRequest(status) ? (
        <form action={cancelRequestAction}>
          <input type="hidden" name="requestId" value={id} />
          <button className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-800 hover:bg-red-50">Cancel this request</button>
        </form>
      ) : null}
    </div>
  );
}

export default function RequestPage(props: { params: Promise<{ id: string }>; searchParams: Promise<{ attach?: string }> }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Suspense fallback={<p className="text-sm">Loading…</p>}>
        <Content params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
