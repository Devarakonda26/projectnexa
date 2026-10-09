"use client";

import { useActionState } from "react";
import { addAttachmentsAction } from "@/app/custom-projects/actions";
import type { FormState } from "@/lib/validation/form";

export function AddAttachments({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState(addAttachmentsAction, {} as FormState);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="requestId" value={requestId} />
      <input name="attachments" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.zip,.docx,.txt" className="block w-full text-sm" />
      <button disabled={pending} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 disabled:opacity-60">{pending ? "Uploading…" : "Add files"}</button>
      {state.error ? <p role="alert" className="text-sm text-red-700">{state.error}</p> : null}
      {state.ok ? <p role="status" className="text-sm text-green-800">{state.message}</p> : null}
    </form>
  );
}
