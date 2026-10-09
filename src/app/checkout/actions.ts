"use server";

import { redirect } from "next/navigation";
import { assertUser } from "@/lib/auth/dal";
import { friendlyDbError } from "@/lib/errors/db";
import { createClient } from "@/lib/supabase/server";
import { parseForm, type FormState } from "@/lib/validation/form";
import { placeOrderSchema } from "@/lib/validation/schemas";

/**
 * Prices, stock, shipping and COD eligibility are all decided inside the place_order() database function from
 * the products table. Nothing the browser sends (other than which address / method / note) influences the amount.
 */
export async function placeOrderAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertUser();
  const parsed = parseForm(placeOrderSchema, formData);
  if (!parsed.success) return parsed.state;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_order", {
    p_address_id: parsed.data.addressId,
    p_method: parsed.data.method,
    p_notes: parsed.data.notes ?? null,
  });
  if (error || typeof data !== "string") return { error: friendlyDbError(error?.message) };
  redirect(`/orders/${data}`);
}
