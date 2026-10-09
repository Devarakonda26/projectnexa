import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { customerUploadPath } from "./paths";
import { UPLOAD_POLICIES, validateUpload } from "./validate";

export const MAX_ATTACHMENTS_PER_REQUEST = 10;
export const MAX_FILES_PER_SUBMISSION = 5;

/**
 * Validates and stores files for a custom request, as the signed-in user (so storage RLS + table RLS also apply).
 * Returns per-file errors instead of throwing so one bad file does not lose the request.
 */
export async function saveRequestAttachments(
  supabase: SupabaseClient,
  userId: string,
  requestId: string,
  files: File[],
): Promise<{ saved: number; errors: string[] }> {
  const errors: string[] = [];
  let saved = 0;

  const { count } = await supabase.from("request_attachments").select("id", { count: "exact", head: true }).eq("request_id", requestId);
  let room = MAX_ATTACHMENTS_PER_REQUEST - (count ?? 0);

  for (const file of files.slice(0, MAX_FILES_PER_SUBMISSION)) {
    if (room <= 0) {
      errors.push(`${file.name}: attachment limit reached (${MAX_ATTACHMENTS_PER_REQUEST} per request).`);
      continue;
    }
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const checked = validateUpload({ name: file.name, size: file.size, type: file.type, head }, UPLOAD_POLICIES.requestAttachment);
    if (!checked.ok) {
      errors.push(`${file.name.slice(0, 80)}: ${checked.error}`);
      continue;
    }
    const path = customerUploadPath(userId, requestId, checked.safeName, randomUUID());
    const { error: upErr } = await supabase.storage.from("request-attachments").upload(path, file, { contentType: checked.contentType, upsert: false });
    if (upErr) {
      errors.push(`${checked.safeName}: upload failed.`);
      continue;
    }
    const { error: rowErr } = await supabase.from("request_attachments").insert({
      request_id: requestId,
      uploaded_by: userId,
      storage_path: path,
      file_name: checked.safeName,
      size_bytes: file.size,
      content_type: checked.contentType,
    });
    if (rowErr) {
      errors.push(`${checked.safeName}: could not be recorded.`);
      continue;
    }
    saved += 1;
    room -= 1;
  }
  if (files.length > MAX_FILES_PER_SUBMISSION) errors.push(`Only ${MAX_FILES_PER_SUBMISSION} files can be added at a time.`);
  return { saved, errors };
}
