import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActionForm, inputCls } from "@/components/admin/ActionForm";
import { requireAdmin } from "@/lib/auth/dal";
import { formatINR } from "@/lib/money";
import { MILESTONE_STATUS_LABEL, REQUEST_STATUS_LABEL, type RequestStatus } from "@/lib/requests/labels";
import { createClient } from "@/lib/supabase/server";
import { addAdminNoteAction, addMilestoneAction, createQuoteAction, markMilestonePaidAction, setMilestoneStatusAction, setRequestStatusAction } from "../../actions";

export const metadata = { title: "Admin · Custom request", robots: { index: false } };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  await requireAdmin(`/admin/requests/${id}`);
  const supabase = await createClient();
  const { data: req } = await supabase.from("custom_requests").select("*, branch:branches(name)").eq("id", id).maybeSingle();
  if (!req) notFound();
  const [{ data: owner }, { data: attachments }, { data: quotes }, { data: milestones }, { data: notes }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", req.user_id).maybeSingle(),
    supabase.from("request_attachments").select("id, file_name, size_bytes, storage_path").eq("request_id", id),
    supabase.from("request_quotes").select("*").eq("request_id", id).order("created_at", { ascending: false }),
    supabase.from("request_milestones").select("*").eq("request_id", id).order("sort_order"),
    supabase.from("request_admin_notes").select("id, note, created_at").eq("request_id", id).order("created_at", { ascending: false }),
  ]);
  const files = await Promise.all((attachments ?? []).map(async (a) => ({ ...a, url: (await supabase.storage.from("request-attachments").createSignedUrl(a.storage_path, 120, { download: a.file_name })).data?.signedUrl ?? null })));
  const status = req.status as RequestStatus;
  const setters = (["under_review", "in_progress", "completed", "rejected"] as const);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-600">{req.request_number} · {(req.branch as unknown as { name: string } | null)?.name} · {owner?.full_name ?? "Customer"} {owner?.phone ? `· ${owner.phone}` : ""}</p>
        <h1 className="text-2xl font-semibold">{req.title}</h1>
        <p className="mt-1"><span className="rounded bg-slate-100 px-2 py-0.5 text-sm font-medium">{REQUEST_STATUS_LABEL[status]}</span></p>
      </div>

      <section className="space-y-2 text-sm">
        <p className="whitespace-pre-line">{req.description}</p>
        {req.requirements ? <p className="whitespace-pre-line text-slate-700"><strong>Requirements:</strong> {req.requirements}</p> : null}
        <p className="text-slate-600">Budget: {req.budget_min_paise !== null ? formatINR(req.budget_min_paise) : "—"} to {req.budget_max_paise !== null ? formatINR(req.budget_max_paise) : "—"} · Needed by {req.deadline ?? "—"}</p>
        <ul>{files.map((f) => <li key={f.id}>{f.url ? <a href={f.url} className="text-blue-800 underline">{f.file_name}</a> : f.file_name}</li>)}</ul>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Status</h2>
        <p className="mb-2 text-xs text-slate-600">“Quoted” and “accepted” are set automatically when you send a quote and the customer responds.</p>
        <ActionForm action={setRequestStatusAction} submitLabel="Update" className="flex items-end gap-3">
          <input type="hidden" name="requestId" value={id} />
          <select name="status" aria-label="New status" className={inputCls}>{setters.map((s) => <option key={s} value={s}>{REQUEST_STATUS_LABEL[s]}</option>)}</select>
        </ActionForm>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Quotations</h2>
        <ul className="mb-4 space-y-2 text-sm">
          {(quotes ?? []).map((q) => <li key={q.id} className="rounded border border-slate-200 bg-white p-3"><strong>{formatINR(q.amount_paise)}</strong> · <span className="capitalize">{q.status}</span>{q.delivery_days ? ` · ${q.delivery_days} days` : ""}<p className="whitespace-pre-line text-slate-700">{q.scope}</p></li>)}
        </ul>
        <ActionForm action={createQuoteAction} submitLabel="Save quote" className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="requestId" value={id} />
          <div><label className="mb-1 block text-xs font-medium" htmlFor="amount">Amount (₹)</label><input id="amount" name="amount" required inputMode="decimal" className={inputCls} /></div>
          <div><label className="mb-1 block text-xs font-medium" htmlFor="deliveryDays">Delivery (days)</label><input id="deliveryDays" name="deliveryDays" inputMode="numeric" className={inputCls} /></div>
          <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium" htmlFor="scope">Scope of work</label><textarea id="scope" name="scope" required rows={4} className={inputCls} /></div>
          <div><label className="mb-1 block text-xs font-medium" htmlFor="validUntil">Valid until</label><input id="validUntil" name="validUntil" type="date" className={inputCls} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="send" /> Send to customer now</label>
        </ActionForm>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Milestones</h2>
        <ul className="mb-4 space-y-3">
          {(milestones ?? []).map((m) => (
            <li key={m.id} className="rounded border border-slate-200 bg-white p-3 text-sm">
              <p className="font-medium">{m.title} · {MILESTONE_STATUS_LABEL[m.status as keyof typeof MILESTONE_STATUS_LABEL]} · {m.amount_paise ? formatINR(m.amount_paise) : "no payment"}{m.is_paid ? ` · paid (${m.paid_reference})` : ""}</p>
              {m.status !== "approved" ? (
                <ActionForm action={setMilestoneStatusAction} submitLabel="Set" className="mt-2 flex items-end gap-2">
                  <input type="hidden" name="requestId" value={id} /><input type="hidden" name="milestoneId" value={m.id} />
                  <select name="status" aria-label="Milestone status" defaultValue={m.status} className={inputCls}><option value="pending">Not started</option><option value="in_progress">In progress</option><option value="submitted">Submitted for customer review</option></select>
                </ActionForm>
              ) : null}
              {m.amount_paise > 0 && !m.is_paid ? (
                <ActionForm action={markMilestonePaidAction} submitLabel="Mark paid" className="mt-2 flex items-end gap-2">
                  <input type="hidden" name="requestId" value={id} /><input type="hidden" name="milestoneId" value={m.id} />
                  <input name="reference" required placeholder="Bank / UPI reference" aria-label="Payment reference" className={inputCls} />
                </ActionForm>
              ) : null}
            </li>
          ))}
        </ul>
        <ActionForm action={addMilestoneAction} submitLabel="Add milestone" resetOnSuccess className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="requestId" value={id} />
          <div><label className="mb-1 block text-xs font-medium" htmlFor="mtitle">Title</label><input id="mtitle" name="title" required className={inputCls} /></div>
          <div><label className="mb-1 block text-xs font-medium" htmlFor="mamount">Payment due (₹, optional)</label><input id="mamount" name="amount" inputMode="decimal" className={inputCls} /></div>
          <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium" htmlFor="mdesc">Description</label><input id="mdesc" name="description" className={inputCls} /></div>
          <div><label className="mb-1 block text-xs font-medium" htmlFor="mdue">Due date</label><input id="mdue" name="dueDate" type="date" className={inputCls} /></div>
        </ActionForm>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Internal notes (never shown to the customer)</h2>
        <ul className="mb-3 space-y-1 text-sm">{(notes ?? []).map((n) => <li key={n.id} className="rounded bg-amber-50 p-2">{n.note}</li>)}</ul>
        <ActionForm action={addAdminNoteAction} submitLabel="Add note" resetOnSuccess>
          <input type="hidden" name="requestId" value={id} />
          <textarea name="note" required rows={2} maxLength={2000} aria-label="Note" className={inputCls} />
        </ActionForm>
      </section>
    </div>
  );
}

export default function AdminRequestPage({ params }: { params: Promise<{ id: string }> }) {
  return <main><Suspense fallback={<p className="text-sm">Loading…</p>}><Content params={params} /></Suspense></main>;
}
