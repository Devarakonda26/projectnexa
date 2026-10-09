"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/validation/form";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "tel";
  autoComplete?: string;
  required?: boolean;
  hint?: string;
};

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  fields: Field[];
  submitLabel: string;
  next?: string;
};

const initial: FormState = {};

export function AuthForm({ action, fields, submitLabel, next }: Props) {
  const [state, formAction, pending] = useActionState(action, initial);

  if (state.ok && state.message) {
    return (
      <p role="status" className="rounded-md border border-green-300 bg-green-50 p-4 text-sm text-green-900">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.error ? (
        <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {state.error}
        </p>
      ) : null}
      {fields.map((f) => {
        const errors = state.fieldErrors?.[f.name];
        return (
          <div key={f.name}>
            <label htmlFor={f.name} className="mb-1 block text-sm font-medium">
              {f.label}
            </label>
            <input
              id={f.name}
              name={f.name}
              type={f.type ?? "text"}
              autoComplete={f.autoComplete}
              required={f.required !== false}
              aria-invalid={errors?.length ? true : undefined}
              aria-describedby={errors?.length ? `${f.name}-error` : f.hint ? `${f.name}-hint` : undefined}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:outline-2 focus:outline-blue-600"
            />
            {f.hint && !errors?.length ? (
              <p id={`${f.name}-hint`} className="mt-1 text-xs text-slate-600">
                {f.hint}
              </p>
            ) : null}
            {errors?.length ? (
              <p id={`${f.name}-error`} className="mt-1 text-xs text-red-700">
                {errors[0]}
              </p>
            ) : null}
          </div>
        );
      })}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-blue-700 px-4 py-2.5 font-medium text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {pending ? "Please wait…" : submitLabel}
      </button>
    </form>
  );
}
