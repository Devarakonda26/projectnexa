"use server";

import { revalidatePath } from "next/cache";
import { adminErrorMessage, withAdmin } from "@/lib/admin/run";
import {
  adminNoteSchema, branchSchema, categorySchema, milestonePaidSchema, milestoneSchema, milestoneStatusSchema,
  orderStatusSchema, quoteSchema, rejectPaymentSchema, requestStatusSchema, shipmentSchema, stockAdjustSchema, verifyPaymentSchema,
} from "@/lib/validation/admin";
import { parseForm, type FormState } from "@/lib/validation/form";

type Result = Promise<FormState>;
const done = (message: string): FormState => ({ ok: true, message });

// ---------------------------------------------------------------- payments
export async function verifyPaymentAction(_p: FormState, formData: FormData): Result {
  return (await withAdmin(async ({ supabase }) => {
    const parsed = parseForm(verifyPaymentSchema, formData);
    if (!parsed.success) return parsed.state;
    const { error } = await supabase.rpc("admin_verify_payment", {
      p_payment_id: parsed.data.paymentId,
      p_received_paise: parsed.data.receivedAmount,
      p_note: parsed.data.note ?? null,
    });
    if (error) return { error: adminErrorMessage(error) };
    revalidatePath("/admin", "layout");
    return done("Payment verified. The order is now paid.");
  })) as FormState;
}

export async function rejectPaymentAction(_p: FormState, formData: FormData): Result {
  return (await withAdmin(async ({ supabase }) => {
    const parsed = parseForm(rejectPaymentSchema, formData);
    if (!parsed.success) return parsed.state;
    const { error } = await supabase.rpc("admin_reject_payment", { p_payment_id: parsed.data.paymentId, p_reason: parsed.data.reason });
    if (error) return { error: adminErrorMessage(error) };
    revalidatePath("/admin", "layout");
    return done("Payment rejected. The customer can submit new details.");
  })) as FormState;
}

// ---------------------------------------------------------------- orders & shipments
export async function setOrderStatusAction(_p: FormState, formData: FormData): Result {
  return (await withAdmin(async ({ supabase }) => {
    const parsed = parseForm(orderStatusSchema, formData);
    if (!parsed.success) return parsed.state;
    const { error } = await supabase.rpc("admin_set_order_status", { p_order_id: parsed.data.orderId, p_status: parsed.data.status, p_note: parsed.data.note ?? null });
    if (error) return { error: adminErrorMessage(error) };
    revalidatePath("/admin", "layout");
    return done("Order status updated.");
  })) as FormState;
}

export async function upsertShipmentAction(_p: FormState, formData: FormData): Result {
  return (await withAdmin(async ({ supabase }) => {
    const parsed = parseForm(shipmentSchema, formData);
    if (!parsed.success) return parsed.state;
    const d = parsed.data;
    const { error } = await supabase.rpc("admin_upsert_shipment", {
      p_order_id: d.orderId, p_status: d.status, p_carrier: d.carrier ?? null, p_tracking_number: d.trackingNumber ?? null, p_tracking_url: d.trackingUrl ?? null,
    });
    if (error) return { error: adminErrorMessage(error) };
    revalidatePath("/admin", "layout");
    return done("Shipment saved.");
  })) as FormState;
}

// ---------------------------------------------------------------- inventory
export async function adjustStockAction(_p: FormState, formData: FormData): Result {
  return (await withAdmin(async ({ supabase }) => {
    const parsed = parseForm(stockAdjustSchema, formData);
    if (!parsed.success) return parsed.state;
    const { error } = await supabase.rpc("admin_adjust_stock", {
      p_product_id: parsed.data.productId, p_delta: parsed.data.delta, p_reason: parsed.data.reason, p_note: parsed.data.note ?? null,
    });
    if (error) return { error: adminErrorMessage(error) };
    revalidatePath("/admin", "layout");
    return done("Stock updated.");
  })) as FormState;
}

// ---------------------------------------------------------------- branches & categories
export async function saveBranchAction(_p: FormState, formData: FormData): Result {
  return (await withAdmin(async ({ supabase }) => {
    const parsed = parseForm(branchSchema, formData);
    if (!parsed.success) return parsed.state;
    const d = parsed.data;
    const row = { name: d.name, short_name: d.shortName, slug: d.slug, description: d.description ?? null, sort_order: d.sortOrder ?? 100, is_active: d.isActive };
    const id = formData.get("id");
    const { error } = typeof id === "string" && id ? await supabase.from("branches").update(row).eq("id", id) : await supabase.from("branches").insert(row);
    if (error) return { error: adminErrorMessage(error) };
    revalidatePath("/", "layout");
    return done("Branch saved.");
  })) as FormState;
}

export async function saveCategoryAction(_p: FormState, formData: FormData): Result {
  return (await withAdmin(async ({ supabase }) => {
    const parsed = parseForm(categorySchema, formData);
    if (!parsed.success) return parsed.state;
    const d = parsed.data;
    const row = { branch_id: d.branchId, name: d.name, slug: d.slug, description: d.description ?? null, sort_order: d.sortOrder ?? 100, is_active: d.isActive };
    const id = formData.get("id");
    const { error } = typeof id === "string" && id ? await supabase.from("categories").update(row).eq("id", id) : await supabase.from("categories").insert(row);
    if (error) return { error: adminErrorMessage(error) };
    revalidatePath("/", "layout");
    return done("Category saved.");
  })) as FormState;
}

// ---------------------------------------------------------------- custom requests
export async function setRequestStatusAction(_p: FormState, formData: FormData): Result {
  return (await withAdmin(async ({ supabase }) => {
    const parsed = parseForm(requestStatusSchema, formData);
    if (!parsed.success) return parsed.state;
    const { error } = await supabase.from("custom_requests").update({ status: parsed.data.status }).eq("id", parsed.data.requestId);
    if (error) return { error: adminErrorMessage(error) };
    revalidatePath("/admin", "layout");
    return done("Request status updated.");
  })) as FormState;
}

export async function addAdminNoteAction(_p: FormState, formData: FormData): Result {
  return (await withAdmin(async ({ supabase, admin }) => {
    const parsed = parseForm(adminNoteSchema, formData);
    if (!parsed.success) return parsed.state;
    const { error } = await supabase.from("request_admin_notes").insert({ request_id: parsed.data.requestId, author_id: admin.id, note: parsed.data.note });
    if (error) return { error: adminErrorMessage(error) };
    revalidatePath("/admin", "layout");
    return done("Note added (visible to staff only).");
  })) as FormState;
}

export async function createQuoteAction(_p: FormState, formData: FormData): Result {
  return (await withAdmin(async ({ supabase, admin }) => {
    const parsed = parseForm(quoteSchema, formData);
    if (!parsed.success) return parsed.state;
    const d = parsed.data;
    const { error } = await supabase.from("request_quotes").insert({
      request_id: d.requestId, amount_paise: d.amount, scope: d.scope, delivery_days: d.deliveryDays ?? null,
      valid_until: d.validUntil ?? null, status: d.send ? "sent" : "draft", created_by: admin.id,
    });
    if (error) return { error: adminErrorMessage(error) };
    revalidatePath("/admin", "layout");
    return done(d.send ? "Quote sent to the customer." : "Draft quote saved.");
  })) as FormState;
}

export async function addMilestoneAction(_p: FormState, formData: FormData): Result {
  return (await withAdmin(async ({ supabase }) => {
    const parsed = parseForm(milestoneSchema, formData);
    if (!parsed.success) return parsed.state;
    const d = parsed.data;
    const { count } = await supabase.from("request_milestones").select("id", { count: "exact", head: true }).eq("request_id", d.requestId);
    const { error } = await supabase.from("request_milestones").insert({
      request_id: d.requestId, title: d.title, description: d.description ?? null, amount_paise: d.amount, due_date: d.dueDate ?? null, sort_order: ((count ?? 0) + 1) * 10,
    });
    if (error) return { error: adminErrorMessage(error) };
    revalidatePath("/admin", "layout");
    return done("Milestone added.");
  })) as FormState;
}

export async function setMilestoneStatusAction(_p: FormState, formData: FormData): Result {
  return (await withAdmin(async ({ supabase }) => {
    const parsed = parseForm(milestoneStatusSchema, formData);
    if (!parsed.success) return parsed.state;
    const patch: Record<string, unknown> = { status: parsed.data.status };
    if (parsed.data.status === "submitted") patch.submitted_at = new Date().toISOString();
    const { error } = await supabase.from("request_milestones").update(patch).eq("id", parsed.data.milestoneId).eq("request_id", parsed.data.requestId);
    if (error) return { error: adminErrorMessage(error) };
    revalidatePath("/admin", "layout");
    return done("Milestone updated.");
  })) as FormState;
}

export async function markMilestonePaidAction(_p: FormState, formData: FormData): Result {
  return (await withAdmin(async ({ supabase }) => {
    const parsed = parseForm(milestonePaidSchema, formData);
    if (!parsed.success) return parsed.state;
    const { error } = await supabase.rpc("admin_mark_milestone_paid", { p_milestone_id: parsed.data.milestoneId, p_reference: parsed.data.reference });
    if (error) return { error: adminErrorMessage(error) };
    revalidatePath("/admin", "layout");
    return done("Milestone marked as paid.");
  })) as FormState;
}
