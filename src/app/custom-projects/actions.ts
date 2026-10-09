"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { saveRequestAttachments } from "@/lib/uploads/request-attachments";
import { uuid } from "@/lib/validation/common";
import { parseForm, type FormState } from "@/lib/validation/form";
import { customRequestSchema } from "@/lib/validation/schemas";

function filesFrom(formData: FormData): File[] {
  return formData.getAll("attachments").filter((f): f is File => f instanceof File && f.size > 0);
}

export async function createCustomRequestAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await assertUser();
  const parsed = parseForm(customRequestSchema, formData);
  if (!parsed.success) return parsed.state;
  const r = parsed.data;

  const supabase = await createClient();

  // Cheap abuse guard on top of RLS: at most 5 open requests per customer.
  const { count } = await supabase
    .from("custom_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["submitted", "under_review", "quoted"]);
  if ((count ?? 0) >= 5) return { error: "You already have 5 open requests. Please wait for a response or cancel one." };

  const { data, error } = await supabase
    .from("custom_requests")
    .insert({
      user_id: user.id,
      title: r.title,
      branch_id: r.branchId,
      description: r.description,
      requirements: r.requirements ?? null,
      budget_min_paise: r.budgetMin ?? null,
      budget_max_paise: r.budgetMax ?? null,
      deadline: r.deadline ?? null,
      status: "submitted",
    })
    .select("id")
    .single();
  if (error || !data) return { error: "Could not submit your request. Please check the details and try again." };

  const { errors } = await saveRequestAttachments(supabase, user.id, data.id, filesFrom(formData));
  revalidatePath("/custom-projects/requests");
  redirect(`/custom-projects/requests/${data.id}${errors.length ? "?attach=partial" : ""}`);
}

export async function addAttachmentsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await assertUser();
  const id = uuid.safeParse(formData.get("requestId"));
  if (!id.success) return { error: "Invalid request." };
  const files = filesFrom(formData);
  if (files.length === 0) return { error: "Choose at least one file." };

  const supabase = await createClient();
  const { data: req } = await supabase.from("custom_requests").select("id").eq("id", id.data).eq("user_id", user.id).maybeSingle();
  if (!req) return { error: "Request not found." };

  const { saved, errors } = await saveRequestAttachments(supabase, user.id, id.data, files);
  revalidatePath(`/custom-projects/requests/${id.data}`);
  if (saved === 0) return { error: errors[0] ?? "No files were added." };
  return { ok: true, message: `${saved} file${saved > 1 ? "s" : ""} added.${errors.length ? ` Skipped: ${errors.join(" ")}` : ""}` };
}

export async function respondToQuoteAction(formData: FormData): Promise<void> {
  await assertUser();
  const quoteId = uuid.safeParse(formData.get("quoteId"));
  const requestId = uuid.safeParse(formData.get("requestId"));
  const decision = formData.get("decision");
  if (!quoteId.success || !requestId.success || (decision !== "accept" && decision !== "decline")) return;
  const supabase = await createClient();
  await supabase.rpc("respond_to_quote", { p_quote_id: quoteId.data, p_accept: decision === "accept" });
  revalidatePath(`/custom-projects/requests/${requestId.data}`);
}

export async function approveMilestoneAction(formData: FormData): Promise<void> {
  await assertUser();
  const milestoneId = uuid.safeParse(formData.get("milestoneId"));
  const requestId = uuid.safeParse(formData.get("requestId"));
  if (!milestoneId.success || !requestId.success) return;
  const supabase = await createClient();
  await supabase.rpc("approve_milestone", { p_milestone_id: milestoneId.data });
  revalidatePath(`/custom-projects/requests/${requestId.data}`);
}

export async function cancelRequestAction(formData: FormData): Promise<void> {
  await assertUser();
  const requestId = uuid.safeParse(formData.get("requestId"));
  if (!requestId.success) return;
  const supabase = await createClient();
  await supabase.rpc("cancel_custom_request", { p_request_id: requestId.data });
  revalidatePath(`/custom-projects/requests/${requestId.data}`);
  revalidatePath("/custom-projects/requests");
}
