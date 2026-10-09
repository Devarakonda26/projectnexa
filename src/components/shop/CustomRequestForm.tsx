"use client";

import { useActionState } from "react";
import { createCustomRequestAction } from "@/app/custom-projects/actions";
import type { FormState } from "@/lib/validation/form";

type Branch = { id: string; name: string };
const input = "block w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-2 focus:outline-blue-600";

export function CustomRequestForm({ branches }: { branches: Branch[] }) {
  const [state, action, pending] = useActionState(createCustomRequestAction, {} as FormState);
  const v = (n: string) => state.values?.[n] ?? "";
  const err = (n: string) => state.fieldErrors?.[n]?.[0];
  const fieldError = (n: string) => (err(n) ? <p className="mt-1 text-xs text-red-700">{err(n)}</p> : null);
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error ? <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">{state.error}</p> : null}
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">Project title</label>
        <input id="title" name="title" required maxLength={160} defaultValue={v("title")} className={input} />
        {fieldError("title")}
      </div>
      <div>
        <label htmlFor="branchId" className="mb-1 block text-sm font-medium">Branch / domain</label>
        <select id="branchId" name="branchId" required defaultValue={v("branchId")} className={input}>
          <option value="" disabled>Select a branch</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {fieldError("branchId")}
      </div>
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">What do you want built?</label>
        <textarea id="description" name="description" required rows={6} maxLength={5000} defaultValue={v("description")} className={input} />
        <p className="mt-1 text-xs text-slate-600">At least 30 characters. Explain the problem, expected outcome and any hardware you need.</p>
        {fieldError("description")}
      </div>
      <div>
        <label htmlFor="requirements" className="mb-1 block text-sm font-medium">Technical requirements (optional)</label>
        <textarea id="requirements" name="requirements" rows={4} maxLength={5000} defaultValue={v("requirements")} className={input} />
        {fieldError("requirements")}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="budgetMin" className="mb-1 block text-sm font-medium">Budget from (₹)</label>
          <input id="budgetMin" name="budgetMin" inputMode="decimal" placeholder="e.g. 5000" defaultValue={v("budgetMin")} className={input} />
          {fieldError("budgetMin")}
        </div>
        <div>
          <label htmlFor="budgetMax" className="mb-1 block text-sm font-medium">Budget up to (₹)</label>
          <input id="budgetMax" name="budgetMax" inputMode="decimal" placeholder="e.g. 10000" defaultValue={v("budgetMax")} className={input} />
          {fieldError("budgetMax")}
        </div>
        <div>
          <label htmlFor="deadline" className="mb-1 block text-sm font-medium">Needed by</label>
          <input id="deadline" name="deadline" type="date" defaultValue={v("deadline")} className={input} />
          {fieldError("deadline")}
        </div>
      </div>
      <p className="-mt-2 text-xs text-slate-600">Budget and date are optional. Leave them empty (do not type words) if there is no limit or deadline.</p>
      <div>
        <label htmlFor="attachments" className="mb-1 block text-sm font-medium">Attachments (optional)</label>
        <input id="attachments" name="attachments" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.zip,.docx,.txt" className="block w-full text-sm" />
        <p className="mt-1 text-xs text-slate-600">Up to 5 files, 20 MB each: PDF, images, ZIP, DOCX or TXT.</p>
      </div>
      <button disabled={pending} className="w-full rounded-md bg-blue-700 px-4 py-3 font-medium text-white hover:bg-blue-800 disabled:opacity-60">
        {pending ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}
