"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { assertUser } from "@/lib/auth/dal";
import { friendlyDbError } from "@/lib/errors/db";
import { createClient } from "@/lib/supabase/server";
import { customerUploadPath } from "@/lib/uploads/paths";
import { UPLOAD_POLICIES, validateUpload } from "@/lib/uploads/validate";
import { uuid } from "@/lib/validation/common";
import { parseForm, type FormState } from "@/lib/validation/form";
import { paymentClaimSchema } from "@/lib/validation/schemas";

/**
 * Submits a payment CLAIM. The order does not become "paid" here: only an admin can verify it
 * (admin_verify_payment checks the amount). The amount is copied from the order by the database, never from the form.
 */
export async function submitPaymentClaimAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await assertUser();
  const parsed = parseForm(paymentClaimSchema, formData);
  if (!parsed.success) return parsed.state;
  const { orderId, utr, payerName } = parsed.data;

  const supabase = await createClient();

  let proofPath: string | null = null;
  const file = formData.get("proof");
  if (file instanceof File && file.size > 0) {
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const checked = validateUpload({ name: file.name, size: file.size, type: file.type, head }, UPLOAD_POLICIES.paymentProof);
    if (!checked.ok) return { error: checked.error, fieldErrors: { proof: [checked.error] } };

    proofPath = customerUploadPath(user.id, orderId, checked.safeName, randomUUID());
    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(proofPath, file, { contentType: checked.contentType, upsert: false });
    if (uploadError) return { error: "Could not upload the screenshot. Please try again." };
  }

  const { error } = await supabase.rpc("submit_payment_claim", {
    p_order_id: orderId,
    p_utr: utr,
    p_payer_name: payerName,
    p_proof_path: proofPath,
  });
  if (error) return { error: friendlyDbError(error.message) };

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return { ok: true, message: "Thanks! We received your payment details and will verify them shortly." };
}

export async function cancelOrderAction(formData: FormData): Promise<void> {
  await assertUser();
  const id = uuid.safeParse(formData.get("orderId"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.rpc("cancel_order", { p_order_id: id.data });
  revalidatePath(`/orders/${id.data}`);
  revalidatePath("/orders");
}
