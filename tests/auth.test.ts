import { describe, expect, it } from "vitest";
import { loginUrl, safeNextPath } from "@/lib/auth/redirects";
import { isAdminPath, requiresAuth } from "@/lib/auth/routes";

describe("safeNextPath (open-redirect protection)", () => {
  it("allows plain same-site paths, with query and hash", () => {
    expect(safeNextPath("/checkout")).toBe("/checkout");
    expect(safeNextPath("/orders/123?tab=items#top")).toBe("/orders/123?tab=items#top");
  });

  it.each([
    "https://evil.example",
    "http://evil.example/path",
    "//evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "javascript:alert(1)",
    "evil.example",
    "/%2f%2fevil.example",
    "/%5cevil.example",
    "/ok\r\nSet-Cookie: a=b",
    "/ok\u0000",
    "",
    "   ",
  ])("rejects %j", (bad) => {
    expect(safeNextPath(bad)).toBe("/account");
  });

  it("rejects non-strings and oversized values", () => {
    expect(safeNextPath(undefined)).toBe("/account");
    expect(safeNextPath(["/a"])).toBe("/account");
    expect(safeNextPath("/" + "a".repeat(600))).toBe("/account");
  });

  it("honours a custom fallback", () => {
    expect(safeNextPath("https://evil.example", "/")).toBe("/");
  });

  it("builds an encoded login URL", () => {
    expect(loginUrl("/checkout?x=1")).toBe("/login?next=%2Fcheckout%3Fx%3D1");
    expect(loginUrl("https://evil.example")).toBe("/login?next=%2F");
  });
});

describe("requiresAuth / isAdminPath", () => {
  it.each(["/account", "/account/addresses", "/admin", "/admin/orders/5", "/cart", "/checkout", "/orders/abc", "/downloads", "/custom-projects/new"])(
    "protects %s",
    (p) => expect(requiresAuth(p)).toBe(true),
  );

  it.each(["/", "/products", "/products/esp32-kit", "/branches/cse", "/login", "/custom-projects", "/accounting", "/administrator"])(
    "leaves %s public",
    (p) => expect(requiresAuth(p)).toBe(false),
  );

  it("recognises admin paths without matching look-alikes", () => {
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/products")).toBe(true);
    expect(isAdminPath("/administrator")).toBe(false);
  });
});
