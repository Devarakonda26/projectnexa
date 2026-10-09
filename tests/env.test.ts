import { describe, expect, it } from "vitest";
import { parsePublicEnv, parseServerEnv } from "@/lib/env.schema";

const validPublic = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "a".repeat(32),
};

const validServer = {
  SUPABASE_SERVICE_ROLE_KEY: "s".repeat(40),
  PAYMENT_UPI_ID: "shop@upi",
  PAYMENT_UPI_PAYEE_NAME: "ProjectNexa",
};

describe("parsePublicEnv", () => {
  it("accepts a valid config and applies defaults", () => {
    const env = parsePublicEnv(validPublic);
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
  });

  it("rejects a malformed Supabase URL", () => {
    expect(() => parsePublicEnv({ ...validPublic, NEXT_PUBLIC_SUPABASE_URL: "not-a-url" })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });
});

describe("parseServerEnv", () => {
  it("applies bucket and TTL defaults", () => {
    const env = parseServerEnv(validServer);
    expect(env.STORAGE_BUCKET_PRODUCT_FILES).toBe("product-files");
    expect(env.DOWNLOAD_URL_TTL_SECONDS).toBe(120);
  });

  it("requires the service role key", () => {
    const rest: Record<string, string | undefined> = { ...validServer };
    delete rest.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => parseServerEnv(rest)).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("does not leak secret values in error messages", () => {
    try {
      parseServerEnv({ ...validServer, SUPABASE_SERVICE_ROLE_KEY: "short-secret" });
      throw new Error("expected parseServerEnv to throw");
    } catch (e) {
      expect(String(e)).not.toContain("short-secret");
    }
  });

  it("rejects an out-of-range download TTL", () => {
    expect(() => parseServerEnv({ ...validServer, DOWNLOAD_URL_TTL_SECONDS: "99999" })).toThrow(
      /DOWNLOAD_URL_TTL_SECONDS/,
    );
  });
});
