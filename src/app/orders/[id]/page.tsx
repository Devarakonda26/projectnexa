import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PaymentClaimForm } from "@/components/shop/PaymentClaimForm";
import { requireUser } from "@/lib/auth/dal";
import { serverEnv } from "@/lib/env.server";
import { formatINR } from "@/lib/money";
import { SHIPMENT_LABEL, STATUS_HELP, STATUS_LABEL } from "@/lib/orders/labels";
import { canCustomerCancel, type OrderStatus } from "@/lib/orders/status";
import { createClient } from "@/lib/supabase/server";
import { cancelOrderAction } from "./actions";

export const metadata = { title: "Order details" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Address = { recipient_name: string; phone: string; line1: string; line2?: string | null; landmark?: string | null; city: string; state: string; pincode: string };

async function OrderContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const user = await requireUser(`/orders/${id}`);
  const supabase = await createClient();

  // RLS limits this to the signed-in customer's own orders; the user_id filter makes that explicit.
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!order) notFound();

  const [{ data: items }, { data: payments }, { data: shipment }, { data: history }] = await Promise.all([
    supabase.from("order_items").select("product_id, title_snapshot, product_type, unit_price_paise, quantity, line_total_paise").eq("order_id", id),
    supabase.from("payments").select("status, rejection_reason, created_at").eq("order_id", id).order("created_at", { ascending: false }),
    supabase.from("shipments").select("status, carrier, tracking_number, tracking_url").eq("order_id", id).maybeSingle(),
    supabase.from("order_status_history").select("to_status, created_at").eq("order_id", id).order("created_at"),
  ]);

  const status = order.status as OrderStatus;
  const latestPayment = payments?.[0];
  const needsPayment = status === "pending_payment" && order.payment_method !== "cod";

  const downloads: string[] = [];
  for (const it of items ?? []) {
    if (it.product_type !== "digital") continue;
    const { data: ok } = await supabase.rpc("has_download_access", { p_product_id: it.product_id });
    if (ok === true) downloads.push(it.product_id as string);
  }

  const env = needsPayment ? serverEnv() : null;
  const amount = (order.total_paise / 100).toFixed(2);
  const upiLink = env
    ? `upi://pay?pa=${encodeURIComponent(env.PAYMENT_UPI_ID)}&pn=${encodeURIComponent(env.PAYMENT_UPI_PAYEE_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(order.order_number)}`
    : null;
  const addr = order.shipping_address as Address | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Order {order.order_number}</h1>
        <p className="mt-1"><span className="rounded bg-slate-100 px-2 py-0.5 text-sm font-medium">{STATUS_LABEL[status]}</span></p>
        {STATUS_HELP[status] ? <p className="mt-2 text-sm text-slate-700">{STATUS_HELP[status]}</p> : null}
        {latestPayment?.status === "rejected" && status === "pending_payment" ? (
          <p role="alert" className="mt-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
            Your last payment details could not be verified{latestPayment.rejection_reason ? `: ${latestPayment.rejection_reason}` : "."} Please check and submit again.
          </p>
        ) : null}
      </div>

      {needsPayment && env ? (
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-semibold">Pay {formatINR(order.total_paise)}</h2>
          {order.payment_method === "upi" ? (
            <div className="mt-2 text-sm">
              <p>UPI ID: <strong className="select-all">{env.PAYMENT_UPI_ID}</strong> ({env.PAYMENT_UPI_PAYEE_NAME})</p>
              <p className="mt-1"><a href={upiLink!} className="text-blue-800 underline">Open in UPI app (mobile)</a></p>
            </div>
          ) : (
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              {env.PAYMENT_BANK_ACCOUNT_NAME ? <><dt>Account name</dt><dd className="select-all font-medium">{env.PAYMENT_BANK_ACCOUNT_NAME}</dd></> : null}
              {env.PAYMENT_BANK_ACCOUNT_NUMBER ? <><dt>Account number</dt><dd className="select-all font-medium">{env.PAYMENT_BANK_ACCOUNT_NUMBER}</dd></> : null}
              {env.PAYMENT_BANK_IFSC ? <><dt>IFSC</dt><dd className="select-all font-medium">{env.PAYMENT_BANK_IFSC}</dd></> : null}
              {env.PAYMENT_BANK_NAME ? <><dt>Bank</dt><dd>{env.PAYMENT_BANK_NAME}</dd></> : null}
            </dl>
          )}
          <p className="mt-2 text-sm">Pay exactly <strong>{formatINR(order.total_paise)}</strong> and mention <strong>{order.order_number}</strong> in the remarks.</p>
          <div className="mt-4"><PaymentClaimForm orderId={order.id} defaultName={user.fullName ?? ""} /></div>
        </section>
      ) : null}

      {downloads.length > 0 ? (
        <section className="rounded-lg border border-green-200 bg-green-50 p-5">
          <h2 className="font-semibold">Your downloads</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {(items ?? []).filter((i) => downloads.includes(i.product_id as string)).map((i) => (
              <li key={i.product_id}>
                {/* Route handler re-checks access and redirects to a short-lived signed URL. */}
                <a href={`/downloads/${i.product_id}`} className="text-blue-800 underline">{i.title_snapshot}</a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="mb-2 font-semibold">Items</h2>
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white text-sm">
          {(items ?? []).map((i) => (
            <li key={i.product_id} className="flex justify-between gap-3 p-3">
              <span>{i.title_snapshot}{i.quantity > 1 ? ` × ${i.quantity}` : ""}</span>
              <span>{formatINR(i.line_total_paise)}</span>
            </li>
          ))}
          <li className="flex justify-between p-3"><span>Shipping</span><span>{order.has_physical ? (order.shipping_paise ? formatINR(order.shipping_paise) : "Free") : "—"}</span></li>
          <li className="flex justify-between p-3 font-semibold"><span>Total ({order.payment_method === "cod" ? "cash on delivery" : order.payment_method === "upi" ? "UPI" : "bank transfer"})</span><span>{formatINR(order.total_paise)}</span></li>
        </ul>
      </section>

      {addr ? (
        <section className="text-sm">
          <h2 className="mb-1 font-semibold">Delivery address</h2>
          <p>{addr.recipient_name} · {addr.phone}</p>
          <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}{addr.landmark ? `, ${addr.landmark}` : ""}</p>
          <p>{addr.city}, {addr.state} {addr.pincode}</p>
        </section>
      ) : null}

      {shipment ? (
        <section className="text-sm">
          <h2 className="mb-1 font-semibold">Shipment</h2>
          <p>Status: {SHIPMENT_LABEL[shipment.status] ?? shipment.status}</p>
          {shipment.carrier ? <p>Carrier: {shipment.carrier}</p> : null}
          {shipment.tracking_number ? <p>Tracking number: <span className="select-all">{shipment.tracking_number}</span></p> : null}
          {shipment.tracking_url ? <p><a href={shipment.tracking_url} rel="noopener noreferrer nofollow" target="_blank" className="text-blue-800 underline">Track package</a></p> : null}
        </section>
      ) : null}

      <section className="text-sm">
        <h2 className="mb-1 font-semibold">Timeline</h2>
        <ol className="space-y-1">
          {(history ?? []).map((h, i) => (
            <li key={i}>{new Date(h.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} — {STATUS_LABEL[h.to_status as OrderStatus]}</li>
          ))}
        </ol>
      </section>

      {canCustomerCancel(status) ? (
        <form action={cancelOrderAction}>
          <input type="hidden" name="orderId" value={order.id} />
          <button className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-800 hover:bg-red-50">Cancel this order</button>
        </form>
      ) : null}
    </div>
  );
}

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Suspense fallback={<p className="text-sm">Loading…</p>}>
        <OrderContent params={params} />
      </Suspense>
    </main>
  );
}
