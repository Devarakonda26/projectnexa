/**
 * Storage object paths. The DATABASE enforces the same shape in RLS and in submit_payment_claim():
 *   payment-proofs      <user id>/<order id>/<file>
 *   request-attachments <user id>/<request id>/<file>
 * so a customer can only ever write inside their own folder.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertUuid(value: string, label: string) {
  if (!UUID.test(value)) throw new Error(`${label} must be a UUID`);
}

export function customerUploadPath(userId: string, parentId: string, safeName: string, uniqueId: string): string {
  assertUuid(userId, "userId");
  assertUuid(parentId, "parentId");
  assertUuid(uniqueId, "uniqueId");
  if (!/^[a-z0-9][a-z0-9.-]*$/.test(safeName)) throw new Error("safeName must come from sanitizeFileName()");
  return `${userId}/${parentId}/${uniqueId}-${safeName}`;
}

export function productFilePath(productId: string, version: number, safeName: string): string {
  assertUuid(productId, "productId");
  if (!Number.isInteger(version) || version < 1) throw new Error("version must be a positive integer");
  if (!/^[a-z0-9][a-z0-9.-]*$/.test(safeName)) throw new Error("safeName must come from sanitizeFileName()");
  return `${productId}/v${version}/${safeName}`;
}
