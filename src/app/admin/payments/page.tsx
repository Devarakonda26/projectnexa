import { Suspense } from "react";
import { PaymentReview } from "@/components/admin/PaymentReview";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin · Payments", robots: { index: false } };

async function Queue() {
  await requireAdmin("/admin/payments");
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("id, method, amount_paise, utr_reference, payer_name, proof_path, submitted_at, order:orders(order_number)")
    .eq("status", "submitted")
    .order("submitted_at")
    .limit(100);
  if (!data?.length) return <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-600">Nothing waiting for verification.</p>;
  const rows = await Promise.all(
    data.map(async (p) => {
      const proof = p.proof_path ? (await supabase.storage.from("payment-proofs").createSignedUrl(p.proof_path, 120)).data?.signedUrl ?? null : null;
      return { ...p, proof_url: proof, orderNumber: (p.order as unknown as { order_number: string } | null)?.order_number ?? "—" };
    }),
  );
  return <div className="space-y-4">{rows.map((p) => <PaymentReview key={p.id} payment={p} orderNumber={p.orderNumber} />)}</div>;
}

export default function AdminPaymentsPage() {
  return (
    <main>
      <h1 className="mb-1 text-2xl font-semibold">Payments awaiting verification</h1>
      <p className="mb-4 text-sm text-slate-600">Only mark a payment as received after you see the money in the bank statement. The amount you type must equal the order total.</p>
      <Suspense fallback={<p className="text-sm">Loading…</p>}><Queue /></Suspense>
    </main>
  );
}
