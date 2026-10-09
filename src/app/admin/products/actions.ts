"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminErrorMessage, withAdmin } from "@/lib/admin/run";
import { assertAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { productFilePath } from "@/lib/uploads/paths";
import { UPLOAD_POLICIES, sanitizeFileName, sniffKind, validateUpload } from "@/lib/uploads/validate";
import { productSchema } from "@/lib/validation/admin";
import { uuid } from "@/lib/validation/common";
import { parseForm, type FormState } from "@/lib/validation/form";

export async function saveProductAction(_p: FormState, formData: FormData): Promise<FormState> {
  let createdId: string | null = null;
  const result = (await withAdmin(async ({ supabase, admin }) => {
    const parsed = parseForm(productSchema, formData);
    if (!parsed.success) return parsed.state;
    const d = parsed.data;
    const row = {
      title: d.title, slug: d.slug, summary: d.summary, description: d.description ?? "",
      product_type: d.productType, status: d.status, branch_id: d.branchId, category_id: d.categoryId,
      price_paise: d.price, mrp_paise: d.mrp ?? null, difficulty: d.difficulty,
      tech_stack: d.techStack, tags: d.tags, weight_grams: d.productType === "hardware" ? d.weightGrams ?? null : null,
      cod_eligible: d.productType === "hardware" && d.codEligible, is_featured: d.isFeatured,
      is_sample: d.isSample, is_quote_only: d.isQuoteOnly, sku: d.sku, subdomain: d.subdomain ?? null,
      estimated_time: d.estimatedTime ?? null, features: d.features, deliverables: d.deliverables,
      software_requirements: d.softwareRequirements, hardware_requirements: d.hardwareRequirements, faq: d.faq,
    };

    const id = formData.get("id");
    if (typeof id === "string" && id) {
      if (!uuid.safeParse(id).success) return { error: "Invalid product." };
      const { error } = await supabase.from("products").update(row).eq("id", id);
      if (error) return { error: adminErrorMessage(error) };
      revalidatePath("/", "layout");
      return { ok: true, message: "Product saved." } satisfies FormState;
    }

    const { data, error } = await supabase.from("products").insert({ ...row, created_by: admin.id }).select("id").single();
    if (error || !data) return { error: adminErrorMessage(error) };
    if (d.productType === "hardware") {
      const inv = await supabase.from("inventory").insert({ product_id: data.id, quantity_on_hand: d.initialStock ?? 0, low_stock_threshold: d.lowStockThreshold ?? 5 });
      if (inv.error) return { error: "Product created but its stock record failed: " + adminErrorMessage(inv.error) };
    }
    createdId = data.id;
    revalidatePath("/", "layout");
    return { ok: true } satisfies FormState;
  })) as FormState;
  if (createdId) redirect(`/admin/products/${createdId}`);
  return result;
}

export async function uploadCoverImageAction(_p: FormState, formData: FormData): Promise<FormState> {
  return (await withAdmin(async ({ supabase }) => {
    const productId = uuid.safeParse(formData.get("productId"));
    const file = formData.get("image");
    if (!productId.success || !(file instanceof File) || file.size === 0) return { error: "Choose an image." };

    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const checked = validateUpload({ name: file.name, size: file.size, type: file.type, head }, UPLOAD_POLICIES.productImage);
    if (!checked.ok) return { error: checked.error };

    const path = `${productId.data}/${randomUUID()}-${checked.safeName}`;
    const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, { contentType: checked.contentType, upsert: false });
    if (upErr) return { error: "Upload failed. Please try again." };
    const { error } = await supabase.from("products").update({ cover_image_path: path }).eq("id", productId.data);
    if (error) return { error: adminErrorMessage(error) };
    revalidatePath("/", "layout");
    return { ok: true, message: "Cover image updated." } satisfies FormState;
  })) as FormState;
}

// ----- Large downloadable files go straight from the browser to Storage (Server Actions cap request bodies).
// Step 1 validates the declaration and mints a one-time upload token; step 2 (browser) uploads;
// step 3 re-checks what actually landed in Storage (size + file signature) before recording it.

export type PrepareResult = { ok: true; path: string; token: string; version: number; contentType: string } | { ok: false; error: string };

export async function prepareProductFileUpload(input: { productId: string; name: string; size: number; type: string }): Promise<PrepareResult> {
  try {
    await assertAdmin();
  } catch {
    return { ok: false, error: "You are not allowed to do that." };
  }
  const productId = uuid.safeParse(input.productId);
  if (!productId.success) return { ok: false, error: "Invalid product." };

  // Only the declared metadata can be checked here (the real bytes are verified in finalize), so an empty
  // header is expected to fail the content check below and is ignored; every other failure is reported.
  const probe = validateUpload({ name: input.name, size: input.size, type: input.type, head: new Uint8Array() }, UPLOAD_POLICIES.productFile);
  if (!probe.ok && !/contents do not match/.test(probe.error)) return { ok: false, error: probe.error };

  const supabase = await createClient();
  const { data: last } = await supabase.from("product_files").select("version").eq("product_id", productId.data).order("version", { ascending: false }).limit(1).maybeSingle();
  const version = (last?.version ?? 0) + 1;
  const path = productFilePath(productId.data, version, sanitizeFileName(input.name));
  const { data, error } = await supabase.storage.from("product-files").createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: "Could not start the upload." };
  return { ok: true, path, token: data.token, version, contentType: probe.ok ? probe.contentType : input.type };
}

export async function finalizeProductFileUpload(input: { productId: string; path: string; name: string; contentType: string; version: number }): Promise<FormState> {
  return (await withAdmin(async ({ supabase }) => {
    const productId = uuid.safeParse(input.productId);
    if (!productId.success || !input.path.startsWith(`${productId.data}/`) || input.path.includes("..")) return { error: "Invalid upload." };

    const { data: info, error } = await supabase.storage.from("product-files").info(input.path);
    if (error || !info) return { error: "The uploaded file was not found in storage." };
    const size = Number(info.size);

    // Verify the file signature from its first bytes (ranged read through a short-lived URL).
    const { data: signed } = await supabase.storage.from("product-files").createSignedUrl(input.path, 60);
    let head: Uint8Array | null = null;
    if (signed?.signedUrl) {
      const res = await fetch(signed.signedUrl, { headers: { Range: "bytes=0-15" } }).catch(() => null);
      if (res?.ok) head = new Uint8Array(await res.arrayBuffer()).slice(0, 16);
    }
    const kind = head ? sniffKind(head) : null;
    if (!kind || !["zip", "pdf", "7z", "gzip"].includes(kind)) {
      await supabase.storage.from("product-files").remove([input.path]);
      return { error: "The file contents are not a ZIP, PDF, 7z or GZ archive, so it was removed." };
    }

    const { error: rowErr } = await supabase.from("product_files").insert({
      product_id: productId.data, storage_path: input.path, file_name: sanitizeFileName(input.name),
      size_bytes: size, content_type: input.contentType, version: input.version,
    });
    if (rowErr) return { error: adminErrorMessage(rowErr) };
    revalidatePath(`/admin/products/${productId.data}`);
    return { ok: true, message: `Version ${input.version} uploaded.` } satisfies FormState;
  })) as FormState;
}
