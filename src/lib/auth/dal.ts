import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { loginUrl } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

/**
 * Data Access Layer: the single place that decides "who is this, and may they do this?".
 *
 * Rules (see docs/SECURITY.md):
 *  1. Identity comes from `auth.getUser()`, which asks the Supabase Auth server to validate the token.
 *     It is never read from a cookie, a header, a request body or a client-supplied field.
 *  2. The role comes from the `profiles` table (read with the user's own RLS-limited session), never from the JWT.
 *  3. Call these from EVERY protected page, Server Action and Route Handler. A layout check alone is not enough:
 *     layouts do not re-render on client-side navigation, and Server Actions are separately reachable POST endpoints.
 *  4. The database re-checks admin rights inside every admin RPC (`require_admin()`), so a bug here cannot
 *     by itself let a customer change orders or payments.
 */

export type CurrentUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: "customer" | "admin";
};

export class ForbiddenError extends Error {
  constructor(message = "forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // Who is signed in differs per visitor, so this always runs per request, never at build time.
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", data.user.id)
    .maybeSingle();

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    fullName: (profile?.full_name as string | null | undefined) ?? null,
    role: profile?.role === "admin" ? "admin" : "customer",
  };
});

/** For pages: redirects to sign-in (preserving where the visitor was going). */
export async function requireUser(returnTo = "/account"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl(returnTo));
  return user;
}

/**
 * For admin pages: anyone who is not an admin gets a plain 404, so the admin area's existence is not revealed.
 * (Signed-out visitors go to sign-in first.)
 */
export async function requireAdmin(returnTo = "/admin"): Promise<CurrentUser> {
  const user = await requireUser(returnTo);
  if (user.role !== "admin") notFound();
  return user;
}

/** For Server Actions and Route Handlers: throws instead of redirecting so callers can return a clean error. */
export async function assertUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new ForbiddenError("not_authenticated");
  return user;
}

export async function assertAdmin(): Promise<CurrentUser> {
  const user = await assertUser();
  if (user.role !== "admin") throw new ForbiddenError("admin_only");
  return user;
}
