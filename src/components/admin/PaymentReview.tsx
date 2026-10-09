import { rejectPaymentAction, verifyPaymentAction } from "@/app/admin/actions";
import { formatINR } from "@/lib/money";
import { ActionForm, inputCls } from "./ActionForm";

export type PaymentRow = {
  id: string;
  method: string;
  amount_paise: number;
  utr_reference: string | null;
  payer_name: string | null;
  submitted_at: string | null;
  proof_url: string | null;
};

/** Staff compare the claim with the bank statement, then confirm the amount actually received. */
export function PaymentReview({ payment, orderNumber }: { payment: PaymentRow; orderNumber: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
      <p className="font-medium">{orderNumber} · expected {formatINR(payment.amount_paise)} via {payment.method === "upi" ? "UPI" : "bank transfer"}</p>
      <p className="text-slate-700">Reference: <span className="select-all font-mono">{payment.utr_reference}</span> · Payer: {payment.payer_name}</p>
      {payment.proof_url ? <p><a href={payment.proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-800 underline">View screenshot (link expires in 2 minutes)</a></p> : <p className="text-slate-500">No screenshot attached.</p>}
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <ActionForm action={verifyPaymentAction} submitLabel="Mark as received" buttonClassName="rounded-md bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800">
          <input type="hidden" name="paymentId" value={payment.id} />
          <label className="block text-xs font-medium" htmlFor={`recv-${payment.id}`}>Amount seen in the bank statement (₹)</label>
          <input id={`recv-${payment.id}`} name="receivedAmount" required inputMode="decimal" className={inputCls} placeholder={(payment.amount_paise / 100).toString()} />
          <input name="note" maxLength={300} placeholder="Note (optional)" className={inputCls} />
        </ActionForm>
        <ActionForm action={rejectPaymentAction} submitLabel="Reject" buttonClassName="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-800 hover:bg-red-50">
          <input type="hidden" name="paymentId" value={payment.id} />
          <label className="block text-xs font-medium" htmlFor={`rej-${payment.id}`}>Reason shown to the customer</label>
          <input id={`rej-${payment.id}`} name="reason" required minLength={3} maxLength={300} className={inputCls} />
        </ActionForm>
      </div>
    </div>
  );
}
