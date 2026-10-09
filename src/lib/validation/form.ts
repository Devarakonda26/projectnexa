import type { z } from "zod";

export type FormState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** What the user typed, sent back so the form does not lose their input after an error. */
  values?: Record<string, string>;
};

/** Plain string fields from a FormData (files and non-strings are ignored). */
export function formToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) out[key] = value;
  }
  return out;
}

export function parseForm<S extends z.ZodType>(
  schema: S,
  formData: FormData,
): { success: true; data: z.output<S> } | { success: false; state: FormState } {
  const result = schema.safeParse(formToObject(formData));
  if (result.success) return { success: true, data: result.data };
  const flat = (result.error as z.ZodError).flatten?.() ?? { fieldErrors: {} };
  return {
    success: false,
    state: {
      error: "Please fix the highlighted fields.",
      fieldErrors: flat.fieldErrors as FormState["fieldErrors"],
      values: formToObject(formData),
    },
  };
}
