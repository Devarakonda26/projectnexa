"use client";

import { useActionState } from "react";
import { addAddressAction } from "@/app/account/addresses/actions";
import { INDIAN_STATES } from "@/lib/validation/common";
import type { FormState } from "@/lib/validation/form";

const input = "block w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-2 focus:outline-blue-600";

export function AddressForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(addAddressAction, {} as FormState);
  const err = (n: string) => state.fieldErrors?.[n]?.[0];
  const field = (name: string, label: string, opts: { required?: boolean; autoComplete?: string; type?: string; maxLength?: number } = {}) => (
    <div>
      <label htmlFor={`addr-${name}`} className="mb-1 block text-sm font-medium">{label}</label>
      <input id={`addr-${name}`} name={name} required={opts.required !== false} autoComplete={opts.autoComplete} type={opts.type ?? "text"} maxLength={opts.maxLength} className={input} aria-invalid={err(name) ? true : undefined} />
      {err(name) ? <p className="mt-1 text-xs text-red-700">{err(name)}</p> : null}
    </div>
  );
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.error ? <p role="alert" className="sm:col-span-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">{state.error}</p> : null}
      {state.ok ? <p role="status" className="sm:col-span-2 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900">{state.message}</p> : null}
      {field("label", "Label (Home, Hostel…)", { maxLength: 30 })}
      {field("recipientName", "Recipient name", { autoComplete: "name" })}
      {field("phone", "Mobile number", { autoComplete: "tel", type: "tel" })}
      {field("pincode", "PIN code", { autoComplete: "postal-code", maxLength: 6 })}
      <div className="sm:col-span-2">{field("line1", "Address line 1", { autoComplete: "address-line1" })}</div>
      <div className="sm:col-span-2">{field("line2", "Address line 2 (optional)", { required: false, autoComplete: "address-line2" })}</div>
      {field("landmark", "Landmark (optional)", { required: false })}
      {field("city", "City", { autoComplete: "address-level2" })}
      <div>
        <label htmlFor="addr-state" className="mb-1 block text-sm font-medium">State</label>
        <select id="addr-state" name="state" required className={input} defaultValue="">
          <option value="" disabled>Select state</option>
          {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {err("state") ? <p className="mt-1 text-xs text-red-700">{err("state")}</p> : null}
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="isDefault" /> Make this my default address
      </label>
      <button disabled={pending} className="rounded-md bg-blue-700 px-4 py-2.5 font-medium text-white hover:bg-blue-800 disabled:opacity-60 sm:col-span-2">
        {pending ? "Saving…" : "Save address"}
      </button>
    </form>
  );
}
