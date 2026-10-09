/**
 * Which URL prefixes need a signed-in user. This list drives the Proxy's *optimistic* redirect only.
 * It is a convenience, NOT the security boundary: every protected page, layout and Server Action
 * re-checks on the server through `src/lib/auth/dal.ts`, and the database enforces RLS regardless.
 */
export const AUTH_REQUIRED_PREFIXES = [
  "/account",
  "/admin",
  "/cart",
  "/checkout",
  "/orders",
  "/downloads",
  "/custom-projects/new",
  "/custom-projects/requests",
] as const;

export function requiresAuth(pathname: string): boolean {
  return AUTH_REQUIRED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}
