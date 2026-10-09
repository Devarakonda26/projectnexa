import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { safeNextPath } from "@/lib/auth/redirects";
import { signUpAction } from "../actions";

export const metadata = { title: "Create account" };

async function SignupForm({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNextPath((await searchParams).next);
  return (
    <>
      <AuthForm
        action={signUpAction}
        next={next}
        submitLabel="Create account"
        fields={[
          { name: "fullName", label: "Full name", autoComplete: "name" },
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "phone", label: "Mobile (optional)", type: "tel", autoComplete: "tel", required: false, hint: "10-digit Indian mobile number" },
          { name: "password", label: "Password", type: "password", autoComplete: "new-password", hint: "At least 10 characters, with a letter and a number" },
        ]}
      />
      <p className="mt-4 text-sm">
        Already have an account? <Link href="/login" className="text-blue-700 underline">Sign in</Link>
      </p>
    </>
  );
}

export default function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return (
    <AuthShell title="Create your account">
      <Suspense fallback={<p className="text-sm">Loading…</p>}>
        <SignupForm searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}
