"use client";

import { useActionState } from "react";
import { submitPaymentClaimAction } from "@/app/orders/[id]/actions";
import type { FormState } from "@/lib/validation/form";

export function PaymentClaimForm({ orderId, defaultName }: { orderId: string; defaultName: string }) {
  const [state, action, pending] = useActionState(submitPaymentClaimAction, {} as FormState);
  const err = (n: string) => state.fieldErrors?.[n]?.[0];
  if (state.ok) return <p role="status" className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900">{state.message}</p>;
  const input = "block w-full rounded-md border border-slate-300 px-3 py-2";
  return (
    <form action={action} className="space-y-3" noValidate>
      <input type="hidden" name="orderId" value={orderId} />
      {state.error ? <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">{state.error}</p> : null}
      <div>
        <label htmlFor="utr" className="mb-1 block text-sm font-medium">Transaction reference (UTR)</label>
        <input id="utr" name="utr" required maxLength={30} autoComplete="off" className={input} />
        {err("utr") ? <p className="mt-1 text-xs text-red-700">{err("utr")}</p> : <p className="mt-1 text-xs text-slate-600">12-digit UPI reference or bank transfer reference. Letters and digits only.</p>}
      </div>
      <div>
        <label htmlFor="payerName" className="mb-1 block text-sm font-medium">Name of the person who paid</label>
        <input id="payerName" name="payerName" required maxLength={120} defaultValue={defaultName} className={input} />
        {err("payerName") ? <p className="mt-1 text-xs text-red-700">{err("payerName")}</p> : null}
      </div>
      <div>
        <label htmlFor="proof" className="mb-1 block text-sm font-medium">Payment screenshot (optional)</label>
        <input id="proof" name="proof" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="block w-full text-sm" />
        <p className="mt-1 text-xs text-slate-600">PNG, JPG, WebP or PDF, up to 5 MB.</p>
      </div>
      <p className="text-xs text-slate-600">Your order is confirmed only after we verify the payment in our bank account. Submitting a reference does not mark it as paid.</p>
      <button disabled={pending} className="w-full rounded-md bg-blue-700 px-4 py-2.5 font-medium text-white hover:bg-blue-800 disabled:opacity-60">
        {pending ? "Submitting…" : "Submit payment details"}
      </button>
    </form>
  );
}
