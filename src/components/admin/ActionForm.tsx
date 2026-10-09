"use client";

import { useActionState, useRef, type ReactNode } from "react";
import type { FormState } from "@/lib/validation/form";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  children: ReactNode;
  submitLabel: string;
  className?: string;
  buttonClassName?: string;
  resetOnSuccess?: boolean;
};

/** Generic admin form: shows validation/database errors and a success message next to the button. */
export function ActionForm({ action, children, submitLabel, className = "space-y-3", buttonClassName, resetOnSuccess }: Props) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const next = await action(prev, fd);
    if (next.ok && resetOnSuccess) ref.current?.reset();
    return next;
  }, {} as FormState);

  const fieldMessages = Object.entries(state.fieldErrors ?? {}).flatMap(([k, v]) => (v ?? []).map((m) => `${k}: ${m}`));
  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className={buttonClassName ?? "rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"}>
          {pending ? "Saving…" : submitLabel}
        </button>
        {state.ok && state.message ? <span role="status" className="text-sm text-green-800">{state.message}</span> : null}
      </div>
      {state.error ? <p role="alert" className="text-sm text-red-700">{state.error}</p> : null}
      {fieldMessages.length ? <ul role="alert" className="list-disc pl-5 text-xs text-red-700">{fieldMessages.map((m) => <li key={m}>{m}</li>)}</ul> : null}
    </form>
  );
}

export const inputCls = "block w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:outline-2 focus:outline-blue-600";
