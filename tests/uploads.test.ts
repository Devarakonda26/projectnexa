import { describe, expect, it } from "vitest";
import { customerUploadPath, productFilePath } from "@/lib/uploads/paths";
import { sanitizeFileName, sniffKind, UPLOAD_POLICIES, validateUpload } from "@/lib/uploads/validate";

const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0x41)]);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0);
const PDF = bytes(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31);
const ZIP = bytes(0x50, 0x4b, 0x03, 0x04);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50, 0, 0, 0, 0]);
const EXE = bytes(0x4d, 0x5a, 0x90, 0x00); // "MZ" Windows executable
const HTML = new TextEncoder().encode("<html><script>alert(1)</script></html>");
const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

const proof = UPLOAD_POLICIES.paymentProof;
const attach = UPLOAD_POLICIES.requestAttachment;

describe("sniffKind", () => {
  it("recognises real file signatures", () => {
    expect(sniffKind(PNG)).toBe("png");
    expect(sniffKind(JPEG)).toBe("jpeg");
    expect(sniffKind(WEBP)).toBe("webp");
    expect(sniffKind(PDF)).toBe("pdf");
    expect(sniffKind(ZIP)).toBe("zip");
    expect(sniffKind(new TextEncoder().encode("hello world\n"))).toBe("text");
  });
  it("does not mistake executables for anything", () => {
    expect(sniffKind(EXE)).toBeNull();
    expect(sniffKind(new Uint8Array([]))).toBeNull();
  });
});

describe("validateUpload", () => {
  it("accepts a genuine PNG payment proof", () => {
    const r = validateUpload({ name: "Receipt 1.PNG", size: 120_000, type: "image/png", head: PNG }, proof);
    expect(r).toEqual({ ok: true, kind: "png", contentType: "image/png", safeName: "receipt-1.png" });
  });

  it("accepts docx (a zip container) for attachments", () => {
    const r = validateUpload(
      { name: "brief.docx", size: 5000, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", head: ZIP },
      attach,
    );
    expect(r.ok).toBe(true);
  });

  it("rejects a renamed executable", () => {
    const r = validateUpload({ name: "proof.png", size: 5000, type: "image/png", head: EXE }, proof);
    expect(r).toEqual({ ok: false, error: "The file contents do not match its type." });
  });

  it("rejects HTML and SVG disguised as images (stored-XSS vector)", () => {
    expect(validateUpload({ name: "x.png", size: 100, type: "image/png", head: HTML }, proof).ok).toBe(false);
    expect(validateUpload({ name: "x.svg", size: 100, type: "image/svg+xml", head: SVG }, UPLOAD_POLICIES.productImage).ok).toBe(false);
    expect(validateUpload({ name: "x.png", size: 100, type: "image/png", head: SVG }, UPLOAD_POLICIES.productImage).ok).toBe(false);
  });

  it("rejects a MIME type that disagrees with the extension", () => {
    const r = validateUpload({ name: "proof.png", size: 5000, type: "application/pdf", head: PNG }, proof);
    expect(r.ok).toBe(false);
  });

  it("rejects disallowed extensions even with a plausible MIME and content", () => {
    expect(validateUpload({ name: "run.exe", size: 5000, type: "application/octet-stream", head: EXE }, attach).ok).toBe(false);
    expect(validateUpload({ name: "page.html", size: 5000, type: "text/html", head: HTML }, attach).ok).toBe(false);
    expect(validateUpload({ name: "archive.zip", size: 5000, type: "application/zip", head: ZIP }, proof).ok).toBe(false);
  });

  it("enforces size limits", () => {
    expect(validateUpload({ name: "a.png", size: 5 * 1024 * 1024 + 1, type: "image/png", head: PNG }, proof).ok).toBe(false);
    expect(validateUpload({ name: "a.png", size: 5 * 1024 * 1024, type: "image/png", head: PNG }, proof).ok).toBe(true);
    expect(validateUpload({ name: "a.png", size: 0, type: "image/png", head: PNG }, proof).ok).toBe(false);
  });

  it("rejects control characters in file names", () => {
    expect(validateUpload({ name: "a\u0000.png", size: 100, type: "image/png", head: PNG }, proof).ok).toBe(false);
  });

  it("accepts a JPEG regardless of .jpg vs .jpeg", () => {
    expect(validateUpload({ name: "a.jpeg", size: 100, type: "image/jpeg", head: JPEG }, proof).ok).toBe(true);
    expect(validateUpload({ name: "a.JPG", size: 100, type: "image/jpeg", head: JPEG }, proof).ok).toBe(true);
  });

  it("tolerates MIME parameters", () => {
    expect(validateUpload({ name: "n.txt", size: 10, type: "text/plain; charset=utf-8", head: new TextEncoder().encode("notes") }, attach).ok).toBe(true);
  });
});

describe("sanitizeFileName", () => {
  it.each([
    ["Receipt (1).PNG", "receipt-1.png"],
    ["evil.php.png", "evil-php.png"],
    ["../../etc/passwd.png", "passwd.png"],
    ["C:\\Users\\x\\proof.jpg", "proof.jpg"],
    ["रसीद.png", "file.png"],
    ["noext", "noext"],
    [".png", "png"],
  ])("%j -> %j", (input, expected) => expect(sanitizeFileName(input)).toBe(expected));

  it("limits the length", () => {
    expect(sanitizeFileName("a".repeat(300) + ".pdf").length).toBeLessThanOrEqual(69);
  });
});

describe("storage paths", () => {
  const user = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const order = "11111111-1111-4111-8111-111111111111";
  const uniq = "22222222-2222-4222-8222-222222222222";

  it("builds the folder shape the database policies and RPC require", () => {
    const path = customerUploadPath(user, order, "proof.png", uniq);
    expect(path).toBe(`${user}/${order}/${uniq}-proof.png`);
    // identical to the LIKE pattern in submit_payment_claim(): <uid>/<order>/%
    expect(path.startsWith(`${user}/${order}/`)).toBe(true);
  });

  it("refuses path traversal and unsanitised names", () => {
    expect(() => customerUploadPath(user, order, "../x.png", uniq)).toThrow();
    expect(() => customerUploadPath(user, order, "a/b.png", uniq)).toThrow();
    expect(() => customerUploadPath("../../x", order, "a.png", uniq)).toThrow();
    expect(() => customerUploadPath(user, "not-a-uuid", "a.png", uniq)).toThrow();
  });

  it("builds product file paths", () => {
    expect(productFilePath(order, 2, "project.zip")).toBe(`${order}/v2/project.zip`);
    expect(() => productFilePath(order, 0, "project.zip")).toThrow();
  });
});
