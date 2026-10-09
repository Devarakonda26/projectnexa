import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..");
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === ".git") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const srcFiles = walk(join(root, "src")).filter((f) => /\.(ts|tsx)$/.test(f));
const rel = (f: string) => relative(root, f).replaceAll("\\", "/");

describe("security hygiene", () => {
  it("only the signed-URL helper imports the service-role client", () => {
    const offenders = srcFiles
      .filter((f) => /supabase\/service["']/.test(readFileSync(f, "utf8")))
      .map(rel)
      .filter((f) => f !== "src/lib/storage/signed-urls.ts");
    expect(offenders).toEqual([]);
  });

  it("the service role key is never referenced outside env.server / env.schema / service", () => {
    const allowed = new Set(["src/lib/env.schema.ts", "src/lib/env.server.ts", "src/lib/supabase/service.ts"]);
    const offenders = srcFiles.filter((f) => /SERVICE_ROLE/.test(readFileSync(f, "utf8"))).map(rel).filter((f) => !allowed.has(f));
    expect(offenders).toEqual([]);
  });

  it("no client component imports server-only modules", () => {
    const offenders = srcFiles
      .filter((f) => /^\s*["']use client["']/.test(readFileSync(f, "utf8")))
      .filter((f) => /@\/lib\/(supabase\/(server|service)|auth\/dal|env\.server|storage)/.test(readFileSync(f, "utf8")))
      .map(rel);
    expect(offenders).toEqual([]);
  });

  it("no NEXT_PUBLIC variable name looks like a secret", () => {
    const offenders = srcFiles.filter((f) => /NEXT_PUBLIC_\w*(SERVICE|SECRET|PRIVATE)/i.test(readFileSync(f, "utf8"))).map(rel);
    expect(offenders).toEqual([]);
  });

  it("every Server Action file authenticates or is the auth module", () => {
    const actionFiles = srcFiles.filter((f) => /^\s*["']use server["']/.test(readFileSync(f, "utf8")));
    const bad = actionFiles
      .map(rel)
      .filter((f) => !f.startsWith("src/app/(auth)/"))
      .filter((f) => !/assert(User|Admin)\(/.test(readFileSync(join(root, f), "utf8")));
    expect(bad).toEqual([]);
  });
});
