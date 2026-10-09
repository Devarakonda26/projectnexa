import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActionForm, inputCls } from "@/components/admin/ActionForm";
import { PaymentReview } from "@/components/admin/PaymentReview";
import { requireAdmin } from "@/lib/auth/dal";
import { formatINR } from "@/lib/money";
import { SHIPMENT_LABEL, STATUS_LABEL } from "@/lib/orders/labels";
import { adminNextStatuses, type OrderStatus, type PaymentMethod } from "@/lib/orders/status";
import { createClient } from "@/lib/supabase/server";
import { setOrderStatusAction, upsertShipmentAction } from "../../actions";

export const metadata = { title: "Admin · Order", robots: { index: false } };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  await requireAdmin(`/admin/orders/${id}`);
  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) notFound();

  const [{ data: items }, { data: payments }, { data: shipment }, { data: history }] = await Promise.all([
    supabase.from("order_items").select("title_snapshot, product_type, quantity, line_total_paise").eq("order_id", id),
    supabase.from("payments").select("id, method, status, amount_paise, utr_reference, payer_name, proof_path, submitted_at, rejection_reason, verified_at").eq("order_id", id).order("created_at", { ascending: false }),
    supabase.from("shipments").select("*").eq("order_id", id).maybeSingle(),
    supabase.from("order_status_history").select("from_status, to_status, note, created_at").eq("order_id", id).order("created_at"),
  ]);

  const status = order.status as OrderStatus;
  const next = adminNextStatuses(status, order.payment_method as PaymentMethod, order.has_physical);
  const toVerify = await Promise.all(
    (payments ?? []).filter((p) => p.status === "submitted").map(async (p) => ({
      ...p,
      proof_url: p.proof_path ? (await supabase.storage.from("payment-proofs").createSignedUrl(p.proof_path, 120)).data?.signedUrl ?? null : null,
    })),
  );
  const addr = order.shipping_address as Record<string, string> | null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Order {order.order_number}</h1>
        <p className="text-sm text-slate-600">{order.contact_email} · {order.contact_phone ?? "no phone"} · {order.payment_method.replace("_", " ").toUpperCase()}</p>
        <p className="mt-1"><span className="rounded bg-slate-100 px-2 py-0.5 text-sm font-medium">{STATUS_LABEL[status]}</span></p>
        {order.customer_notes ? <p className="mt-2 text-sm"><strong>Customer note:</strong> {order.customer_notes}</p> : null}
      </div>

      <section>
        <h2 className="mb-2 font-semibold">Items</h2>
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white text-sm">
          {(items ?? []).map((i, n) => <li key={n} className="flex justify-between p-3"><span>{i.title_snapshot} ({i.product_type}) × {i.quantity}</span><span>{formatINR(i.line_total_paise)}</span></li>)}
          <li className="flex justify-between p-3"><span>Shipping</span><span>{formatINR(order.shipping_paise)}</span></li>
          <li className="flex justify-between p-3 font-semibold"><span>Total</span><span>{formatINR(order.total_paise)}</span></li>
        </ul>
      </section>

      {addr ? <section className="text-sm"><h2 className="mb-1 font-semibold">Ship to</h2><p>{addr.recipient_name} · {addr.phone}</p><p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}{addr.landmark ? `, ${addr.landmark}` : ""}</p><p>{addr.city}, {addr.state} {addr.pincode}</p></section> : null}

      {toVerify.length ? (
        <section className="space-y-3"><h2 className="font-semibold">Payment to verify</h2>{toVerify.map((p) => <PaymentReview key={p.id} payment={p} orderNumber={order.order_number} />)}</section>
      ) : null}

      <section className="text-sm">
        <h2 className="mb-1 font-semibold">Payment history</h2>
        <ul className="space-y-1">
          {(payments ?? []).map((p) => <li key={p.id}>{p.status} · {formatINR(p.amount_paise)} {p.utr_reference ? `· ref ${p.utr_reference}` : ""}{p.rejection_reason ? ` · rejected: ${p.rejection_reason}` : ""}</li>)}
          {(payments ?? []).length === 0 ? <li className="text-slate-600">No payment recorded yet.</li> : null}
        </ul>
      </section>

      {next.length ? (
        <section>
          <h2 className="mb-2 font-semibold">Change status</h2>
          <ActionForm action={setOrderStatusAction} submitLabel="Update status" className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="orderId" value={id} />
            <div><label htmlFor="status" className="mb-1 block text-xs font-medium">New status</label>
              <select id="status" name="status" required className={inputCls}>{next.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div>
            <div><label htmlFor="note" className="mb-1 block text-xs font-medium">Note</label><input id="note" name="note" maxLength={300} className={inputCls} /></div>
          </ActionForm>
          <p className="mt-1 text-xs text-slate-600">Only moves the database allows are listed. Payment states change only through payment verification.</p>
        </section>
      ) : null}

      {order.has_physical && ["paid", "processing", "shipped", "delivered", "completed"].includes(status) || (order.payment_method === "cod" && ["processing", "shipped", "delivered", "completed"].includes(status)) ? (
        <section>
          <h2 className="mb-2 font-semibold">Shipment {shipment ? `(${SHIPMENT_LABEL[shipment.status] ?? shipment.status})` : ""}</h2>
          <ActionForm action={upsertShipmentAction} submitLabel="Save shipment" className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="orderId" value={id} />
            <div><label htmlFor="sstatus" className="mb-1 block text-xs font-medium">Shipment status</label>
              <select id="sstatus" name="status" defaultValue={shipment?.status ?? "preparing"} className={inputCls}>{Object.entries(SHIPMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div><label htmlFor="carrier" className="mb-1 block text-xs font-medium">Carrier</label><input id="carrier" name="carrier" defaultValue={shipment?.carrier ?? ""} className={inputCls} /></div>
            <div><label htmlFor="trackingNumber" className="mb-1 block text-xs font-medium">Tracking number</label><input id="trackingNumber" name="trackingNumber" defaultValue={shipment?.tracking_number ?? ""} className={inputCls} /></div>
            <div><label htmlFor="trackingUrl" className="mb-1 block text-xs font-medium">Tracking link (https://…)</label><input id="trackingUrl" name="trackingUrl" defaultValue={shipment?.tracking_url ?? ""} className={inputCls} /></div>
          </ActionForm>
        </section>
      ) : null}

      <section className="text-sm">
        <h2 className="mb-1 font-semibold">History</h2>
        <ol className="space-y-1">{(history ?? []).map((h, i) => <li key={i}>{new Date(h.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} — {h.from_status ? `${STATUS_LABEL[h.from_status as OrderStatus]} → ` : ""}{STATUS_LABEL[h.to_status as OrderStatus]}{h.note ? ` (${h.note})` : ""}</li>)}</ol>
      </section>
    </div>
  );
}

export default function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  return <main><Suspense fallback={<p className="text-sm">Loading…</p>}><Content params={params} /></Suspense></main>;
}
