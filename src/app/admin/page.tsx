import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

async function AdminHome() {
  // Every admin page repeats this check: layouts do not re-run on client-side navigation.
  const admin = await requireAdmin("/admin");
  return <p className="text-sm">Signed in as {admin.email} (admin)</p>;
}

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="mb-4 text-2xl font-semibold">Admin dashboard</h1>
      <Suspense fallback={<p className="text-sm">Loading…</p>}>
        <AdminHome />
      </Suspense>
    </main>
  );
}
