import "server-only";
import { assertAdmin, ForbiddenError, type CurrentUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/validation/form";

type Supa = Awaited<ReturnType<typeof createClient>>;

/**
 * Every admin Server Action goes through here:
 *  1. assertAdmin(): identity from Supabase Auth, role from the profiles table;
 *  2. the work runs as the admin's own session (not the service role), so RLS and the admin-only RPCs
 *     (`require_admin()` inside each function) check the role AGAIN in the database.
 */
export async function withAdmin<T extends FormState | void>(
  fn: (ctx: { admin: CurrentUser; supabase: Supa }) => Promise<T>,
): Promise<T | FormState> {
  let admin: CurrentUser;
  try {
    admin = await assertAdmin();
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: "You are not allowed to do that." };
    throw e;
  }
  return fn({ admin, supabase: await createClient() });
}

const ADMIN_MESSAGES: Record<string, string> = {
  amount_mismatch: "The amount received does not match the order total. Check the bank statement.",
  payment_not_found: "Payment not found.",
  payment_not_awaiting_verification: "This payment is not waiting for verification.",
  cod_not_ready_for_verification: "COD payments can be verified only after the order is delivered.",
  reason_required: "A reason is required.",
  use_payment_workflow: "Use the payment verification buttons for that status.",
  order_not_found: "Order not found.",
  order_has_no_shipment: "This order has no shipment yet.",
  order_not_ready_to_ship: "The order must be paid / processing before shipping.",
  invalid_adjustment: "That stock change is not allowed (stock cannot go below zero).",
  inventory_row_missing: "This product has no stock record.",
  invalid_transition: "That status change is not allowed from the current status.",
  "23505": "That value is already in use (duplicate).",
  "23503": "This item is referenced by other records and cannot be changed that way.",
  "23514": "A value breaks a database rule. Please review the inputs.",
};

/** Admin-facing: known codes get a plain sentence, unknown ones a generic one (never raw SQL text). */
export function adminErrorMessage(error: { message?: string; code?: string } | null | undefined): string {
  if (!error) return "Something went wrong.";
  const hit = Object.keys(ADMIN_MESSAGES).find((k) => error.message?.includes(k) || error.code === k);
  return hit ? ADMIN_MESSAGES[hit] : "The database rejected that change. Please review the inputs.";
}
