/**
 * Upload validation that does NOT trust the browser.
 * A file passes only if (1) size is within the cap, (2) the extension is allowed, (3) the declared MIME type is allowed
 * and matches the extension, and (4) the first bytes of the file really look like that type ("magic numbers").
 * The storage buckets repeat the size and MIME limits, so this is defence in depth.
 */

export type Kind = "png" | "jpeg" | "webp" | "pdf" | "zip" | "docx" | "7z" | "gzip" | "text";

type KindInfo = { mime: string[]; ext: string[] };

const KINDS: Record<Kind, KindInfo> = {
  png: { mime: ["image/png"], ext: ["png"] },
  jpeg: { mime: ["image/jpeg"], ext: ["jpg", "jpeg"] },
  webp: { mime: ["image/webp"], ext: ["webp"] },
  pdf: { mime: ["application/pdf"], ext: ["pdf"] },
  zip: { mime: ["application/zip", "application/x-zip-compressed"], ext: ["zip"] },
  docx: { mime: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"], ext: ["docx"] },
  "7z": { mime: ["application/x-7z-compressed"], ext: ["7z"] },
  gzip: { mime: ["application/gzip"], ext: ["gz", "tgz"] },
  text: { mime: ["text/plain"], ext: ["txt"] },
};

export type UploadPolicy = { name: string; maxBytes: number; kinds: Kind[] };

const MB = 1024 * 1024;
export const UPLOAD_POLICIES = {
  paymentProof: { name: "payment proof", maxBytes: 5 * MB, kinds: ["png", "jpeg", "webp", "pdf"] },
  requestAttachment: { name: "attachment", maxBytes: 20 * MB, kinds: ["pdf", "png", "jpeg", "webp", "zip", "docx", "text"] },
  productImage: { name: "product image", maxBytes: 2 * MB, kinds: ["png", "jpeg", "webp"] },
  productFile: { name: "product file", maxBytes: 200 * MB, kinds: ["zip", "pdf", "7z", "gzip"] },
} as const satisfies Record<string, UploadPolicy>;

export type UploadInput = {
  name: string;
  size: number;
  type: string;
  /** At least the first 16 bytes of the file. */
  head: Uint8Array;
};

export type UploadResult =
  | { ok: true; kind: Kind; contentType: string; safeName: string }
  | { ok: false; error: string };

const startsWith = (bytes: Uint8Array, sig: number[], offset = 0) =>
  bytes.length >= offset + sig.length && sig.every((b, i) => bytes[offset + i] === b);

/** Identifies the real file type from its leading bytes. */
export function sniffKind(head: Uint8Array): Kind | null {
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (startsWith(head, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWith(head, [0x52, 0x49, 0x46, 0x46]) && startsWith(head, [0x57, 0x45, 0x42, 0x50], 8)) return "webp";
  if (startsWith(head, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "pdf"; // %PDF-
  if (startsWith(head, [0x50, 0x4b, 0x03, 0x04]) || startsWith(head, [0x50, 0x4b, 0x05, 0x06])) return "zip"; // docx is a zip too
  if (startsWith(head, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) return "7z";
  if (startsWith(head, [0x1f, 0x8b])) return "gzip";
  // Plain text: no NUL or other control bytes (tab, LF, CR allowed).
  if (head.length > 0 && head.every((b) => b === 0x09 || b === 0x0a || b === 0x0d || (b >= 0x20 && b !== 0x7f))) return "text";
  return null;
}

/** Lowercase, ASCII, no path parts, only the final dot kept ("evil.php.png" becomes "evil-php.png"). */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot + 1) : "";
  const clean = (s: string) =>
    s.normalize("NFKD").replace(/[^\x20-\x7e]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const safeStem = clean(stem).slice(0, 60) || "file";
  const safeExt = clean(ext).slice(0, 8);
  return safeExt ? `${safeStem}.${safeExt}` : safeStem;
}

export function validateUpload(input: UploadInput, policy: UploadPolicy): UploadResult {
  const fail = (error: string): UploadResult => ({ ok: false, error });

  if (!input.name || /[\u0000-\u001f]/.test(input.name)) return fail("Invalid file name.");
  if (!Number.isFinite(input.size) || input.size <= 0) return fail("The file is empty.");
  if (input.size > policy.maxBytes) {
    return fail(`The ${policy.name} must be at most ${Math.floor(policy.maxBytes / MB)} MB.`);
  }

  const extension = (input.name.split(".").pop() ?? "").toLowerCase();
  const declaredMime = input.type.toLowerCase().split(";")[0].trim();

  const kind = policy.kinds.find((k) => KINDS[k].ext.includes(extension));
  if (!kind) {
    const allowed = [...new Set(policy.kinds.flatMap((k) => KINDS[k].ext))].join(", ");
    return fail(`Unsupported file type. Allowed: ${allowed}.`);
  }
  if (!KINDS[kind].mime.includes(declaredMime)) {
    return fail("The file type does not match its extension.");
  }

  const sniffed = sniffKind(input.head);
  // .docx files are ZIP containers, so they sniff as "zip".
  const matches = sniffed === kind || (kind === "docx" && sniffed === "zip");
  if (!matches) return fail("The file contents do not match its type.");

  return { ok: true, kind, contentType: KINDS[kind].mime[0], safeName: sanitizeFileName(input.name) };
}
