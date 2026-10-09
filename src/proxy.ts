import { NextResponse, type NextRequest } from "next/server";
import { requiresAuth } from "@/lib/auth/routes";
import { loginUrl } from "@/lib/auth/redirects";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 "Proxy" (formerly Middleware).
 * Keeps the session fresh and bounces signed-out visitors away from private areas early.
 * This is a UX shortcut: it is NOT the security boundary (see src/lib/auth/dal.ts and the database RLS).
 */
export async function proxy(request: NextRequest) {
  const { response, isAuthenticated } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (!isAuthenticated && requiresAuth(pathname)) {
    const redirect = NextResponse.redirect(new URL(loginUrl(pathname + search), request.url));
    // Carry over any cookies the session refresh set.
    for (const cookie of response().cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }
  return response();
}

export const config = {
  matcher: [
    // Everything except static assets and image optimisation.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
