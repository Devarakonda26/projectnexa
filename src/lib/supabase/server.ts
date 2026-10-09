import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { publicEnv } from "@/lib/env.public";

/**
 * Supabase client acting AS THE SIGNED-IN USER (anon key + the user's session cookie).
 * Every query runs under Row Level Security, so this is the client to use almost everywhere.
 * Create a new client per request; never share one across requests.
 */
export async function createClient() {
  // Everything this client reads is per-request data; never evaluate it at build time.
  await connection();
  const cookieStore = await cookies();
  const env = publicEnv();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Components cannot set cookies. The Proxy refreshes the session on every request instead.
        }
      },
    },
  });
}
