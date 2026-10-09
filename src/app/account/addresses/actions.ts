"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertUser } from "@/lib/auth/dal";
import { safeNextPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/validation/common";
import { parseForm, type FormState } from "@/lib/validation/form";
import { addressSchema } from "@/lib/validation/schemas";

export async function addAddressAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await assertUser();
  const parsed = parseForm(addressSchema, formData);
  if (!parsed.success) return parsed.state;
  const a = parsed.data;

  const supabase = await createClient();
  if (a.isDefault) await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id).eq("is_default", true);
  const { count } = await supabase.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  if ((count ?? 0) >= 10) return { error: "You can save up to 10 addresses. Delete one first." };

  const { error } = await supabase.from("addresses").insert({
    user_id: user.id,
    label: a.label,
    recipient_name: a.recipientName,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2 ?? null,
    landmark: a.landmark ?? null,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    is_default: a.isDefault || (count ?? 0) === 0,
  });
  if (error) return { error: "Could not save the address. Please check the details." };

  revalidatePath("/account/addresses");
  const next = safeNextPath(formData.get("next"), "");
  if (next) redirect(next);
  return { ok: true, message: "Address saved." };
}

export async function deleteAddressAction(formData: FormData): Promise<void> {
  const user = await assertUser();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("addresses").delete().eq("id", id.data).eq("user_id", user.id);
  revalidatePath("/account/addresses");
}

