import { Suspense } from "react";
import { requireUser } from "@/lib/auth/dal";
import { signOutAction } from "../(auth)/actions";

export const metadata = { title: "My account" };

async function AccountSummary() {
  const user = await requireUser("/account");
  return (
    <>
      <p className="mb-4 text-sm">Signed in as {user.email}</p>
      <form action={signOutAction}>
        <button className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100">Sign out</button>
      </form>
    </>
  );
}

export default function AccountPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="mb-4 text-2xl font-semibold">My account</h1>
      <Suspense fallback={<p className="text-sm">Loading…</p>}>
        <AccountSummary />
      </Suspense>
    </main>
  );
}
