"use client";

import Link from "next/link";
import { useActionState } from "react";
import { placeOrderAction } from "@/app/checkout/actions";
import type { FormState } from "@/lib/validation/form";

type Address = { id: string; label: string; summary: string; isDefault: boolean };
type Props = {
  addresses: Address[];
  needsAddress: boolean;
  codAvailable: boolean;
  codReason: string | null;
  canPayOnline: boolean;
};

export function CheckoutForm({ addresses, needsAddress, codAvailable, codReason, canPayOnline }: Props) {
  const [state, action, pending] = useActionState(placeOrderAction, {} as FormState);
  const defaultAddress = addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id;
  return (
    <form action={action} className="space-y-6">
      {state.error ? <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">{state.error}</p> : null}

      {needsAddress ? (
        <fieldset>
          <legend className="mb-2 font-semibold">Delivery address</legend>
          {addresses.length === 0 ? (
            <p className="text-sm">
              You have no saved address. <Link href="/account/addresses?next=/checkout" className="text-blue-800 underline">Add one</Link> to continue.
            </p>
          ) : (
            <div className="space-y-2">
              {addresses.map((a) => (
                <label key={a.id} className="flex cursor-pointer gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm has-[:checked]:border-blue-700">
                  <input type="radio" name="addressId" value={a.id} defaultChecked={a.id === defaultAddress} required />
                  <span><span className="font-medium">{a.label}</span><br />{a.summary}</span>
                </label>
              ))}
              <Link href="/account/addresses?next=/checkout" className="text-sm text-blue-800 underline">Add another address</Link>
            </div>
          )}
        </fieldset>
      ) : null}

      <fieldset>
        <legend className="mb-2 font-semibold">Payment method</legend>
        <div className="space-y-2">
          {canPayOnline ? (
            <>
              <label className="flex cursor-pointer gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm has-[:checked]:border-blue-700">
                <input type="radio" name="method" value="upi" defaultChecked required />
                <span><span className="font-medium">UPI</span><br />Pay to our UPI ID, then submit the transaction reference. We verify it manually.</span>
              </label>
              <label className="flex cursor-pointer gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm has-[:checked]:border-blue-700">
                <input type="radio" name="method" value="bank_transfer" />
                <span><span className="font-medium">Bank transfer (NEFT / IMPS)</span><br />Transfer to our bank account, then submit the reference.</span>
              </label>
            </>
          ) : null}
          <label className={`flex gap-3 rounded-md border bg-white p-3 text-sm ${codAvailable ? "cursor-pointer border-slate-200 has-[:checked]:border-blue-700" : "border-slate-200 opacity-60"}`}>
            <input type="radio" name="method" value="cod" disabled={!codAvailable} defaultChecked={!canPayOnline} />
            <span><span className="font-medium">Cash on delivery</span><br />{codAvailable ? "Pay when the kit arrives. We confirm the order first." : codReason}</span>
          </label>
        </div>
      </fieldset>

      <div>
        <label htmlFor="notes" className="mb-1 block font-semibold">Order notes (optional)</label>
        <textarea id="notes" name="notes" rows={3} maxLength={500} className="block w-full rounded-md border border-slate-300 px-3 py-2" />
      </div>

      <button disabled={pending || (needsAddress && addresses.length === 0)} className="w-full rounded-md bg-blue-700 px-4 py-3 font-medium text-white hover:bg-blue-800 disabled:opacity-60">
        {pending ? "Placing order…" : "Place order"}
      </button>
    </form>
  );
}
