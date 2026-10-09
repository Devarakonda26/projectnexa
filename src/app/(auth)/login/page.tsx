import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { safeNextPath } from "@/lib/auth/redirects";
import { signInAction } from "../actions";

export const metadata = { title: "Sign in" };

async function LoginForm({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNextPath((await searchParams).next);
  const q = `?next=${encodeURIComponent(next)}`;
  return (
    <>
      <AuthForm
        action={signInAction}
        next={next}
        submitLabel="Sign in"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
      />
      <p className="mt-4 text-sm">
        <Link href="/forgot-password" className="text-blue-700 underline">Forgot password?</Link>
      </p>
      <p className="mt-2 text-sm">
        New here? <Link href={`/signup${q}`} className="text-blue-700 underline">Create an account</Link>
      </p>
    </>
  );
}

export default function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return (
    <AuthShell title="Sign in">
      <Suspense fallback={<p className="text-sm">Loading…</p>}>
        <LoginForm searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}
